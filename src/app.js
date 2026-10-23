/** Doctor Tracker: Configures Express middleware, session storage, health checks, and API routes. */
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import MongoStore from "connect-mongo";
import morgan from "morgan";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { verifyOrigin } from "./middleware/verifyOrigin.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import mongoose from "mongoose";

const app = express();

// Vercel loads this module as the Express entry point, so connect before handling API requests.
await connectDatabase();

if (env.isProduction) app.set("trust proxy", 1);

// Apply security, origin checks, and persistent sessions before registering route handlers.
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.frontendOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  maxAge: 600,
}));
app.use(express.json({ limit: "20kb" }));
app.use(morgan(":method :status :response-time ms"));
app.use(verifyOrigin);
app.use(session({
  name: env.sessionName,
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  // Reuse Mongoose's connected client to avoid opening a second Atlas connection for sessions.
  store: MongoStore.create({
    client: mongoose.connection.getClient(),
    dbName: mongoose.connection.name,
    collectionName: "sessions",
    ttl: env.sessionMaxAgeMs / 1000,
  }),
  cookie: {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: env.sessionMaxAgeMs,
    path: "/",
  },
}));

app.get("/api/health", (_req, res) => {
  // Report database readiness so callers can distinguish a running API from a ready API.
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    data: { status: connected ? "ok" : "database_unavailable" },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
