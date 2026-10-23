/** Doctor Tracker: Implements rate-limited login, session checks, and administrator logout. */
import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { Admin } from "../models/Admin.js";
import { env } from "../config/env.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { AppError } from "../utils/AppError.js";
import { loginBody, parseBody } from "../utils/validation.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many sign-in attempts. Try again in 15 minutes." },
});

// Adapt callback-based session methods so route handlers can await their completion.
function sessionOperation(session, operation) {
  return new Promise((resolve, reject) => {
    session[operation]((error) => (error ? reject(error) : resolve()));
  });
}

// Authenticate with a bounded attempt rate and establish a fresh server session.
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = parseBody(loginBody, req.body);
  const admin = await Admin.findOne({ email }).select("+passwordHash");
  const passwordMatches = admin ? await bcrypt.compare(password, admin.passwordHash) : false;

  if (!admin || !passwordMatches) {
    throw new AppError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
  }

  // Regenerate the identifier after authentication to prevent session fixation.
  await sessionOperation(req.session, "regenerate");
  req.session.admin = { id: admin._id.toString(), name: admin.name, email: admin.email };
  await sessionOperation(req.session, "save");

  res.json({ success: true, data: { admin: req.session.admin } });
});

// Return the current administrator for the frontend session guard.
router.get("/me", requireAdmin, (req, res) => {
  res.json({ success: true, data: { admin: req.session.admin } });
});

// Destroy server-side session data and clear its browser cookie.
router.post("/logout", requireAdmin, async (req, res) => {
  await sessionOperation(req.session, "destroy");
  res.clearCookie(env.sessionName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
  });
  res.json({ success: true, data: { loggedOut: true } });
});

export default router;
