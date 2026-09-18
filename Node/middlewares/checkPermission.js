/**
 * Check Permission Middleware
 * ============================
 * Simple slug-based permission check. Verifies that the authenticated user
 * has the required permission slug in req.user.permissions.
 *
 * SuperAdmin wildcard ('*') grants all permissions automatically.
 *
 * Usage:
 *   router.get('/admin/events', verifyToken, checkPermission('view-event'), controller.list);
 *   router.post('/admin/events', verifyToken, checkPermission('create-event'), controller.store);
 *   router.put('/admin/events/:id', verifyToken, checkPermission('edit-event'), controller.update);
 *   router.delete('/admin/events/:id', verifyToken, checkPermission('delete-event'), controller.delete);
 */

function checkPermission(permissionSlug) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: req.t ? req.t('Authentication required') : 'Authentication required',
      });
    }

    const permissions = req.user.permissions || [];

    // SuperAdmin wildcard check
    if (permissions.includes('*') || permissions.includes(permissionSlug)) {
      return next();
    }

    return res.status(403).json({
      status: false,
      message: req.t
        ? req.t('You do not have permission to perform this action')
        : 'Access denied. Missing permission.',
    });
  };
}

module.exports = checkPermission;
