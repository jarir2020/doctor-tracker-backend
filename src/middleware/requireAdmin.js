/** Doctor Tracker: Restricts protected API handlers to a signed-in administrator session. */
/** Continue only when the session contains an authenticated administrator. */
export function requireAdmin(req, res, next) {
  if (!req.session?.admin) {
    return res.status(401).json({ success: false, message: "Please sign in to continue." });
  }
  next();
}
