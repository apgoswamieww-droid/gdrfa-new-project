/**
 * Unit tests for resourceAuthorization.js
 *
 * Covers:
 *   authorizeResource(resourceType, { operation }) factory
 *   - No authentication (401)
 *   - Unknown resource type (throws)
 *   - SuperAdmin bypass (next() called)
 *   - Granular permission checks (read / write / create)
 *   - Resource existence check (non-scoped resources → 404)
 *   - Event ownership/scope check (scoped resources → 403)
 *   - Missing resource ID on write (400)
 *   - Wildcard permission "*" bypass
 *   - Internal error handling (500)
 *   - validateResourceId helper
 *   - RESOURCE_CONFIGS export
 */

/* ─── Mocks ──────────────────────────────────────────────────────────
 * All mocks must be defined inside jest.mock() because of Jest's
 * automatic mock hoisting (variables are lifted to the top).
 */

jest.mock('../../config/dbDirect', () => ({
  queryOne: jest.fn(),
}));

// ─── Load modules after mocks are registered ─────────────────────────

const db = require('../../config/dbDirect');
const {
  authorizeResource,
  validateResourceId,
  RESOURCE_CONFIGS,
} = require('../resourceAuthorization');

// ─── Helpers ─────────────────────────────────────────────────────────

/** Create a mock request with the given user and route params. */
function mockReq(opts = {}) {
  const {
    user,
    params,
    body,
    query,
    t,
  } = opts;
  return {
    user: user || undefined,
    params: params || {},
    body: body || {},
    query: query || {},
    t: t || ((msg) => msg),
  };
}

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.SUPERADMINROLEID;
});

// ═════════════════════════════════════════════════════════════════════
//  RESOURCE_CONFIGS
// ═════════════════════════════════════════════════════════════════════

describe('RESOURCE_CONFIGS', () => {
  test('exports all 17 resource types', () => {
    const expectedKeys = [
      'kpi', 'event', 'eventType', 'sportActivity', 'faq',
      'facility', 'sponsor', 'blog', 'media', 'plan',
      'cmsPage', 'team', 'homeSlider', 'glimpseOfSports',
      'participant', 'participantTeam', 'contactUs',
    ];
    expectedKeys.forEach((key) => {
      expect(RESOURCE_CONFIGS).toHaveProperty(key);
    });
  });

  test('every config has required fields', () => {
    Object.entries(RESOURCE_CONFIGS).forEach(([key, config]) => {
      expect(config).toHaveProperty('table');
      expect(config).toHaveProperty('idColumn');
      expect(config).toHaveProperty('idParamName');
      expect(config).toHaveProperty('superAdminBypass');
      // Must have at least a base permission
      expect(typeof config.permission).toBe('string');
    });
  });

  test('event config has ownership scope', () => {
    const evt = RESOURCE_CONFIGS.event;
    expect(evt.scopeCheck).toBeDefined();
    expect(evt.scopeCheck.checkOwnerSqlWithPlaceholder).toContain('@currentUser');
  });

  test('non-event resources have no scopeCheck (null)', () => {
    const noScope = ['kpi', 'eventType', 'sportActivity', 'faq', 'facility',
      'sponsor', 'blog', 'media', 'plan', 'cmsPage', 'team',
      'homeSlider', 'glimpseOfSports', 'participant', 'participantTeam', 'contactUs'];
    noScope.forEach((key) => {
      if (key !== 'event') {
        expect(RESOURCE_CONFIGS[key].scopeCheck).toBeNull();
      }
    });
  });

  test('participantTeam uses teamId param', () => {
    expect(RESOURCE_CONFIGS.participantTeam.idParamName).toBe('teamId');
  });
});

// ═════════════════════════════════════════════════════════════════════
//  authorizeResource – no authentication
// ═════════════════════════════════════════════════════════════════════

