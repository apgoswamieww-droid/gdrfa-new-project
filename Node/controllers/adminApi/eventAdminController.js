const db = require('../../config/dbDirect');
const path = require('path');
const fs = require('fs');
const imagePath = require('../../utils/imagePath');

// Event Controller for Admin API using raw SQL queries for MSSQL compatibility
// This controller handles CRUD operations for Events

let _columnCache = null;
async function getExistingColumns() {
  if (_columnCache) return _columnCache;
  const rows = await db.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'events'`);
  _columnCache = new Set(rows.map(r => (r.COLUMN_NAME || r.column_name || '').toString()));
  return _columnCache;
}

class EventAdminController {
    
    static async list(req, res) {
        try {
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const search = req.query.search || '';
            const draw = parseInt(req.query.draw) || 1;
            
            const currentUserId = req.user?.id || req.session?.admin?.id;
            const currentUserRoleId = String(req.user?.roleId || req.session?.admin?.roleId || '');
            const SUPER_ADMIN_ROLE_ID = String(process.env.SUPERADMINROLEID || '');

            // Build where condition based on role
            let whereCondition = 'e.deletedAt IS NULL';
            
            if (currentUserRoleId !== SUPER_ADMIN_ROLE_ID) {
                // Non-super admins can only see their own events or those they're assigned to
                whereCondition += ` AND (e.userId = '${currentUserId}' 
                    OR e.eventAdmins LIKE '%${currentUserId}%' 
                    OR e.eventCoordinators LIKE '%${currentUserId}%')`;
            }

            // Add search filter
            if (search) {
                whereCondition += ` AND (e.name LIKE '%${search}%' OR e.location LIKE '%${search}%')`;
            }

            // Get total count
            const totalResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM events e WHERE ${whereCondition}`
            );
            const totalRecords = totalResult?.total || 0;

            const existingCols = await getExistingColumns();
            const sel = (col) => existingCols.has(col) ? `e.${col}` : `NULL AS ${col}`;

            // Get paginated data
            const events = await db.query(`
                SELECT 
                    e.id,
                    e.year,
                    e.name,
                    e.name_ar,
                    e.startDate,
                    e.endDate,
                    e.startTime,
                    e.endTime,
                    e.numberOfHour,
                    e.location,
                    e.lat,
                    e.lng,
                    e.image,
                    e.userId,
                    e.status,
                    e.eventStatus,
                    e.eventDescription,
                    e.eventDescription_ar,
                    e.ageRange,
                    e.eventCoordinators,
                    e.eventAdmins,
                    e.activityId,
                    e.teamName,
                    e.targetType,
                    e.targetedEmployees,
                    e.selectedEmployees,
                    e.eventActiveStatus,
                    e.regStartDate,
                    e.regEndDate,
                    ${sel('workSystem')},
                    ${sel('rank')},
                    ${sel('peopleOfDetermination')},
                    e.createdAt,
                    e.updatedAt
                FROM events e
                WHERE ${whereCondition}
                ORDER BY e.createdAt DESC
                OFFSET ${start} ROWS FETCH NEXT ${length} ROWS ONLY
            `);

            return res.json({
                status: true,
                message: 'Events retrieved successfully',
                data: {
                    data: events,
                    total: totalRecords,
                    recordsTotal: totalRecords,
                    recordsFiltered: totalRecords,
                },
            });
        } catch (error) {
            console.error('Error in list Events:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const eventId = req.params.id;
            
            if (!eventId) {
                return res.status(400).json({ status: false, message: 'Event ID is required' });
            }

            const event = await db.queryOne(`
                SELECT * FROM events WHERE id = ? AND deletedAt IS NULL
            `, [eventId]);

            if (!event) {
                return res.status(404).json({ status: false, message: 'Event not found' });
            }

            // Resolve year display value
            const yearData = await db.queryOne(
                `SELECT year FROM plans WHERE id = ? AND deletedAt IS NULL`,
                [event.year]
            );
            event.yearLabel = yearData?.year ? String(yearData.year) : String(event.year);

            // Resolve team names
            let teamNamesList = [];
            if (event.teamName) {
                const teamIds = event.teamName.split(',').map(s => s.trim()).filter(Boolean);
                if (teamIds.length > 0) {
                    const teams = await db.query(`
                        SELECT id, name FROM teams WHERE id IN (${teamIds.map(() => '?').join(',')}) AND deletedAt IS NULL
                    `, teamIds);
                    teamNamesList = teams.map(t => t.name);
                }
            }
            event.teamNameLabel = teamNamesList.join(', ') || event.teamName || '';

            // Target type label
            const targetTypeLabels = { ragular: 'Regular Employee', competitive: 'Competitive Employee' };
            event.targetTypeLabel = targetTypeLabels[event.targetType] || event.targetType || '-';

            return res.json({
                status: true,
                data: event
            });
        } catch (error) {
            console.error('Error in getById Event:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async store(req, res) {
        try {
            const { name, name_ar, startDate, endDate, startTime, endTime, numberOfHour, location, lat, lng, year, eventDescription, eventDescription_ar, ageRange, eventCoordinators, activityId, teamName, targetType, status, regStartDate, regEndDate } = req.body;

            let image = req.body.image || null;
            if (req.file) {
                image = `uploads/${imagePath(req.file.path)}`;
            }

            const currentUserId = req.user?.id || req.session?.admin?.id;

            // Validation
            if (!name) {
                return res.status(400).json({ status: false, message: 'Event name is required' });
            }
            if (!startDate) {
                return res.status(400).json({ status: false, message: 'Start date is required' });
            }
            if (!endDate) {
                return res.status(400).json({ status: false, message: 'End date is required' });
            }
            if (!location) {
                return res.status(400).json({ status: false, message: 'Location is required' });
            }
            if (!year) {
                return res.status(400).json({ status: false, message: 'Year is required' });
            }

            // Registration date validation
            if (regStartDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const regStart = new Date(regStartDate);
                if (regStart < today) {
                    return res.status(400).json({ status: false, message: 'Registration start date cannot be in the past' });
                }
            }
            if (regStartDate && regEndDate && new Date(regEndDate) <= new Date(regStartDate)) {
                return res.status(400).json({ status: false, message: 'Registration end date must be after registration start date' });
            }
            if (regStartDate && startDate && new Date(startDate) < new Date(regStartDate)) {
                return res.status(400).json({ status: false, message: 'Event start date cannot be earlier than registration start date' });
            }
            if (regEndDate && startDate && new Date(startDate) < new Date(regEndDate)) {
                return res.status(400).json({ status: false, message: 'Event start date must be on or after registration end date' });
            }
            if (regEndDate && endDate && new Date(endDate) < new Date(regEndDate)) {
                return res.status(400).json({ status: false, message: 'Event end date cannot be earlier than registration end date' });
            }

            // Check for duplicate
            const existing = await db.queryOne(
                `SELECT id FROM events WHERE name = ? AND year = ? AND deletedAt IS NULL`,
                [name.trim(), year]
            );

            if (existing) {
                return res.status(409).json({ status: false, message: 'Event with this name already exists in this year' });
            }

            const sql = `
                INSERT INTO events (
                    year, name, name_ar, startDate, endDate, startTime, endTime, numberOfHour, location,
                    lat, lng, image, userId, status, eventStatus, eventDescription, eventDescription_ar,
                    ageRange, eventCoordinators, activityId, teamName, targetType,
                    regStartDate, regEndDate,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '0', ?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
            `;

            await db.query(sql, [
                year,
                name.trim(),
                name_ar ? name_ar.trim() : null,
                startDate,
                endDate,
                startTime || null,
                endTime || null,
                numberOfHour || null,
                location.trim(),
                lat || null,
                lng || null,
                image,
                currentUserId,
                status || '1',
                eventDescription || null,
                eventDescription_ar || null,
                ageRange || null,
                eventCoordinators || null,
                activityId || null,
                teamName || null,
                targetType || null,
                regStartDate || null,
                regEndDate || null
            ]);

            return res.json({
                status: true,
                message: 'Event created successfully'
            });
        } catch (error) {
            console.error('Error in store Event:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async update(req, res) {
        try {
            const eventId = req.params.id;
            const { name, name_ar, startDate, endDate, startTime, endTime, numberOfHour, location, lat, lng, year, eventDescription, eventDescription_ar, ageRange, eventCoordinators, activityId, teamName, targetType, status, regStartDate, regEndDate } = req.body;

            if (!eventId) {
                return res.status(400).json({ status: false, message: 'Event ID is required' });
            }

            // Validation
            if (!name) {
                return res.status(400).json({ status: false, message: 'Event name is required' });
            }
            if (!startDate) {
                return res.status(400).json({ status: false, message: 'Start date is required' });
            }
            if (!endDate) {
                return res.status(400).json({ status: false, message: 'End date is required' });
            }
            if (!location) {
                return res.status(400).json({ status: false, message: 'Location is required' });
            }

            // Registration date validation
            if (regStartDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const regStart = new Date(regStartDate);
                if (regStart < today) {
                    return res.status(400).json({ status: false, message: 'Registration start date cannot be in the past' });
                }
            }
            if (regStartDate && regEndDate && new Date(regEndDate) <= new Date(regStartDate)) {
                return res.status(400).json({ status: false, message: 'Registration end date must be after registration start date' });
            }
            if (regStartDate && startDate && new Date(startDate) < new Date(regStartDate)) {
                return res.status(400).json({ status: false, message: 'Event start date cannot be earlier than registration start date' });
            }
            if (regEndDate && startDate && new Date(startDate) < new Date(regEndDate)) {
                return res.status(400).json({ status: false, message: 'Event start date must be on or after registration end date' });
            }
            if (regEndDate && endDate && new Date(endDate) < new Date(regEndDate)) {
                return res.status(400).json({ status: false, message: 'Event end date cannot be earlier than registration end date' });
            }

            // Fetch existing event for image handling and duplicate check
            const event = await db.queryOne(
                `SELECT * FROM events WHERE id = ? AND deletedAt IS NULL`,
                [eventId]
            );

            if (!event) {
                return res.status(404).json({ status: false, message: 'Event not found' });
            }

            // Check for duplicate (excluding current record)
            const existing = await db.queryOne(
                `SELECT id FROM events WHERE name = ? AND year = ? AND id != ? AND deletedAt IS NULL`,
                [name.trim(), year, eventId]
            );

            if (existing) {
                return res.status(409).json({ status: false, message: 'Event with this name already exists in this year' });
            }

            // Handle image
            let image = event.image;
            if (req.file) {
                if (event.image) {
                    const oldImagePath = path.join(__dirname, '../../', event.image);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
                image = `uploads/${imagePath(req.file.path)}`;
            } else if (req.body.image && req.body.image !== event.image) {
                image = req.body.image;
            }

            const sql = `
                UPDATE events SET
                    name = ?, name_ar = ?, startDate = ?, endDate = ?, startTime = ?, endTime = ?,
                    numberOfHour = ?, location = ?, lat = ?, lng = ?, eventDescription = ?,
                    eventDescription_ar = ?, ageRange = ?, eventCoordinators = ?, activityId = ?,
                    teamName = ?, targetType = ?, image = ?,
                    regStartDate = ?, regEndDate = ?
                    ${status !== undefined ? ', status = ?' : ''}
                    , updatedAt = GETDATE()
                WHERE id = ?
            `;

            const params = [
                name.trim(),
                name_ar ? name_ar.trim() : null,
                startDate,
                endDate,
                startTime || null,
                endTime || null,
                numberOfHour || null,
                location.trim(),
                lat || null,
                lng || null,
                eventDescription || null,
                eventDescription_ar || null,
                ageRange || null,
                eventCoordinators || null,
                activityId || null,
                teamName || null,
                targetType || null,
                image,
                regStartDate || null,
                regEndDate || null
            ];

            if (status !== undefined) params.push(status);
            params.push(eventId);

            await db.query(sql, params);

            return res.json({
                status: true,
                message: 'Event updated successfully'
            });
        } catch (error) {
            console.error('Error in update Event:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const eventId = req.params.id;

            if (!eventId) {
                return res.status(400).json({ status: false, message: 'Event ID is required' });
            }

            // Soft delete event and all related records
            await db.query(`UPDATE events SET deletedAt = GETDATE() WHERE id = ?`, [eventId]);
            await db.query(`UPDATE participates SET deletedAt = GETDATE(), updatedAt = GETDATE() WHERE event_id = ? AND deletedAt IS NULL`, [eventId]);
            await db.query(`UPDATE event_activity_schedules SET deletedAt = GETDATE(), updatedAt = GETDATE() WHERE event_id = ? AND deletedAt IS NULL`, [eventId]);

            return res.json({
                status: true,
                message: 'Event and related participants deleted successfully'
            });
        } catch (error) {
            console.error('Error in delete Event:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async getYears(req, res) {
        try {
            const years = await db.query(`
                SELECT DISTINCT id, year FROM plans WHERE status = '1' AND deletedAt IS NULL 
                ORDER BY year DESC
            `);
            return res.json({
                status: true,
                data: years
            });
        } catch (error) {
            console.error('Error fetching years:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async getSportActivities(req, res) {
        try {
            const activities = await db.query(`
                SELECT sa.id, sa.name, sa.activityType, sa.isTeam, at.name as activityTypeName
                FROM sport_activities sa
                LEFT JOIN activity_types at ON sa.activityType = at.id
                WHERE sa.status = '1' AND sa.deletedAt IS NULL
                ORDER BY sa.name ASC
            `);
            return res.json({
                status: true,
                data: activities
            });
        } catch (error) {
            console.error('Error fetching sport activities:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async getTeams(req, res) {
        try {
            const teams = await db.query(`
                SELECT id, name FROM teams WHERE status = '1' AND deletedAt IS NULL 
                ORDER BY name ASC
            `);
            return res.json({
                status: true,
                data: teams
            });
        } catch (error) {
            console.error('Error fetching teams:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async getEventCoordinators(req, res) {
        try {
            const { attemptTokenRefresh } = require('../../utils/ciamTokenHelper');
            const ciamService = require('../../ciam/ciam.service');
            let authToken = req.user?.token || req.session?.admin?.accessToken;

            if (!authToken) {
                return res.json({ status: true, data: [] });
            }

            let coordinatorResp = await ciamService.getUserByRoleId(process.env.EVENTCOORDINATORROLEID, authToken);
            if (coordinatorResp?.isError || coordinatorResp == null) {
                console.warn('[Event getEventCoordinators] CIAM getUserByRoleId failed — returning empty list');
                coordinatorResp = { value: { internalClientUsers: [] } };
            }
            const employees = coordinatorResp?.isError || coordinatorResp == null ? [] : (coordinatorResp.value?.internalClientUsers || []);

            const data = employees.map(emp => ({
                id: emp.userDomain,
                name: emp.nameEn,
                nameAr: emp.nameAr,
                email: emp.emailAddress,
            }));

            return res.json({ status: true, data });
        } catch (error) {
            console.error('Error fetching event coordinators:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== EVENT ACTIVITIES (Manage Activity & Players) ====================

    static async getActivities(req, res) {
        try {
            const eventId = req.params.id;
            if (!eventId) {
                return res.status(400).json({ status: false, message: 'Event ID is required' });
            }

            const event = await db.queryOne(
                `SELECT * FROM events WHERE id = ? AND deletedAt IS NULL`,
                [eventId]
            );
            if (!event) {
                return res.status(404).json({ status: false, message: 'Event not found' });
            }

            // Get activity schedules
            const schedules = await db.query(`
                SELECT es.*, sa.name as activityName
                FROM event_activity_schedules es
                LEFT JOIN sport_activities sa ON es.activity_id = sa.id
                WHERE es.event_id = ?
                ORDER BY es.activity_id
            `, [eventId]);

            // Get all active sport activities
            const sportActivities = await db.query(`
                SELECT sa.id, sa.name, sa.isTeam, at.name as activityTypeName
                FROM sport_activities sa
                LEFT JOIN activity_types at ON sa.activityType = at.id
                WHERE sa.status = '1' AND sa.deletedAt IS NULL
                ORDER BY sa.name ASC
            `);

            // Get teams
            const teams = await db.query(`
                SELECT id, name FROM teams WHERE status = '1' AND deletedAt IS NULL ORDER BY name ASC
            `);

            // Get participants count
            const participantCountResult = await db.queryOne(
                `SELECT COUNT(*) as count FROM participates WHERE event_id = ?`,
                [eventId]
            );

            return res.json({
                status: true,
                data: {
                    event: {
                        id: event.id,
                        name: event.name,
                        name_ar: event.name_ar,
                        year: event.year,
                        startDate: event.startDate,
                        endDate: event.endDate,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        location: event.location,
                        image: event.image,
                        status: event.status,
                        activityId: event.activityId ? event.activityId.split(',').map(s => s.trim()).filter(Boolean) : [],
                        targetType: event.targetType || '',
                        targetedEmployees: event.targetedEmployees || '',
                        teamName: event.teamName ? event.teamName.split(',').map(s => s.trim()).filter(Boolean) : [],
                        gender: event.gender || '',
                        ageRange: event.ageRange || '',
                        sector: event.sector || '',
                        department: event.department || '',
                        section: event.section || '',
                        branch: event.branch || '',
                        rank: event.rank || '',
                        jobTitle: event.jobTitle || '',
                        workSystem: event.workSystem || '',
                        peopleOfDetermination: event.peopleOfDetermination || '',
                        selectedEmployees: event.selectedEmployees || '',
                        eventCoordinators: event.eventCoordinators || '',
                        eventAdmins: event.eventAdmins || '',
                        eventDescription: event.eventDescription,
                        eventDescription_ar: event.eventDescription_ar,
                        eventActiveStatus: event.eventActiveStatus,
                    },
                    schedules,
                    sportActivities,
                    teams,
                    participantCount: participantCountResult?.count || 0,
                }
            });
        } catch (error) {
            console.error('Error in getActivities:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async updateActivities(req, res) {
        try {
            const eventId = req.params.id;
            if (!eventId) {
                return res.status(400).json({ status: false, message: 'Event ID is required' });
            }

            const event = await db.queryOne(
                `SELECT * FROM events WHERE id = ? AND deletedAt IS NULL`,
                [eventId]
            );
            if (!event) {
                return res.status(404).json({ status: false, message: 'Event not found' });
            }

            const {
                activityId, targetType, targetedEmployees, teamName,
                gender, from_age, to_age,
                sector, department, section, branch,
                rank, jobTitle,
                selectedUserIds, eventAdmins,
                schedules
            } = req.body;

            // Validation
            if (!activityId || (Array.isArray(activityId) && activityId.length === 0)) {
                return res.status(400).json({ status: false, message: 'At least one activity is required' });
            }
            if (!targetType) {
                return res.status(400).json({ status: false, message: 'Target type is required' });
            }

            const activityIds = Array.isArray(activityId) ? activityId : String(activityId).split(',').map(s => s.trim()).filter(Boolean);
            const activityIdStr = activityIds.join(',');
            const teamNameStr = targetType === 'competitive'
                ? (Array.isArray(teamName) ? teamName.join(',') : (teamName || ''))
                : '';
            const targetedEmployeesStr = targetType === 'competitive' ? '' : (targetedEmployees || '');
            const genderStr = targetType === 'competitive' ? '' : (gender || '');
            const ageRangeStr = targetType === 'competitive' ? '' : ((from_age && to_age) ? `${from_age}-${to_age}` : '');
            const sectorStr = targetType === 'competitive' ? '' : (Array.isArray(sector) ? sector.join(',') : (sector || ''));
            const departmentStr = targetType === 'competitive' ? '' : (Array.isArray(department) ? department.join(',') : (department || ''));
            const sectionStr = targetType === 'competitive' ? '' : (Array.isArray(section) ? section.join(',') : (section || ''));
            const branchStr = targetType === 'competitive' ? '' : (Array.isArray(branch) ? branch.join(',') : (branch || ''));
            const rankStr = targetType === 'competitive' ? '' : (rank || '');
            const jobTitleStr = targetType === 'competitive' ? '' : (jobTitle || '');
            const selectedEmployeesStr = targetType === 'competitive' || targetedEmployees === 'all'
                ? ''
                : (Array.isArray(selectedUserIds) ? selectedUserIds.join(',') : (selectedUserIds || ''));
            const eventAdminsStr = eventAdmins || '';

            // Update event – build SET dynamically so missing columns don't cause errors
            const existingCols = await getExistingColumns();
            const setClauses = [
                '[activityId] = ?', '[targetType] = ?', '[teamName] = ?', '[targetedEmployees] = ?',
                '[ageRange] = ?', '[selectedEmployees] = ?', '[eventAdmins] = ?',
                '[gender] = ?', '[sector] = ?', '[department] = ?', '[section] = ?', '[branch] = ?',
            ];
            const setParams = [
                activityIdStr, targetType, teamNameStr, targetedEmployeesStr,
                ageRangeStr, selectedEmployeesStr, eventAdminsStr,
                genderStr, sectorStr, departmentStr, sectionStr, branchStr,
            ];
            if (existingCols.has('rank')) {
                setClauses.push('[rank] = ?');
                setParams.push(rankStr);
            }
            if (existingCols.has('jobTitle')) {
                setClauses.push('[jobTitle] = ?');
                setParams.push(jobTitleStr);
            }
            setClauses.push('[updatedAt] = GETDATE()');
            await db.query(`
                UPDATE events SET ${setClauses.join(', ')}
                WHERE id = ?
            `, [...setParams, eventId]);

            // Handle schedules
            if (activityIds.length > 0 && schedules && Array.isArray(schedules)) {
                for (const sched of schedules) {
                    const actId = parseInt(sched.activityId, 10);
                    if (!actId) continue;

                    const existingSchedule = await db.queryOne(
                        `SELECT id FROM event_activity_schedules WHERE event_id = ? AND activity_id = ?`,
                        [parseInt(eventId, 10), actId]
                    );

                    if (existingSchedule) {
                        await db.query(
                            `UPDATE event_activity_schedules SET start_date = ?, end_date = ?, start_time = ?, end_time = ?, description = ? WHERE id = ?`,
                            [sched.startDate || null, sched.endDate || null, sched.startTime || null, sched.endTime || null, sched.description || null, existingSchedule.id]
                        );
                    } else {
                        await db.query(
                            `INSERT INTO event_activity_schedules (event_id, activity_id, start_date, end_date, start_time, end_time, description, createdAt, updatedAt)
                             VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())`,
                            [parseInt(eventId, 10), actId, sched.startDate || null, sched.endDate || null, sched.startTime || null, sched.endTime || null, sched.description || null]
                        );
                    }
                }

                // Remove schedules for activities no longer selected
                const activityIdsInt = activityIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
                if (activityIdsInt.length > 0) {
                    const placeholders = activityIdsInt.map(() => '?').join(',');
                    await db.query(
                        `DELETE FROM event_activity_schedules WHERE event_id = ? AND activity_id NOT IN (${placeholders})`,
                        [parseInt(eventId, 10), ...activityIdsInt]
                    );
                }
            }

            // 🔹 Send activity invitation emails and notifications to targeted employees
            try {
                const ciamService = require('../../ciam/ciam.service');
                const { sendEmail } = require('../../utils/emailService');
                const { storeNotification } = require('../../utils/notificationHelper');
                const moment = require('moment');
                const accessToken = req.user?.token || req.session?.admin?.accessToken || req.headers.authorization?.split(' ')[1];

                // Get activity name(s)
                const activityIdInts = activityIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
                let activityNameStr = 'Activity';
                if (activityIdInts.length > 0) {
                    const actRows = await db.query(
                        `SELECT name FROM sport_activities WHERE id IN (${activityIdInts.map(() => '?').join(',')}) AND deletedAt IS NULL`,
                        activityIdInts
                    );
                    activityNameStr = actRows.map(r => r.name).filter(Boolean).join(', ') || 'Activity';
                }

                const baseNotificationData = {
                    title_en: 'New Activity Invitation',
                    title_ar: 'دعوة نشاط جديد',
                    message_en: `You have been invited to the activity "${activityNameStr}" for event "${event.name}".`,
                    message_ar: `لقد تمت دعوتك للنشاط "${activityNameStr}" في الفعالية "${event.name_ar || event.name}".`,
                };

                let targetUserDomains = [];

                if (targetType === 'competitive' && teamNameStr) {
                    const teams = teamNameStr.split(',').map(t => t.trim()).filter(Boolean);
                    const teamMembers = await db.query(
                        `SELECT tp.player_id, tp.isCaptain, t.name as team_name
                         FROM team_players tp
                         INNER JOIN teams t ON tp.team_id = t.id
                         WHERE tp.team_id IN (${teams.map(() => '?').join(',')}) AND tp.deletedAt IS NULL`,
                        teams
                    );
                    const userDomainMap = {};
                    for (const member of teamMembers) {
                        if (!userDomainMap[member.player_id]) {
                            userDomainMap[member.player_id] = { teamName: member.team_name, isCaptain: member.isCaptain };
                        }
                    }
                    targetUserDomains = Object.keys(userDomainMap);
                    // Attach team info for email data
                    const teamInfoMap = userDomainMap;
                    if (targetUserDomains.length > 0 && accessToken) {
                        let userResp = await ciamService.getUserByDomainId(targetUserDomains, accessToken);
                        if (userResp?.isError || userResp == null) {
                            console.warn('[updateActivities] CIAM getUserByDomainId failed for team members');
                        } else {
                            const users = userResp.value || [];
                            for (const user of users) {
                                const domain = (user.userDomain || user.userName || '').toString().trim().toLowerCase();
                                const info = teamInfoMap[domain] || {};
                                if (user.emailAddress) {
                                    sendEmail({
                                        to: user.emailAddress,
                                        subject: `GDRFA - Activity Invitation: ${event.name}`,
                                        template: 'activity-invitation.ejs',
                                        data: {
                                            title: 'You\'re Invited to a Sports Activity!',
                                            employeeName: user.nameEn || user.nameAr || domain,
                                            eventName: event.name,
                                            activityName: activityNameStr,
                                            location: event.location || 'TBD',
                                            startDate: event.startDate ? moment(event.startDate).format('DD-MM-YYYY') : 'TBD',
                                            endDate: event.endDate ? moment(event.endDate).format('DD-MM-YYYY') : 'TBD',
                                            startTime: event.startTime || '',
                                            endTime: event.endTime || '',
                                            eventDescription: event.eventDescription || '',
                                            targetType: 'competitive',
                                            teamName: info.teamName || '',
                                            isCaptain: info.isCaptain || '0',
                                            logoUrl: `${req.protocol}://${req.get('host')}/assets/images/Group.png`,
                                        },
                                    }).catch(err => console.error(`[updateActivities] Failed to send email to ${domain}:`, err.message));
                                }
                                storeNotification({
                                    userId: domain,
                                    ...baseNotificationData,
                                }).catch(err => console.error(`[updateActivities] Failed to store notification for ${domain}:`, err.message));
                            }
                        }
                    }
                } else if (targetType !== 'competitive' && targetedEmployeesStr === 'selected' && selectedEmployeesStr) {
                    targetUserDomains = selectedEmployeesStr.split(',').map(s => s.trim()).filter(Boolean);
                    if (targetUserDomains.length > 0 && accessToken) {
                        let userResp = await ciamService.getUserByDomainId(targetUserDomains, accessToken);
                        if (userResp?.isError || userResp == null) {
                            console.warn('[updateActivities] CIAM getUserByDomainId failed for selected employees');
                        } else {
                            const users = userResp.value || [];
                            for (const user of users) {
                                const domain = (user.userDomain || user.userName || '').toString().trim().toLowerCase();
                                if (user.emailAddress) {
                                    sendEmail({
                                        to: user.emailAddress,
                                        subject: `GDRFA - Activity Invitation: ${event.name}`,
                                        template: 'activity-invitation.ejs',
                                        data: {
                                            title: 'You\'re Invited to a Sports Activity!',
                                            employeeName: user.nameEn || user.nameAr || domain,
                                            eventName: event.name,
                                            activityName: activityNameStr,
                                            location: event.location || 'TBD',
                                            startDate: event.startDate ? moment(event.startDate).format('DD-MM-YYYY') : 'TBD',
                                            endDate: event.endDate ? moment(event.endDate).format('DD-MM-YYYY') : 'TBD',
                                            startTime: event.startTime || '',
                                            endTime: event.endTime || '',
                                            eventDescription: event.eventDescription || '',
                                            targetType: 'ragular',
                                            teamName: '',
                                            isCaptain: '0',
                                            logoUrl: `${req.protocol}://${req.get('host')}/assets/images/Group.png`,
                                        },
                                    }).catch(err => console.error(`[updateActivities] Failed to send email to ${domain}:`, err.message));
                                }
                                storeNotification({
                                    userId: domain,
                                    ...baseNotificationData,
                                }).catch(err => console.error(`[updateActivities] Failed to store notification for ${domain}:`, err.message));
                            }
                        }
                    }
                } else if (targetType !== 'competitive' && targetedEmployeesStr === 'all') {
                    if (accessToken) {
                        let allUsersResp = await ciamService.getUserByRoleId(String(process.env.USERROLEID || '').trim(), accessToken);
                        if (allUsersResp?.isError || allUsersResp == null) {
                            console.warn('[updateActivities] CIAM getUserByRoleId failed — skipping email for all employees');
                        } else {
                            const allUsers = allUsersResp.value || [];
                            for (const user of allUsers) {
                                const domain = (user.userDomain || user.userName || '').toString().trim().toLowerCase();
                                if (domain && user.emailAddress) {
                                    sendEmail({
                                        to: user.emailAddress,
                                        subject: `GDRFA - Activity Invitation: ${event.name}`,
                                        template: 'activity-invitation.ejs',
                                        data: {
                                            title: 'You\'re Invited to a Sports Activity!',
                                            employeeName: user.nameEn || user.nameAr || domain,
                                            eventName: event.name,
                                            activityName: activityNameStr,
                                            location: event.location || 'TBD',
                                            startDate: event.startDate ? moment(event.startDate).format('DD-MM-YYYY') : 'TBD',
                                            endDate: event.endDate ? moment(event.endDate).format('DD-MM-YYYY') : 'TBD',
                                            startTime: event.startTime || '',
                                            endTime: event.endTime || '',
                                            eventDescription: event.eventDescription || '',
                                            targetType: 'ragular',
                                            teamName: '',
                                            isCaptain: '0',
                                            logoUrl: `${req.protocol}://${req.get('host')}/assets/images/Group.png`,
                                        },
                                    }).catch(err => console.error(`[updateActivities] Failed to send email to ${domain}:`, err.message));
                                }
                                storeNotification({
                                    userId: domain,
                                    ...baseNotificationData,
                                }).catch(err => console.error(`[updateActivities] Failed to store notification for ${domain}:`, err.message));
                            }
                        }
                    }
                }
            } catch (emailErr) {
                console.error('[updateActivities] Email dispatch error:', emailErr.message);
            }

            return res.json({
                status: true,
                message: 'Event activities updated successfully'
            });
        } catch (error) {
            console.error('Error in updateActivities:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async getParticipants(req, res) {
        try {
            const { eventId, activityId, eventType } = req.body;
            if (!eventId || !activityId || !eventType) {
                return res.status(400).json({ status: false, message: 'Event ID, Activity ID and Event Type are required' });
            }

            const event = await db.queryOne(
                `SELECT * FROM events WHERE id = ? AND deletedAt IS NULL`,
                [eventId]
            );
            if (!event) {
                return res.status(404).json({ status: false, message: 'Event not found' });
            }

            let responseData = {};

            if (eventType === 'ragular') {
                const participantRows = await db.query(`
                    SELECT DISTINCT p.user_id
                    FROM participates p
                    WHERE p.event_id = ? AND p.activity_id = ? AND p.deletedAt IS NULL
                `, [eventId, activityId]);

                const userIds = participantRows.map(p => p.user_id).filter(Boolean);

                let players = [];
                if (userIds.length > 0) {
                    const ciamService = require('../../ciam/ciam.service');
                    const accessToken = req.headers.authorization?.split(' ')[1] || process.env.CIAM_TOKEN;
                    const usersResponse = await ciamService.getUserByDomainId(userIds, accessToken);
                    if (!usersResponse?.isError && usersResponse?.value) {
                        players = usersResponse.value.map(u => ({
                            user_id: u.userDomain,
                            name: u.nameEn || u.nameAr || u.userName,
                            email: u.emailAddress,
                            mobile: u.mobile,
                        }));
                    }
                }

                responseData = { players, eventType };
            } else {
                let teamIds = [];
                if (event.teamName) {
                    teamIds = event.teamName.split(",").map(id => id.trim()).filter(Boolean);
                }

                const teams = await db.query(`
                    SELECT id, name FROM teams WHERE id IN (${teamIds.map(() => '?').join(',')}) AND deletedAt IS NULL
                `, teamIds);

                responseData = { teams, eventType };
            }

            return res.json({ status: true, data: responseData });
        } catch (error) {
            console.error('Error in getParticipants:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async markComplete(req, res) {
        try {
            const { eventId, activityId, user_ids, winner_team } = req.body;

            if (!eventId || !activityId) {
                return res.status(400).json({ status: false, message: 'Event ID and Activity ID are required' });
            }

            const eventIdInt = parseInt(eventId, 10);
            const activityIdInt = parseInt(activityId, 10);
            const now = new Date().toISOString();

            // Check if participants exist for this activity
            const participantCount = await db.queryOne(`
                SELECT COUNT(*) as count FROM participates WHERE event_id = ? AND activity_id = ? AND deletedAt IS NULL
            `, [eventIdInt, activityIdInt]);
            if (!participantCount || participantCount.count === 0) {
                return res.status(400).json({ status: false, message: 'No participants found for this activity. Cannot set winner.' });
            }

            let certificateEntries = [];

            if (user_ids && Array.isArray(user_ids)) {
                certificateEntries = user_ids.map(uid => ({
                    user_id: String(uid),
                    event_id: eventIdInt,
                    activity_id: activityIdInt,
                    status: '1'
                }));
            } else if (winner_team) {
                const teamPlayers = await db.query(
                    `SELECT player_id FROM team_players WHERE team_id = ?`,
                    [parseInt(winner_team, 10)]
                );
                certificateEntries = teamPlayers.map(tp => ({
                    user_id: String(tp.player_id),
                    event_id: eventIdInt,
                    activity_id: activityIdInt,
                    status: '1'
                }));
            }

            if (certificateEntries.length === 0) {
                return res.status(400).json({ status: false, message: 'No participants selected' });
            }

            for (const entry of certificateEntries) {
                const existing = await db.queryOne(`
                    SELECT id FROM event_certificates WHERE user_id = ? AND event_id = ? AND activity_id = ?
                `, [entry.user_id, entry.event_id, entry.activity_id]);

                if (!existing) {
                    await db.query(`
                        INSERT INTO event_certificates (user_id, event_id, activity_id, status, createdAt, updatedAt)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [entry.user_id, entry.event_id, entry.activity_id, entry.status, now, now]);
                }
            }

            const totalActivitiesResult = await db.queryOne(`
                SELECT COUNT(*) as count FROM event_activity_schedules WHERE event_id = ?
            `, [eventIdInt]);
            const totalActivities = totalActivitiesResult?.count || 0;

            const completedActivitiesResult = await db.queryOne(`
                SELECT COUNT(DISTINCT activity_id) as count FROM event_certificates WHERE event_id = ?
            `, [eventIdInt]);
            const completedActivities = completedActivitiesResult?.count || 0;

            let message = 'Activity winners stored successfully!';

            if (totalActivities > 0 && completedActivities >= totalActivities) {
                await db.query(`
                    UPDATE events SET eventActiveStatus = '2', updatedAt = GETDATE() WHERE id = ?
                `, [eventIdInt]);
                message = 'All activities completed. Event is now closed!';
            }

            return res.json({ status: true, message });
        } catch (error) {
            console.error('Error in markComplete:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async markActivityComplete(req, res) {
        try {
            const { eventId, activityId } = req.body;
            if (!eventId || !activityId) {
                return res.status(400).json({ status: false, message: 'Event ID and Activity ID are required' });
            }

            await db.query(
                `UPDATE event_activity_schedules SET status = '2', updatedAt = GETDATE() WHERE event_id = ? AND activity_id = ? AND deletedAt IS NULL`,
                [eventId, activityId]
            );

            return res.json({ status: true, message: 'Activity marked as complete successfully' });
        } catch (error) {
            console.error('Error in markActivityComplete:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async getWinners(req, res) {
        try {
            const eventId = req.params.id;
            if (!eventId) {
                return res.status(400).json({ status: false, message: 'Event ID is required' });
            }

            const certificates = await db.query(`
                SELECT ec.activity_id, ec.user_id, ec.createdAt,
                       sa.name as activity_name, sa.isTeam
                FROM event_certificates ec
                LEFT JOIN sport_activities sa ON ec.activity_id = sa.id
                WHERE ec.event_id = ?
                ORDER BY ec.activity_id, ec.createdAt
            `, [eventId]);

            const certificateActivityIds = [...new Set(certificates.map(e => e.activity_id))];

            const completedSchedules = await db.query(
                `SELECT activity_id FROM event_activity_schedules WHERE event_id = ? AND status = '2' AND deletedAt IS NULL`,
                [eventId]
            );
            const completedScheduleIds = completedSchedules.map(s => s.activity_id);

            const completedActivityIds = [...new Set([...certificateActivityIds, ...completedScheduleIds])];

            // Resolve winner names from CIAM
            const userIds = [...new Set(certificates.map(e => e.user_id))].filter(Boolean);
            let userMap = new Map();
            if (userIds.length > 0) {
                const ciamService = require('../../ciam/ciam.service');
                const accessToken = req.headers.authorization?.split(' ')[1] || process.env.CIAM_TOKEN;
                const usersResponse = await ciamService.getUserByDomainId(userIds, accessToken);
                if (!usersResponse?.isError && usersResponse?.value) {
                    usersResponse.value.forEach(u => {
                        userMap.set(u.userDomain, u.nameEn || u.nameAr || u.userName || u.userDomain);
                    });
                }
            }

            // Build winners by activity
            const winnersByActivity = {};
            certificates.forEach(cert => {
                if (!winnersByActivity[cert.activity_id]) {
                    winnersByActivity[cert.activity_id] = {
                        activity_name: cert.activity_name,
                        isTeam: cert.isTeam === '1',
                        winners: [],
                    };
                }
                const name = userMap.get(cert.user_id) || cert.user_id;
                if (!winnersByActivity[cert.activity_id].winners.find(w => w.user_id === cert.user_id)) {
                    winnersByActivity[cert.activity_id].winners.push({
                        user_id: cert.user_id,
                        name,
                    });
                }
            });

            return res.json({
                status: true,
                data: {
                    certificates,
                    completedActivityIds,
                    completedScheduleIds,
                    winnersByActivity,
                }
            });
        } catch (error) {
            console.error('Error in getWinners:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async updateEventStatus(req, res) {
        try {
            const { id } = req.params;
            const { eventStatus } = req.body;

            if (!['0', '1', '2'].includes(String(eventStatus))) {
                return res.status(400).json({ status: false, message: 'Invalid event status. Use 0=Pending, 1=Approved, 2=Rejected' });
            }

            // Check role: only Admin or Event Coordinator can approve/reject
            const currentRoleId = String(req.user?.roleId || '').trim();
            const ADMIN_ROLE_ID = String(process.env.ADMINROLEID || '').trim();
            const EVENT_COORDINATOR_ROLE_ID = String(process.env.EVENTCOORDINATORROLEID || '').trim();

            const hasAllowedRole = currentRoleId === ADMIN_ROLE_ID || currentRoleId === EVENT_COORDINATOR_ROLE_ID;

            // Also check granular permission (OR logic — role OR permission is sufficient)
            const userPermissions = req.user?.permissions || [];
            const hasPermission = userPermissions.includes('*') || userPermissions.includes('approve-event');

            if (!hasAllowedRole && !hasPermission) {
                return res.status(403).json({ status: false, message: 'You do not have permission to approve or reject events. Required role: Admin or Event Coordinator.' });
            }

            const event = await db.queryOne(
                `SELECT id, eventStatus FROM events WHERE id = ? AND deletedAt IS NULL`,
                [id]
            );

            if (!event) {
                return res.status(404).json({ status: false, message: 'Event not found' });
            }

            await db.query(
                `UPDATE events SET eventStatus = ?, updatedAt = SYSDATETIME() WHERE id = ?`,
                [eventStatus, id]
            );

            const statusLabel = eventStatus === '0' ? 'Pending' : eventStatus === '1' ? 'Approved' : 'Rejected';

            return res.json({
                status: true,
                message: `Event ${statusLabel.toLowerCase()} successfully`,
                data: { eventStatus }
            });

        } catch (error) {
            console.error('Error in updateEventStatus:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = EventAdminController;
