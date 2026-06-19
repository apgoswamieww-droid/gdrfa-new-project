const ciamService = require('../../ciam/ciam.service');
const { attemptTokenRefresh } = require('../../utils/ciamTokenHelper');
const { decryptRole } = require('../../config/role-decryption');
const { getUserPermissions } = require('../../utils/permissionChecker');

class AdminAuthController {
  static async login(req, res) {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.error(req.t ? req.t('Email and password are required') : 'Email and password are required');
      }

      const responseOfAuth = await ciamService.auth({
        userName: String(email).trim(),
        password,
      });

      if (responseOfAuth?.isError || !responseOfAuth?.value) {
        return res.error(req.t ? req.t('There is some issue with Id and Password, Please check!') : 'Invalid credentials');
      }

      const user = responseOfAuth.value;
      const decryptedPermissionArray = await decryptRole(user.encryptedRoles);
      const roleId = decryptedPermissionArray[0]?.ClientRoleId?.toString() || '';

      if (!roleId) {
        return res.error(req.t ? req.t('Your role does not have access to admin panel.') : 'Your role does not have access to admin panel.');
      }

      const permissions = await getUserPermissions(roleId, user.accessToken, user.userDomain);

      if (roleId !== '1' && !permissions.includes('can-login')) {
        return res.error(req.t ? req.t('Your role does not have access to admin panel.') : 'Your role does not have access to admin panel.');
      }

      let userImage = null;
      try {
        let userInfoForImg = await ciamService.getUserImageByDomainId([user.userDomain], user.accessToken);
        userImage = userInfoForImg?.isError || userInfoForImg == null ? null : userInfoForImg.value?.[0]?.img || null;
      } catch (imageError) {
        console.warn('Admin login image lookup failed:', imageError.message);
      }

      const currentLang =
        req.query.lng ||
        req.cookies?.lang ||
        (req.headers['accept-language']?.startsWith('ar') ? 'ar' : 'en');

      console.log("[Admin Login] roleId:", roleId);
      console.log("[Admin Login] permissions count:", permissions?.length);

      return res.success(
        {
          token: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpiry: user.accessTokenExpirationUtcDateTime,
          admin: {
            id: user.userDomain,
            name: user.name,
            email: user.email,
            roleId,
            image: userImage,
            permissions,
          },
          language: currentLang,
        },
        req.t ? req.t('Login Successfully!') : 'Login Successfully!'
      );
    } catch (error) {
      console.error('Admin API login error:', error);
      return res.error(req.t ? req.t('There is some issue with Id and Password, Please check!') : 'Unable to login');
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body || {};
      if (!refreshToken) {
        return res.status(401).json({ status: false, message: req.t ? req.t('Refresh token required') : 'Refresh token required' });
      }

      const currentToken = req.headers.authorization?.split(' ')[1];

      const result = await ciamService.authRefreshToken(currentToken, refreshToken);
    
      if (result?.isError || !result?.value?.accessToken) {
         return res
           .status(401)
           .json({ status: false, message: "Unauthorized" });
      }

      return res.success({
        token: result.value.accessToken,
        refreshToken: result.value.refreshToken,
        accessTokenExpiry: result.value.accessTokenExpirationUtcDateTime,
      }, req.t ? req.t('Token refreshed successfully') : 'Token refreshed successfully');
    } catch (error) {
      console.error('Admin refresh token error:', error);
      return res.status(401).json({ status: false, message: req.t ? req.t('Token refresh failed') : 'Token refresh failed' });
    }
  }

  static async logout(req, res) {
    try {
      if (req.session?.admin) {
        req.session.admin = null;
      }

      return res.success({}, req.t ? req.t('Logged out successfully') : 'Logged out successfully');
    } catch (error) {
      console.error('Admin API logout error:', error);
      return res.error(req.t ? req.t('Unable to logout') : 'Unable to logout');
    }
  }
}

module.exports = AdminAuthController;
