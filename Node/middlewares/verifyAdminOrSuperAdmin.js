const ADMIN_ROLE_ID = String(process.env.ADMINROLEID || '').trim();
const SUPER_ADMIN_ROLE_ID = String(process.env.SUPERADMINROLEID || '').trim();
const PERMISSIONS_BYPASS = process.env.PERMISSIONS_BYPASS === 'true';

module.exports = function verifyAdminOrSuperAdmin(req, res, next) {
  if (PERMISSIONS_BYPASS) return next();

  const currentRoleId = String(req.user?.roleId || '').trim();

  if (currentRoleId === ADMIN_ROLE_ID || currentRoleId === SUPER_ADMIN_ROLE_ID) {
    return next();
  }

  return res.status(403).json({
    status: false,
    message: 'Access denied. Only Admin and Super Admin can access this module.'
  });
};
