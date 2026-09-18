const SUPER_ADMIN_ROLE_ID = String(process.env.SUPERADMINROLEID || '').trim();

module.exports = function verifySuperAdminOnly(req, res, next) {
  const currentRoleId = String(req.user?.roleId || '').trim();

  if (currentRoleId === SUPER_ADMIN_ROLE_ID) {
    return next();
  }

  return res.status(403).json({
    status: false,
    message: 'Access denied. Only Super Admin can access this module.'
  });
};
