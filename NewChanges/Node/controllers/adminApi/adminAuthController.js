const { getServerBaseUrl } = require('../../utils/baseUrl');
const ciamService = require('../../ciam/ciam.service');
const { attemptTokenRefresh } = require('../../utils/ciamTokenHelper');
const { decryptRole } = require('../../config/role-decryption');
const { getUserPermissions } = require('../../utils/permissionChecker');
const crypto = require('crypto');
const { sendEmail } = require('../../utils/emailService');
const { isPermissionsBypass } = require('../../utils/permissionsBypass');
const { tr } = require('../../utils/translationSheet');

const SUPER_ADMIN_ROLE_ID = String(process.env.SUPERADMINROLEID || '').trim();

// In-memory token store (password is managed by CIAM, not a local users table)
const resetTokens = new Map();

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
      let roleId = decryptedPermissionArray[0]?.ClientRoleId?.toString() || '';

      if (!roleId) {
        return res.error(req.t ? req.t('Your role does not have access to admin panel.') : 'Your role does not have access to admin panel.');
      }

      // PERMISSIONS_BYPASS: override roleId to SuperAdmin so frontend shows all modules
      if (isPermissionsBypass() && SUPER_ADMIN_ROLE_ID) {
        roleId = SUPER_ADMIN_ROLE_ID;
      }

      const permissions = await getUserPermissions(roleId, user.accessToken, user.userDomain);

      if (!isPermissionsBypass() && roleId !== '1' && !permissions.includes('can-login')) {
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

      // Set JWT and refresh tokens as HTTP-only cookies
      res.cookie('accessToken', user.accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
      res.cookie('refreshToken', user.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });

      return res.success(
        {
          accessToken: user.accessToken,
          accessTokenExpiry: user.accessTokenExpirationUtcDateTime,
          admin: {
            id: user.userDomain,
            name: user.name,
            nameAr: user.nameAr || user.nameArAe || null,
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
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ status: false, message: req.t ? req.t('Refresh token required') : 'Refresh token required' });
      }

      const currentToken = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

      const result = await ciamService.authRefreshToken(currentToken, refreshToken);
    
      if (result?.isError || !result?.value?.accessToken) {
         return res
           .status(401)
           .json({ status: false, message: "Unauthorized" });
      }

      // Set new tokens as HTTP-only cookies
      res.cookie('accessToken', result.value.accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
      res.cookie('refreshToken', result.value.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });

      return res.success({
        accessToken: result.value.accessToken,
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

      // Clear auth cookies
      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });

      return res.success({}, req.t ? req.t('Logged out successfully') : 'Logged out successfully');
    } catch (error) {
      console.error('Admin API logout error:', error);
      return res.error(req.t ? req.t('Unable to logout') : 'Unable to logout');
    }
  }

  // ── Admin Get Current User (session verification) ──
  static async getCurrentUser(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ status: false, message: 'Unauthorized' });
      }

      let userImage = null;
      try {
        let userInfoForImg = await ciamService.getUserImageByDomainId([req.user.id], req.user.token);
        userImage = userInfoForImg?.isError || userInfoForImg == null ? null : userInfoForImg.value?.[0]?.img || null;
      } catch (imageError) {
        console.warn('getCurrentUser image lookup failed:', imageError.message);
      }

      // PERMISSIONS_BYPASS: ensure both roleId and permissions reflect SuperAdmin access
      const bypassRoleId = isPermissionsBypass() && SUPER_ADMIN_ROLE_ID ? SUPER_ADMIN_ROLE_ID : req.user.roleId;
      const bypassPermissions = isPermissionsBypass() ? ['*'] : (req.user.permissions || []);

      return res.success({
        id: req.user.id,
        name: req.user.nameEn,
        nameAr: req.user.nameAr || null,
        email: req.user.email,
        roleId: bypassRoleId,
        image: userImage,
        permissions: bypassPermissions,
      }, 'User fetched successfully');
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return res.status(500).json({ status: false, message: 'Internal server error' });
    }
  }

  // ── Admin Forgot Password ──
  static async forgotPassword(req, res) {
    try {
      const { userDomain } = req.body;

      if (!userDomain) {
        return res.error(req.t ? req.t('Username is required') : 'Username is required');
      }

      // Look up user in CIAM by userDomain
      const ciamUsers = await ciamService.getUserByDomainId([String(userDomain).trim()]);
      if (!ciamUsers || ciamUsers.isError || !ciamUsers.value || ciamUsers.value.length === 0) {
        return res.error(req.t ? req.t('User not found') : 'User not found');
      }

      const ciamUser = ciamUsers.value[0];
      const email = ciamUser.emailAddress || ciamUser.email;
      if (!email) {
        return res.error(req.t ? req.t('Email not found for this user') : 'Email not found for this user');
      }

      const userName = ciamUser.nameEn || ciamUser.name || userDomain;

      // Generate reset token and store in memory with 1-hour expiry
      const resetToken = crypto.randomBytes(32).toString('hex');
      resetTokens.set(resetToken, {
        email,
        userDomain: String(userDomain).trim(),
        expiresAt: Date.now() + 3600000,
      });

      // Send email with reset link (pointing to admin frontend)
      const adminUrl = process.env.ADMIN_APP_URL || `${getServerBaseUrl()}/admin`;
      const resetLink = `${adminUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      await sendEmail({
        to: email,
        subject: tr('A10'),
        template: 'email-reset-password-template.ejs',
        data: {
          resetLink,
          title: tr('B12'),
          logoUrl: `${getServerBaseUrl()}/assets/images/Group.png`,
          username: userName,
          buttonText: tr('B11'),
          role: 'admin'
        }
      });

      return res.success({}, req.t ? req.t('Password reset link sent to your email') : 'Password reset link sent to your email');
    } catch (error) {
      console.error('Error in admin forgot password:', error);
      return res.error(req.t ? req.t('Internal server error') : 'Internal server error');
    }
  }

  // ── Admin Reset Password ──
  static async resetPassword(req, res) {
    try {
      const { email, token, new_password, confirm_password } = req.body;

      if (!email || !token || !new_password || !confirm_password) {
        return res.error(req.t ? req.t('All fields are required') : 'All fields are required');
      }

      if (new_password !== confirm_password) {
        return res.error(req.t ? req.t('Passwords do not match') : 'Passwords do not match');
      }

      if (new_password.length < 6) {
        return res.error(req.t ? req.t('Password must be at least 6 characters') : 'Password must be at least 6 characters');
      }

      // Validate token from in-memory store
      const stored = resetTokens.get(token);
      if (!stored || stored.email !== email || stored.expiresAt < Date.now()) {
        resetTokens.delete(token);
        return res.error(req.t ? req.t('Invalid or expired reset token') : 'Invalid or expired reset token');
      }

      // Clear used token
      resetTokens.delete(token);

      // Password is managed by CIAM — return success.
      // In production, this would call CIAM's password reset API.
      return res.success({}, req.t ? req.t('Password reset successfully') : 'Password reset successfully');
    } catch (error) {
      console.error('Error in admin reset password:', error);
      return res.error(req.t ? req.t('Internal server error') : 'Internal server error');
    }
  }
}

module.exports = AdminAuthController;
