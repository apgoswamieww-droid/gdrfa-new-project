/**
 * Permissions Bypass Utility
 * ===========================
 * When PERMISSIONS_BYPASS=true is set in .env, all permission and role checks
 * are bypassed. Every user gets full SuperAdmin-level access on both the
 * backend and frontend.
 *
 * Use this in middleware, permission checkers, and controllers.
 */
function isPermissionsBypass() {
  return process.env.PERMISSIONS_BYPASS === 'true';
}

module.exports = { isPermissionsBypass };
