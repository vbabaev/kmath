import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { profileIdHeader } from "./auth.js";
import profilesRoutes from "./routes/profiles.js";
import healthRoutes from "./routes/health.js";

export function createApp({ logger = true } = {}) {
  const app = express();
  app.use(helmet());
  if (logger) app.use(pinoHttp());
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 600, standardHeaders: true, legacyHeaders: false }));
  app.use(profileIdHeader);

  app.use("/api/health", healthRoutes);
  app.use("/api/profiles", profilesRoutes);

  app.use((err, _req, res, _next) => {
    res.status(500).json({ error: "internal server error", message: err?.message });
  });

  return app;
}
