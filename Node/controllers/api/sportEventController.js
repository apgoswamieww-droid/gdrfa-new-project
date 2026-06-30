const db = require("../../config/dbDirect");
const responseFormatter = require("../../middlewares/responseFormatter");
const { getLocalizedMessage } = require("../../utils/apiLanguageHelper");
const ciamService = require("../../ciam/ciam.service");
const { attemptTokenRefresh } = require("../../utils/ciamTokenHelper");
require("dotenv").config();

class SportEventController {
  // GET /api/sport-events/all
  static async getSportEvents(req, res) {
    try {
      const lang = req.headers["accept-language"] || "en";
      const isArabic = lang.includes("ar");
      let userId =
        req.user?.id || req.headers["x-user-id"] || req.query.userId || null;
      if (userId) userId = parseInt(userId);

      const { type, page = 1, limit = 12 } = req.query;
      const offset = (page - 1) * limit;
      const today = new Date().toISOString().split("T")[0];

      let whereClause = `WHERE e.status = '1' AND e.deletedAt IS NULL`;
      const params = [];

      // Filter by type: ongoing or upcoming
      if (type === "ongoing") {
        whereClause += ` AND CAST(e.startDate AS DATE) <= ? AND CAST(e.endDate AS DATE) >= ?`;
        params.push(today, today);
      } else if (type === "upcoming") {
        whereClause += ` AND CAST(e.startDate AS DATE) > ?`;
        params.push(today);
      }

      // Count total events
      const countQuery = `SELECT COUNT(DISTINCT e.id) as total FROM events e ${whereClause}`;
      const countResult = await db.queryOne(countQuery, params);
      const total = countResult.total || 0;

      // Fetch all event details
      const query = `
                SELECT DISTINCT
                    e.id, e.name, e.name_ar, e.eventDescription, e.eventDescription_ar,
                    e.startDate, e.endDate, e.startTime, e.endTime, e.numberOfHour,
                    e.activityId, e.userId, e.year, e.location, e.locactionMap, e.lat, e.lng,
                    e.targetType, e.teamName, e.targetedEmployees, e.selectedEmployees,
                    e.image, e.eventStatus, e.gender, e.ageRange, e.sector, e.department,
                    e.section, e.branch, e.status, e.eventActiveStatus, e.eventCoordinators,
                    e.eventAdmins, e.createdAt, e.updatedAt
                FROM events e
                ${whereClause}
                ORDER BY e.startDate ASC, e.startTime ASC
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            `;

      params.push(offset, parseInt(limit));
      const events = await db.query(query, params);

      if (!events || events.length === 0) {
        return res.success(
          {
            data: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: 0,
            },
          },
          getLocalizedMessage(req, "No events found"),
        );
      }

      // Fetch participants for all events
      const eventIds = events.map((e) => e.id);
      let participantsMap = {};

      if (eventIds.length > 0) {
        const participants = await db.query(
          `
                    SELECT event_id, user_id, status FROM participates 
                    WHERE event_id IN (${eventIds.map(() => "?").join(",")}) AND deletedAt IS NULL
                `,
          eventIds,
        );

        (participants || []).forEach((p) => {
          if (!participantsMap[p.event_id]) {
            participantsMap[p.event_id] = [];
          }
          participantsMap[p.event_id].push({
            user_id: p.user_id,
            status: p.status,
          });
        });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;

      // Format response
      const result = events.map((event) => {
        // Get unique participants
        const participantsUnique = [];
        const participants = participantsMap[event.id] || [];
        participants.forEach((p) => {
          if (
            !participantsUnique.some(
              (x) => Number(x.user_id) === Number(p.user_id),
            )
          ) {
            participantsUnique.push(p);
          }
        });

        // Determine participant status
        let participantStatus = "";

        if (userId) {
          const participant = participantsUnique.find(
            (p) => Number(p.user_id) === Number(userId),
          );

          if (participant) {
            const status = participant.status;

            if (
              event.eventActiveStatus === "1" ||
              event.eventActiveStatus === 1
            ) {
              if (status === 0 || status === "0") {
                participantStatus = getLocalizedMessage(req, "Pending");
              } else if (status === 1 || status === "1") {
                participantStatus = getLocalizedMessage(req, "Approved");
              } else if (status === 2 || status === "2") {
                participantStatus = getLocalizedMessage(req, "Rejected");
              }
            } else {
              participantStatus = getLocalizedMessage(req, "Completed");
            }
          }
        }

        // Format time
        const formatTime = (time) => {
          if (!time) return null;
          if (typeof time === "string") {
            // If it's already a string like "09:00", return it
            if (time.includes(":")) return time;
            // Otherwise treat as Date
          }
          if (time instanceof Date) {
            const hours = String(time.getHours()).padStart(2, "0");
            const minutes = String(time.getMinutes()).padStart(2, "0");
            return `${hours}:${minutes}`;
          }
          return null;
        };

        return {
          id: event.id,
          activityId: event.activityId || null,
          userId: event.userId || null,
          year: event.year || null,
          name: isArabic ? event.name_ar || event.name : event.name,
          name_ar: event.name_ar || event.name,
          startDate: event.startDate
            ? new Date(event.startDate).toISOString().split("T")[0]
            : null,
          endDate: event.endDate
            ? new Date(event.endDate).toISOString().split("T")[0]
            : null,
          startTime: formatTime(event.startTime),
          endTime: formatTime(event.endTime),
          location: event.location || null,
          locactionMap: event.locactionMap || null,
          lat: event.lat || null,
          lng: event.lng || null,
          numberOfHour: event.numberOfHour || null,
          targetType: event.targetType || null,
          teamName: event.teamName || "1",
          targetedEmployees: event.targetedEmployees || "",
          selectedEmployees: event.selectedEmployees || "",
          image: event.image ? `${baseUrl}/${event.image}` : null,
          eventStatus: event.eventStatus || "1",
          gender: event.gender || "",
          ageRange: event.ageRange || "",
          eventDescription: isArabic
            ? event.eventDescription_ar || event.eventDescription
            : event.eventDescription,
          eventDescription_ar:
            event.eventDescription_ar || event.eventDescription,
          sector: event.sector || "",
          department: event.department || "",
          section: event.section || "",
          branch: event.branch || "",
          status: event.status || "1",
          eventActiveStatus: event.eventActiveStatus || "0",
          eventCoordinators: event.eventCoordinators || null,
          eventAdmins: event.eventAdmins || null,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
          deletedAt: event.deletedAt || null,
          participantsData: participantsUnique,
          participantStatus: participantStatus,
        };
      });

      return res.success(
        {
          data: result,
          pagination: {
            total: total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
          },
        },
        getLocalizedMessage(req, "Sport events fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching sport events:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/sport-events/activity-types
  static async getActivityTypes(req, res) {
    try {
      const activityTypes = await db.query(
        `SELECT id, name, description FROM activity_types WHERE status = '1' ORDER BY name ASC`,
      );

      return res.success(
        activityTypes || [],
        getLocalizedMessage(req, "Activity types fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching activity types:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // POST /api/sport-events/participate
  static async participateInEvent(req, res) {
    try {
      const userId = req.user.id;
      const { eventId, managerId, coordinatorId, activityId } = req.body;

      if (!eventId) {
        return res.error(getLocalizedMessage(req, "Event ID is required"));
      }

      // Check if event exists
      const event = await db.queryOne(
        `SELECT id, targetType, targetedEmployees, selectedEmployees FROM events WHERE id = ? AND status = '1' AND deletedAt IS NULL`,
        [eventId],
      );

      if (!event) {
        return res.error(getLocalizedMessage(req, "Event not found"));
      }

      // Check targeted employees restriction
      if (
        event.targetType === "ragular" &&
        event.targetedEmployees === "selected" &&
        event.selectedEmployees
      ) {
        const selectedList = event.selectedEmployees
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const userDomainId = String(userId).trim();
        if (!selectedList.includes(userDomainId)) {
          return res.error(
            getLocalizedMessage(
              req,
              "You are not eligible to participate in this event.",
            ),
          );
        }
      }

      // Check if user already participates
      const existingParticipation = await db.queryOne(
        `SELECT id FROM participates WHERE event_id = ? AND user_id = ? AND deletedAt IS NULL`,
        [eventId, userId],
      );

      if (existingParticipation) {
        return res.error(
          getLocalizedMessage(
            req,
            "You are already participating in this event",
          ),
        );
      }

      // Add participation
      await db.query(
        `INSERT INTO participates (event_id, user_id, manager_id, coordinator_id, activity_id, status, activity_type, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, '1', '1', GETDATE(), GETDATE())`,
        [
          eventId,
          userId,
          managerId || userId,
          coordinatorId || userId,
          activityId || 1,
        ],
      );

      return res.success(
        {},
        getLocalizedMessage(req, "You have successfully joined the event"),
      );
    } catch (error) {
      console.error("Error participating in event:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // DELETE /api/sport-events/withdraw/:eventId
  static async withdrawFromEvent(req, res) {
    try {
      const userId = req.user.id;
      const { eventId } = req.params;

      if (!eventId) {
        return res.error(getLocalizedMessage(req, "Event ID is required"));
      }

      // Check if user participates
      const participation = await db.queryOne(
        `SELECT id FROM participates WHERE event_id = ? AND user_id = ? AND deletedAt IS NULL`,
        [eventId, userId],
      );

      if (!participation) {
        return res.error(
          getLocalizedMessage(req, "You are not participating in this event"),
        );
      }

      // Remove participation (soft delete)
      await db.query(
        `UPDATE participates SET deletedAt = GETDATE() WHERE event_id = ? AND user_id = ?`,
        [eventId, userId],
      );

      return res.success(
        {},
        getLocalizedMessage(req, "You have withdrawn from the event"),
      );
    } catch (error) {
      console.error("Error withdrawing from event:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/sport-events/my-events
  static async getMyEvents(req, res) {
    try {
      const monthsArray = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const userId = req.user.id;
      const lang = req.headers["accept-language"] || "en";
      const isArabic = lang.includes("ar");
      const { year } = req.query;

      // Fetch only events where user has actually registered (has a record in participates table)
      const events = await db.query(
        `
                SELECT DISTINCT e.id, e.name, e.name_ar, e.eventDescription, e.eventDescription_ar, 
                       e.image, e.startDate, e.endDate, e.location, e.status, e.createdAt, e.targetType,
                       e.targetedEmployees, e.selectedEmployees, e.teamName
                FROM events e
                INNER JOIN participates p ON e.id = p.event_id AND p.user_id = ? AND p.deletedAt IS NULL AND p.status != '2'
                WHERE e.status = '1' AND e.deletedAt IS NULL
                ORDER BY e.startDate ASC
            `,
        [userId],
      );

      // Fetch user's participant records for these events (approval status etc.)
      const eventIds = (events || []).map((e) => e.id);
      let myParticipantMap = {};
      if (eventIds.length > 0) {
        const myParts = await db.query(
          `SELECT p.id as participantId, p.event_id, p.status as participantStatus,
                  p.current_approval_level, p.workflow_status, p.activity_id
           FROM participates p
           WHERE p.event_id IN (${eventIds.map(() => "?").join(",")})
             AND p.user_id = ? AND p.deletedAt IS NULL AND p.status != '2'`,
          [...eventIds, userId],
        );
        (myParts || []).forEach((p) => {
          myParticipantMap[p.event_id] = p;
        });
      }

      // Fetch all participants per event (for images and count)
      let participantMap = {};
      if (eventIds.length > 0) {
        const participantsArray = await db.query(
          `
                    SELECT p.event_id, p.user_id
                    FROM participates p
                    WHERE p.event_id IN (${eventIds.map(() => "?").join(",")}) AND p.deletedAt IS NULL
                `,
          eventIds,
        );

        const uniqueUserIds = [
          ...new Set(participantsArray.map((p) => p.user_id)),
        ];
        let imageMap = new Map();

        if (req.headers.authorization && uniqueUserIds.length > 0) {
          try {
            const userImagesResp = await ciamService.getUserImageByDomainId(
              uniqueUserIds,
              req.headers.authorization,
            );
            if (userImagesResp?.isError || userImagesResp == null) {
              console.warn(
                "[getMyEvents] CIAM getUserImageByDomainId failed — using empty images",
              );
            } else if (
              userImagesResp &&
              !userImagesResp.isError &&
              userImagesResp.value
            ) {
              let userImages = userImagesResp.value;
              imageMap = new Map(userImages.map((u) => [u.userDomain, u.img]));
            }
          } catch (ciamError) {
            console.error(
              "Error fetching user images from CIAM:",
              ciamError.message,
            );
          }
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const defaultImage = `${baseUrl}/assets/images/default_user.png`;

        (participantsArray || []).forEach((p) => {
          if (!participantMap[p.event_id]) {
            participantMap[p.event_id] = [];
          }
          const userImage = imageMap.get(p.user_id) || defaultImage;
          participantMap[p.event_id].push(userImage);
        });
      }

      // Group events by year and month
      const eventsByYear = {};

      (events || []).forEach((event) => {
        const eventYear = new Date(event.startDate).getFullYear();
        const eventMonthIndex = new Date(event.startDate).getMonth(); // 0-11

        if (!eventsByYear[eventYear]) {
          eventsByYear[eventYear] = monthsArray.map((month) => ({
            name: month,
            events: [],
          }));
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;

        // Get participant data
        const userImages = participantMap[event.id]
          ? participantMap[event.id].slice(0, 4)
          : [];
        const totalJoined = participantMap[event.id]
          ? participantMap[event.id].length
          : 0;

        const myPart = myParticipantMap[event.id] || {};
        eventsByYear[eventYear][eventMonthIndex].events.push({
          id: event.id,
          name: event.name,
          name_ar: event.name_ar,
          eventDescription: isArabic
            ? event.eventDescription_ar || event.eventDescription
            : event.eventDescription,
          image: event.image ? `${baseUrl}/${event.image}` : null,
          startDate: event.startDate
            ? new Date(event.startDate).toISOString().split("T")[0]
            : null,
          endDate: event.endDate
            ? new Date(event.endDate).toISOString().split("T")[0]
            : null,
          location: event.location,
          status: event.status,
          targetType: event.targetType,
          createdAt: event.createdAt
            ? new Date(event.createdAt).toISOString().split("T")[0]
            : null,
          total_joined: totalJoined,
          userImages: userImages,
          participantStatus: myPart.participantStatus || "0",
          participantWorkflowStatus: myPart.workflow_status || null,
          participantCurrentLevel: myPart.current_approval_level || null,
          participantId: myPart.participantId || null,
        });
      });

      let result = [];

      if (year) {
        const numericYear = parseInt(year, 10);
        if (!isNaN(numericYear)) {
          const monthsWithEvents =
            eventsByYear[numericYear] ||
            monthsArray.map((month) => ({
              name: month,
              events: [],
            }));

          result.push({
            year: numericYear,
            months: monthsWithEvents,
          });
        }
      }

      if (result.length === 0) {
        // Format result with all years
        result = Object.keys(eventsByYear)
          .map((yr) => parseInt(yr, 10))
          .sort((a, b) => a - b)
          .map((yr) => ({
            year: yr,
            months: eventsByYear[yr],
          }));
      }

      // If still no events, return current year with empty months
      if (result.length === 0) {
        const currentYear = new Date().getFullYear();
        result.push({
          year: currentYear,
          months: monthsArray.map((month) => ({
            name: month,
            events: [],
          })),
        });
      }

      return res.success(
        result,
        getLocalizedMessage(req, "Your events fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching user events:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/user/participant-approval-history/:participantId
  // Returns the approval workflow timeline for a specific participation
  static async getMyApprovalHistory(req, res) {
    try {
      const { participantId } = req.params;
      const userId = req.user.id;

      // Ensure the participant belongs to the current user
      const part = await db.queryOne(
        `SELECT id, user_id, event_id, status, current_approval_level, workflow_status
         FROM participates WHERE id = ? AND deletedAt IS NULL`,
        [participantId]
      );

      if (!part) {
        return res.error(getLocalizedMessage(req, 'Participant record not found'));
      }

      if (part.user_id !== userId) {
        return res.error(getLocalizedMessage(req, 'Access denied'));
      }

      // Fetch approval history
      const history = await db.query(
        `SELECT id, approval_level, approver_id, approver_name, status, assigned_date, action_date, comment
         FROM participate_approval_history
         WHERE participate_id = ?
         ORDER BY assigned_date ASC`,
        [participantId]
      );

      return res.success({
        participant: part,
        history: history || [],
      });
    } catch (error) {
      console.error('Error fetching approval history:', error.message);
      return res.error(getLocalizedMessage(req, 'Internal server error'));
    }
  }
}

module.exports = SportEventController;
