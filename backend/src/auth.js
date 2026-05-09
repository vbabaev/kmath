// MVP: trust the X-Profile-Id header. Phase 5 replaces this with a
// session cookie populated by the Google OAuth callback.
export function profileIdHeader(req, _res, next) {
  req.profileId = req.header("X-Profile-Id") ?? null;
  next();
}
