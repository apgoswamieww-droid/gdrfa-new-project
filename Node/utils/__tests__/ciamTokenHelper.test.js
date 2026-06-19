/**
 * Unit tests for ciamTokenHelper.js
 *
 * Tests both attemptTokenRefresh() and destroyAdminSession() covering:
 * - Session-based token refresh
 * - Header-based token refresh
 * - CIAM returning errors/isError/throwing
 * - Token extraction edge cases (malformed headers, missing tokens)
 * - Session update propagation (req.session, req.headers, req.user)
 * - destroyAdminSession with/without session, callback, errors
 */

const { attemptTokenRefresh, destroyAdminSession } = require('../ciamTokenHelper');

// ─── Mocks ───────────────────────────────────────────────────────────

const mockNewAccessToken = 'refreshed-access-token-abc123';
const mockNewRefreshToken = 'refreshed-refresh-token-xyz789';

// Mock ciamService – must be required before ciamTokenHelper is loaded
jest.mock('../../ciam/ciam.service', () => ({
  authRefreshToken: jest.fn(),
}));

const ciamService = require('../../ciam/ciam.service');

// ─── Helpers ─────────────────────────────────────────────────────────

function createMockReq(opts = {}) {
  const {
    sessionAdmin,
    authorization,
    bodyRefreshToken,
    userToken,
  } = opts;

  return {
    session: sessionAdmin !== undefined
      ? { admin: sessionAdmin }
      : {},
    headers: authorization
      ? { authorization }
      : {},
    body: bodyRefreshToken
      ? { refreshToken: bodyRefreshToken }
      : {},
    user: userToken !== undefined
      ? { token: userToken }
      : undefined,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════
//  attemptTokenRefresh()
// ═════════════════════════════════════════════════════════════════════

describe('attemptTokenRefresh()', () => {
  // ── Happy path: session-based refresh ──────────────────────────────

  test('refreshes tokens from req.session.admin successfully', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
      },
      firstError: null,
    });

    const req = createMockReq({
      sessionAdmin: { accessToken: 'old-token', refreshToken: 'old-refresh' },
    });

    const result = await attemptTokenRefresh(req);

    expect(ciamService.authRefreshToken).toHaveBeenCalledWith('old-token', 'old-refresh');
    expect(result).toEqual({
      accessToken: mockNewAccessToken,
      refreshToken: mockNewRefreshToken,
    });
    expect(req.session.admin.accessToken).toBe(mockNewAccessToken);
    expect(req.session.admin.refreshToken).toBe(mockNewRefreshToken);
    expect(req.headers.authorization).toBe(`Bearer ${mockNewAccessToken}`);
  });

  // ── Happy path: header + body refresh ──────────────────────────────

  test('refreshes tokens from req.headers.authorization + req.body.refreshToken', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
      },
      firstError: null,
    });

    const req = createMockReq({
      authorization: 'Bearer header-token',
      bodyRefreshToken: 'body-refresh',
      userToken: 'header-token',
    });

    const result = await attemptTokenRefresh(req);

    expect(ciamService.authRefreshToken).toHaveBeenCalledWith('header-token', 'body-refresh');
    expect(result.accessToken).toBe(mockNewAccessToken);
    expect(result.refreshToken).toBe(mockNewRefreshToken);
    expect(req.headers.authorization).toBe(`Bearer ${mockNewAccessToken}`);
    expect(req.user.token).toBe(mockNewAccessToken);
  });

  // ── Session takes priority over header ─────────────────────────────

  test('session tokens take priority over header tokens', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
      },
      firstError: null,
    });

    const req = createMockReq({
      sessionAdmin: { accessToken: 'session-token', refreshToken: 'session-refresh' },
      authorization: 'Bearer header-token',
    });

    await attemptTokenRefresh(req);

    // Should use session tokens, not header tokens
    expect(ciamService.authRefreshToken).toHaveBeenCalledWith('session-token', 'session-refresh');
  });

  // ── PRESERVES old refresh token when CIAM returns no new one ──────

  test('preserves old refresh token when CIAM returns none', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockNewAccessToken,
        // no refreshToken in response
      },
      firstError: null,
    });

    const req = createMockReq({
      sessionAdmin: { accessToken: 'old-token', refreshToken: 'original-refresh' },
    });

    const result = await attemptTokenRefresh(req);

    // Should preserve the original refresh token
    expect(result.refreshToken).toBe('original-refresh');
    expect(req.session.admin.refreshToken).toBe('original-refresh');
  });

  // ── CIAM returns isError ──────────────────────────────────────────

  test('returns null tokens when CIAM returns isError: true', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: true,
      errors: [{ code: 'Auth.Expired', description: 'Token expired' }],
      value: null,
      firstError: 'Token expired',
    });

    const req = createMockReq({
      sessionAdmin: { accessToken: 'old-token', refreshToken: 'old-refresh' },
    });

    const result = await attemptTokenRefresh(req);

    expect(result).toEqual({ accessToken: null, refreshToken: null });
    // Session should NOT be updated
    expect(req.session.admin.accessToken).toBe('old-token');
  });

  // ── CIAM returns null result ──────────────────────────────────────

  test('returns null tokens when CIAM returns null', async () => {
    ciamService.authRefreshToken.mockResolvedValue(null);

    const req = createMockReq({
      sessionAdmin: { accessToken: 'old-token', refreshToken: 'old-refresh' },
    });

    const result = await attemptTokenRefresh(req);

    expect(result).toEqual({ accessToken: null, refreshToken: null });
  });

  // ── CIAM returns result without value.accessToken ─────────────────

  test('returns null tokens when CIAM response lacks accessToken', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: { /* no accessToken */ },
    });

    const req = createMockReq({
      sessionAdmin: { accessToken: 'old-token', refreshToken: 'old-refresh' },
    });

    const result = await attemptTokenRefresh(req);

    expect(result).toEqual({ accessToken: null, refreshToken: null });
  });

  // ── CIAM throws an exception ──────────────────────────────────────

  test('returns null tokens when CIAM throws an exception', async () => {
    ciamService.authRefreshToken.mockRejectedValue(new Error('Network error'));

    const req = createMockReq({
      sessionAdmin: { accessToken: 'old-token', refreshToken: 'old-refresh' },
    });

    const result = await attemptTokenRefresh(req);

    expect(result).toEqual({ accessToken: null, refreshToken: null });
  });

  // ── No refresh token available ────────────────────────────────────

  test('returns null when no refresh token exists in session or body', async () => {
    const req = createMockReq({
      sessionAdmin: { accessToken: 'some-token' }, // no refreshToken
      authorization: 'Bearer some-token',
    });

    const result = await attemptTokenRefresh(req);

    expect(result).toEqual({ accessToken: null, refreshToken: null });
    expect(ciamService.authRefreshToken).not.toHaveBeenCalled();
  });

  // ── No access token available ─────────────────────────────────────

  test('returns null when no access token exists in session or headers', async () => {
    const req = createMockReq({
      bodyRefreshToken: 'some-refresh',
      // no session.admin.accessToken and no authorization
    });

    const result = await attemptTokenRefresh(req);

    expect(result).toEqual({ accessToken: null, refreshToken: null });
    expect(ciamService.authRefreshToken).not.toHaveBeenCalled();
  });

  // ── Both tokens missing ───────────────────────────────────────────

  test('returns null when both tokens are missing entirely', async () => {
    const req = createMockReq({});

    const result = await attemptTokenRefresh(req);

    expect(result).toEqual({ accessToken: null, refreshToken: null });
    expect(ciamService.authRefreshToken).not.toHaveBeenCalled();
  });

  // ── No session object at all ──────────────────────────────────────

  test('handles missing req.session gracefully', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
      },
    });

    // req with no session property
    const req = {
      headers: { authorization: 'Bearer header-token' },
      body: { refreshToken: 'body-refresh' },
    };

    const result = await attemptTokenRefresh(req);

    expect(result.accessToken).toBe(mockNewAccessToken);
    // Should update headers if they exist
    expect(req.headers.authorization).toBe(`Bearer ${mockNewAccessToken}`);
  });

  // ── Authorization header without Bearer prefix ────────────────────

  test('returns null when authorization header lacks Bearer prefix (no space)', async () => {
    const req = createMockReq({
      authorization: 'just-the-token', // no "Bearer " → split(' ')[1] is undefined → falls to null
      bodyRefreshToken: 'body-refresh',
    });

    const result = await attemptTokenRefresh(req);

    expect(result).toEqual({ accessToken: null, refreshToken: null });
    expect(ciamService.authRefreshToken).not.toHaveBeenCalled();
  });

  // ── Updates req.headers when headers exist ────────────────────────

  test('updates req.headers when authorization is present', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
      },
    });

    const req = createMockReq({
      sessionAdmin: { accessToken: 'old-token', refreshToken: 'old-refresh' },
      authorization: 'Bearer old-token',
    });

    await attemptTokenRefresh(req);

    expect(req.headers.authorization).toBe(`Bearer ${mockNewAccessToken}`);
  });

  // ── Does NOT crash when req.headers is absent ─────────────────────

  test('handles missing req.headers gracefully', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
      },
    });

    const req = {
      session: {
        admin: { accessToken: 'old-token', refreshToken: 'old-refresh' },
      },
      // no headers property
    };

    const result = await attemptTokenRefresh(req);

    expect(result.accessToken).toBe(mockNewAccessToken);
  });

  // ── Does NOT update req.headers when session admin is absent ──────

  test('does not update req.session when admin is absent', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
      },
    });

    const req = {
      session: {}, // no admin
      headers: { authorization: 'Bearer header-token' },
      body: { refreshToken: 'body-refresh' },
    };

    const result = await attemptTokenRefresh(req);

    expect(result.accessToken).toBe(mockNewAccessToken);
    expect(req.headers.authorization).toBe(`Bearer ${mockNewAccessToken}`);
    // session.admin should not be created if it didn't exist
    expect(req.session.admin).toBeUndefined();
  });

  // ── CIAM returns value: null (with isError: false) ─────────────────

  test('returns null tokens when CIAM returns value: null', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: null, // value is null, not missing accessToken key
    });

    const req = createMockReq({
      sessionAdmin: { accessToken: 'old-token', refreshToken: 'old-refresh' },
    });

    const result = await attemptTokenRefresh(req);

    expect(result).toEqual({ accessToken: null, refreshToken: null });
  });

  // ── Logs warnings on missing tokens ───────────────────────────────

  test('logs warning when tokens are missing', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const req = createMockReq({});

    await attemptTokenRefresh(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[CIAM Token Refresh] No refresh token or access token available'
    );
    consoleSpy.mockRestore();
  });

  // ── Logs errors on CIAM failures ──────────────────────────────────

  test('logs error when CIAM refresh fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    ciamService.authRefreshToken.mockResolvedValue({
      isError: true,
      firstError: 'Invalid token',
    });

    const req = createMockReq({
      sessionAdmin: { accessToken: 'old-token', refreshToken: 'old-refresh' },
    });

    await attemptTokenRefresh(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[CIAM Token Refresh] Refresh failed:',
      'Invalid token'
    );
    consoleSpy.mockRestore();
  });

  // ── Logs errors on CIAM exceptions ────────────────────────────────

  test('logs error when CIAM throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    ciamService.authRefreshToken.mockRejectedValue(new Error('Connection refused'));

    const req = createMockReq({
      sessionAdmin: { accessToken: 'old-token', refreshToken: 'old-refresh' },
    });

    await attemptTokenRefresh(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[CIAM Token Refresh] Unexpected error:',
      'Connection refused'
    );
    consoleSpy.mockRestore();
  });

  // ── Logs success message on refresh ───────────────────────────────

  test('logs success message on successful refresh', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
      },
    });

    const req = createMockReq({
      sessionAdmin: { accessToken: 'old-token', refreshToken: 'old-refresh' },
    });

    await attemptTokenRefresh(req);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[CIAM Token Refresh] Token refreshed successfully'
    );
    consoleSpy.mockRestore();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  destroyAdminSession()
