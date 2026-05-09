import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 3000,
  env: process.env.NODE_ENV ?? "development",
  mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/kmath",
  allowDevLogin: process.env.ALLOW_DEV_LOGIN === "true",
};
