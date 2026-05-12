import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config, hasOAuthCredentials } from "./config.js";
import { profilesCollection } from "./db.js";
import { makeProfile, generateProfileId } from "./profile-factory.js";

const SESSION_COOKIE = "kmath.sid";

export function configureAuth(app, { mode = "session" } = {}) {
  if (mode === "dev") {
    app.use(async (req, _res, next) => {
      const id = req.header("X-Profile-Id");
      if (!id) return next();
      try {
        const doc = await profilesCollection().findOne({ _id: id });
        if (doc) req.user = { email: null, profileId: doc._id, role: doc.role };
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
              // address creates a teacher profile so the app is usable on a
              // fresh database.
              const bootstrap = config.bootstrapTeacherEmail?.toLowerCase();
              const total = await col.countDocuments();
              if (bootstrap && email === bootstrap && total === 0) {
                const id = await generateProfileId(profile.displayName ?? "Teacher");
                doc = makeProfile({
                  id,
                  name: profile.displayName ?? "Teacher",
                  emoji: "👨",
                  color: "indigo",
                  role: "teacher",
                  googleEmail: email,
                });
                await col.insertOne(doc);
              }
            }

            if (!doc) {
              return done(null, false, { message: "email not associated with any profile" });
            }

            return done(null, { email, profileId: doc._id, role: doc.role });
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

export function requireProfileAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "not authenticated" });
  if (req.user.role === "teacher") return next();
  if (req.params.id === req.user.profileId) return next();
  return res.status(403).json({ error: "forbidden" });
}

export function requireTeacher(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "not authenticated" });
  if (req.user.role !== "teacher") return res.status(403).json({ error: "teacher only" });
  next();
}
