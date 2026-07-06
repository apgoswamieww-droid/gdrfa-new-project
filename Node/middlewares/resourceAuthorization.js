/**
 * Resource Authorization Middleware
 * ===================================
 * Validates that the authenticated user has explicit ownership, scope, or
 * permission over a specific resource BEFORE the controller executes.
 *
 * Usage:
 *   // Write operations (requires permission + optional scope check)
 *   router.delete('/admin/manage-kpi/:id', verifyToken, authorizeResource('kpi'), kpiController.delete);
 *   router.put('/admin/manage-kpi/:id', verifyToken, authorizeResource('kpi'), kpiController.update);
 *
 *   // Read operations (uses readPermission instead of write permission)
 *   router.get('/admin/manage-kpi/:id', verifyToken, authorizeResource('kpi', { operation: 'read' }), kpiController.show);
 *
 *   // Create operations (permission-only, no scope/ID check)
 *   router.post('/admin/manage-kpi', verifyToken, authorizeResource('kpi', { operation: 'create' }), kpiController.store);
 *
 *   // Event with ownership scope (non-superAdmins can only modify their own events)
 *   router.put('/admin/events/:id', verifyToken, authorizeResource('event'), eventAdminController.update);
 *
 * Supports:
 *   - Ownership checks (user created/is assigned to the resource)
 *   - Scope checks (user's organizational unit matches the resource's unit)
 *   - SuperAdmin bypass
 *   - Granular permission checks with read/write/create distinction
 *   - Parameterized mssql queries (uses ? placeholders compatible with msnodesqlv8)
 */

const db = require('../config/dbDirect');

/**
 * Resource authorization configuration.
 *
 * Each entry defines:
 *   - table / idColumn         : database table and its PK column
 *   - idParamSource / idParamName : where to find the resource ID in the request
 *   - scopeCheck                : optional ownership/scope verification (null = skip, use permission-only)
 *   - permission                : granular permission slug required for write operations
 *   - readPermission            : slug for read operations (falls back to permission if omitted)
 *   - createPermission          : slug for create operations (falls back to permission if omitted)
 *   - superAdminBypass          : whether SuperAdmin can bypass all checks
 *
 * ⚠️  Permission slug conventions:
 *   The slugs below follow the pattern from permissionChecker.js / CIAM.
 *   If CIAM uses different slug names, update the `permission` value accordingly.
 *   For resources where no specific slug exists yet, use a broad slug like 'master'
 *   or add the slug to your CIAM permission definitions.
 */
