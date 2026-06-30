const jwt = require('jsonwebtoken');
const db = require('../config/dbDirect');
const ciamService = require('../ciam/ciam.service');
const { attemptTokenRefresh } = require('../utils/ciamTokenHelper');
module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.session.admin && req.session.admin) return next();
    res.redirect('/admin/login');
  },
  ensureAdminApiAuthenticated: (req, res, next) => {
    if (req.session?.admin) {
      return next();
    }

    return res.status(401).json({
      status: false,
      message: req.t ? req.t('Unauthorized admin session') : 'Unauthorized admin session'
    });
  },
  ensureAdminApiPermission: (requiredPermission) => {
    return (req, res, next) => {
      const admin = req.session?.admin;

      if (!admin) {
        return res.status(401).json({
          status: false,
          message: req.t ? req.t('Unauthorized admin session') : 'Unauthorized admin session'
        });
      }

      if (
        admin.roleId === process.env.SUPERADMINROLEID ||
        admin.permissions?.includes('*') ||
        admin.permissions?.includes(requiredPermission)
      ) {
        return next();
      }

      return res.status(403).json({
        status: false,
        message: req.t ? req.t('You do not have permission to access this module') : 'You do not have permission to access this module'
      });
    };
  },
  ensureVendorAuthenticated: (req, res, next) => {
    if (req.session.vendor) return next();
    res.redirect('/vendor/login');
  },
  verifyToken: async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ status: false, message: req.t('Token required') });

    const MAX_RETRIES = 3;
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const user = await new Promise((resolve, reject) => {
          jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
          });
        });

        // Set language from token if available
        if (user.lng) {
          req.session.lng = user.lng;
          res.cookie('lang', user.lng, {
            maxAge: 365 * 24 * 60 * 60 * 1000,
            httpOnly: true
          });
        }

        // Helper to build fallback user from JWT payload
        const buildFallbackUser = () => ({
          id: user.sub || 'unknown',
          userDomain: user.sub || 'unknown',
          email: user.email || user.preferred_username || null,
          roleId: '',
          permissions: [],
          token
        });

        let myUserInfo;
        try {
          myUserInfo = await ciamService.getUserByDomainId(user.sub.split(','), token);
        } catch (ciamError) {
          console.error('[verifyToken] CIAM getUserByDomainId error:', ciamError.message);
          myUserInfo = null;
        }

        if (myUserInfo?.isError || myUserInfo == null) {
          console.warn('[verifyToken] CIAM unavailable, falling back to JWT payload for user:', user.sub);
          req.user = buildFallbackUser();
          return next();
        }

        const userInfo = myUserInfo.value ? myUserInfo.value[0] : myUserInfo[0];

        if (!userInfo) {
          console.warn('[verifyToken] User not found in CIAM, falling back to JWT payload for user:', user.sub);
          req.user = buildFallbackUser();
          return next();
        }

        // Get role info
        const { decryptRole } = require('../config/role-decryption');
        const { getUserPermissions } = require('../utils/permissionChecker');
        const decryptedRoles = await decryptRole(userInfo.encryptedRoles);
        const roleId = decryptedRoles?.[0]?.ClientRoleId?.toString() || '';
        const permissions = roleId ? await getUserPermissions(roleId, token, userInfo.userDomain) : [];

        req.user = {
          id: userInfo.userDomain,
          userDomain: userInfo.userDomain,
          nameEn: userInfo.nameEn || null,
          nameAr: userInfo.nameAr || null,
          email: userInfo.emailAddress || userInfo.email || null,
          roleId,
          permissions,
          token
        };

        return next();

      } catch (err) {
        lastError = err;

        if (err.name === 'NotBeforeError') {
          console.warn(`[verifyToken] NotBeforeError (attempt ${attempt}/${MAX_RETRIES}):`, err.message);

          if (attempt < MAX_RETRIES) {
            // Small delay before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 100 * attempt));
            continue;
          }
        }

        // For other errors or after max retries, fail immediately
        return res.status(401).json({
          status: false,
          message: req.t('Invalid token')
        });
      }
    }

    // Fallback (should not reach here normally)
    console.error('[verifyToken] Max retries exceeded for NotBeforeError');
    return res.status(401).json({
      status: false,
      message: req.t('Invalid token')
    });
  },
  redirectIfAuthenticated: (req, res, next) => {
    if (req.session && req.session.admin) {
      // Preserve language when redirecting
      const lang = req.session.lng || req.query.lng || req.cookies.lang || 'en';
      // Already logged in
      return res.redirect(`/admin/dashboard?lng=${lang}`);
    }
    return next();
  }

};

