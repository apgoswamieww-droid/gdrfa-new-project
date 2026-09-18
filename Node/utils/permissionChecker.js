// ─── Role Priority Resolution ────────────────────────────────────────
// When CIAM returns multiple roles for a user, this function picks the
// highest-priority role based on the order defined in .env.
//
// Priority: SuperAdmin > Admin > Manager > EventCoordinator > Staff > User
//
// Usage:
//   const decryptedRoles = await decryptRole(encryptedRoles);
//   const roleId = resolveHighestPriorityRole(decryptedRoles);
// ─────────────────────────────────────────────────────────────────────

const ROLE_PRIORITY = [
  'SUPERADMINROLEID',
  'ADMINROLEID',
  'MANAGERROLEID',
  'EVENTCOORDINATORROLEID',
  'STAFFROLEID',
  'USERROLEID',
];

function resolveHighestPriorityRole(decryptedRoles) {
  if (!Array.isArray(decryptedRoles) || decryptedRoles.length === 0) return '';

  for (const envKey of ROLE_PRIORITY) {
    const roleId = String(process.env[envKey] || '').trim();
    if (!roleId) continue;
    if (decryptedRoles.some(r => String(r.ClientRoleId || '').trim() === roleId)) {
      return roleId;
    }
  }

  // Fallback: return the first role if none matched the priority list
  return String(decryptedRoles[0]?.ClientRoleId || '').trim();
}

async function getUserRoleId(req) {
  return req.user?.roleId || null;
}

async function hasPermission(req, permissionSlug) {
  const roleId = await getUserRoleId(req);
  if (roleId === process.env.SUPERADMINROLEID) return true;

  const permissions = await getUserPermissions(roleId, req.session.admin.accessToken);
  return permissions.includes(permissionSlug);
}

async function hasAnyPermission(req, permissionSlugs = []) {
  const roleId = await getUserRoleId(req);
  if (roleId === process.env.SUPERADMINROLEID) return true;

  const permissions = await getUserPermissions(roleId, req.session.admin.accessToken);
  return permissionSlugs.some(slug => permissions.includes(slug));
}

async function hasAllPermissions(req, permissionSlugs = []) {
  const roleId = await getUserRoleId(req);
  if (roleId === process.env.SUPERADMINROLEID) return true;

  const permissions = await getUserPermissions(roleId, req.session.admin.accessToken);
  return permissionSlugs.every(slug => permissions.includes(slug));
}

async function getUserPermissions(roleId, accessToken = '', userId) {
  return new Promise((resolve) => {
    try {
      const SUPER_ADMIN = String(process.env.SUPERADMINROLEID || '').trim();
      const ADMIN = String(process.env.ADMINROLEID || '').trim();

      // Super Admin gets wildcard — all access
      if (roleId === SUPER_ADMIN) {
        return resolve(['can-login', 'admin-access', '*']);
      }

      // Admin gets full CRUD permissions
      if (roleId === ADMIN) {
        return resolve(getAllPermissions());
      }

      // All other roles (Manager/Examiner, etc.) get limited permissions
      return resolve(getManagerPermissions());
    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      return resolve([]);
    }
  });
}