const RESOURCE_CONFIGS = {
  // ─── KPI ──────────────────────────────────────────────
  kpi: {
    table: 'kpis',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'edit-kpis',
    readPermission: 'view-kpis',
    createPermission: 'create-kpis',
    superAdminBypass: true,
  },

  // ─── Event ────────────────────────────────────────────
  event: {
    table: 'events',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    // Ownership check: creator (userId), assigned admins (eventAdmins), or coordinators (eventCoordinators)
    // @currentUser is counted and expanded to the correct number of ? parameters at runtime
    scopeCheck: {
      checkOwnerSqlWithPlaceholder: `(userId = @currentUser OR eventAdmins LIKE '%' + @currentUser + '%' OR eventCoordinators LIKE '%' + @currentUser + '%')`,
    },
    permission: 'edit-event',
    readPermission: 'view-event',
    createPermission: 'create-event',
    superAdminBypass: true,
  },

  // ─── Event Type (activity_types) ──────────────────────
  eventType: {
    table: 'activity_types',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'edit-activity-type',
    readPermission: 'view-activity-type',
    createPermission: 'create-activity-type',
    superAdminBypass: true,
  },

  // ─── Event Activity (sport_activities) ────────────────
  sportActivity: {
    table: 'sport_activities',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'edit-sport-activity',
    readPermission: 'view-sport-activity',
    createPermission: 'create-sport-activity',
    superAdminBypass: true,
  },

  // ─── FAQ ──────────────────────────────────────────────
  faq: {
    table: 'faqs',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    // Use 'master' as fallback if no specific FAQ permission exists in CIAM
    permission: 'master',
    superAdminBypass: true,
  },

  // ─── Facility ─────────────────────────────────────────
  facility: {
    table: 'facilities',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'edit-facility',
    readPermission: 'view-list-facilities',
    createPermission: 'create-facility',
    superAdminBypass: true,
  },

  // ─── Sponsor ──────────────────────────────────────────
  sponsor: {
    table: 'sponsors',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'master',
    superAdminBypass: true,
  },

  // ─── Blog ─────────────────────────────────────────────
  blog: {
    table: 'blog_posts',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'edit-blog',
    readPermission: 'view-blog-list',
    createPermission: 'create-blog',
    superAdminBypass: true,
  },

  // ─── Media ────────────────────────────────────────────
  media: {
    table: 'Media',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'master',
    superAdminBypass: true,
  },

  // ─── Plan ─────────────────────────────────────────────
  plan: {
    table: 'plans',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'edit-plan',
    readPermission: 'view-plans',
    createPermission: 'create-plan',
    superAdminBypass: true,
  },

  // ─── CMS Page ─────────────────────────────────────────
  cmsPage: {
    table: 'cms_pages',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'master',
    superAdminBypass: true,
  },

  // ─── Team ─────────────────────────────────────────────
  team: {
    table: 'teams',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'edit-team',
    readPermission: 'view-team',
    createPermission: 'create-team',
    superAdminBypass: true,
  },

  // ─── Home Slider ──────────────────────────────────────
  homeSlider: {
    table: 'home_sliders',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'master',
    superAdminBypass: true,
  },

  // ─── Glimpse of Sports ────────────────────────────────
  glimpseOfSports: {
    table: 'glimpse_of_sports',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'master',
    superAdminBypass: true,
  },

  // ─── Participant ────────────────────────────────────────
  participant: {
    table: 'participates',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    // Uses 'master' because no generic 'delete-participant' slug exists in CIAM.
    // The 'change-status-of-participant' slug exists for status changes.
    permission: 'master',
    superAdminBypass: true,
  },

  // ─── Participant Team (team_players with :teamId param) ─
  participantTeam: {
    table: 'team_players',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'teamId',
    scopeCheck: null,
    permission: 'master',
    superAdminBypass: true,
  },

  // ─── Contact Us ─────────────────────────────────────────
  contactUs: {
    table: 'contacts',
    idColumn: 'id',
    idParamSource: 'params',
    idParamName: 'id',
    scopeCheck: null,
    permission: 'master',
    superAdminBypass: true,
  },
};

/**
 * Extract the string value at a given pointer in an object.
 * Supports dot-separated keys, e.g. 'params.id' or 'body.eventId'.
 */
function getValueAtPath(obj, path) {
  return path.split('.').reduce((current, key) => (current && current[key] !== undefined ? current[key] : undefined), obj);
}

/**
 * Extract the resource ID from the request based on the config.
 */
function extractResourceId(req, config) {
  const { idParamSource, idParamName } = config;
  const sourceObj = req[idParamSource];
  if (!sourceObj) return null;

  // Support dot-separated param names (e.g. 'params.id')
  const idPath = `${idParamSource}.${idParamName}`;
  return getValueAtPath(req, idPath) || sourceObj[idParamName] || null;
}

/**
 * Check if the current user has the configured permission.
 * Uses the same permission slugs already defined in permissionChecker.js.
 */
function userHasPermission(user, permissionSlug) {
  if (!user || !user.permissions) return false;
  return user.permissions.includes('*') || user.permissions.includes(permissionSlug);
}

/**
 * Count how many times @currentUser appears in the owner SQL template.
 * Each occurrence needs its own ? placeholder AND its own user.userDomain value.
 */
