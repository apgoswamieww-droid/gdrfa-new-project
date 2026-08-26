// const db = require('../config/dbDirect');
const { getUserPermissions } = require('./../utils/permissionChecker');

module.exports = function (requiredPermission) {
  return async function (req, res, next) {
    const user = req.session.admin;

    if (!user) {
      return res.status(403).render('admin/pages/403', {
        error: 'Access denied. No user.',
        t: req.t,
        lng: req.session.lng || 'en'
      });
    }

    // SuperAdmin bypass (roleId === process.env.SUPERADMINROLEID.toString())
    if (user.roleId === process.env.SUPERADMINROLEID) {
      return next(); // Full access for SuperAdmin
    }

    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    // Refresh permissions if needed
    if (!user.permissions || !user.permissionsFetchedAt || now - user.permissionsFetchedAt > FIVE_MINUTES) {
      try {
        const permissions = await getUserPermissions(user.roleId, req.session.admin.accessToken, req.session.admin.id);

        req.session.admin.permissions = permissions;
        req.session.admin.permissionsFetchedAt = now;
      } catch (error) {
        console.error('Failed to refresh permissions:', error);
        return res.status(500).send('Internal Server Error');
      }
    }

    // Normal permission check
    if (!req.session.admin.permissions.includes(requiredPermission)) {
      return res.status(403).render('admin/pages/403', {
        error: 'Access denied. Missing permission.',
        t: req.t,
        lng: req.session.lng || 'en'
      });
    }

    next();
  };
};
