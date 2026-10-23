import "dotenv/config";

const nodeEnv = process.env.NODE_ENV || "development";

const rawOrigins = process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const frontendOrigins = rawOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const sessionSecret = process.env.SESSION_SECRET || (nodeEnv === "production" ? "" : "local-development-session-secret-change-me");

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set in production.");
}

export const env = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number.parseInt(process.env.PORT || "4000", 10),
  host: process.env.HOST || "0.0.0.0",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/doctor_tracker",
  sessionSecret,
  sessionName: "doctor_tracker.sid",
  sessionMaxAgeMs: 12 * 60 * 60 * 1000,
  frontendOrigins,
  adminName: process.env.ADMIN_NAME || "Doctor Tracker Admin",
  adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
});