// ─── All Permissions (Admin role) ────────────────────────────────────
function getAllPermissions() {
  return [
    "can-login",
    "admin-access",

    // ─── Dashboard ─────────────────────────────────────────
    "view-dashboard",
    "view-latest-events",
    "view-latest-participants",
    "view-total-employees",
    "view-total-events",
    "view-total-managers",
    "view-total-participants",

    // ─── Masters — KPIs ────────────────────────────────────
    "view-kpis",
    "create-kpis",
    "edit-kpis",
    "delete-kpis",
    "change-status-kpis",

    // ─── Masters — Event Types ─────────────────────────────
    "view-activity-type",
    "create-activity-type",
    "edit-activity-type",
    "delete-activity-type",
    "change-activity-type-status",

    // ─── Masters — Event Activities ────────────────────────
    "view-sport-activity",
    "create-sport-activity",
    "edit-sport-activity",
    "delete-sport-activity",
    "change-sport-activity-status",
    "detail-view",

    // ─── Masters — Plans ───────────────────────────────────
    "view-plans",
    "create-plan",
    "edit-plan",
    "delete-plan",
    "change-plan-status",

    // ─── Admin Users ───────────────────────────────────────
    "list-view-admin",
    "create-admin",
    "edit-admin",
    "delete-admin",
    "change-admin-status",

    // ─── Employees ─────────────────────────────────────────
    "list-view-users",
    "create-employee",
    "edit-employee",
    "delete-employee",
    "change-employee-status",
    "detail-employee",
    "import-employees",

    // ─── Teams ─────────────────────────────────────────────
    "view-teams",
    "create-team",
    "edit-team",
    "delete-team",
    "change-team-status",
    "detail-team",

    // ─── Events ────────────────────────────────────────────
    "view-events",
    "create-event",
    "edit-event",
    "delete-event",
    "view-event-list",
    "change-event-status",
    "event-list-view",
    "detail-event",

    // ─── Participants ──────────────────────────────────────
    "view-list-participants",
    "participant-list-view",
    "create-participant",
    "change-status-of-participant",
    "approve-event",

    // ─── Evaluation ────────────────────────────────────────
    "view-evaluation-list",
    "add-evaluation",
    "edit-evaluation",
    "delete-evaluation",
    "detail-view-evaluation",
    "view-evaluation",
    "can-approve-or-reject",
    "evaluation-assign",
    "evaluation-assignee",
    "evaluation-assign-to-team",

    // ─── Fitness Categories ────────────────────────────────
    "view-fitness-category-list",
    "add-fitness-category",
    "edit-fitness-category",
    "delete-fitness-category",
    "change-fitness-category-status",

    // ─── Facilities ────────────────────────────────────────
    "view-list-facilities",
    "create-facility",
    "edit-facility",
    "delete-facility",
    "can-approve-or-reject-request",
    "can-change-status",

    // ─── FAQs ──────────────────────────────────────────────
    "view-faq-list",
    "create-faq",
    "edit-faq",
    "delete-faq",
    "change-faq-status",

    // ─── Sponsors ──────────────────────────────────────────
    "view-sponsor-list",
    "create-sponsor",
    "edit-sponsor",
    "delete-sponsor",

    // ─── Social Links ──────────────────────────────────────
    "view-social-link-list",
    "create-social-link",
    "edit-social-link",
    "delete-social-link",

    // ─── Home Slider ───────────────────────────────────────
    "view-home-slider-list",
    "create-home-slider",
    "edit-home-slider",
    "delete-home-slider",

    // ─── Blog ──────────────────────────────────────────────
    "view-blog-list",
    "create-blog",
    "edit-blog",
    "delete-blog",
    "change-status-blog",

    // ─── Media ─────────────────────────────────────────────
    "view-media-list",
    "create-media",
    "edit-media",
    "delete-media",

    // ─── Contact Us ────────────────────────────────────────
    "view-contact-list",
    "create-contact",
    "delete-contact",

    // ─── CMS Pages ─────────────────────────────────────────
    "view-cms-page-list",
    "create-cms-page",
    "edit-cms-page",
    "delete-cms-page",
    "change-cms-page-status",

    // ─── Glimpse of Sports ─────────────────────────────────
    "view-glimpse-list",
    "create-glimpse",
    "edit-glimpse",
    "delete-glimpse",

    // ─── Notifications ─────────────────────────────────────
    "view-notification-list",

    // ─── Audit History ─────────────────────────────────────
    "view-audit-history",

    // ─── Profile & Settings ────────────────────────────────
    "view-profile",
    "edit-profile",
    "change-password",
    "view-settings",
    "edit-settings",

    // ─── Permissions Management ────────────────────────────
    "view-permissions",
    "create-permissions",
    "edit-permissions",
    "delete-permissions",
    "change-permission-status",

    // ─── Roles Management ──────────────────────────────────
    "view-roles",
    "create-roles",
    "edit-roles",
    "delete-roles",

    // ─── Legacy Reference Data — Branches ──────────────────
    "view-branches",
    "create-branches",
    "edit-branches",
    "delete-branches",
    "change-status-branch",

    // ─── Legacy Reference Data — Departments ───────────────
    "view-departments",
    "create-departments",
    "edit-departments",
    "delete-departments",
    "change-status-department",

    // ─── Legacy Reference Data — Sections ──────────────────
    "view-sections",
    "create-sections",
    "edit-sections",
    "delete-sections",
    "change-sections-status",

    // ─── Legacy Reference Data — Sectors ───────────────────
    "view-sectors",
    "create-sectors",
    "edit-sectors",
    "delete-sectors",
    "change-sector-status",

    // ─── Legacy Reference Data — Ranks ─────────────────────
    "view-ranks",
    "create-ranks",
    "edit-ranks",
    "delete-ranks",
    "change-rank-status",

    // ─── Legacy Reference Data — Job Titles ────────────────
    "view-job-titles",
    "create-job-titles",
    "edit-job-titles",
    "delete-job-titles",
    "change-job-title-status",

    // ─── Legacy Reference Data — Managers ──────────────────
    "list-view-manager",
    "create-manager",
    "edit-manager",
    "delete-manager",
    "change-manager-status",

    // ─── Legacy Reference Data — Staff Members ─────────────
    "view-staff-member",
    "create-staff-member",
    "edit-staff-member",
    "delete-staff-member",
    "change-staff-member-status",
    "staff-detail-view",

    // ─── Database ──────────────────────────────────────────
    "view-database-settings",
    "backup-database",
    "restore-database",
    "delete-database-backup",

    // ─── Webmaster ─────────────────────────────────────────
    "webmaster-list-view",
  ];
}

