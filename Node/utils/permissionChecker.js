const db = require('../config/dbDirect');
const axios = require('axios');
const https = require('https');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function getUserRoleId(req) {
  return req.user?.roleId || null;
}

async function hasPermission(req, permissionSlug) {
  const roleId = await getUserRoleId(req);
  if (roleId === process.env.SUPERADMINROLEID) return true; // SuperAdmin bypass

  const permissions = await getUserPermissions(roleId, req.session.admin.accessToken);
  return permissions.includes(permissionSlug);
}

async function hasAnyPermission(req, permissionSlugs = []) {
  const roleId = await getUserRoleId(req);
  if (roleId === process.env.SUPERADMINROLEID) return true; // SuperAdmin bypass

  const permissions = await getUserPermissions(roleId, req.session.admin.accessToken);
  return permissionSlugs.some(slug => permissions.includes(slug));
}

async function hasAllPermissions(req, permissionSlugs = []) {
  const roleId = await getUserRoleId(req);
  if (roleId === process.env.SUPERADMINROLEID) return true; // SuperAdmin bypass

  const permissions = await getUserPermissions(roleId, req.session.admin.accessToken);
  return permissionSlugs.every(slug => permissions.includes(slug));
}

async function getUserPermissions(roleId, accessToken = '', userId) {
  return new Promise((resolve) => {
    try {
      // // Return all permissions for Super Admin (roleId = 1)
      if (roleId === process.env.SUPERADMINROLEID) {
        return resolve(['can-login', 'admin-access', '*']);// Wildcard permission
      }

      // // Fetch permissions from database for other roles
      // const permissions = await db.query(
      //   `SELECT p.slug FROM permissions p
      //    INNER JOIN RolePermissions rp ON p.id = rp.permissionId
      //    WHERE rp.roleId = ?`,
      //   [roleId]
      // );

      // if (!permissions || permissions.length === 0) {
      //   return [];
      // }

      // return permissions.map(p => p.slug);
      return resolve(["change-activity-type-status",
        "create-activity-type",
        "delete-activity-type",
        "edit-activity-type",
        "view-activity-type",
        "change-admin-status",
        "create-admin",
        "delete-admin",
        "edit-admin",
        "list-view-admin",
        "can-login",
        "change-status-blog",
        "create-blog",
        "delete-blog",
        "edit-blog",
        "view-blog-list",
        "change-status-branch",
        "create-branches",
        "delete-branches",
        "edit-branches",
        "view-branches",
        "view-dashboard",
        "view-latest-events",
        "view-latest-participants",
        "view-total-employees",
        "view-total-events",
        "view-total-managers",
        "view-total-participants",
        "backup-database",
        "delete-database-backup",
        "restore-database",
        "view-database-settings",
        "change-status-department",
        "create-departments",
        "delete-departments",
        "edit-departments",
        "view-departments",
        "add-evaluation",
        "add-evaluation-rule",
        "add-fitness-category",
        "change-evaluation-rule-status",
        "change-fitness-category-status",
        "delete-evaluation",
        "delete-evaluation-rule",
        "delete-fitness-category",
        "edit-evaluation",
        "edit-evaluation-rule",
        "edit-fitness-category",
        "view-evaluation",
        "view-evaluation-list",
        "view-evaluation-rule-list",
        "view-fitness-category-list",
        "view-audit-history",
        "change-event-coordinator-status",
        "create-event-coordinator",
        "delete-event-coordinator",
        "edit-event-coordinator",
        "list-view-event-coordinator",
        "can-event-end-or-complete",
        "can-manage-activities",
        "change-event-active-inactive",
        "change-event-status",
        "create-event",
        "delete-event",
        "edit-event",
        "view-event",
        "can-approve-or-reject-request",
        "can-change-status",
        "create-facility",
        "delete-facility",
        "edit-facility",
        "view-list-facilities",
        "change-job-title-status",
        "create-job-titles",
        "delete-job-titles",
        "edit-job-titles",
        "view-job-titles",
        "change-status-kpis",
        "create-kpis",
        "delete-kpis",
        "edit-kpis",
        "view-kpis",
        "change-manager-status",
        "create-manager",
        "delete-manager",
        "edit-manager",
        "list-view-manager",
        "master",
        "change-status-of-participant",
        "view-details-of-participant",
        "view-list-participants",
        "change-permission-status",
        "create-permissions",
        "delete-permissions",
        "edit-permissions",
        "view-permissions",
        "change-plan-status",
        "create-plan",
        "delete-plan",
        "edit-plan",
        "view-plans",
        "change-password",
        "edit-profile",
        "view-profile",
        "change-rank-status",
        "create-ranks",
        "delete-ranks",
        "edit-ranks",
        "view-ranks",
        "create-roles",
        "delete-roles",
        "edit-roles",
        "view-roles",
        "change-sections-status",
        "create-sections",
        "delete-sections",
        "edit-sections",
        "view-sections",
        "change-sector-status",
        "create-sectors",
        "delete-sectors",
        "edit-sectors",
        "view-sectors",
        "change-sport-activity-status",
        "create-sport-activity",
        "delete-sport-activity",
        "detail-view",
        "edit-sport-activity",
        "view-sport-activity",
        "change-staff-member-status",
        "create-staff-member",
        "delete-staff-member",
        "edit-staff-member",
        "staff-detail-view",
        "view-staff-member",
        "edit-settings",
        "view-settings",
        "add-team-member",
        "change-team-status",
        "create-team",
        "delete-team",
        "edit-team",
        "view-team",
        "change-user-status",
        "create-users",
        "delete-users",
        "edit-users",
        "list-view-users",
        "user-view-details-page",
        "view-user-management",
        "webmaster-list-view",]);
      const payload = {
        "userDomain": userId,
        "projectId": process.env.PROJECTID
      };

      const config = {
        httpsAgent,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
      axios.post(`${process.env.CIAMBASEURL}client/permissions/get/all`, payload, config)
        .then(async (response) => {
          if (response.data.isError) {
            console.error('Error fetching permissions:', JSON.stringify(response.data));
            return resolve([]);
          }
          const permissionArray = response.data.value?.endpointPermissions;
          const permission = permissionArray.length > 0 ? permissionArray.map(x => x.endpointName) : [];
          return resolve(permission);
        })
        .catch(err => {
          console.error('Error fetching permissions:', err);
          return resolve([]);
        });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return resolve([]);
    }
  });
}

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  getUserRoleId
};
