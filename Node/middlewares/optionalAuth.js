/**
 * Optional authentication middleware.
 *
 * Behaves like `verifyToken` but never rejects the request:
 * - If a valid bearer token is present, `req.user` is populated
 *   (including nameAr/nameEn from CIAM).
 * - If the token is missing/invalid, or CIAM is unreachable, the
 *   request continues as a guest with no `req.user`.
 *
 * Used on public endpoints that want to enrich their payload for
 * logged-in users (e.g. capturing the requestor's Arabic name on
 * facility booking requests) without forcing authentication.
 */
const jwt = require('jsonwebtoken');
const ciamService = require('../ciam/ciam.service');

module.exports = async function optionalAuth(req, res, next) {
  try {
    const token =
      req.cookies?.accessToken ||
      (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

    if (!token) return next();

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return resolve(null); // invalid/expired token -> guest
        resolve(payload);
      });
    });

    if (!decoded?.sub) return next();

    let userInfo = null;
    try {
      const myUserInfo = await ciamService.getUserByDomainId(decoded.sub.split(','), token);
      userInfo = myUserInfo?.value ? myUserInfo.value[0] : myUserInfo?.[0] || null;
    } catch (ciamError) {
      console.warn('[optionalAuth] CIAM lookup failed, continuing as guest:', ciamError.message);
    }

    if (userInfo) {
      req.user = {
        id: userInfo.userDomain,
        userDomain: userInfo.userDomain,
        nameEn: userInfo.nameEn || null,
        nameAr: userInfo.nameAr || null,
        email: userInfo.emailAddress || userInfo.email || null,
        token
      };
    }

    return next();
  } catch (err) {
    // Never block a public endpoint because of auth errors.
    console.warn('[optionalAuth] Unexpected error, continuing as guest:', err.message);
    return next();
  }
};