function countPlaceholderOccurrences(sqlTemplate, placeholder) {
  const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = sqlTemplate.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Determine the correct permission slug based on the operation type.
 * Falls back to config.permission for any unspecified operation.
 */
function resolvePermissionSlug(config, operation) {
  if (operation === 'create' && config.createPermission) return config.createPermission;
  if (operation === 'read' && config.readPermission) return config.readPermission;
  return config.permission;
}

/**
 * Main authorization middleware factory.
 *
 * @param {string} resourceType - Key into RESOURCE_CONFIGS (e.g. 'kpi', 'event')
 * @param {object} [options]
 * @param {'read'|'write'|'create'} [options.operation='write'] - Determines which
 *        permission slug to check. 'create' skips resource ID/scope checks since
 *        the resource doesn't exist yet.
 * @returns {function} Express middleware
 */
function authorizeResource(resourceType, options = {}) {
  const { operation = 'write' } = options;

  const config = RESOURCE_CONFIGS[resourceType];
  if (!config) {
    throw new Error(`Unknown resource type: "${resourceType}". Add it to RESOURCE_CONFIGS in resourceAuthorization.js`);
  }

  // Resolve which permission slug to check
  const requiredPermission = resolvePermissionSlug(config, operation);

  return async (req, res, next) => {
    try {
      // ── 0. Ensure user is authenticated ──────────────────────
      if (!req.user) {
        return res.status(401).json({
          status: false,
          message: req.t ? req.t('Authentication required') : 'Authentication required',
        });
      }

      const { user } = req;
      const SUPER_ADMIN_ROLE_ID = String(process.env.SUPERADMINROLEID || '').trim();

      // ── 1. SuperAdmin bypass ─────────────────────────────────
      if (config.superAdminBypass && String(user.roleId || '').trim() === SUPER_ADMIN_ROLE_ID) {
        return next();
      }

      // ── 2. Granular permission check ─────────────────────────
      if (requiredPermission && !userHasPermission(user, requiredPermission)) {
        return res.status(403).json({
          status: false,
          message: req.t
            ? req.t('You do not have permission to perform this action')
            : 'access denied. missing permission.',
        });
      }

      // ── 3. For create operations: permission is sufficient ────
      if (operation === 'create') {
        // Resource doesn't exist yet — no scope or existence check needed
        return next();
      }

      // ── 4. Extract resource ID for scope/existence check ─────
      const resourceId = extractResourceId(req, config);

      // For read/list operations without a specific resource ID (e.g. GET /admin/events),
      // skip the existence/scope check — permission check alone is sufficient for listing.
      if (operation === 'read' && !resourceId) {
        return next();
      }

      if (!resourceId) {
        return res.status(400).json({
          status: false,
          message: req.t ? req.t('Resource ID is required') : 'Resource ID is required',
        });
      }

      // ── 5. Resource scope / ownership check ──────────────────
      if (config.scopeCheck && config.scopeCheck.checkOwnerSqlWithPlaceholder) {
        const ownerSqlTemplate = config.scopeCheck.checkOwnerSqlWithPlaceholder;
        const occurrences = countPlaceholderOccurrences(ownerSqlTemplate, '@currentUser');

        // Replace @currentUser with ? for msnodesqlv8 compatibility
        const ownerSql = ownerSqlTemplate.replace(/@currentUser/g, '?');

        const row = await db.queryOne(
          `SELECT ${config.idColumn}
           FROM ${config.table}
           WHERE ${config.idColumn} = ?
             AND deletedAt IS NULL
             AND ${ownerSql}`,
          // Build params: [resourceId, user.userDomain, user.userDomain, ...]
          [resourceId, ...Array(occurrences).fill(user.userDomain)]
        );

        if (!row) {
          return res.status(403).json({
            status: false,
            message: req.t
              ? req.t('You do not have access to this resource')
              : 'access denied. you do not have scope over this resource.',
          });
        }
      } else {
        // ── 6. Existence check (no ownership scope to verify) ────
        const row = await db.queryOne(
          `SELECT ${config.idColumn} FROM ${config.table}
           WHERE ${config.idColumn} = ? AND deletedAt IS NULL`,
          [resourceId]
        );

        if (!row) {
          return res.status(404).json({
            status: false,
            message: req.t ? req.t('Resource not found') : 'Resource not found',
          });
        }
      }

      // ── All checks passed ─────────────────────────────────────
      return next();
    } catch (error) {
      console.error(`[resourceAuthorization] Error for "${resourceType}":`, error.message);
      return res.status(500).json({
        status: false,
        message: 'Internal server error during authorization check',
      });
    }
  };
}

/**
 * Resource ID parameter validator — for routes where you need to ensure
 * a valid integer/non-empty ID is provided before any DB operation.
 */
function validateResourceId(req, res, next) {
  const id = req.params.id || req.body.id || req.query.id;
  if (!id || (typeof id === 'string' && id.trim() === '')) {
    return res.status(400).json({
      status: false,
      message: 'Resource ID is required',
    });
  }
  next();
}

module.exports = {
  authorizeResource,
  validateResourceId,
  RESOURCE_CONFIGS,     // exported so you can extend it from other modules
};
