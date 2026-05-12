import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 3000,
  env: process.env.NODE_ENV ?? "development",
  mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/kmath",
  appUrl: process.env.APP_URL || "http://localhost:5173",
  sessionSecret: process.env.SESSION_SECRET || "dev-secret-change-me",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  bootstrapTeacherEmail: process.env.BOOTSTRAP_TEACHER_EMAIL || "",
  allowDevLogin: process.env.ALLOW_DEV_LOGIN === "true",
};

export function hasOAuthCredentials() {
  return Boolean(config.googleClientId && config.googleClientSecret);
}