// ─── Manager / Examiner Permissions (limited subset) ─────────────────
function getManagerPermissions() {
  return [
    "can-login",
    "admin-access",

    // ─── Dashboard ─────────────────────────────────────────
    "view-dashboard",
    "view-latest-events",
    "view-latest-participants",
    "view-total-employees",
    "view-total-events",
    "view-total-managers",
    "view-total-participants",

    // ─── Masters — KPIs (view only) ────────────────────────
    "view-kpis",

    // ─── Masters — Event Types (view only) ─────────────────
    "view-activity-type",

    // ─── Masters — Event Activities (view only) ────────────
    "view-sport-activity",
    "detail-view",

    // ─── Masters — Plans (view only) ───────────────────────
    "view-plans",

    // ─── Employees (view only) ─────────────────────────────
    "list-view-users",
    "detail-employee",

    // ─── Teams ─────────────────────────────────────────────
    "view-teams",
    "create-team",
    "edit-team",
    "delete-team",
    "change-team-status",
    "detail-team",

    // ─── Events ────────────────────────────────────────────
    "view-events",
    "create-event",
    "edit-event",
    "view-event-list",
    "change-event-status",
    "event-list-view",
    "detail-event",

    // ─── Participants (view + approve) ─────────────────────
    "view-list-participants",
    "participant-list-view",
    "create-participant",
    "can-approve-or-reject",
    "change-status-of-participant",
    "approve-event",

    // ─── Facilities ────────────────────────────────────────
    "view-list-facilities",
    "create-facility",
    "edit-facility",
    "delete-facility",
    "can-approve-or-reject-request",
    "can-change-status",

    // ─── FAQs (view only) ──────────────────────────────────
    "view-faq-list",

    // ─── Sponsors (view only) ──────────────────────────────
    "view-sponsor-list",

    // ─── Blog (view only) ──────────────────────────────────
    "view-blog-list",

    // ─── Media (view only) ─────────────────────────────────
    "view-media-list",

    // ─── CMS Pages (view only) ─────────────────────────────
    "view-cms-page-list",

    // ─── Contact Us (view only) ────────────────────────────
    "view-contact-list",

    // ─── Notifications ─────────────────────────────────────
    "view-notification-list",

    // ─── Profile & Settings ────────────────────────────────
    "view-profile",
    "edit-profile",
    "change-password",
  ];
}

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  getUserRoleId,
  getAllPermissions,
  getManagerPermissions,
  resolveHighestPriorityRole,
};
