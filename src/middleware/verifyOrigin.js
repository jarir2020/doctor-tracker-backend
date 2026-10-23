/** Doctor Tracker: Rejects unsafe cross-site requests outside the configured frontend origins. */
import { env } from "../config/env.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function verifyOrigin(req, res, next) {
  // Read-only requests do not mutate state; every other method must come from the UI origin.
  if (safeMethods.has(req.method)) return next();

  const origin = req.get("origin");
  if (!origin || !env.frontendOrigins.includes(origin)) {
    return res.status(403).json({ success: false, message: "Request origin is not allowed." });
  }

  next();
}