describe('authorizeResource – no req.user (401)', () => {
  test('returns 401 when req.user is undefined', async () => {
    const middleware = authorizeResource('kpi');
    const req = mockReq({}); // no user
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Authentication required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 with translated message when req.t exists', async () => {
    const middleware = authorizeResource('kpi');
    const req = {
      ...mockReq({}),
      t: () => 'مصادقة مطلوبة',
    };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'مصادقة مطلوبة',
    });
  });

  test('returns 401 even for create operation when not authenticated', async () => {
    const middleware = authorizeResource('kpi', { operation: 'create' });
    const req = mockReq({});
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  authorizeResource – unknown resource type
// ═════════════════════════════════════════════════════════════════════

describe('authorizeResource – unknown resource type', () => {
  test('throws error when resource type is not configured', () => {
    expect(() => authorizeResource('nonexistent')).toThrow(
      'Unknown resource type: "nonexistent"'
    );
  });
});

// ═════════════════════════════════════════════════════════════════════
//  authorizeResource – SuperAdmin bypass
// ═════════════════════════════════════════════════════════════════════

describe('authorizeResource – SuperAdmin bypass', () => {
  const superAdminUser = {
    roleId: '8B1FABC7-73AF-47F5-944C-3BA7FF049AAF',
    permissions: [],
    userDomain: 'superadmin',
  };

  test('calls next() when user has SUPERADMINROLEID (write)', async () => {
    process.env.SUPERADMINROLEID = '8B1FABC7-73AF-47F5-944C-3BA7FF049AAF';
    const middleware = authorizeResource('kpi');
    const req = mockReq({ user: superAdminUser, params: { id: '123' } });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('calls next() even without permission (SuperAdmin bypass)', async () => {
    process.env.SUPERADMINROLEID = '8B1FABC7-73AF-47F5-944C-3BA7FF049AAF';
    const middleware = authorizeResource('kpi');
    const req = mockReq({
      user: { ...superAdminUser, permissions: [] },
      params: { id: '456' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('calls next() for create operation (SuperAdmin bypass)', async () => {
    process.env.SUPERADMINROLEID = '8B1FABC7-73AF-47F5-944C-3BA7FF049AAF';
    const middleware = authorizeResource('kpi', { operation: 'create' });
    const req = mockReq({ user: superAdminUser });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('does NOT bypass when roleId does not match SUPERADMINROLEID', async () => {
    process.env.SUPERADMINROLEID = 'SOME_OTHER_ID';
    const middleware = authorizeResource('kpi');
    const req = mockReq({
      user: superAdminUser, // matches the default in the test, but env is different
      params: { id: '789' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    // Should fall through to permission check → fails because no permissions
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  authorizeResource – permission checks (read / write / create)
// ═════════════════════════════════════════════════════════════════════

describe('authorizeResource – granular permission checks', () => {
  const baseUser = {
    roleId: '3',
    userDomain: 'ml687',
  };

  // ── Read operation ─────────────────────────────────────────────

  describe('read operation', () => {
    test('calls next() when user has readPermission and resource exists', async () => {
      db.queryOne.mockResolvedValue({ id: 42 });
      const middleware = authorizeResource('kpi', { operation: 'read' });
      const req = mockReq({
        user: { ...baseUser, permissions: ['view-kpis'] },
        params: { id: '42' },
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id'),
        ['42']
      );
    });

    test('calls next() for list operation without resource ID (permission-only)', async () => {
      // GET /admin/kpis has no :id param
      const middleware = authorizeResource('kpi', { operation: 'read' });
      const req = mockReq({
        user: { ...baseUser, permissions: ['view-kpis'] },
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(db.queryOne).not.toHaveBeenCalled();
    });

    test('returns 403 when user lacks readPermission', async () => {
      const middleware = authorizeResource('kpi', { operation: 'read' });
      const req = mockReq({
        user: { ...baseUser, permissions: ['edit-event'] },
        params: { id: '42' },
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: false,      message: 'You do not have permission to perform this action',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

  // ── Write operation ────────────────────────────────────────────

  describe('write operation (default)', () => {
    test('calls next() when user has permission and resource exists', async () => {
      db.queryOne.mockResolvedValue({ id: 1 });
      const middleware = authorizeResource('blog');
      const req = mockReq({
        user: { ...baseUser, permissions: ['edit-blog'] },
        params: { id: '1' },
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('blog_posts'),
        ['1']
      );
    });

    test('returns 404 when resource does not exist', async () => {
      db.queryOne.mockResolvedValue(null); // not found
      const middleware = authorizeResource('blog');
      const req = mockReq({
        user: { ...baseUser, permissions: ['edit-blog'] },
        params: { id: '999' },
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: 'Resource not found',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 when user lacks the write permission', async () => {
      const middleware = authorizeResource('blog');
      const req = mockReq({
        user: { ...baseUser, permissions: ['view-blog-list'] },
        params: { id: '1' },
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('returns 400 when resource ID is missing for write', async () => {
      const middleware = authorizeResource('blog');
      const req = mockReq({
        user: { ...baseUser, permissions: ['edit-blog'] },
        // no params.id
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: 'Resource ID is required',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ── Create operation ───────────────────────────────────────────

  describe('create operation', () => {
    test('calls next() with permission only (no resource ID needed)', async () => {
      const middleware = authorizeResource('blog', { operation: 'create' });
      const req = mockReq({
        user: { ...baseUser, permissions: ['create-blog'] },
        // no params — create doesn't need an ID
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(db.queryOne).not.toHaveBeenCalled();
    });

    test('returns 403 when user lacks createPermission', async () => {
      const middleware = authorizeResource('blog', { operation: 'create' });
      const req = mockReq({
        user: { ...baseUser, permissions: ['edit-blog'] },
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    test('create uses the createPermission slug', async () => {
      const middleware = authorizeResource('event', { operation: 'create' });
      const req = mockReq({
        user: { ...baseUser, permissions: ['create-event'] },
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('create fails when user has write permission but not create', async () => {
      const middleware = authorizeResource('event', { operation: 'create' });
      const req = mockReq({
        user: { ...baseUser, permissions: ['edit-event'] }, // not 'create-event'
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════
//  authorizeResource – event ownership / scope check
// ═════════════════════════════════════════════════════════════════════

describe('authorizeResource – event ownership scope', () => {
  const eventUser = {
    roleId: '3',
    userDomain: 'ml687',
    permissions: ['edit-event'],
  };

  test('calls next() when user is the event owner (userId match)', async () => {
    // queryOne returns a row — user is the owner
    db.queryOne.mockResolvedValue({ id: 10 });
    const middleware = authorizeResource('event');
    const req = mockReq({
      user: eventUser,
      params: { id: '10' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(db.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = ?'),
      ['10', 'ml687', 'ml687', 'ml687'] // resourceId + 3 @currentUser occurrences
    );
  });

  test('returns 403 when user is NOT the event owner', async () => {
    // queryOne returns null — no ownership match
    db.queryOne.mockResolvedValue(null);
    const middleware = authorizeResource('event');
    const req = mockReq({
      user: eventUser,
      params: { id: '99' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'You do not have access to this resource',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('scope SQL includes eventAdmins and eventCoordinators checks', async () => {
    // The scope SQL should check userId, eventAdmins, AND eventCoordinators
    db.queryOne.mockResolvedValue({ id: 5 });
    const middleware = authorizeResource('event');
    const req = mockReq({
      user: eventUser,
      params: { id: '5' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    // Verify the SQL contains all three ownership conditions
    const sqlArg = db.queryOne.mock.calls[0][0];
    expect(sqlArg).toContain('userId');
    expect(sqlArg).toContain('eventAdmins');
    expect(sqlArg).toContain('eventCoordinators');
    expect(sqlArg).toContain('deletedAt IS NULL');
  });

  test('returns 403 for event when user has permission but no ownership', async () => {
    // User has 'edit-event' permission but is not the owner
    db.queryOne.mockResolvedValue(null);
    const middleware = authorizeResource('event');
    const req = mockReq({
      user: eventUser,
      params: { id: '42' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  authorizeResource – wildcard permission "*"
// ═════════════════════════════════════════════════════════════════════

describe('authorizeResource – wildcard permission bypass', () => {
  const wildcardUser = {
    roleId: '3',
    userDomain: 'admin1',
    permissions: ['*'],
  };

  test('wildcard bypasses permission check on write', async () => {
    db.queryOne.mockResolvedValue({ id: 1 });
    const middleware = authorizeResource('kpi');
    const req = mockReq({
      user: wildcardUser,
      params: { id: '1' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('wildcard bypasses permission check on read', async () => {
    const middleware = authorizeResource('kpi', { operation: 'read' });
    const req = mockReq({
      user: wildcardUser,
      params: { id: '1' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('wildcard bypasses permission check on create', async () => {
    const middleware = authorizeResource('kpi', { operation: 'create' });
    const req = mockReq({ user: wildcardUser });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(db.queryOne).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  authorizeResource – resource type with master permission
// ═════════════════════════════════════════════════════════════════════

describe('authorizeResource – master permission resources', () => {
  const masterUser = {
    roleId: '3',
    userDomain: 'ml687',
    permissions: ['master'],
  };

  test('sponsor with master permission passes', async () => {
    db.queryOne.mockResolvedValue({ id: 1 });
    const middleware = authorizeResource('sponsor');
    const req = mockReq({
      user: masterUser,
      params: { id: '1' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('faq with master permission passes', async () => {
    db.queryOne.mockResolvedValue({ id: 5 });
    const middleware = authorizeResource('faq');
    const req = mockReq({
      user: masterUser,
      params: { id: '5' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('media without master permission fails', async () => {
    const middleware = authorizeResource('media');
    const req = mockReq({
      user: { ...masterUser, permissions: ['view-blog-list'] },
      params: { id: '3' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  authorizeResource – participantTeam with teamId param
// ═════════════════════════════════════════════════════════════════════

describe('authorizeResource – participantTeam (teamId param)', () => {
  test('extracts resource ID from params.teamId', async () => {
    db.queryOne.mockResolvedValue({ id: 7 });
    const middleware = authorizeResource('participantTeam');
    const req = mockReq({
      user: { roleId: '3', userDomain: 'ml687', permissions: ['master'] },
      params: { teamId: '7' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(db.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('team_players'),
      ['7']
    );
  });

  test('returns 400 when teamId param is missing', async () => {
    const middleware = authorizeResource('participantTeam');
    const req = mockReq({
      user: { roleId: '3', userDomain: 'ml687', permissions: ['master'] },
      // no teamId param
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Resource ID is required',
    });
  });
});

// ═════════════════════════════════════════════════════════════════════
//  authorizeResource – i18n translated messages
// ═════════════════════════════════════════════════════════════════════

describe('authorizeResource – translated error messages', () => {
  test('returns translated 403 when req.t exists', async () => {
    const middleware = authorizeResource('kpi');
    const req = mockReq({
      user: { roleId: '3', userDomain: 'ml687', permissions: ['view-reports'] },
      params: { id: '1' },
      t: () => 'ليس لديك صلاحية',
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'ليس لديك صلاحية',
    });
  });

  test('returns translated 404 when req.t exists', async () => {
    db.queryOne.mockResolvedValue(null);
    const middleware = authorizeResource('kpi');
    const req = mockReq({
      user: { roleId: '3', userDomain: 'ml687', permissions: ['edit-kpis'] },
      params: { id: '999' },
      t: () => 'الموارد غير موجودة',
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'الموارد غير موجودة',
    });
  });

  test('returns translated scope denied when req.t exists', async () => {
    db.queryOne.mockResolvedValue(null);
    const middleware = authorizeResource('event');
    const req = mockReq({
      user: { roleId: '3', userDomain: 'ml687', permissions: ['edit-event'] },
      params: { id: '42' },
      t: () => 'ليس لديك صلاحية على هذا المورد',
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'ليس لديك صلاحية على هذا المورد',
    });
  });
});

// ═════════════════════════════════════════════════════════════════════
//  authorizeResource – internal error handling (500)
// ═════════════════════════════════════════════════════════════════════

describe('authorizeResource – error handling', () => {
  test('returns 500 when db.queryOne throws', async () => {
    db.queryOne.mockRejectedValue(new Error('DB connection lost'));
    const middleware = authorizeResource('kpi');
    const req = mockReq({
      user: { roleId: '3', userDomain: 'ml687', permissions: ['edit-kpis'] },
      params: { id: '1' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Internal server error during authorization check',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 500 when db.queryOne throws for event scope check', async () => {
    db.queryOne.mockRejectedValue(new Error('Timeout'));
    const middleware = authorizeResource('event');
    const req = mockReq({
      user: { roleId: '3', userDomain: 'ml687', permissions: ['edit-event'] },
      params: { id: '1' },
    });
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Internal server error during authorization check',
    });
    expect(next).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════
//  validateResourceId
// ═════════════════════════════════════════════════════════════════════

describe('validateResourceId()', () => {
  test('calls next() when params.id is present', () => {
    const req = { params: { id: '42' } };
    const res = mockRes();
    const next = jest.fn();

    validateResourceId(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('calls next() when body.id is present (fallback)', () => {
    const req = { params: {}, body: { id: '5' }, query: {} };
    const res = mockRes();
    const next = jest.fn();

    validateResourceId(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('calls next() when query.id is present (fallback)', () => {
    const req = { params: {}, body: {}, query: { id: '7' } };
    const res = mockRes();
    const next = jest.fn();

    validateResourceId(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('returns 400 when id is missing', () => {
    const req = { params: {}, body: {}, query: {} };
    const res = mockRes();
    const next = jest.fn();

    validateResourceId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: false,
      message: 'Resource ID is required',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 400 when id is empty string', () => {
    const req = { params: { id: '' }, body: {}, query: {} };
    const res = mockRes();
    const next = jest.fn();

    validateResourceId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ═════════════════════════════════════════════════════════════════════
//  authorizeResource – multi-resource existence check
// ═════════════════════════════════════════════════════════════════════

describe('authorizeResource – existence check across resource types', () => {
  const testUser = {
    roleId: '3',
    userDomain: 'admin',
    permissions: ['edit-team', 'edit-plan', 'edit-facility', 'edit-blog'],
  };

  const testCases = [
    { resource: 'team', table: 'teams', perm: 'edit-team', id: '10' },
    { resource: 'plan', table: 'plans', perm: 'edit-plan', id: '20' },
    { resource: 'facility', table: 'facilities', perm: 'edit-facility', id: '30' },
    { resource: 'blog', table: 'blog_posts', perm: 'edit-blog', id: '40' },
    { resource: 'faq', table: 'faqs', perm: 'master', id: '50' },
    { resource: 'sponsor', table: 'sponsors', perm: 'master', id: '60' },
  ];

  testCases.forEach(({ resource, table, perm, id }) => {
    test(`${resource} exists → next() called`, async () => {
      db.queryOne.mockResolvedValue({ id: Number(id) });
      const middleware = authorizeResource(resource);
      const req = mockReq({
        user: { ...testUser, permissions: [perm] },
        params: { id },
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(db.queryOne).toHaveBeenCalledWith(
        expect.stringContaining(table),
        [id]
      );
    });

    test(`${resource} not found → 404`, async () => {
      db.queryOne.mockResolvedValue(null);
      const middleware = authorizeResource(resource);
      const req = mockReq({
        user: { ...testUser, permissions: [perm] },
        params: { id: '999' },
      });
      const res = mockRes();
      const next = jest.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