// ═════════════════════════════════════════════════════════════════════

describe('destroyAdminSession()', () => {
  // ── Normal session destroy ────────────────────────────────────────

  test('destroys session and redirects when session exists', (done) => {
    const req = {
      session: {
        destroy(cb) {
          cb(null); // no error
        },
      },
    };
    const res = {
      redirect: jest.fn((url) => {
        expect(url).toBe('/admin/login');
        done();
      }),
    };

    destroyAdminSession(req, res);
  });

  // ── Session destroy with callback ─────────────────────────────────

  test('invokes callback when provided instead of res.redirect', (done) => {
    const req = {
      session: {
        destroy(cb) {
          cb(null);
        },
      },
    };
    const res = { redirect: jest.fn() };
    const callback = jest.fn(() => {
      expect(callback).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
      done();
    });

    destroyAdminSession(req, res, callback);
  });

  // ── Session destroy error ─────────────────────────────────────────

  test('logs error when session.destroy fails and calls callback', (done) => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const req = {
      session: {
        destroy(cb) {
          cb(new Error('Destroy failed'));
        },
      },
    };
    const res = { redirect: jest.fn() };
    const callback = jest.fn(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Session Destroy] Error:',
        'Destroy failed'
      );
      consoleSpy.mockRestore();
      expect(callback).toHaveBeenCalled();
      done();
    });

    destroyAdminSession(req, res, callback);
  });

  // ── No session object ─────────────────────────────────────────────

  test('calls callback when req.session is absent', (done) => {
    const req = {}; // no session
    const res = { redirect: jest.fn() };
    const callback = jest.fn(() => {
      expect(callback).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
      done();
    });

    destroyAdminSession(req, res, callback);
  });

  // ── No callback, no redirect if headers already sent ──────────────

  test('does not redirect if headersSent is true', () => {
    const req = {
      session: {
        destroy(cb) {
          cb(null);
        },
      },
    };
    const res = {
      headersSent: true,
      redirect: jest.fn(),
    };

    destroyAdminSession(req, res);

    expect(res.redirect).not.toHaveBeenCalled();
  });

  // ── No session, no callback, no res ───────────────────────────────

  test('handles missing session and missing callback gracefully', () => {
    // Should not throw
    expect(() => destroyAdminSession({}, null)).not.toThrow();
  });

  // ── Session destroy throws synchronously ──────────────────────────

  test('handles synchronous throw in session.destroy', (done) => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const req = {
      session: {
        destroy() {
          throw new Error('Unexpected crash');
        },
      },
    };
    const res = { redirect: jest.fn() };
    const callback = jest.fn(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Session Destroy] Unexpected error:',
        'Unexpected crash'
      );
      consoleSpy.mockRestore();
      done();
    });

    destroyAdminSession(req, res, callback);
  });
});
