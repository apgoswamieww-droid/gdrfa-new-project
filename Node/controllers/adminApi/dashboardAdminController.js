const db = require('../../config/dbDirect');
const ciamService = require('../../ciam/ciam.service');
const { attemptTokenRefresh } = require('../../utils/ciamTokenHelper');

class DashboardAdminController {

  static async getStats(req, res) {
    try {
      const currentUserId = req.user?.id || req.session?.admin?.id;
      const currentRoleId = req.user?.roleId || req.session?.admin?.roleId;
      const accessToken = req.headers.authorization?.split(' ')[1] || process.env.CIAM_TOKEN;

      let totalEmployees = 0;
      if (accessToken) {
        let usersArray = await ciamService.getRecursiveUsers({
          pagination: { pageSize: 1000000, pageNumber: 1 }
        }, accessToken);

        if (usersArray?.isError || usersArray == null) {
          console.warn('[getStats] CIAM getRecursiveUsers failed — using 0 for employee count');
          usersArray = { value: [] };
        }

        if (!usersArray?.isError && usersArray?.value) {
          if (currentRoleId === process.env.MANAGERROLEID) {
            totalEmployees = usersArray.value.filter(x => x.currentManagerUserDomain === currentUserId).length;
          } else {
            totalEmployees = usersArray.value.length;
          }
        }
      }

      let totalParticipants = 0;
      const participantResult = await db.queryOne(`
        SELECT COUNT(*) as count FROM participates WHERE deletedAt IS NULL
      `);
      totalParticipants = participantResult?.count || 0;

      const totalEventsResult = await db.queryOne(`
        SELECT COUNT(*) as count FROM events WHERE deletedAt IS NULL
      `);
      const totalEvents = totalEventsResult?.count || 0;

      return res.json({
        status: true,
        data: { totalEmployees, totalParticipants, totalEvents }
      });
    } catch (error) {
      console.error('Error in dashboard stats:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = req.user;
      return res.json({
        status: true,
        data: {
          name: user?.name || 'Admin',
          role: user?.roleName || 'Administrator',
          image: null,
        }
      });
    } catch (error) {
      console.error('Error in dashboard profile:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async getLatestEvents(req, res) {
    try {
      const currentUserId = req.user?.id || req.session?.admin?.id;
      const currentUserRoleId = String(req.user?.roleId || req.session?.admin?.roleId || '');
      const SUPER_ADMIN_ROLE_ID = String(process.env.SUPERADMINROLEID || '');

      let whereCondition = 'e.deletedAt IS NULL';

      if (currentUserRoleId !== SUPER_ADMIN_ROLE_ID) {
        whereCondition += ` AND (e.userId = '${currentUserId}' 
          OR e.eventAdmins LIKE '%${currentUserId}%' 
          OR e.eventCoordinators LIKE '%${currentUserId}%')`;
      }

      const events = await db.query(`
        SELECT TOP 5
          e.id, e.name, e.image, e.startDate, e.endDate, e.status, e.targetType,
          e.eventDescription, e.location
        FROM events e
        WHERE ${whereCondition}
        ORDER BY e.createdAt DESC
      `);

      const mapped = Array.isArray(events) ? events.map(e => ({
        id: e.id,
        title: e.name,
        image: e.image,
        startDate: e.startDate,
        endDate: e.endDate,
        status: e.status,
        targetType: e.targetType,
        description: e.eventDescription,
        location: e.location,
      })) : [];

      return res.json({
        status: true,
        message: 'Latest events retrieved successfully',
        data: mapped,
      });
    } catch (error) {
      console.error('Error in getLatestEvents:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async getLatestParticipants(req, res) {
    try {
      const accessToken = req.headers.authorization?.split(' ')[1] || process.env.CIAM_TOKEN;

      const latestIdsResult = await db.query(`SELECT TOP 5 id FROM participates WHERE deletedAt IS NULL ORDER BY createdAt DESC`);
      const latestIds = latestIdsResult.map(p => p.id);

      if (latestIds.length === 0) {
        return res.json({ status: true, message: 'No participants found', data: [] });
      }

      const placeholders = latestIds.map(() => '?').join(',');
      const participantsData = await db.query(`
        SELECT p.id, p.user_id, p.activity_type
        FROM participates p
        WHERE p.id IN (${placeholders})
        ORDER BY p.createdAt DESC
      `, latestIds);

      const userIds = [...new Set(participantsData.map(x => x.user_id))];
      let userMap = new Map();

      if (userIds.length > 0 && accessToken) {
        let resultUsers = await ciamService.getUserByDomainId(userIds, accessToken);
        if (resultUsers?.isError || resultUsers == null) {
          console.warn('[getLatestParticipants] CIAM getUserByDomainId failed — using user IDs as names');
          resultUsers = { value: [] };
        }
        if (!resultUsers?.isError && resultUsers?.value) {
          userMap = new Map(resultUsers.value.map(u => [
            u.userDomain,
            { name: u.nameEn || u.nameAr || u.userName, email: u.emailAddress, mobile: u.mobile }
          ]));
        }
      }

      const formatted = participantsData.map(p => {
        const info = userMap.get(p.user_id);
        return {
          id: p.id,
          user_id: p.user_id,
          activityType: p.activity_type == "1" ? 'Individual' : 'Team',
          name: info?.name || p.user_id,
          mobile: info?.mobile || '-',
          email: info?.email || '-',
        };
      });

      return res.json({
        status: true,
        message: 'Latest participants retrieved successfully',
        data: formatted,
      });
    } catch (error) {
      console.error('Error in getLatestParticipants:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }
}

module.exports = DashboardAdminController;
