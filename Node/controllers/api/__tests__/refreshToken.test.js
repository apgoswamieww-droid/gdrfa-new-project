jest.mock('../../../ciam/ciam.service', () => ({
  authRefreshToken: jest.fn(),
}));

const request = require('supertest');
const express = require('express');
const ciamService = require('../../../ciam/ciam.service');
const responseFormatter = require('../../../middlewares/responseFormatter');

// Create a test express app
const app = express();
app.use(express.json());
app.use(responseFormatter);

// Simple language mock so req.t() works
app.use((req, res, next) => {
  req.t = (key) => key;
  next();
});

// Import controllers AFTER mocks are set up
const authController = require('../authController');
const adminAuthController = require('../../adminApi/adminAuthController');

// Register refresh-token routes
app.post('/api/auth/refresh-token', authController.refreshToken);
app.post('/api/admin/refresh-token', adminAuthController.refreshToken);

const mockValidAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtbDY4NyJ9.mock';
const mockRefreshedAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtbDY4NyJ9.new';

const mockRefreshToken = '60bcca7a-1d7f-432b-9c8f-b466a72d18d0';
const mockNewRefreshToken = 'new-refresh-token-12345';

describe('POST /api/auth/refresh-token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Happy paths ─────────────────────────────────────────

  test('refreshes token successfully with valid body + auth header', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockRefreshedAccessToken,
        refreshToken: mockNewRefreshToken,
        accessTokenExpirationUtcDateTime: '2027-06-01T00:00:00Z',
      },
    });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.accessToken).toBe(mockRefreshedAccessToken);
    expect(res.body.data.refreshToken).toBe(mockNewRefreshToken);
    expect(res.body.data.accessTokenExpiry).toBe('2027-06-01T00:00:00Z');
    expect(ciamService.authRefreshToken).toHaveBeenCalledWith(
      mockValidAccessToken,
      mockRefreshToken,
    );
  });

  test('refreshes token successfully without authorization header', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockRefreshedAccessToken,
        refreshToken: mockNewRefreshToken,
        accessTokenExpirationUtcDateTime: '2027-06-01T00:00:00Z',
      },
    });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    // Without auth header, currentToken will be undefined
    expect(ciamService.authRefreshToken).toHaveBeenCalledWith(
      undefined,
      mockRefreshToken,
    );
  });

  test('refreshes token with malformed authorization header', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockRefreshedAccessToken,
        refreshToken: mockNewRefreshToken,
        accessTokenExpirationUtcDateTime: '2027-06-01T00:00:00Z',
      },
    });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', 'InvalidFormat')
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(200);
    // split(' ')[1] on 'InvalidFormat' returns undefined
    expect(ciamService.authRefreshToken).toHaveBeenCalledWith(
      undefined,
      mockRefreshToken,
    );
  });

  // ── Error scenarios ──────────────────────────────────────

  test('returns 401 when refreshToken is missing from body', async () => {
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/refresh token required/i);
    expect(ciamService.authRefreshToken).not.toHaveBeenCalled();
  });

  test('returns 401 when refreshToken is empty string', async () => {
    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: '' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/refresh token required/i);
    expect(ciamService.authRefreshToken).not.toHaveBeenCalled();
  });

  test('returns 401 when CIAM returns isError', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: true,
      errors: [{ code: 'AuthFailed', description: 'Invalid refresh token' }],
    });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/token refresh failed/i);
  });

  test('returns 401 when CIAM returns value without accessToken', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        refreshToken: mockNewRefreshToken,
        // no accessToken
      },
    });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/token refresh failed/i);
  });

  test('returns 401 when CIAM returns null result', async () => {
    ciamService.authRefreshToken.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/token refresh failed/i);
  });

  test('returns 401 when CIAM returns accessToken as null', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: null,
        refreshToken: mockNewRefreshToken,
      },
    });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
  });

  test('returns 401 when CIAM throws an exception', async () => {
    ciamService.authRefreshToken.mockRejectedValue(new Error('Network error'));

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/token refresh failed/i);
  });

  test('response envelope matches expected structure on success', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockRefreshedAccessToken,
        refreshToken: mockNewRefreshToken,
        accessTokenExpirationUtcDateTime: '2027-06-01T00:00:00Z',
      },
    });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: {
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        accessTokenExpiry: expect.any(String),
      },
    });
  });

  test('response envelope matches expected structure on failure', async () => {
    ciamService.authRefreshToken.mockResolvedValue({ isError: true });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.body).toMatchObject({
      status: false,
      message: expect.any(String),
    });
  });
});

// ────────────────────────────────────────────────────────────────────────
// /api/admin/refresh-token
// ────────────────────────────────────────────────────────────────────────

describe('POST /api/admin/refresh-token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('refreshes admin token successfully', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockRefreshedAccessToken,
        refreshToken: mockNewRefreshToken,
        accessTokenExpirationUtcDateTime: '2027-06-01T00:00:00Z',
      },
    });

    const res = await request(app)
      .post('/api/admin/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(true);
    expect(res.body.data.token).toBe(mockRefreshedAccessToken);
    expect(res.body.data.refreshToken).toBe(mockNewRefreshToken);
    expect(res.body.data.accessTokenExpiry).toBe('2027-06-01T00:00:00Z');
    // Admin endpoint maps token differently: { token, refreshToken, accessTokenExpiry }
    expect(ciamService.authRefreshToken).toHaveBeenCalledWith(
      mockValidAccessToken,
      mockRefreshToken,
    );
  });

  test('returns 401 when refreshToken is missing from body', async () => {
    const res = await request(app)
      .post('/api/admin/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/refresh token required/i);
    expect(ciamService.authRefreshToken).not.toHaveBeenCalled();
  });

  test('returns 401 when CIAM returns isError', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: true,
      errors: [{ code: 'AuthFailed', description: 'Invalid refresh token' }],
    });

    const res = await request(app)
      .post('/api/admin/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/token refresh failed/i);
  });

  test('returns 401 when CIAM returns value without accessToken', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: { refreshToken: mockNewRefreshToken },
    });

    const res = await request(app)
      .post('/api/admin/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/token refresh failed/i);
  });

  test('returns 401 when CIAM throws an exception', async () => {
    ciamService.authRefreshToken.mockRejectedValue(new Error('Network error'));

    const res = await request(app)
      .post('/api/admin/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(false);
    expect(res.body.message).toMatch(/token refresh failed/i);
  });

  test('response envelope structure on admin success', async () => {
    ciamService.authRefreshToken.mockResolvedValue({
      isError: false,
      value: {
        accessToken: mockRefreshedAccessToken,
        refreshToken: mockNewRefreshToken,
        accessTokenExpirationUtcDateTime: '2027-06-01T00:00:00Z',
      },
    });

    const res = await request(app)
      .post('/api/admin/refresh-token')
      .set('Authorization', `Bearer ${mockValidAccessToken}`)
      .send({ refreshToken: mockRefreshToken });

    expect(res.body).toMatchObject({
      status: true,
      message: expect.any(String),
      data: {
        token: expect.any(String),
        refreshToken: expect.any(String),
        accessTokenExpiry: expect.any(String),
      },
    });
  });
});
