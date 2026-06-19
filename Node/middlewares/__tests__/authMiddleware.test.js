/**
 * Unit tests for authMiddleware.js
 *
 * Covers all 6 exported middleware functions:
 *   ensureAuthenticated        – session check, redirect
 *   ensureAdminApiAuthenticated – session check, 401 JSON
 *   ensureAdminApiPermission    – role/permission check, 401/403
 *   ensureVendorAuthenticated   – vendor session check, redirect
 *   verifyToken                – JWT auth + CIAM + refresh-retry
 *   redirectIfAuthenticated    – redirect if session exists
 */

/* ─── Mocks ──────────────────────────────────────────────────────────
 * All mocks must be defined inside jest.mock() because of Jest's
 * automatic mock hoisting (variables are lifted to the top).
 */

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../config/dbDirect', () => ({
  queryOne: jest.fn(),
}));

jest.mock('../../ciam/ciam.service', () => ({
  getUserByDomainId: jest.fn(),
}));

jest.mock('../../utils/ciamTokenHelper', () => ({
  attemptTokenRefresh: jest.fn(),
}));

jest.mock('../../config/role-decryption', () => ({
  decryptRole: jest.fn(),
}));

jest.mock('../../utils/permissionChecker', () => ({
  getUserPermissions: jest.fn(),
}));

// ─── Load modules after mocks are registered ─────────────────────────

const jwt = require('jsonwebtoken');
const ciamService = require('../../ciam/ciam.service');
const { attemptTokenRefresh } = require('../../utils/ciamTokenHelper');
const { decryptRole } = require('../../config/role-decryption');
const { getUserPermissions } = require('../../utils/permissionChecker');

const {
  ensureAuthenticated,
  ensureAdminApiAuthenticated,
  ensureAdminApiPermission,
  ensureVendorAuthenticated,
  verifyToken,
  redirectIfAuthenticated,
} = require('../authMiddleware');

// ─── Helpers ─────────────────────────────────────────────────────────

function mockReq(opts = {}) {
  const {
    sessionAdmin,
    sessionVendor,
    sessionLng,
    authHeader,
    cookies,
    query,
  } = opts;
  return {
    session: {
      admin: sessionAdmin || undefined,
      vendor: sessionVendor || undefined,
      lng: sessionLng,
      destroy: jest.fn((cb) => cb && cb(null)),
    },
    headers: authHeader ? { authorization: authHeader } : {},
    cookies: cookies || {},
    query: query || {},
    t: (msg) => msg,
  };
}

