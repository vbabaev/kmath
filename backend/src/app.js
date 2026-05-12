import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { configureAuth } from "./auth.js";
import profilesRoutes from "./routes/profiles.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";

export function createApp({ logger = true, auth = "session" } = {}) {
  const app = express();
  // Caddy fronts us in production; trust the first proxy hop so
  // express-rate-limit and req.ip see the real client address.
  app.set("trust proxy", 1);
  app.use(helmet());
  if (logger) app.use(pinoHttp());
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false }));

  // API responses must never be cached — /sync in particular is polled
  // continuously and must reflect the latest write, not a stale heuristic
  // copy in the browser HTTP cache.
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  configureAuth(app, { mode: auth });

  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/profiles", profilesRoutes);

  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: "internal server error", message: err?.message });
  });

  return app;
}
