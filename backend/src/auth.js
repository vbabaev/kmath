import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config, hasOAuthCredentials } from "./config.js";
import { profilesCollection, groupsCollection } from "./db.js";
import {
  makeProfile,
  makeGroup,
  generateProfileId,
  generateGroupId,
} from "./profile-factory.js";

export const ADULT_ROLES = new Set(["owner", "parent"]);
function isAdult(role) {
  return ADULT_ROLES.has(role);
}

const SESSION_COOKIE = "kmath.sid";

export function configureAuth(app, { mode = "session" } = {}) {
  if (mode === "dev") {
    app.use(async (req, _res, next) => {
      const id = req.header("X-Profile-Id");
      if (!id) return next();
      try {
        const doc = await profilesCollection().findOne({ _id: id });
        if (doc) {
          req.user = {
            email: null,
            profileId: doc._id,
            role: doc.role,
            groupId: doc.groupId,
          };
        }
      } catch {
        // ignore — request continues unauth'd
      }
      next();
    });
    return;
  }

  app.use(
    session({
      name: SESSION_COOKIE,
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: config.mongoUrl, collectionName: "sessions" }),
      cookie: {
        httpOnly: true,
        secure: config.env === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  if (hasOAuthCredentials()) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.googleClientId,
          clientSecret: config.googleClientSecret,
          callbackURL: `${config.appUrl}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(null, false, { message: "no email" });

          try {
            const col = profilesCollection();
            let doc = await col.findOne({ googleEmail: email });

            if (!doc) {
              // Bootstrap: the very first login by the configured bootstrap
              // address creates an OWNER profile and a default group, so
              // the app is usable on a fresh database.
              const bootstrap = config.bootstrapTeacherEmail?.toLowerCase();
              const total = await col.countDocuments();
              if (bootstrap && email === bootstrap && total === 0) {
                const displayName = profile.displayName ?? "Owner";
                const profileId = await generateProfileId(displayName);
                const groupId = await generateGroupId(profileId);
                await groupsCollection().insertOne(
                  makeGroup({ id: groupId, name: `${displayName}'s family`, ownerId: profileId }),
                );
                doc = makeProfile({
                  id: profileId,
                  name: displayName,
                  emoji: "👨",
                  color: "indigo",
                  role: "owner",
                  groupId,
                  googleEmail: email,
                });
                await col.insertOne(doc);
              }
            }

            if (!doc) {
              return done(null, false, { message: "email not associated with any profile" });
            }

            return done(null, {
              email,
              profileId: doc._id,
              role: doc.role,
              groupId: doc.groupId,
            });
          } catch (err) {
            return done(err);
          }
        },
      ),
    );
  } else {
    console.warn("[auth] GOOGLE_CLIENT_ID/SECRET missing — OAuth strategy disabled");
  }

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  app.use(passport.initialize());
  app.use(passport.session());
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "not authenticated" });
  next();
}

// Household visibility rule:
//   - Self is always allowed.
//   - Same-group adult (owner/parent) accessing a child is allowed.
//   - Everything else is 403 (incl. adult-to-adult and cross-group).
// Loads the target profile and attaches it as `req.targetProfile` so
// the downstream handler doesn't fetch it twice.
export async function requireProfileAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "not authenticated" });
  const target = await profilesCollection().findOne({ _id: req.params.id });
  if (!target) return res.status(404).json({ error: "not found" });
  if (target._id === req.user.profileId) {
    req.targetProfile = target;
    return next();
  }
  if (target.groupId !== req.user.groupId) {
    return res.status(403).json({ error: "forbidden" });
  }
  if (!isAdult(req.user.role)) return res.status(403).json({ error: "forbidden" });
  if (target.role !== "child") return res.status(403).json({ error: "forbidden" });
  req.targetProfile = target;
  next();
}

export function requireAdult(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "not authenticated" });
  if (!isAdult(req.user.role)) return res.status(403).json({ error: "adult only" });
  next();
}

export function requireOwner(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "not authenticated" });
  if (req.user.role !== "owner") return res.status(403).json({ error: "owner only" });
  next();
}
