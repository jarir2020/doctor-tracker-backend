export function requireAdmin(req, res, next) {
  if (!req.session?.admin) {
    return res.status(401).json({ success: false, message: "Please sign in to continue." });
  }
  next();
}
