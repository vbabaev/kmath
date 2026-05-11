import { Router } from "express";
import passport from "passport";
import { config, hasOAuthCredentials } from "../config.js";
import { profilesCollection } from "../db.js";

const router = Router();

router.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "not authenticated" });
  res.json(req.user);
});

router.get("/config", (_req, res) => {
  res.json({
    oauth: hasOAuthCredentials(),
    devLogin: config.allowDevLogin,
  });
});

router.get("/google", (req, res, next) => {
  if (!hasOAuthCredentials()) {
    return res.status(503).json({ error: "OAuth not configured" });
  }
  passport.authenticate("google", { scope: ["openid", "profile", "email"] })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  if (!hasOAuthCredentials()) {
    return res.status(503).json({ error: "OAuth not configured" });
  }
  passport.authenticate("google", {
    failureRedirect: `${config.appUrl}/?login=denied`,
    successRedirect: `${config.appUrl}/`,
  })(req, res, next);
});

router.post("/dev-login", async (req, res, next) => {
  if (!config.allowDevLogin) return res.status(404).json({ error: "not found" });
  const { profileId } = req.body ?? {};
  if (!profileId) return res.status(400).json({ error: "profileId required" });
  try {
    const doc = await profilesCollection().findOne({ _id: profileId });
    if (!doc) return res.status(404).json({ error: "profile not found" });
    const user = { email: null, profileId: doc._id, role: doc.role };
    req.login(user, (err) => {
      if (err) return next(err);
      res.json(user);
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res, next) => {
  if (!req.logout) return res.status(204).end();
  req.logout((err) => {
    if (err) return next(err);
    if (req.session) {
      req.session.destroy(() => res.status(204).end());
    } else {
      res.status(204).end();
    }
  });
});

export default router;