function mockRes() {
  const res = {
    redirect: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    cookie: jest.fn(),
  };
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════
//  1. ensureAuthenticated
// ═════════════════════════════════════════════════════════════════════

describe('ensureAuthenticated()', () => {
  test('calls next() when req.session.admin exists', () => {
    const req = mockReq({ sessionAdmin: { id: 'admin1' } });
    const res = mockRes();
    const next = jest.fn();

    ensureAuthenticated(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('redirects to /admin/login when req.session.admin is missing', () => {
    const req = mockReq({}); // no session admin
    const res = mockRes();
    const next = jest.fn();

    ensureAuthenticated(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('redirects to /admin/login when req.session.admin is null', () => {
    const req = mockReq({ sessionAdmin: null });
    const res = mockRes();
    const next = jest.fn();

    ensureAuthenticated(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/login');
  });
});

// ═════════════════════════════════════════════════════════════════════
//  2. ensureAdminApiAuthenticated
// ═════════════════════════════════════════════════════════════════════

describe('ensureAdminApiAuthenticated()', () => {
  test('calls next() when session admin exists', () => {
    const req = mockReq({ sessionAdmin: { id: 'admin1' } });
    const res = mockRes();
    const next = jest.fn();

    ensureAdminApiAuthenticated(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 401 JSON when session admin is missing', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = jest.fn();

    ensureAdminApiAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Unauthorized admin session',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 JSON with translated message when req.t exists', () => {
    const req = {
      ...mockReq({}),
      t: () => 'جلسة غير مصرح بها',
    };
    const res = mockRes();
    const next = jest.fn();

    ensureAdminApiAuthenticated(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'جلسة غير مصرح بها',
    });
  });
});

// ═════════════════════════════════════════════════════════════════════
//  3. ensureAdminApiPermission
// ═════════════════════════════════════════════════════════════════════

describe('ensureAdminApiPermission()', () => {
  const middleware = ensureAdminApiPermission('manage-users');

  test('returns 401 when no session admin exists', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Unauthorized admin session',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when admin has SUPERADMINROLEID', () => {
    process.env.SUPERADMINROLEID = '1';
    const req = mockReq({
      sessionAdmin: { roleId: '1', permissions: [] },
    });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    delete process.env.SUPERADMINROLEID;
  });

  test('calls next() when admin has wildcard permission "*"', () => {
    const req = mockReq({
      sessionAdmin: { roleId: '2', permissions: ['*'] },
    });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('calls next() when admin has the required permission', () => {
    const req = mockReq({
      sessionAdmin: { roleId: '2', permissions: ['manage-users'] },
    });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('returns 403 when admin lacks the required permission', () => {
    const req = mockReq({
      sessionAdmin: { roleId: '2', permissions: ['view-reports'] },
    });
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'You do not have permission to access this module',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 with translated message when req.t exists', () => {
    const req = {
      ...mockReq({
        sessionAdmin: { roleId: '2', permissions: ['view-reports'] },
      }),
      t: () => 'ليس لديك صلاحية',
    };
    const res = mockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'ليس لديك صلاحية',
    });
  });
});

// ═════════════════════════════════════════════════════════════════════
//  4. ensureVendorAuthenticated
// ═════════════════════════════════════════════════════════════════════

describe('ensureVendorAuthenticated()', () => {
  test('calls next() when req.session.vendor exists', () => {
    const req = mockReq({ sessionVendor: { id: 'vendor1' } });
    const res = mockRes();
    const next = jest.fn();

    ensureVendorAuthenticated(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('redirects to /vendor/login when session vendor is missing', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = jest.fn();

    ensureVendorAuthenticated(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/vendor/login');
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── Helper to flush microtasks ────────────────────────────────────
// The verifyToken() source uses an `async` callback inside jwt.verify().
// Even when the mocked jwt.verify calls the callback synchronously,
// the `await` inside that async callback defers execution to the
// microtask queue. This helper drains those microtasks before assertions.
function flushMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ═════════════════════════════════════════════════════════════════════
//  5. verifyToken  (the complex one)
// ═════════════════════════════════════════════════════════════════════

describe('verifyToken()', () => {
  const mockUserEncryptedRoles = { data: 'encrypted' };
  const mockUserInfo = {
    value: [{
      userDomain: 'ml687',
      encryptedRoles: mockUserEncryptedRoles,
      nameEn: 'Test User',
      emailAddress: 'test@dnrd.ae',
    }],
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  // ── Happy path ──────────────────────────────────────────────────

  test('calls next() with valid token and successful CIAM call', async () => {
    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(null, { sub: 'ml687', lng: 'en' });
    });
    ciamService.getUserByDomainId.mockResolvedValue(mockUserInfo);
    decryptRole.mockResolvedValue([{ ClientRoleId: '3' }]);
    getUserPermissions.mockResolvedValue(['view-events', 'manage-events']);

    const req = mockReq({ authHeader: 'Bearer valid.jwt.token' });
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: 'ml687',
      userDomain: 'ml687',
      roleId: '3',
      permissions: ['view-events', 'manage-events'],
      token: 'valid.jwt.token',
    });
  });

  // ── Missing token ───────────────────────────────────────────────

  test('returns 401 when no authorization header', async () => {
    const req = mockReq({});
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Token required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is empty string', async () => {
    const req = mockReq({ authHeader: 'Bearer ' });
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Token required',
    });
  });

  // ── Invalid JWT ─────────────────────────────────────────────────

  test('returns 401 when JWT verification fails', async () => {
    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(new Error('jwt malformed'));
    });

    const req = mockReq({ authHeader: 'Bearer bad.token.here' });
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Invalid token',
    });
  });

  // ── CIAM fails THEN refresh succeeds THEN retry succeeds ────────

  test('CIAM fails → refresh succeeds → retry succeeds → next()', async () => {
    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(null, { sub: 'ml687' });
    });
    // First CIAM call returns null (simulated 401)
    ciamService.getUserByDomainId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockUserInfo); // retry succeeds
    attemptTokenRefresh.mockResolvedValue({
      accessToken: 'refreshed-token',
      refreshToken: 'new-refresh',
    });
    decryptRole.mockResolvedValue([{ ClientRoleId: '3' }]);
    getUserPermissions.mockResolvedValue([]);

    const req = mockReq({ authHeader: 'Bearer expired.token' });
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);
    await flushMicrotasks();

    // Verify refresh was attempted
    expect(attemptTokenRefresh).toHaveBeenCalledWith(req);
    // Verify retry used the refreshed token
    expect(ciamService.getUserByDomainId).toHaveBeenNthCalledWith(
      2,
      ['ml687'],
      'refreshed-token'
    );
    expect(next).toHaveBeenCalled();
    // The source keeps the original token in req.user.token (not the refreshed one)
    expect(req.user.token).toBe('expired.token');
  });

  // ── CIAM fails → refresh fails → 401 ────────────────────────────

  test('CIAM fails → refresh fails → returns 401', async () => {
    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(null, { sub: 'ml687' });
    });
    ciamService.getUserByDomainId.mockResolvedValue(null);
    attemptTokenRefresh.mockResolvedValue({
      accessToken: null,
      refreshToken: null,
    });

    const req = mockReq({ authHeader: 'Bearer expired.token' });
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);
    await flushMicrotasks();

    expect(attemptTokenRefresh).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Session expired, please login again',
    });
    expect(next).not.toHaveBeenCalled();
  });

  // ── CIAM returns isError → refresh fails → 401 ─────────────────

  test('CIAM returns isError → refresh fails → returns 401', async () => {
    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(null, { sub: 'ml687' });
    });
    ciamService.getUserByDomainId.mockResolvedValue({
      isError: true,
      firstError: 'Token expired',
    });
    attemptTokenRefresh.mockResolvedValue({
      accessToken: null,
      refreshToken: null,
    });

    const req = mockReq({ authHeader: 'Bearer expired.token' });
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);
    await flushMicrotasks();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Session expired, please login again',
    });
  });

  // ── CIAM returns value where value[0] is null ──────────────────

  test('returns 401 when CIAM returns empty value array', async () => {
    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(null, { sub: 'ml687' });
    });
    ciamService.getUserByDomainId.mockResolvedValue({ value: [] });

    const req = mockReq({ authHeader: 'Bearer valid.token' });
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);
    await flushMicrotasks();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'User not found',
    });
  });

  // ── Handles missing userInfo.value gracefully (flat array) ──────

  test('handles CIAM response with flat array (no value wrapper)', async () => {
    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(null, { sub: 'ml687' });
    });
    ciamService.getUserByDomainId.mockResolvedValue([
      {
        userDomain: 'ml687',
        encryptedRoles: mockUserEncryptedRoles,
      },
    ]);
    decryptRole.mockResolvedValue([{ ClientRoleId: '2' }]);
    getUserPermissions.mockResolvedValue([]);

    const req = mockReq({ authHeader: 'Bearer valid.token' });
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('ml687');
  });

  // ── Sets language from JWT payload ──────────────────────────────

  test('sets session language from JWT payload', async () => {
    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(null, { sub: 'ml687', lng: 'ar' });
    });
    ciamService.getUserByDomainId.mockResolvedValue(mockUserInfo);
    decryptRole.mockResolvedValue([{ ClientRoleId: '1' }]);
    getUserPermissions.mockResolvedValue([]);

    const req = mockReq({ authHeader: 'Bearer valid.token' });
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);
    await flushMicrotasks();

    expect(req.session.lng).toBe('ar');
    expect(res.cookie).toHaveBeenCalledWith('lang', 'ar', expect.any(Object));
  });

  // ── Does NOT crash when lng is not in JWT ───────────────────────

  test('handles missing lng in JWT payload gracefully', async () => {
    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(null, { sub: 'ml687' }); // no lng
    });
    ciamService.getUserByDomainId.mockResolvedValue(mockUserInfo);
    decryptRole.mockResolvedValue([{ ClientRoleId: '1' }]);
    getUserPermissions.mockResolvedValue([]);

    const req = mockReq({ authHeader: 'Bearer valid.token' });
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalled();
    expect(req.session.lng).toBeUndefined();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  // ── Handles missing roleId gracefully ───────────────────────────

  test('sets empty permissions when decryptRole returns no role', async () => {
    jwt.verify.mockImplementation((token, secret, cb) => {
      cb(null, { sub: 'ml687' });
    });
    ciamService.getUserByDomainId.mockResolvedValue(mockUserInfo);
    decryptRole.mockResolvedValue([]); // no role

    const req = mockReq({ authHeader: 'Bearer valid.token' });
    const res = mockRes();
    const next = jest.fn();

    await verifyToken(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalled();
    expect(req.user.roleId).toBe('');
    expect(req.user.permissions).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════
//  6. redirectIfAuthenticated
// ═════════════════════════════════════════════════════════════════════

describe('redirectIfAuthenticated()', () => {
  test('redirects to /admin/dashboard?lng=en when admin session exists', () => {
    const req = mockReq({
      sessionAdmin: { id: 'admin1' },
      sessionLng: 'en',
    });
    const res = mockRes();
    const next = jest.fn();

    redirectIfAuthenticated(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard?lng=en');
    expect(next).not.toHaveBeenCalled();
  });

  test('redirects with lng from query param when session.lng is absent', () => {
    const req = mockReq({
      sessionAdmin: { id: 'admin1' },
      query: { lng: 'ar' },
    });
    const res = mockRes();
    const next = jest.fn();

    redirectIfAuthenticated(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard?lng=ar');
  });

  test('redirects with lng from cookie when session.lng and query are absent', () => {
    const req = mockReq({
      sessionAdmin: { id: 'admin1' },
      cookies: { lang: 'fr' },
    });
    const res = mockRes();
    const next = jest.fn();

    redirectIfAuthenticated(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard?lng=fr');
  });

  test('defaults to en when no language source available', () => {
    const req = {
      ...mockReq({ sessionAdmin: { id: 'admin1' } }),
      cookies: {}, // no lang cookie
      query: {},   // no lng query
    };
    const res = mockRes();
    const next = jest.fn();

    redirectIfAuthenticated(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard?lng=en');
  });

  test('calls next() when no admin session exists', () => {
    const req = mockReq({});
    const res = mockRes();
    const next = jest.fn();

    redirectIfAuthenticated(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
