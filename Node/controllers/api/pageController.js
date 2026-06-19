const ciamService = require("../../ciam/ciam.service");
const { attemptTokenRefresh } = require("../../utils/ciamTokenHelper");
const db = require("../../config/dbDirect");
const responseFormatter = require("../../middlewares/responseFormatter");
const { getLocalizedMessage } = require("../../utils/apiLanguageHelper");
const approvalWorkflow = require("../../services/approvalWorkflowService");
const { storeNotification } = require("../../utils/notificationHelper");
require("dotenv").config();

class PageController {
  // GET /api/pages/faq
  static async getFaq(req, res) {
    try {
      const lang = req.headers["accept-language"] || "en";
      const isArabic = lang.includes("ar");

      const faqs = await db.query(
        `SELECT id, question, question_ar, answer, answer_ar, status, createdAt 
                 FROM faqs 
                 WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
                 ORDER BY createdAt DESC`,
      );

      const formattedFaqs = (faqs || []).map((faq) => ({
        id: faq.id,
        question: isArabic ? faq.question_ar || faq.question : faq.question,
        answer: isArabic ? faq.answer_ar || faq.answer : faq.answer,
      }));

      return res.success(
        formattedFaqs,
        getLocalizedMessage(req, "FAQs retrieved successfully."),
      );
    } catch (error) {
      console.error("Error fetching FAQs:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/slider
  static async getSlider(req, res) {
    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const lang = req.headers["accept-language"] || "en";

      const sliders = await db.query(
        `SELECT id, media_type, media_path, title, title_ar, short_description, short_description_ar, status 
                 FROM home_sliders 
                 WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
                 ORDER BY id ASC`,
      );

      const updatedSliders = (sliders || []).map((item) => {
        // Localize based on language
        const isArabic = lang.includes("ar");
        return {
          id: item.id,
          media_type: item.media_type,
          media_path: `${baseUrl}/${item.media_path}`,
          title: isArabic ? item.title_ar || item.title : item.title,
          short_description: isArabic
            ? item.short_description_ar || item.short_description
            : item.short_description,
        };
      });

      return res.success(
        updatedSliders,
        getLocalizedMessage(req, "Slider retrieved successfully."),
      );
    } catch (error) {
      console.error("Slider fetch error:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/home-events
  static async getHomeEvent(req, res) {
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

      const lang = req.headers["accept-language"] || "en";
      const isArabic = lang.includes("ar");
      const { year } = req.query;

      // Fetch all active events
      const events = await db.query(`
                SELECT id, name,name_ar, eventDescription, eventDescription_ar, image, startDate, endDate, location, status, createdAt, targetType
                FROM events 
                WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
                ORDER BY startDate ASC
            `);

      // Collect all event IDs to fetch participants
      const eventIds = (events || []).map((e) => e.id);

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
        let imageMap = new Map();          if (req.headers.authorization) {
          let userImagesResp = await ciamService.getUserImageByDomainId(
            uniqueUserIds,
            req.headers.authorization,
          );
          if (userImagesResp?.isError || userImagesResp == null) {
            console.warn('[getHomeEvent] CIAM getUserImageByDomainId failed — using empty images');
            userImagesResp = { value: [] };
          }
          let userImages = userImagesResp.value || [];
          imageMap = new Map(userImages.map((u) => [u.userDomain, u.img]));
        }

        const participants = participantsArray.map((p) => ({
          ...p,
          image: imageMap.get(p.user_id) ?? null,
        }));

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const defaultImage = `${baseUrl}/assets/images/default_user.png`;

        (participants || []).forEach((p) => {
          if (!participantMap[p.event_id]) {
            participantMap[p.event_id] = [];
          }
          const userImage = p.image ? `${p.image}` : defaultImage;
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

        // Get participant data
        const userImages = participantMap[event.id]
          ? participantMap[event.id].slice(0, 4)
          : [];
        const totalJoined = participantMap[event.id]
          ? participantMap[event.id].length
          : 0;

        const baseUrl = `${req.protocol}://${req.get("host")}`;

        eventsByYear[eventYear][eventMonthIndex].events.push({
          id: event.id,
          name: event.name,
          name_ar: event.name_ar,
          eventDescription: event.eventDescription,
          eventDescription_ar: event.eventDescription_ar,
          image: event.image ? `${baseUrl}/${event.image}` : null,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          total_joined: totalJoined,
          userImages: userImages,
          targetType: event.targetType,
        });
      });

      let result = [];

      if (year) {
        const numericYear = parseInt(year, 10);
        if (isNaN(numericYear)) {
          return res.error(getLocalizedMessage(req, "Invalid year parameter."));
        }

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
      } else {
        // Get all available years from events
        const availableYears = Object.keys(eventsByYear)
          .map((y) => parseInt(y, 10))
          .sort((a, b) => a - b);

        result = availableYears.map((yr) => ({
          year: yr,
          months: eventsByYear[yr],
        }));
      }

      return res.success(
        result,
        getLocalizedMessage(req, "Event retrieved successfully."),
      );
    } catch (error) {
      console.error("Error fetching home events:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/event/:eventId
  static async getEventById(req, res) {
    try {
      const rawEventId = req.params.id ? req.params.id.toString() : null;
      const eventIdMatch = String(rawEventId || "").match(/\d+/);
      const eventId = eventIdMatch ? eventIdMatch[0] : null;
      const lang = req.headers["accept-language"] || "en";
      const isArabic = lang.includes("ar");
      const userId =
        req.user?.id || req.headers["x-user-id"] || req.query.userId || null;

      if (!eventId) {
        return res.error(getLocalizedMessage(req, "Invalid event ID"));
      }

      // Fetch event details
      const event = await db.queryOne(
        `
                SELECT id, name, name_ar, eventDescription, eventDescription_ar, 
                       startDate, endDate, startTime, endTime, numberOfHour,
                       targetType, targetedEmployees, selectedEmployees, location, lat, lng,
                       image, eventActiveStatus, activityId, teamName, createdAt, updatedAt,
                       status, eventCoordinators, regStartDate, regEndDate
                FROM events
                WHERE id = CAST(? AS INT) AND CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
            `,
        [eventId],
      );

      if (!event) {
        return res.error(getLocalizedMessage(req, "Event not found"));
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;

      // Format basic event data
      const eventData = {
        id: event.id,
        name: isArabic ? event.name_ar || event.name : event.name,
        eventDescription: isArabic
          ? event.eventDescription_ar || event.eventDescription
          : event.eventDescription,
        startDate: event.startDate
          ? new Date(event.startDate).toISOString().split("T")[0]
          : null,
        endDate: event.endDate
          ? new Date(event.endDate).toISOString().split("T")[0]
          : null,
        startTime: event.startTime || null,
        endTime: event.endTime || null,
        numberOfHour: event.numberOfHour || null,
        targetType: event.targetType || null,
        targetedEmployees: event.targetedEmployees || "",
        selectedEmployees: event.selectedEmployees || "",
        location: event.location || null,
        lat: event.lat || null,
        lng: event.lng || null,
        image: event.image ? `${baseUrl}/${event.image}` : null,
        eventActiveStatus: event.eventActiveStatus || "0",
        eventCoordinators: event.eventCoordinators || "",
        regStartDate: event.regStartDate
          ? new Date(event.regStartDate).toISOString().split("T")[0]
          : null,
        regEndDate: event.regEndDate
          ? new Date(event.regEndDate).toISOString().split("T")[0]
          : null,
        teamName: event.teamName || "1",
        createdAt: event.createdAt
          ? new Date(event.createdAt).toISOString().split("T")[0]
          : null,
        updatedAt: event.updatedAt
          ? new Date(event.updatedAt).toISOString().split("T")[0]
          : null,
        year: event.startDate
          ? new Date(event.startDate).getFullYear().toString()
          : null,
      };

      // ✅ Parse and fetch activities
      let activityIds = [];
      if (event.activityId && typeof event.activityId === "string") {
        activityIds = event.activityId
          .split(",")
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));
      }

      const activities =
        activityIds.length > 0
          ? await db.query(
              `
                    SELECT id, name FROM sport_activities 
                    WHERE id IN (${activityIds.map(() => "?").join(",")}) AND deletedAt IS NULL
                  `,
              activityIds,
            )
          : [];

      eventData.activities = activities.map((a) => ({
        id: a.id,
        name: a.name,
        type: "Sports Activity",
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        isParticipant: userId ? false : false,
      }));

      // ✅ Fetch teams and players
      let teamIds = [];
      if (event.teamName && typeof event.teamName === "string") {
        teamIds = event.teamName
          .split(",")
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));
      }

      const teams =
        teamIds.length > 0
          ? await db.query(
              `
                    SELECT id, name FROM teams 
                    WHERE id IN (${teamIds.map(() => "?").join(",")}) AND deletedAt IS NULL
                  `,
              teamIds,
            )
          : [];

      // Fetch team players
      let teamPlayers = [];
      if (teamIds.length > 0) {
        teamPlayers = await db.query(
          `
                    SELECT tp.team_id, tp.player_id, tp.isCaptain
                    FROM team_players tp
                    WHERE tp.team_id IN (${teamIds.map(() => "?").join(",")}) AND tp.deletedAt IS NULL
                `,
          teamIds,
        );
      }

      // Enrich player data from CIAM
      let userMap = new Map();
      if (teamPlayers.length > 0) {
        let arrayOfUsers = [...new Set(teamPlayers.map((x) => x.player_id))];
        let userInfo = await ciamService.getUserByDomainId(
          arrayOfUsers,
          req.headers.authorization,
        );
        if (userInfo?.isError || userInfo == null) {
          console.warn('[getEventById] CIAM getUserByDomainId failed — using empty player data');
          userInfo = { value: [] };
        }
        userInfo = userInfo?.value || [];
        userMap = new Map(
          userInfo.map((user) => [
            user.userDomain,
            {
              name: user.nameEn || user.userDomain,
              email: user.emailAddress || null,
              mobile: user.mobile || null,
            },
          ]),
        );
      }

      // Group players by team_id with enriched data
      const playersByTeam = {};
      teamPlayers.forEach((tp) => {
        if (!playersByTeam[tp.team_id]) {
          playersByTeam[tp.team_id] = [];
        }
        const userData = userMap.get(tp.player_id) || {
          name: tp.player_id,
          email: null,
          mobile: null,
        };
        playersByTeam[tp.team_id].push({
          id: tp.player_id,
          name: userData.name,
          email: userData.email,
          mobile: userData.mobile,
          isCaptain: tp.isCaptain,
        });
      });

      eventData.teams = teams.map((t) => ({
        teamId: t.id,
        teamName: t.name || null,
        players: playersByTeam[t.id] || [],
      }));

      eventData.isCaptain = false;
      if (userId) {
        for (const team of eventData.teams) {
          const captainPlayer = team.players.find(
            (p) =>
              String(p.id).toLowerCase() === String(userId).toLowerCase() &&
              String(p.isCaptain) === "1",
          );
          if (captainPlayer) {
            eventData.isCaptain = true;
            break;
          }
        }
      }

      // ✅ Fetch event activity schedules
      const schedules = await db.query(
        `
                SELECT eas.activity_id, eas.start_date, eas.end_date, eas.start_time, eas.end_time, eas.description,
                       sa.name as activity_name
                FROM event_activity_schedules eas
                LEFT JOIN sport_activities sa ON eas.activity_id = sa.id
                WHERE eas.event_id = CAST(? AS INT) AND eas.deletedAt IS NULL
            `,
        [eventId],
      );

      // Check participant activities
      let participantActivityIds = [];
      if (userId) {
        const participants = await db.query(
          `
                    SELECT activity_id FROM participates
                    WHERE event_id = CAST(? AS INT) AND user_id = CAST(? AS INT) AND deletedAt IS NULL AND status != '2'
                `,
          [eventId, userId],
        );
        participantActivityIds = participants.map(p => p.activity_id);
      }

      // Format schedules
      eventData.eventActivitySchedule = (schedules || []).map((s) => {
        const formatTime = (time) => {
          if (!time) return null;
          if (typeof time === "string") return time;
          if (time instanceof Date) {
            const hours = String(time.getHours()).padStart(2, "0");
            const minutes = String(time.getMinutes()).padStart(2, "0");
            return `${hours}:${minutes}`;
          }
          return null;
        };

        return {
          activityId: s.activity_id,
          activityName: s.activity_name || null,
          activityType: "Sports Activity",
          startDate: s.start_date
            ? new Date(s.start_date).toISOString().split("T")[0]
            : null,
          endDate: s.end_date
            ? new Date(s.end_date).toISOString().split("T")[0]
            : null,
          startTime: formatTime(s.start_time),
          endTime: formatTime(s.end_time),
          description: s.description || null,
          isParticipant: participantActivityIds.includes(s.activity_id),
        };
      });

      // Merge schedule data into activities
      eventData.activities = eventData.activities.map((a) => {
        const schedule = schedules.find((s) => s.activity_id === a.id);
        const formatTime = (time) => {
          if (!time) return null;
          if (typeof time === "string") return time;
          if (time instanceof Date) {
            const hours = String(time.getHours()).padStart(2, "0");
            const minutes = String(time.getMinutes()).padStart(2, "0");
            return `${hours}:${minutes}`;
          }
          return null;
        };

        return {
          ...a,
          startDate: schedule?.start_date
            ? new Date(schedule.start_date).toISOString().split("T")[0]
            : null,
          endDate: schedule?.end_date
            ? new Date(schedule.end_date).toISOString().split("T")[0]
            : null,
          startTime: formatTime(schedule?.start_time),
          endTime: formatTime(schedule?.end_time),
          isParticipant: participantActivityIds.includes(a.id),
        };
      });

      // ✅ Fetch facilities
      const facilities = await db.query(`
                SELECT id, title, description, image FROM facilities 
                WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
            `);

      eventData.eventFacilities = (facilities || []).map((f) => ({
        id: f.id,
        title: f.title,
        description: f.description,
        image: f.image ? `${baseUrl}/${f.image}` : null,
      }));

      // Fetch sponsors (global active sponsors)
      const sponsors = await db.query(`
                SELECT id, name, logo, website_url
                FROM sponsors
                WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
                ORDER BY id DESC
            `);

      eventData.eventSponsors = (sponsors || []).map((s) => ({
        id: s.id,
        name: s.name,
        logo: s.logo ? `${baseUrl}/${s.logo}` : null,
        website_url: s.website_url || "",
      }));

      // ✅ Check if user can participate
      eventData.selectedEvent = false;
      if (userId) {
        if (event.selectedEmployees && event.selectedEmployees.trim()) {
          let selectedIds = event.selectedEmployees
            .split(",")
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id));
          if (selectedIds.includes(parseInt(userId))) {
            eventData.selectedEvent = true;
          }
        } else if (event.targetedEmployees === "all") {
          eventData.selectedEvent = true;
        }
      }

      return res.success(
        eventData,
        getLocalizedMessage(req, "Event retrieved successfully."),
      );
    } catch (error) {
      console.error("[getEventById] ERROR:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // POST /api/pages/event-participant
  static async postEventParticipant(req, res) {
    const {
      user_id,
      event_id,
      manager_id,
      coordinator_id,
      activity_id,
      activity_type,
    } = req.body;

    try {
      // console.log('=== POST Event Participant Start ===');
      // console.log('Request body:', { user_id, event_id, manager_id, coordinator_id, activity_id, activity_type });

      // Force language detection based on Accept-Language header
      const acceptLang = req.headers["accept-language"];
      const forcedLang =
        acceptLang && acceptLang.startsWith("ar") ? "ar" : "en";

      // Override i18n language if needed
      if (req.i18n && req.i18n.language !== forcedLang) {
        req.i18n.changeLanguage(forcedLang);
        // console.log('Changed language to:', forcedLang);
      }

      // Validate required fields
      if (!user_id || !event_id || !activity_id) {
        // console.log('❌ Validation failed - Missing required fields');
        return res.error(
          getLocalizedMessage(
            req,
            "User ID, Event ID, and Activity ID are required",
          ),
        );
      }

      // 🔹 Step 1: Check targeted employees restriction
      // console.log('📋 Step 1: Checking targeted employees restriction...');
      const eventRecord = await db.queryOne(
        `SELECT targetType, targetedEmployees, selectedEmployees, regStartDate, regEndDate FROM events WHERE id = CAST(? AS INT) AND deletedAt IS NULL`,
        [event_id],
      );

      if (!eventRecord) {
        return res.error(getLocalizedMessage(req, "Event not found"));
      }

      const now = new Date();

      // Check registration window
      if (eventRecord.regStartDate) {
        const regStart = new Date(eventRecord.regStartDate);
        if (now < regStart) {
          return res.error(getLocalizedMessage(req, "Registration is not open yet for this event."));
        }
      }
      if (eventRecord.regEndDate) {
        const regEnd = new Date(eventRecord.regEndDate);
        regEnd.setHours(23, 59, 59, 999);
        if (now > regEnd) {
          return res.error(getLocalizedMessage(req, "Registration has closed for this event."));
        }
      }

      if (
        eventRecord.targetType === "ragular" &&
        eventRecord.targetedEmployees === "selected" &&
        eventRecord.selectedEmployees
      ) {
        const selectedList = eventRecord.selectedEmployees
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const userDomainId = String(user_id).trim();
        if (!selectedList.includes(userDomainId)) {
          return res.error(
            getLocalizedMessage(
              req,
              "You are not eligible to participate in this event.",
            ),
          );
        }
      }

      // 🔹 Step 2: Validate schedule
      // console.log('📋 Step 2: Validating schedule...');
      const schedule = await db.queryOne(
        `SELECT id, start_date, end_date, start_time, end_time 
                 FROM event_activity_schedules 
                 WHERE event_id = ? AND activity_id = ? AND deletedAt IS NULL`,
        [event_id, activity_id],
      );

      if (!schedule) {
        // console.log('❌ No schedule found');
        return res.error(
          getLocalizedMessage(
            req,
            "No schedule found for this event and activity.",
          ),
        );
      }
      // console.log('✅ Schedule found:', schedule);

      // Create proper date objects for comparison
      let startDate = new Date(schedule.start_date);
      let endDate = new Date(schedule.end_date);

      // console.log('⏰ Initial dates:', { startDate, endDate, now });

      // If the schedule has time fields, use them
      if (schedule.start_time) {
        const startTimeValue =
          schedule.start_time instanceof Date
            ? schedule.start_time
            : schedule.start_time;

        if (startTimeValue instanceof Date) {
          const startHours = startTimeValue.getHours();
          const startMinutes = startTimeValue.getMinutes();
          startDate.setHours(startHours, startMinutes, 0, 0);
        } else if (typeof startTimeValue === "string") {
          const [startHours, startMinutes] = startTimeValue.split(":");
          startDate.setHours(
            parseInt(startHours),
            parseInt(startMinutes),
            0,
            0,
          );
        } else {
          startDate.setHours(0, 0, 0, 0);
        }
      } else {
        startDate.setHours(0, 0, 0, 0);
      }

      if (schedule.end_time) {
        const endTimeValue =
          schedule.end_time instanceof Date
            ? schedule.end_time
            : schedule.end_time;

        if (endTimeValue instanceof Date) {
          const endHours = endTimeValue.getHours();
          const endMinutes = endTimeValue.getMinutes();
          endDate.setHours(endHours, endMinutes, 59, 999);
        } else if (typeof endTimeValue === "string") {
          const [endHours, endMinutes] = endTimeValue.split(":");
          endDate.setHours(parseInt(endHours), parseInt(endMinutes), 59, 999);
        } else {
          endDate.setHours(23, 59, 59, 999);
        }
      } else {
        endDate.setHours(23, 59, 59, 999);
      }

      // console.log("⏰ Adjusted dates:", { startDate, endDate, now });

      // 🔹 Restriction checks
      if (now > endDate) {
        // console.log('❌ Event has already ended');
        return res.error(
          getLocalizedMessage(
            req,
            "Event has already ended. Participation not allowed.",
          ),
        );
      }

      // 🔹 Step 3: Check for duplicate registration
      // console.log('🔍 Step 2: Checking for duplicate registration...');
      // console.log('Query params:', { user_id, event_id, activity_id, activity_type });

      const existingParticipant = await db.queryOne(
        `SELECT id, status FROM participates 
                 WHERE user_id = ? AND event_id = ? AND activity_id = ? AND CONVERT(NVARCHAR(MAX), activity_type) = ? AND deletedAt IS NULL`,
        [user_id, event_id, activity_id, activity_type],
      );

      if (existingParticipant) {
        // console.log('⚠️ Existing participant found:', existingParticipant);
        if (existingParticipant.status === "1") {
          return res.error(
            getLocalizedMessage(
              req,
              "You have already registered for this event and activity.",
            ),
          );
        }
        if (existingParticipant.status === "2") {
          return res.error(
            getLocalizedMessage(
              req,
              "Your participation request was rejected by your examiner.",
            ),
          );
        }
        if (existingParticipant.status === "0") {
          return res.error(
            getLocalizedMessage(
              req,
              "Your participation request is pending examiner approval.",
            ),
          );
        }
      }
      // console.log('✅ No duplicate found - proceeding with registration');

      // 🔹 Step 4: Register participant
      // console.log('📝 Step 3: Inserting participant...');
      const participantResult = await db.query(
        `INSERT INTO participates (event_id, user_id, manager_id, coordinator_id, activity_id, status, activity_type, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, '0', ?, GETDATE(), GETDATE())`,
        [
          event_id,
          user_id,
          manager_id,
          coordinator_id,
          activity_id,
          activity_type,
        ],
      );
      // console.log('✅ Participant inserted');

      // Fetch the inserted participant record
      // console.log('📋 Step 3b: Fetching inserted participant...');
      const participant = await db.queryOne(
        `SELECT id, event_id, user_id, manager_id, coordinator_id, activity_id, status, activity_type, createdAt, updatedAt
                 FROM participates 
                 WHERE user_id = ? AND event_id = ? AND activity_id = ? AND CONVERT(NVARCHAR(MAX), activity_type) = ? AND deletedAt IS NULL
                 ORDER BY createdAt DESC`,
        [user_id, event_id, activity_id, activity_type],
      );
      // console.log('✅ Participant fetched:', participant);

      // Start multi-level approval workflow (Requirement 4)
      if (participant && participant.id) {
        approvalWorkflow.startWorkflow(participant.id, user_id).catch(err => {
          console.warn('[postEventParticipant] Workflow start failed (non-blocking):', err.message);
        });
      }

      // 🔹 Step 4: Fetch data for email notifications
      // console.log('📧 Step 4: Fetching data for email notifications...');
      let userDetailsUrl = `${req.protocol}://${req.get("host")}/admin/user/view/${user_id}`;

      // console.log('📌 Fetching user data for ID:', user_id);
      let userData = await ciamService.getUserByDomainId(
        user_id.split(","),
        req.headers.authorization,
      );
      if (userData?.isError || userData == null) {
        console.warn('[postEventParticipant] CIAM failed for user data — proceeding without enriched user data');
        userData = { value: [{ userDomain: user_id, nameEn: user_id, emailAddress: '' }] };
      }
      userData = userData.value[0];

      // const userData = await db.queryOne(
      //     `SELECT id, name, email, mobile FROM users WHERE id = ? AND deletedAt IS NULL`,
      //     [user_id]
      // );
      // console.log('✅ User data:', userData);

      // console.log('📌 Fetching event data for ID:', event_id);
      const eventData = await db.queryOne(
        `SELECT id, name, eventDescription, location, startDate, endDate, eventAdmins FROM events WHERE id = ? AND deletedAt IS NULL`,
        [event_id],
      );
      // console.log('✅ Event data:', eventData);

      // console.log('📌 Fetching manager data for ID:', manager_id);
      let managerData = await ciamService.getUserByDomainId(
        manager_id.split(","),
        req.headers.authorization,
      );

      if (managerData?.isError || managerData == null) {
        console.warn('[postEventParticipant] CIAM failed for manager data — proceeding without enriched manager data');
        managerData = { value: [{ userDomain: manager_id, nameEn: manager_id, emailAddress: '' }] };
      }

      managerData = managerData.value[0];

      // const managerData = await db.queryOne(
      //     `SELECT id, name, email FROM users WHERE id = ? AND deletedAt IS NULL`,
      //     [manager_id]
      // );
      // console.log('✅ Manager data:', managerData);

      // console.log('📌 Fetching activity data for ID:', activity_id);
      const activityData = await db.queryOne(
        `SELECT sa.id, sa.name, sa.activityType, at.name as activityTypeName 
                 FROM sport_activities sa
                 LEFT JOIN activity_types at ON sa.activityType = at.id
                 WHERE sa.id = ? AND sa.deletedAt IS NULL`,
        [activity_id],
      );
      // console.log('✅ Activity data:', activityData);

      // 🔹 Step 5: Send email notifications
      // console.log('📧 Step 5: Sending email notifications...');
      try {
        const { sendEmail } = require("../../utils/emailService");
        const moment = require("moment");

        // Send email to manager
        if (managerData && managerData.email) {
          // console.log('📨 Sending email to manager:', managerData.email);
          await sendEmail({
            to: managerData.email,
            subject: `GDRFA - Event Participation Request: ${eventData.name}`,
            template: "employee-participant-to-manager.ejs",
            data: {
              title: "Employee Event Participation Notification",
              userData,
              eventData,
              userDetailsUrl,
              managerData,
              logoUrl: `${req.protocol}://${req.get("host")}/assets/images/Group.png`,
            },
          });
          // console.log('✅ Manager email sent');
        }

        // Send email to event admins
        if (eventData.eventAdmins) {
          // console.log('📨 Sending emails to event admins:', eventData.eventAdmins);
          const adminIds =
            typeof eventData.eventAdmins === "string"
              ? eventData.eventAdmins.split(",")
              : Array.isArray(eventData.eventAdmins)
                ? eventData.eventAdmins
                : [eventData.eventAdmins];

          let adminUsers = await ciamService.getUserByDomainId(
            adminIds,
            req.headers.authorization,
          );
          if (adminUsers?.isError || adminUsers == null) {
            const refreshed = await attemptTokenRefresh(req);
            if (refreshed.accessToken) {
              adminUsers = await ciamService.getUserByDomainId(
                adminIds,
                refreshed.accessToken,
              );
            }
            if (adminUsers?.isError || adminUsers == null) {
              console.warn('[postEventParticipant] CIAM failed for admin data — skipping admin email notifications');
              adminUsers = { value: [] };
            }
          }
          adminUsers = adminUsers.value;

          for (const admin of adminUsers) {
            if (admin.emailAddress) {
              try {
                // console.log('📨 Sending emailAddress to admin:', admin.emailAddress);
                await sendEmail({
                  to: admin.emailAddress,
                  subject: `GDRFA - New Participant Registered: ${eventData.name}`,
                  template: "admin-participant-notification.ejs",
                  data: {
                    title: "New Event Participant Registration",
                    adminName: admin.nameEn,
                    participantName: userData.nameEn,
                    participantEmail: userData.emailAddress,
                    participantMobile: userData.mobile || "Not provided",
                    eventName: eventData.name,
                    eventDescription:
                      eventData.eventDescription || "No description provided",
                    eventLocation: eventData.location,
                    eventStartDate: moment(eventData.startDate).format(
                      "DD-MM-YYYY",
                    ),
                    eventEndDate: moment(eventData.endDate).format(
                      "DD-MM-YYYY",
                    ),
                    activityName: activityData
                      ? activityData.name
                      : "Activity not found",
                    activityType:
                      activityData && activityData.activityTypeName
                        ? activityData.activityTypeName
                        : "Type not specified",
                    participantType:
                      activity_type === "1" ? "Individual" : "Team Captain",
                    registrationDate: moment().format("DD-MM-YYYY HH:mm"),
                    userDetailsUrl,
                    eventDetailsUrl: `${req.protocol}://${req.get("host")}/admin/event/view/${event_id}`,
                    logoUrl: `${req.protocol}://${req.get("host")}/assets/images/Group.png`,
                  },
                });
                // console.log('✅ Admin email sent to:', admin.emailAddress);
              } catch (emailError) {
                console.error(
                  `❌ Failed to send email to admin ${admin.emailAddress}:`,
                  emailError.message,
                );
              }
            }
          }
        } else {
          // console.log('⚠️ No event admins found');
        }
      } catch (emailError) {
        console.error("❌ Email notification error:", emailError.message);
        // Don't fail the entire request if email fails
      }

      // 🔹 Send in-app notification to the first approver (manager)
      try {
        if (managerData && managerData.userDomain) {
          await storeNotification({
            userId: managerData.userDomain,
            title_en: 'New Registration Approval Request',
            title_ar: 'طلب موافقة تسجيل جديد',
            message_en: `${userData.nameEn || user_id} has registered for "${eventData.name}" and requires your approval.`,
            message_ar: `قام ${userData.nameAr || userData.nameEn || user_id} بالتسجيل في "${eventData.name_ar || eventData.name}" ويحتاج إلى موافقتك.`,
          });
        }
      } catch (notifErr) {
        console.warn('[postEventParticipant] In-app notification failed (non-blocking):', notifErr.message);
      }

      // console.log('✅ POST Event Participant Complete - Success');
      return res.success({
        status: true,
        message: getLocalizedMessage(req, "Registered successfully."),
        data: participant,
      });
    } catch (error) {
      console.error("❌ Error adding participant:", error.message);
      console.error("❌ Full error stack:", error);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/:slug
  static async getPageBySlug(req, res) {
    try {
      const { slug } = req.params;
      const lang = req.headers["accept-language"] || "en";
      const isArabic = lang.includes("ar");

      const page = await db.queryOne(
        `SELECT id, slug, name_en, name_ar, description_en, description_ar, status, createdAt
                 FROM cms_pages 
                 WHERE slug = ? AND CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL`,
        [slug],
      );

      if (!page) {
        return res.error(getLocalizedMessage(req, "Page not found"));
      }

      // Helper function to properly decode UTF-8 strings
      const decodeUTF8 = (str) => {
        if (!str) return str;
        if (typeof str !== "string") return str;

        try {
          // Check if string contains UTF-8 encoded mojibake
          if (
            /[\xC2-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/.test(
              str,
            )
          ) {
            // It's already proper UTF-8, return as is
            return str;
          }
          return str;
        } catch (e) {
          return str;
        }
      };

      const formattedPage = {
        id: page.id,
        slug: page.slug,
        status: page.status,
        name: isArabic ? decodeUTF8(page.name_ar) : page.name_en,
        description: isArabic
          ? decodeUTF8(page.description_ar)
          : page.description_en,
      };

      return res.success(
        formattedPage,
        getLocalizedMessage(req, "Page retrieved successfully."),
      );
    } catch (error) {
      console.error("Error fetching page by slug:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/all-pages
  static async getAllPages(req, res) {
    try {
      const lang = req.headers["accept-language"] || "en";
      const isArabic = lang.includes("ar");

      const pages = await db.query(
        `SELECT id, slug, name_en, name_ar, description_en, description_ar, status, createdAt
                 FROM cms_pages 
                 WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
                 ORDER BY createdAt DESC`,
      );

      const formattedPages = (pages || []).map((page) => ({
        id: page.id,
        slug: page.slug,
        title: isArabic ? page.name_ar : page.name_en,
        description: isArabic ? page.description_ar : page.description_en,
        status: page.status,
        createdAt: page.createdAt,
      }));

      return res.success(
        formattedPages,
        getLocalizedMessage(req, "Pages fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching pages:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/teams/:teamId
  static async getTeamDetails(req, res) {
    try {
      const teamId = parseInt(req.params.id);

      if (!teamId) {
        return res.error(getLocalizedMessage(req, "Invalid team ID"));
      }

      const team = await db.queryOne(
        `SELECT id, name, image, status, createdAt
                 FROM teams 
                 WHERE id = ? AND CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL`,
        [teamId],
      );

      if (!team) {
        return res.error(getLocalizedMessage(req, "Team not found"));
      }

      // Get team players
      const players = await db.query(
        `SELECT tp.id, tp.player_id, tp.isCaptain
                 FROM team_players tp
                 WHERE tp.team_id = ? AND tp.deletedAt IS NULL`,
        [teamId],
      );
      let userMap = new Map();
      if (players.length > 0) {
        let arrayOfUsers = [...new Set(players.map((x) => x.player_id))];
        let userInfo = await ciamService.getUserByDomainId(
          arrayOfUsers,
          req.headers.authorization,
        );
        if (userInfo?.isError || userInfo == null) {
          const refreshed = await attemptTokenRefresh(req);
          if (refreshed.accessToken) {
            userInfo = await ciamService.getUserByDomainId(
              arrayOfUsers,
              refreshed.accessToken,
            );
          }
          if (userInfo?.isError || userInfo == null) {
            console.warn('[getTeamDetails] CIAM getUserByDomainId failed — using empty player data');
            userInfo = { value: [] };
          }
        }
        userInfo = userInfo.value || [];
        userMap = new Map(
          userInfo.map((user) => [
            user.userDomain,
            {
              userId: user.userDomain,
              image: null,
              name: user.nameEn,
              email: user.emailAddress,
              mobile: user.mobile,
            },
          ]),
        );
      }
      const formattedTeam = {
        ...team,
        image: team.image ? `${process.env.APP_URL}/${team.image}` : null,
        players: (players || []).map((p) => {
          const info = userMap.get(p.player_id) || {
            userId: p.player_id,
            image: null,
            name: null,
            email: null,
            mobile: null,
          };
          return {
            ...p,
            ...info,
            image: info.image ? `${info.image}` : null,
          };
        }),
      };

      return res.success(
        formattedTeam,
        getLocalizedMessage(req, "Team details fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching team details:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/blogs
  static async getAllBlogs(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      const lang = req.headers["accept-language"] || "en";
      const isArabic = lang.includes("ar");

      const countResult = await db.queryOne(
        `SELECT COUNT(*) as total FROM blog_posts WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL`,
      );
      const total = countResult.total || 0;

      const blogs = await db.query(
        `SELECT id, title, title_ar, shortDescription, shortDescription_ar, media, mediaType, content, content_ar, status, createdAt, updatedAt
                 FROM blog_posts 
                 WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
                 ORDER BY createdAt DESC
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
        [offset, parseInt(limit)],
      );

      // Fetch tags for all blogs
      const blogIds = (blogs || []).map((b) => b.id);
      let blogTagsMap = {};

      if (blogIds.length > 0) {
        const tagsQuery = await db.query(
          `SELECT pt.postId, t.id, t.name
                     FROM post_tags pt
                     INNER JOIN tags t ON pt.tagId = t.id
                     WHERE pt.postId IN (${blogIds.map(() => "?").join(",")}) AND t.deletedAt IS NULL`,
          blogIds,
        );

        // Group tags by postId
        blogTagsMap = {};
        (tagsQuery || []).forEach((tag) => {
          if (!blogTagsMap[tag.postId]) {
            blogTagsMap[tag.postId] = [];
          }
          blogTagsMap[tag.postId].push({
            id: tag.id,
            name: tag.name,
          });
        });
      }

      const formattedBlogs = (blogs || []).map((blog) => {
        const contentText = isArabic
          ? blog.content_ar || blog.content
          : blog.content;
        const wordCount = contentText
          ? contentText.split(/\s+/).filter((w) => w.length > 0).length
          : 0;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 words per minute

        return {
          id: blog.id,
          title: isArabic ? blog.title_ar || blog.title : blog.title,
          title_ar: blog.title_ar,
          description: isArabic
            ? blog.shortDescription_ar || blog.shortDescription
            : blog.shortDescription,
          description_ar: blog.shortDescription_ar,
          shortDescription: isArabic
            ? blog.shortDescription_ar || blog.shortDescription
            : blog.shortDescription,
          shortDescription_ar: blog.shortDescription_ar,
          media: blog.media ? `${process.env.APP_URL}/${blog.media}` : null,
          mediaType: blog.mediaType,
          isVideo: blog.mediaType === "video",
          videoSrc:
            blog.mediaType === "video"
              ? blog.media
                ? `${process.env.APP_URL}/${blog.media}`
                : null
              : null,
          tags: blogTagsMap[blog.id] || [],
          readingTime: `${readingTime} ${isArabic ? "دقيقة للقراءة" : "min read"}`,
          content: contentText,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
        };
      });

      return res.success(
        {
          data: formattedBlogs,
          total: total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
        getLocalizedMessage(req, "Blogs fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching blogs:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/blog/:id
  static async getBlogById(req, res) {
    try {
      const blogId = req.params.id ? req.params.id.toString() : null;
      const lang = req.headers["accept-language"] || "en";
      const isArabic = lang.includes("ar");

      if (!blogId) {
        return res.error(getLocalizedMessage(req, "Invalid blog ID"));
      }

      const blog = await db.queryOne(
        `SELECT bp.id, bp.title, bp.title_ar, bp.shortDescription, bp.shortDescription_ar, 
                        bp.media, bp.mediaType, bp.content, bp.content_ar, bp.status, bp.createdAt, bp.updatedAt
                 FROM blog_posts bp
                 WHERE bp.id = CAST(? AS INT) AND CONVERT(NVARCHAR(MAX), bp.status) = '1' AND bp.deletedAt IS NULL`,
        [blogId],
      );

      if (!blog) {
        return res.error(getLocalizedMessage(req, "Blog not found"));
      }

      // Fetch tags for this blog
      const tags = await db.query(
        `SELECT t.id, t.name
                 FROM tags t
                 INNER JOIN post_tags pt ON t.id = pt.tagId
                 WHERE pt.postId = CAST(? AS INT) AND t.deletedAt IS NULL
                 ORDER BY t.name ASC`,
        [blogId],
      );

      // Fetch related blogs with same tags
      const relatedBlogs = await db.query(
        `SELECT DISTINCT TOP 5 bp.id, bp.title, bp.title_ar, bp.shortDescription, bp.shortDescription_ar, 
                        bp.media, bp.mediaType, bp.createdAt
                 FROM blog_posts bp
                 INNER JOIN post_tags pt ON bp.id = pt.postId
                 INNER JOIN tags t ON pt.tagId = t.id
                 WHERE t.id IN (
                     SELECT DISTINCT pt2.tagId FROM post_tags pt2 WHERE pt2.postId = CAST(? AS INT)
                 )
                 AND bp.id != CAST(? AS INT)
                 AND CONVERT(NVARCHAR(MAX), bp.status) = '1' AND bp.deletedAt IS NULL
                 ORDER BY bp.createdAt DESC`,
        [blogId, blogId],
      );

      const blogContent = isArabic ? blog.content_ar : blog.content;
      const wordCount = blogContent
        ? blogContent.split(/\s+/).filter((w) => w.length > 0).length
        : 0;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      const formattedBlog = {
        id: blog.id,
        title: isArabic ? blog.title_ar || blog.title : blog.title,
        shortDescription: isArabic
          ? blog.shortDescription_ar || blog.shortDescription
          : blog.shortDescription,
        media: blog.media ? `${process.env.APP_URL}/${blog.media}` : null,
        mediaType: blog.mediaType,
        isVideo: blog.mediaType === "video",
        videoSrc:
          blog.mediaType === "video"
            ? blog.media
              ? `${process.env.APP_URL}/${blog.media}`
              : null
            : null,
        content: blogContent,
        tags: (tags || []).map((tag) => ({ id: tag.id, name: tag.name })),
        readingTime: `${readingTime} ${isArabic ? "دقيقة للقراءة" : "min read"}`,
        relatedBlogs: (relatedBlogs || []).map((rb) => ({
          id: rb.id,
          title: isArabic ? rb.title_ar || rb.title : rb.title,
          shortDescription: isArabic
            ? rb.shortDescription_ar || rb.shortDescription
            : rb.shortDescription,
          media: rb.media ? `${process.env.APP_URL}/${rb.media}` : null,
          mediaType: rb.mediaType,
          createdAt: rb.createdAt,
        })),
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      };

      return res.success(
        formattedBlog,
        getLocalizedMessage(req, "Blog fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching blog:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/media
  static async getAllMedia(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      const lang = req.headers["accept-language"] || "en";
      const isArabic = lang.includes("ar");

      const countResult = await db.queryOne(
        `SELECT COUNT(*) as total FROM media WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL`,
      );
      const total = countResult.total || 0;

      const media = await db.query(
        `SELECT id, title, title_ar, description, description_ar, [file], fileType, status, createdAt, updatedAt
                 FROM media 
                 WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
                 ORDER BY createdAt DESC
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
        [offset, parseInt(limit)],
      );

      // Fetch tags for all media
      const mediaIds = (media || []).map((m) => m.id);
      let mediaTagsMap = {};

      if (mediaIds.length > 0) {
        const tagsQuery = await db.query(
          `SELECT mt.mediaId, t.id, t.name
                     FROM media_tags mt
                     INNER JOIN tags t ON mt.tagId = t.id
                     WHERE mt.mediaId IN (${mediaIds.map(() => "?").join(",")}) AND t.deletedAt IS NULL`,
          mediaIds,
        );

        // Group tags by mediaId
        mediaTagsMap = {};
        (tagsQuery || []).forEach((tag) => {
          if (!mediaTagsMap[tag.mediaId]) {
            mediaTagsMap[tag.mediaId] = [];
          }
          mediaTagsMap[tag.mediaId].push({
            id: tag.id,
            name: tag.name,
          });
        });
      }

      const formattedMedia = (media || []).map((m) => ({
        id: m.id,
        title: isArabic ? m.title_ar || m.title : m.title,
        description: isArabic
          ? m.description_ar || m.description
          : m.description,
        shortDescription: isArabic
          ? m.description_ar || m.description
          : m.description,
        media: m.file ? `${process.env.APP_URL}/${m.file}` : null,
        file: m.file ? `${process.env.APP_URL}/${m.file}` : null,
        fileType: m.fileType,
        isVideo: m.fileType === "video",
        tags: mediaTagsMap[m.id] || [],
        status: m.status,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }));

      return res.success(
        {
          data: formattedMedia,
          total: total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
        getLocalizedMessage(req, "Media fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching media:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/media/:id
  static async getMediaById(req, res) {
    try {
      const mediaId = req.params.id ? req.params.id.toString() : null;
      const lang = req.headers["accept-language"] || "en";
      const isArabic = lang.includes("ar");

      if (!mediaId) {
        return res.error(getLocalizedMessage(req, "Invalid media ID"));
      }

      const media = await db.queryOne(
        `SELECT id, title, title_ar, description, description_ar, [file], fileType, status, createdAt, updatedAt
                    FROM media WHERE id = CAST(? AS INT) AND CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL`,
        [mediaId],
      );

      if (!media) {
        return res.error(getLocalizedMessage(req, "Media not found"));
      }

      // Fetch tags for this media
      const tags = await db.query(
        `SELECT t.id, t.name
                 FROM tags t
                 INNER JOIN media_tags mt ON t.id = mt.tagId
                 WHERE mt.mediaId = CAST(? AS INT) AND t.deletedAt IS NULL
                 ORDER BY t.name ASC`,
        [mediaId],
      );

      // Fetch related media with same tags
      const relatedMedia = await db.query(
        `SELECT TOP 5 m.id, m.title, m.title_ar, m.description, m.description_ar, 
                        m.[file], m.fileType, m.createdAt
                    FROM media m
                    INNER JOIN media_tags mt ON m.id = mt.mediaId
                    INNER JOIN tags t ON mt.tagId = t.id
                    WHERE t.id IN (
                     SELECT DISTINCT mt2.tagId FROM media_tags mt2 WHERE mt2.mediaId = CAST(? AS INT)
                 )
                 AND m.id != CAST(? AS INT)
                 AND CONVERT(NVARCHAR(MAX), m.status) = '1' AND m.deletedAt IS NULL
                 ORDER BY m.createdAt DESC`,
        [mediaId, mediaId],
      );

      const formattedMedia = {
        id: media.id,
        title: isArabic ? media.title_ar || media.title : media.title,
        description: isArabic
          ? media.description_ar || media.description
          : media.description,
        file: media.file ? `${process.env.APP_URL}/${media.file}` : null,
        fileType: media.fileType,
        isVideo: media.fileType === "video",
        tags: (tags || []).map((tag) => ({ id: tag.id, name: tag.name })),
        readingTime: `6 ${isArabic ? "دقيقة للقراءة" : "min read"}`,
        relatedMedia: (relatedMedia || []).map((rm) => ({
          id: rm.id,
          title: isArabic ? rm.title_ar || rm.title : rm.title,
          description: isArabic
            ? rm.description_ar || rm.description
            : rm.description,
          file: rm.file ? `${process.env.APP_URL}/${rm.file}` : null,
          fileType: rm.fileType,
          createdAt: rm.createdAt,
        })),
        createdAt: media.createdAt,
        updatedAt: media.updatedAt,
      };

      return res.success(
        formattedMedia,
        getLocalizedMessage(req, "Media fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching media by id:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/certificates
  static async getCertificates(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.error(getLocalizedMessage(req, "Authentication required"));
      }

      const certificates = await db.query(
        `SELECT ec.id, ec.user_id, ec.event_id, ec.activity_id, ec.status, 
                        ec.createdAt, e.name as event_title, at.name as activity_title
                 FROM event_certificates ec
                 LEFT JOIN events e ON ec.event_id = e.id
                 LEFT JOIN activity_types at ON ec.activity_id = at.id
                 WHERE ec.user_id = ?  AND CONVERT(NVARCHAR(MAX), ec.status) = '1' AND ec.deletedAt IS NULL
                 ORDER BY ec.createdAt DESC`,
        [userId],
      );

      return res.success(
        certificates || [],
        getLocalizedMessage(req, "Certificates fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching certificates:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/fitness-category
  static async getFitnessCategory(req, res) {
    try {
      const userId = req.user?.id;
      const { filter, month, year } = req.query;

      if (!userId) {
        return res.error(getLocalizedMessage(req, "Authentication required"));
      }

      // === Build date filter ===
      let dateWhereClause = "";
      let dateParams = [];
      const selectedYear = year ? parseInt(year, 10) : new Date().getFullYear();

      if (filter === "monthly") {
        const selectedMonth = month
          ? parseInt(month, 10)
          : new Date().getMonth() + 1;
        const monthStr = String(selectedMonth).padStart(2, "0");
        const startDateStr = `${selectedYear}-${monthStr}-01 00:00:00`;
        const endDateStr =
          new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0] +
          " 23:59:59";

        dateWhereClause = "AND e.createdAt >= ? AND e.createdAt <= ?";
        dateParams = [startDateStr, endDateStr];
      } else if (filter === "yearly") {
        const startDateStr = `${selectedYear}-01-01 00:00:00`;
        const endDateStr = `${selectedYear}-12-31 23:59:59`;

        dateWhereClause = "AND e.createdAt >= ? AND e.createdAt <= ?";
        dateParams = [startDateStr, endDateStr];
      }

      let categoriesWithResults = [];
      let totalPeriodPoints = 0;
      let lastUpdate = null;
      let evaluationDate = null;

      if (filter === "monthly" || filter === "yearly") {
        // === Aggregated Totals for the Period ===
        const aggregatedData = await db.query(
          `SELECT 
                        fc.id as category_id, 
                        fc.name as category_name, 
                        fc.unit,
                        fc.is_time,
                        SUM(CASE WHEN ISNUMERIC(er.value) = 1 THEN CAST(er.value AS FLOAT) ELSE 0 END) as input_value,
                        SUM(CASE WHEN ISNUMERIC(er.result) = 1 THEN CAST(er.result AS FLOAT) ELSE 0 END) as result_points,
                        MAX(er.updatedAt) as last_update
                     FROM fitness_categories fc
                     JOIN evaluation_results er ON fc.id = er.fitness_category_id
                     JOIN evaluations e ON e.id = er.evaluation_id
                     WHERE e.user_id = ? 
                       AND e.status = '1' 
                       AND e.deletedAt IS NULL
                       AND er.deletedAt IS NULL
                       ${dateWhereClause}
                     GROUP BY fc.id, fc.name, fc.unit, fc.is_time`,
          [userId, ...dateParams],
        );

        categoriesWithResults = (aggregatedData || []).map((row) => {
          const points = parseFloat(row.result_points) || 0;
          totalPeriodPoints += points;
          if (!lastUpdate || new Date(row.last_update) > new Date(lastUpdate)) {
            lastUpdate = row.last_update;
          }
          return {
            ...row,
            input_value: parseFloat(row.input_value) || 0,
            result_points: points,
            level: null,
            total_points: 0,
            evaluation_points: 0,
          };
        });

        evaluationDate = lastUpdate;
      } else {
        // === Fetch LATEST evaluation (Default behavior) ===
        const latestEval = await db.queryOne(
          `SELECT TOP 1 e.id, e.user_id, e.total_points, e.evaluation_points, 
                            e.evaluator_id, e.examiner_name, e.createdAt, e.updatedAt
                     FROM evaluations e
                     WHERE e.user_id = ? AND e.status = '1' AND e.deletedAt IS NULL
                     ORDER BY e.createdAt DESC`,
          [userId],
        );

        if (latestEval) {
          evaluationDate = latestEval.createdAt;
          lastUpdate = latestEval.updatedAt;
          totalPeriodPoints = latestEval.total_points;

          const results = await db.query(
            `SELECT er.fitness_category_id, er.value, er.result, er.updatedAt, fc.name as category_name, fc.unit, fc.is_time
                         FROM evaluation_results er
                         JOIN fitness_categories fc ON er.fitness_category_id = fc.id
                         WHERE er.evaluation_id = ? AND er.deletedAt IS NULL`,
            [latestEval.id],
          );

          categoriesWithResults = (results || []).map((r) => ({
            category_id: r.fitness_category_id,
            category_name: r.category_name,
            input_value: parseFloat(r.value) || 0,
            unit: r.unit,
            result_points: parseFloat(r.result) || 0,
            last_update: r.updatedAt,
            level: null,
          }));
        }
      }

      // Final formatting
      const formattedCategories = (categoriesWithResults || []).map((cat) => ({
        ...cat,
        total_points: parseFloat(totalPeriodPoints) || 0,
        evaluation_points: parseFloat(totalPeriodPoints) || 0,
        last_update: cat.last_update,
      }));

      let userInfo = {};
      try {
        const userInfoFromCiam = await ciamService.getUserByDomainId(
          userId.split(","),
          req.headers.authorization,
        );
        userInfo = userInfoFromCiam?.value?.[0] || {};
      } catch (ciamErr) {
        console.warn("CIAM info fetch failed:", ciamErr.message);
      }

      const user = {
        id: userInfo.userDomain || userId,
        name: userInfo.nameEn || "",
        email: userInfo.emailAddress || "",
      };

      return res.success(
        {
          evaluation_id: null, // ID is irrelevant for aggregated data
          evaluation_date: evaluationDate,
          user: user,
          categories: formattedCategories,
          total_points: parseFloat(totalPeriodPoints) || 0,
          filter: filter || "latest",
        },
        getLocalizedMessage(req, "Fitness data retrieved successfully."),
      );
    } catch (error) {
      console.error("Error fetching fitness category:", error.message);
      return res.error(
        error.message || getLocalizedMessage(req, "Internal server error"),
      );
    }
  }

  // GET /api/pages/fitness-categories
  static async getFitnessCategories(req, res) {
    try {
      const categories = await db.query(
        `SELECT id, name, is_time, unit, points, status, createdAt, updatedAt
                 FROM fitness_categories 
                 WHERE CONVERT(NVARCHAR(MAX), status) = '1' AND deletedAt IS NULL
                 ORDER BY name ASC`,
      );

      return res.success(
        categories || [],
        getLocalizedMessage(req, "Fitness categories fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching fitness categories:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }

  // GET /api/pages/my-evaluations
  static async getMyEvaluations(req, res) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      if (!userId) {
        return res.error(getLocalizedMessage(req, "Authentication required"));
      }

      const countResult = await db.queryOne(
        `SELECT COUNT(*) as total FROM evaluations WHERE user_id = ? AND status = '1' AND deletedAt IS NULL`,
        [userId.toString()],
      );
      const total = countResult.total || 0;

      let evaluations = await db.query(
        `SELECT e.id, e.user_id, e.total_points, e.evaluation_points, e.evaluator_id, e.examiner_name,
                        e.comments, e.status, e.createdAt, e.updatedAt
                 FROM evaluations e
                 WHERE e.user_id = ? AND CONVERT(NVARCHAR(MAX), e.status) = '1' AND e.deletedAt IS NULL
                 ORDER BY e.createdAt DESC
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
        [userId.toString(), offset, parseInt(limit)],
      );
      const evlUserIds = [...new Set(evaluations.map((x) => x.evaluator_id))];

      let userInfoMap = new Map();
      if (evlUserIds.length > 0) {
        let userInformation = await ciamService.getUserByDomainId(
          evlUserIds,
          req.headers.authorization,
        );
        if (userInformation?.isError || userInformation == null) {
          console.warn('[getMyEvaluations] CIAM getUserByDomainId failed — using empty evaluator data');
          userInformation = { value: [] };
        }
        userInformation =
          userInformation?.isError || userInformation == null
            ? []
            : userInformation.value;
        userInfoMap = new Map(
          userInformation.map((user) => [
            user.userDomain,
            { name: user.nameEn, email: user.emailAddress },
          ]),
        );
      }

      evaluations = evaluations.map((x) => {
        let informationOfEvl = userInfoMap.get(x.evaluator_id);
        return {
          ...x,
          evaluatorId: informationOfEvl.evaluator_id,
          evaluatorName: informationOfEvl.name,
          evaluatorEmail: informationOfEvl.email,
        };
      });

      return res.success(
        {
          data: evaluations || [],
          total: total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
        getLocalizedMessage(req, "Evaluations fetched successfully"),
      );
    } catch (error) {
      console.error("Error fetching evaluations:", error.message);
      return res.error(getLocalizedMessage(req, "Internal server error"));
    }
  }
}

module.exports = PageController;
