import { env } from "../config/env.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function verifyOrigin(req, res, next) {
  if (safeMethods.has(req.method)) return next();

  const origin = req.get("origin");
  if (!origin || !env.frontendOrigins.includes(origin)) {
    return res.status(403).json({ success: false, message: "Request origin is not allowed." });
  }

  next();
}
