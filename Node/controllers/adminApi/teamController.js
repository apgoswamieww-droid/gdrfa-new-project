const db = require("../../config/dbDirect");
const imagePath = require("../../utils/imagePath");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const ciamService = require("../../ciam/ciam.service");
const { attemptTokenRefresh } = require("../../utils/ciamTokenHelper");
require("dotenv").config();

class TeamController {
  // ==================== GET TEAM INDEX (DATATABLE) ====================
  static async list(req, res) {
    try {
      const draw = parseInt(req.query.draw) || 1;
      const start = parseInt(req.query.start) || 0;
      const length = parseInt(req.query.length) || 10;
      const searchValue = req.query.search || "";

      // Count total records
      const countResult = await db.queryOne(
        `SELECT COUNT(*) as total FROM teams WHERE deletedAt IS NULL`,
      );
      const recordsTotal = countResult.total || 0;

      // Count filtered records
      let countFiltered = recordsTotal;
      if (searchValue) {
        const filteredCountResult = await db.queryOne(
          `SELECT COUNT(*) as total FROM teams 
                     WHERE (name LIKE ? OR activity LIKE ?) AND deletedAt IS NULL`,
          [`%${searchValue}%`, `%${searchValue}%`],
        );
        countFiltered = filteredCountResult.total || 0;
      }

      let query = `
                SELECT t.id, t.name, t.activity, t.numberOfMembers, t.image, t.status, t.createdAt, t.staffMembers,
                       CASE WHEN tp.id IS NOT NULL THEN 1 ELSE 0 END as hasPlayers,
                       tp.player_id as captainId
                FROM teams t
                LEFT JOIN team_players tp ON t.id = tp.team_id AND tp.isCaptain = '1' AND tp.deletedAt IS NULL
                WHERE t.deletedAt IS NULL
            `;

      let params = [];
      if (searchValue) {
        query += ` AND (t.name LIKE ? OR t.activity LIKE ?)`;
        params.push(`%${searchValue}%`, `%${searchValue}%`);
      }

      query += ` ORDER BY t.createdAt DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`;
      params.push(start, length);

      const teams = await db.query(query, params);

      const captainMap = new Map();
      const staffMap = new Map();

      if (teams.length > 0) {
        const uniqueCaptainIds = [
          ...new Set(teams.map((team) => team.captainId).filter(Boolean)),
        ];
        const uniqueStaffIds = [
          ...new Set(
            teams
              .flatMap((team) => String(team.staffMembers || "").split(","))
              .map((id) => String(id || "").trim())
              .filter(Boolean),
          ),
        ];

        const allDomainIds = [
          ...new Set([...uniqueCaptainIds, ...uniqueStaffIds]),
        ];
        if (allDomainIds.length > 0) {
          // Note: In API version, we might need a different way to get access token if it's not in session
          // For now, assuming it's available or handled by ciamService
          const accessToken = req.headers.authorization?.split(" ")[1];
          const usersResponse = await ciamService.getUserByDomainId(
            allDomainIds,
            accessToken,
          );

          if (usersResponse && !usersResponse.isError) {
            const usersRaw =
              usersResponse.value?.internalClientUsers ||
              usersResponse.value ||
              [];
            const users = Array.isArray(usersRaw) ? usersRaw : [];
            users.forEach((user) => {
              const domainId = String(user.userDomain);
              const displayName =
                user.nameEn || user.nameAr || user.emailAddress || "-";
              captainMap.set(domainId, displayName);
              staffMap.set(domainId, displayName);
            });
          }
        }
      }

      const formattedTeams = teams.map((team) => {
        const managerNames = String(team.staffMembers || "")
          .split(",")
          .map((id) => String(id || "").trim())
          .filter(Boolean)
          .map((id) => staffMap.get(id))
          .filter(Boolean);

        return {
          id: team.id,
          name: team.name,
          activity: team.activity,
          numberOfMembers: team.numberOfMembers,
          staffMembers: team.staffMembers,
          image: team.image,
          status: team.status,
          createdAt: team.createdAt,
          hasPlayers: team.hasPlayers === 1,
          captain: team.captainId
            ? {
                id: team.captainId,
                name: captainMap.get(String(team.captainId)),
              }
            : null,
          teamManager: managerNames.length ? managerNames.join(", ") : "-",
        };
      });

      return res.json({
        status: true,
        message: "Teams retrieved successfully",
        data: {
          draw: draw,
          recordsTotal: recordsTotal,
          recordsFiltered: countFiltered,
          data: formattedTeams,
        },
      });
    } catch (error) {
      console.error("Error in list teams:", error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ==================== LIST ALL TEAMS (for dropdowns/modals) ====================
  static async listAll(req, res) {
    try {
      const activityFilter = req.query.activity_id || '';
      let query = `SELECT t.id, t.name, t.activity, t.numberOfMembers
                   FROM teams t
                   WHERE t.deletedAt IS NULL AND t.status = '1'`;
      const params = [];

      if (activityFilter) {
        query += ` AND (t.activity LIKE ? OR t.activity LIKE ? OR t.activity LIKE ?)`;
        params.push(`${activityFilter}`, `${activityFilter},%`, `%,${activityFilter}`);
      }

      query += ` ORDER BY t.name ASC`;

      const teams = await db.query(query, params);

      return res.json({
        status: true,
        data: teams
      });
    } catch (error) {
      console.error('Error in listAll teams:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ==================== STORE (CREATE) ====================
  static async store(req, res) {
    try {
      const { name, activity, numberOfMembers, staffMembers, status } =
        req.body;
      let image = null;

      if (!name || !activity || !numberOfMembers) {
        return res
          .status(400)
          .json({ status: false, message: "Missing required fields" });
      }

      let staffMembersValue = staffMembers;
      if (Array.isArray(staffMembersValue)) {
        staffMembersValue = staffMembersValue.join(",");
      }

      let activityValue = activity;
      if (Array.isArray(activityValue)) {
        activityValue = activityValue.join(",");
      }

      if (req.file) {
        image = `uploads/${imagePath(req.file.path)}`;
      }

      await db.query(
        `INSERT INTO teams (name, activity, numberOfMembers, staffMembers, image, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, SYSDATETIME(), SYSDATETIME())`,
        [
          name,
          activityValue,
          numberOfMembers,
          staffMembersValue || null,
          image,
          status || "1",
        ],
      );

      return res.json({ status: true, message: "Team created successfully" });
    } catch (error) {
      console.error("Error in store team:", error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ==================== UPDATE ====================
  static async update(req, res) {
    try {
      const teamId = req.params.id;
      const { name, activity, numberOfMembers, staffMembers, status } =
        req.body;

      const team = await db.queryOne(
        `SELECT * FROM teams WHERE id = ? AND deletedAt IS NULL`,
        [teamId],
      );

      if (!team) {
        return res
          .status(404)
          .json({ status: false, message: "Team not found" });
      }

      let staffMembersValue = staffMembers;
      if (Array.isArray(staffMembersValue)) {
        staffMembersValue = staffMembersValue.join(",");
      }

      let activityValue = activity;
      if (Array.isArray(activityValue)) {
        activityValue = activityValue.join(",");
      }

      let image = team.image;
      if (req.file) {
        if (team.image) {
          const oldImagePath = path.join(__dirname, "../../", team.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        image = `uploads/${imagePath(req.file.path)}`;
      }

      await db.query(
        `UPDATE teams SET name = ?, activity = ?, numberOfMembers = ?, staffMembers = ?, image = ?, status = ?, updatedAt = SYSDATETIME()
                 WHERE id = ?`,
        [
          name,
          activityValue,
          numberOfMembers,
          staffMembersValue || null,
          image,
          status || team.status,
          teamId,
        ],
      );

      return res.json({ status: true, message: "Team updated successfully" });
    } catch (error) {
      console.error("Error in update team:", error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ==================== DELETE ====================
  static async delete(req, res) {
    try {
      const teamId = req.params.id;
      await db.query(
        `UPDATE teams SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [teamId],
      );

      await db.query(
        `UPDATE team_players SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE team_id = ?`,
        [teamId],
      );

      return res.json({ status: true, message: "Team deleted successfully" });
    } catch (error) {
      console.error("Error in delete team:", error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ==================== SHOW SINGLE TEAM ====================
  static async show(req, res) {
    try {
      const teamId = parseInt(req.params.id, 10);
      if (Number.isNaN(teamId)) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid team ID" });
      }

      const team = await db.queryOne(
        `SELECT t.*, 
                        CASE WHEN tp.id IS NOT NULL THEN 1 ELSE 0 END as hasPlayers,
                        tp.player_id as captainId
                 FROM teams t
                 LEFT JOIN team_players tp ON t.id = tp.team_id AND tp.isCaptain = '1' AND tp.deletedAt IS NULL
                 WHERE t.id = ? AND t.deletedAt IS NULL`,
        [teamId],
      );

      if (!team) {
        return res
          .status(404)
          .json({ status: false, message: "Team not found" });
      }

      const captainMap = new Map();
      const staffMap = new Map();
      const accessToken = req.headers.authorization?.split(" ")[1];

      const allDomainIds = [];
      if (team.captainId) allDomainIds.push(String(team.captainId));
      if (team.staffMembers) {
        const staffIds = String(team.staffMembers)
          .split(",")
          .map((id) => String(id).trim())
          .filter(Boolean);
        allDomainIds.push(...staffIds);
      }

      const uniqueDomainIds = [...new Set(allDomainIds)];
      if (uniqueDomainIds.length > 0) {
        const usersResponse = await ciamService.getUserByDomainId(
          uniqueDomainIds,
          accessToken,
        );

        if (usersResponse && !usersResponse.isError) {
          const usersRaw =
            usersResponse.value?.internalClientUsers ||
            usersResponse.value ||
            [];
          const users = Array.isArray(usersRaw) ? usersRaw : [];
          users.forEach((user) => {
            const domainId = String(user.userDomain || user.loginName || "");
            if (domainId) {
              const displayName =
                user.nameEn || user.nameAr || user.emailAddress || "-";
              captainMap.set(domainId, displayName);
              staffMap.set(domainId, displayName);
            }
          });
        }
      }

      const managerNames = team.staffMembers
        ? String(team.staffMembers)
            .split(",")
            .map((id) => String(id).trim())
            .filter(Boolean)
            .map((id) => staffMap.get(id))
            .filter(Boolean)
        : [];

      // Fetch team players
      const players = await db.query(
        `SELECT tp.*, 
                        CASE WHEN tp.isCaptain = '1' THEN 1 ELSE 0 END as isCaptainFlag
                 FROM team_players tp
                 WHERE tp.team_id = ? AND tp.deletedAt IS NULL
                 ORDER BY isCaptain DESC, tp.createdAt ASC`,
        [teamId],
      );

      // Fetch info from CIAM for real-time updates
      const playerDomainIds = players.map((p) => String(p.player_id || ""));
      const playerInfoMap = new Map();

      try {
        console.log(
          `[Team Show] Fetching CIAM data for ${playerDomainIds.length} players:`,
          playerDomainIds,
        );
        const playersResponse = await ciamService.getUserByDomainId(
          playerDomainIds,
          accessToken,
        );

        // CIAM service might return data in .value or .value.internalClientUsers
        let ciamUsers = [];
        if (playersResponse && playersResponse.isError === false) {
          if (Array.isArray(playersResponse.value)) {
            ciamUsers = playersResponse.value;
          } else if (
            playersResponse.value &&
            Array.isArray(playersResponse.value.internalClientUsers)
          ) {
            ciamUsers = playersResponse.value.internalClientUsers;
          }
        }

        console.log(
          `[Team Show] CIAM returned ${ciamUsers.length} user records.`,
        );

        ciamUsers.forEach((user) => {
          const info = {
            name: user.nameEn || user.nameAr || user.emailAddress || "-",
            nameEn: user.nameEn || "-",
            nameAr: user.nameAr || "-",
            email: user.emailAddress || "-",
            mobile: user.mobile || "-",
            status: user.active === 1 ? "Active" : "Inactive",
          };

          // Map by every possible identifier key
          const identifiers = [
            user.userDomain,
            user.loginName,
            user.grp,
            user.id,
          ]
            .filter(Boolean)
            .map((id) => String(id).toLowerCase().trim());

          identifiers.forEach((id) => {
            playerInfoMap.set(id, info);

            // Map by numeric part (e.g., "ml1234" -> "1234")
            const numeric = id.replace(/\D/g, "");
            if (numeric && numeric !== id && numeric.length > 0) {
              playerInfoMap.set(numeric, info);
            }
          });
        });
      } catch (err) {
        console.error("[Team Show] CIAM Lookup Error:", err.message);
      }

      const formattedPlayers = players.map((p) => {
        const rawPid = String(p.player_id || "");
        const pid = rawPid.toLowerCase().trim();
        const numericPid = pid.replace(/\D/g, "");

        // Try to find match in our multi-format map
        // 1. Exact match (e.g. "o-source1001")
        // 2. Numeric match (e.g. "1001")
        const info =
          playerInfoMap.get(pid) ||
          (numericPid ? playerInfoMap.get(numericPid) : null);

        if (!info) {
          console.log(`[Team Show] No CIAM match found for player: ${rawPid}`);
        }

        return {
          id: p.id,
          playerId: rawPid,
          name: info ? info.name : null,
          nameEn: info ? info.nameEn : null,
          nameAr: info ? info.nameAr : null,
          email: info ? info.email : "-",
          mobile: info ? info.mobile : "-",
          isCaptain: p.isCaptainFlag === 1,
          status: info ? info.status : "Active",
          createdAt: p.createdAt,
        };
      });

      // Get activity names from IDs
      let activityNames = team.activity || "";
      if (team.activity) {
        const activityIds = String(team.activity)
          .split(",")
          .map((id) => parseInt(id.trim()))
          .filter(Boolean);
        if (activityIds.length > 0) {
          const activities = await db.query(
            `SELECT sa.name FROM sport_activities sa 
                         WHERE sa.id IN (${activityIds.map(() => "?").join(",")}) AND sa.deletedAt IS NULL`,
            activityIds,
          );
          activityNames = activities.map((a) => a.name).join(", ");
        }
      }

      const formattedTeam = {
        id: team.id,
        name: team.name,
        activity: activityNames,
        numberOfMembers: team.numberOfMembers,
        staffMembers: team.staffMembers,
        image: team.image,
        status: team.status,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        hasPlayers: team.hasPlayers === 1,
        captain: team.captainId
          ? { id: team.captainId, name: captainMap.get(String(team.captainId)) }
          : null,
        teamManager: managerNames.length ? managerNames.join(", ") : "-",
        players: formattedPlayers,
      };

      return res.json({
        status: true,
        message: "Team retrieved successfully",
        data: formattedTeam,
      });
    } catch (error) {
      console.error("Error in show team:", error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ==================== GET ACTIVITIES ====================
  static async getActivities(req, res) {
    try {
      const activityResults = await db.query(
        `SELECT sa.id, sa.name, at.name as typeName
                 FROM sport_activities sa
                 LEFT JOIN activity_types at ON sa.activityType = at.id
                 WHERE sa.isTeam = '1' AND sa.status = '1' AND sa.deletedAt IS NULL
                 ORDER BY sa.name ASC`,
      );
      return res.json({ status: true, data: activityResults });
    } catch (error) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ==================== GET STAFF ====================
  static async getStaff(req, res) {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      let StaffFromCIAM = await ciamService.getUserByRoleId(
        process.env.STAFFROLEID,
        accessToken,
      );

      if (StaffFromCIAM?.isError || StaffFromCIAM == null) {
        console.warn('[Team getStaff] CIAM getUserByRoleId failed — returning empty staff list');
        StaffFromCIAM = { value: [] };
      }

      let staffUsersRaw =
        StaffFromCIAM.value?.internalClientUsers || StaffFromCIAM.value || [];
      let staffUsers = Array.isArray(staffUsersRaw)
        ? staffUsersRaw.filter((x) => x.userDomain)
        : [];
      return res.json({ status: true, data: staffUsers });
    } catch (error) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ==================== GET TEAM MEMBERS / ADD MEMBERS API ====================
  static async getTeamMembersData(req, res) {
    try {
      const teamId = parseInt(req.params.id, 10);
      if (Number.isNaN(teamId)) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid team ID" });
      }

      const team = await db.queryOne(
        `SELECT * FROM teams WHERE id = ? AND deletedAt IS NULL`,
        [teamId],
      );

      if (!team) {
        return res
          .status(404)
          .json({ status: false, message: "Team not found" });
      }

      let activityNames = "";
      if (team.activity) {
        const activityIds = String(team.activity)
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !Number.isNaN(id));

        if (activityIds.length > 0) {
          const activities = await db.query(
            `SELECT name FROM sport_activities WHERE id IN (${activityIds.map(() => "?").join(",")}) AND deletedAt IS NULL`,
            activityIds,
          );
          activityNames = activities.map((a) => a.name).join(", ");
        }
      }

      let staffNames = [];
      if (team.staffMembers) {
        const staffIds = String(team.staffMembers)
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        const accessToken = req.headers.authorization?.split(" ")[1];
        const StaffFromCIAM = await ciamService.getUserByDomainId(
          staffIds,
          accessToken,
        );
        if (StaffFromCIAM && !StaffFromCIAM.isError) {
          staffNames =
            StaffFromCIAM.value?.internalClientUsers ||
            StaffFromCIAM.value ||
            [];
        }
      }

      const selectedPlayers = await db.query(
        `SELECT player_id FROM team_players WHERE team_id = ? AND deletedAt IS NULL`,
        [teamId],
      );

      const accessToken = req.headers.authorization?.split(" ")[1];
      const payload = {
        pagination: {
          pageNumber: 1,
          pageSize: 100,
        },
        withImages: 30,
        sectors: [],
      };

      if (req.query.search) {
        payload.pagination.filters = { name: req.query.search };
      }

      const allPlayersResponse = await ciamService.getRecursiveUsers(
        payload,
        accessToken,
      );
      const allPlayersResult =
        allPlayersResponse && !allPlayersResponse.isError
          ? allPlayersResponse.value || []
          : [];
      const allPlayers = Array.isArray(allPlayersResult)
        ? allPlayersResult
            .filter((user) => user.userDomain) // Filter out users without userDomain
            .map((user) => {
              // Calculate age from birthDate
              let age = null;
              if (user.birthDate && user.birthDate !== "0001-01-01T00:00:00") {
                const birthDate = new Date(user.birthDate);
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (
                  monthDiff < 0 ||
                  (monthDiff === 0 && today.getDate() < birthDate.getDate())
                ) {
                  age--;
                }
              }

              // Determine gender
              let gender = "Unknown";
              if (user.sex === 1) gender = "Male";
              else if (user.sex === 2) gender = "Female";

              return {
                id: user.userDomain,
                name:
                  user.nameEn ||
                  user.nameAr ||
                  user.emailAddress ||
                  user.email ||
                  "-",
                email: user.emailAddress || user.email || "-",
                gender,
                age,
                mobile: user.mobile || "-",
                jobTitle: user.jobTitleEN || user.jobTitleAR || "-",
                department: user.deptNameEN || user.deptNameAR || "-",
                status: user.active === 1 ? "Active" : "Inactive",
              };
            })
        : [];

      const captain = await db.queryOne(
        `SELECT player_id FROM team_players WHERE team_id = ? AND isCaptain = '1' AND deletedAt IS NULL`,
        [teamId],
      );

      return res.json({
        status: true,
        message: "Team members loaded successfully",
        data: {
          team: { ...team, activityNames, staffNames },
          allPlayers,
          selectedPlayers: selectedPlayers.map((p) => p.player_id), // Keep as string (user domain ID)
          captainId: captain?.player_id || null,
        },
      });
    } catch (error) {
      console.error("Error in getTeamMembersData:", error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async addMemberStore(req, res) {
    try {
      const teamId = parseInt(req.body.team_id || req.params.id, 10);
      let playerIds = req.body.players || req.body["players[]"] || [];
      if (!Array.isArray(playerIds)) {
        playerIds = [playerIds];
      }
      // Keep player IDs as strings (user domain IDs from CIAM)
      playerIds = playerIds.filter((id) => id && String(id).trim() !== "");
      const captainId = req.body.captain || req.body.captain_id || null;

      if (!teamId || playerIds.length === 0) {
        return res
          .status(400)
          .json({
            status: false,
            message: "Team ID and at least one player are required.",
          });
      }

      // Check team capacity
      const team = await db.queryOne(
        `SELECT numberOfMembers FROM teams WHERE id = ? AND deletedAt IS NULL`,
        [teamId],
      );

      if (!team) {
        return res.status(404).json({
          status: false,
          message: "Team not found",
        });
      }

      if (playerIds.length > team.numberOfMembers) {
        return res.status(400).json({
          status: false,
          message: `Cannot add ${playerIds.length} players. Team capacity is ${team.numberOfMembers}.`,
        });
      }

      await db.query(
        `UPDATE team_players SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE team_id = ? AND deletedAt IS NULL`,
        [teamId],
      );

      for (const playerId of playerIds) {
        const isCaptain = String(captainId) === String(playerId) ? "1" : "0";
        await db.query(
          `INSERT INTO team_players (team_id, player_id, isCaptain, createdAt, updatedAt, deletedAt)
                     VALUES (?, ?, ?, SYSDATETIME(), SYSDATETIME(), NULL)`,
          [teamId, playerId, isCaptain],
        );
      }

      await db.query(
        `UPDATE teams SET numberOfMembers = ?, updatedAt = SYSDATETIME() WHERE id = ?`,
        [playerIds.length, teamId],
      );

      return res.json({
        status: true,
        message: "Team members updated successfully",
      });
    } catch (error) {
      console.error("Error in addMemberStore:", error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }
  // ==================== GET TEAM EVENTS ====================
  static async getTeamEvents(req, res) {
    try {
      const teamId = parseInt(req.params.id, 10);
      if (Number.isNaN(teamId)) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid team ID" });
      }

      const events = await db.query(
        `SELECT DISTINCT e.id, e.name, e.year, e.image, e.startDate, e.endDate, e.location,
                e.eventDescription, e.eventStatus, e.eventActiveStatus, e.status,
                e.teamName, e.activityId, e.targetType, e.createdAt
         FROM participates p
         INNER JOIN events e ON p.event_id = e.id AND e.deletedAt IS NULL AND e.status = '1'
         INNER JOIN team_players tp ON p.user_id = tp.player_id AND tp.team_id = ? AND tp.deletedAt IS NULL
         WHERE p.deletedAt IS NULL
           AND e.targetType = 'competitive'
         ORDER BY e.startDate DESC`,
        [teamId],
      );

      const activityIdSet = new Set(
        events
          .flatMap((e) =>
            e.activityId
              ? String(e.activityId)
                  .split(",")
                  .map((id) => parseInt(id.trim()))
                  .filter(Boolean)
              : [],
          ),
      );
      const activityIds = [...activityIdSet];
      const activityMap = {};
      if (activityIds.length > 0) {
        const activities = await db.query(
          `SELECT id, name FROM sport_activities WHERE id IN (${activityIds.map(() => "?").join(",")}) AND deletedAt IS NULL`,
          activityIds,
        );
        activities.forEach((a) => {
          activityMap[a.id] = a.name;
        });
      }

      const formattedEvents = events.map((e) => {
        let activityNames = "";
        if (e.activityId) {
          const ids = String(e.activityId)
            .split(",")
            .map((id) => parseInt(id.trim()))
            .filter(Boolean);
          activityNames = ids
            .map((id) => activityMap[id] || null)
            .filter(Boolean)
            .join(", ");
        }
        return {
          id: e.id,
          name: e.name,
          year: e.year,
          image: e.image,
          startDate: e.startDate,
          endDate: e.endDate,
          location: e.location,
          eventDescription: e.eventDescription,
          eventStatus: e.eventStatus,
          eventActiveStatus: e.eventActiveStatus,
          status: e.status,
          teamName: e.teamName,
          activityId: e.activityId,
          activityNames,
          targetType: e.targetType,
          createdAt: e.createdAt,
        };
      });

      return res.json({
        status: true,
        message: "Team events retrieved successfully",
        data: formattedEvents,
      });
    } catch (error) {
      console.error("Error in getTeamEvents:", error);
      return res
        .status(500)
        .json({ status: false, message: error.message });
    }
  }
}

module.exports = TeamController;
