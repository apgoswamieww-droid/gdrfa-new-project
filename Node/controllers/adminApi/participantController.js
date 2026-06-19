const db = require('../../config/dbDirect');
const ciamService = require('../../ciam/ciam.service');
const approvalWorkflow = require('../../services/approvalWorkflowService');
const { storeNotification } = require('../../utils/notificationHelper');
const { sendEmail } = require('../../utils/emailService');
const moment = require('moment');

class ParticipantController {
    // ==================== LIST PARTICIPANTS ====================
    static async list(req, res) {
        try {
            const draw = parseInt(req.query.draw) || 1;
            const start = parseInt(req.query.start) || 0;
            const length = parseInt(req.query.length) || 10;
            const searchValue = req.query.search || '';
            const statusFilter = req.query.status || '';
            const eventIdFilter = req.query.event_id || '';

            const currentUserId = req.user.userDomain; // Using userDomain from verifyToken middleware
            const currentRoleId = req.user.roleId;

            let whereClause = 'WHERE p.deletedAt IS NULL';
            const params = [];

            // Non-admin users see only participants where they are the pending approver
            // This covers Section Manager, Department Manager, and any other approver
            if (currentRoleId !== process.env.ADMINROLEID && currentRoleId !== process.env.SUPERADMINROLEID) {
                whereClause += ' AND EXISTS (SELECT 1 FROM participate_approval_history h WHERE h.participate_id = p.id AND h.approver_id = ? AND h.status = \'pending\')';
                params.push(currentUserId);
            }

            // Status filter
            if (statusFilter) {
                whereClause += ' AND p.status = ?';
                params.push(statusFilter);
            }

            // Event ID filter
            if (eventIdFilter) {
                whereClause += ' AND p.event_id = ?';
                params.push(eventIdFilter);
            }

            // Event search
            if (searchValue) {
                whereClause += ' AND (e.name LIKE ?)';
                params.push(`%${searchValue}%`);
            }

            // Count total records
            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM participates p LEFT JOIN events e ON p.event_id = e.id ${whereClause}`,
                params
            );
            const recordsTotal = countResult.total || 0;

            // Fetch data
            let query = `
                SELECT p.id, p.user_id, p.event_id, p.activity_id, p.team_id, p.status, p.createdAt,
                       p.current_approval_level, p.workflow_status,
                       e.name as eventName, e.image as eventImage,
                       sa.name as activityName,
                       tm.name as teamName
                FROM participates p
                LEFT JOIN events e ON p.event_id = e.id
                LEFT JOIN sport_activities sa ON p.activity_id = sa.id
                LEFT JOIN teams tm ON p.team_id = tm.id AND tm.deletedAt IS NULL
                ${whereClause}
                ORDER BY p.createdAt DESC 
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
            `;
            const data = await db.query(query, [...params, start, length]);

            // Enrich with CIAM user data
            const userDomainIds = [...new Set(data.map(p => p.user_id).filter(Boolean))];
            const playerInfoMap = new Map();

            if (userDomainIds.length > 0) {
                const accessToken = req.headers.authorization?.split(' ')[1];
                const usersResponse = await ciamService.getUserByDomainId(userDomainIds, accessToken);
                
                if (usersResponse && !usersResponse.isError) {
                    const usersRaw = usersResponse.value?.internalClientUsers || usersResponse.value || [];
                    const users = Array.isArray(usersRaw) ? usersRaw : [];
                    users.forEach(user => {
                        const domainId = String(user.userDomain || user.loginName || '').toLowerCase();
                        if (domainId) {
                            playerInfoMap.set(domainId, {
                                name: user.nameEn || user.nameAr || '-',
                                email: user.emailAddress || '-',
                                mobile: user.mobile || '-'
                            });
                        }
                    });
                }
            }

            const formattedData = data.map(row => {
                const userInfo = playerInfoMap.get(String(row.user_id).toLowerCase()) || { name: row.user_id, email: '-', mobile: '-' };
                return {
                    id: row.id,
                    user: {
                        id: row.user_id,
                        name: userInfo.name,
                        email: userInfo.email,
                        mobile: userInfo.mobile
                    },
                    event: {
                        id: row.event_id,
                        name: row.eventName,
                        image: row.eventImage
                    },
                    sportActivity: {
                        id: row.activity_id,
                        name: row.activityName
                    },
                    team: row.team_id ? {
                        id: row.team_id,
                        name: row.teamName
                    } : null,
                    status: row.status,
                    currentApprovalLevel: row.current_approval_level || null,
                    workflowStatus: row.workflow_status || null,
                    createdAt: row.createdAt
                };
            });

            return res.json({
                status: true,
                message: 'Participants retrieved successfully',
                data: {
                    draw,
                    recordsTotal,
                    recordsFiltered: recordsTotal,
                    data: formattedData
                }
            });

        } catch (error) {
            console.error('Error in list participants:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== VIEW PARTICIPANT ====================
    static async show(req, res) {
        try {
            const participantId = parseInt(req.params.id, 10);
            const participant = await db.queryOne(
                `SELECT p.*, 
                        e.name as eventName, e.name_ar as eventNameAr, e.image as eventImage,
                        e.year, e.startDate, e.endDate, e.startTime, e.endTime,
                        e.location, e.numberOfHour, e.status as eventStatus,
                        e.eventActiveStatus, e.eventDescription, e.eventCoordinators,
                        e.eventAdmins, e.activityId as eventActivityIds,
                        e.selectedEmployees,
                        sa.name as activityName, at.name as activityTypeName
                 FROM participates p
                 LEFT JOIN events e ON p.event_id = e.id
                 LEFT JOIN sport_activities sa ON p.activity_id = sa.id
                 LEFT JOIN activity_types at ON sa.activityType = at.id
                 WHERE p.id = ? AND p.deletedAt IS NULL`,
                [participantId]
            );

            if (!participant) {
                return res.status(404).json({ status: false, message: 'Participant not found' });
            }

            // Fetch CIAM data for User, Manager, and Coordinator
            const domainIds = [
                participant.user_id,
                participant.manager_id,
                participant.coordinator_id
            ].filter(Boolean);

            // Also collect IDs from event coordinators/admins/selectedEmployees
            let eventCoordinatorIds = [];
            let eventAdminIds = [];
            let selectedEmployeeIds = [];
            if (participant.eventCoordinators) {
                eventCoordinatorIds = participant.eventCoordinators.split(',').map(s => s.trim()).filter(Boolean);
                domainIds.push(...eventCoordinatorIds);
            }
            if (participant.eventAdmins) {
                eventAdminIds = participant.eventAdmins.split(',').map(s => s.trim()).filter(Boolean);
                domainIds.push(...eventAdminIds);
            }
            if (participant.selectedEmployees) {
                selectedEmployeeIds = participant.selectedEmployees.split(',').map(s => s.trim()).filter(Boolean);
                domainIds.push(...selectedEmployeeIds);
            }

            const userMap = new Map();
            if (domainIds.length > 0) {
                const accessToken = req.headers.authorization?.split(' ')[1];
                const usersResponse = await ciamService.getUserByDomainId([...new Set(domainIds)], accessToken);
                
                if (usersResponse && !usersResponse.isError) {
                    const usersRaw = usersResponse.value?.internalClientUsers || usersResponse.value || [];
                    const users = Array.isArray(usersRaw) ? usersRaw : [];
                    users.forEach(u => {
                        const domainId = String(u.userDomain || u.loginName || '').toLowerCase();
                        if (domainId) userMap.set(domainId, u);
                    });
                }
            }

            const getAge = (birthDate) => {
                if (!birthDate) return null;
                const birth = new Date(birthDate);
                if (isNaN(birth.getTime())) return null;
                const ageDifMs = Date.now() - birth.getTime();
                const ageDate = new Date(ageDifMs);
                return Math.abs(ageDate.getUTCFullYear() - 1970);
            };

            const getUserData = (id) => {
                const u = userMap.get(String(id || '').toLowerCase());
                if (!u) return { id, name: id, email: '-', mobile: '-' };
                return {
                    id: u.userDomain || u.loginName,
                    name: u.nameEn || u.nameAr || '-',
                    email: u.emailAddress || '-',
                    mobile: u.mobile || '-',
                    jobTitle: u.jobTitleEN || u.jobTitleAR || '-',
                    department: u.deptNameEN || u.deptNameAR || '-',
                    image: u.img,
                    dob: u.birthDate || null,
                    age: getAge(u.birthDate),
                    gender: u.sex == '1' ? 'Male' : u.sex == '2' ? 'Female' : null,
                    sector: u.sectorNameEN || u.sectorNameAR || null,
                    sectorAr: u.sectorNameAR || null,
                    departmentAr: u.deptNameAR || null,
                    section: u.sectionNameEn || u.sectionNameAr || null,
                    sectionAr: u.sectionNameAr || null,
                    branch: u.branchNameEN || u.branchNameAR || null,
                    branchAr: u.branchNameAR || null,
                    rank: u.rankEN || u.rankAR || null,
                    rankAr: u.rankAR || null
                };
            };

            // Fetch event activities with their types
            let eventActivities = [];
            if (participant.eventActivityIds) {
                const activityIds = participant.eventActivityIds.split(',').map(s => s.trim()).filter(Boolean);
                if (activityIds.length > 0) {
                    const placeholders = activityIds.map(() => '?').join(',');
                    eventActivities = await db.query(
                        `SELECT sa.id, sa.name, at.name as typeName
                         FROM sport_activities sa
                         LEFT JOIN activity_types at ON sa.activityType = at.id
                         WHERE sa.id IN (${placeholders})`,
                        activityIds
                    );
                }
            }

            // Resolve event coordinators, admins, selected employees from CIAM map
            const resolvePeople = (ids) => {
                return ids.map(id => {
                    const u = userMap.get(String(id || '').toLowerCase());
                    if (!u) return { id, name: id, email: '-', mobile: '-' };
                    return {
                        id: u.userDomain || u.loginName,
                        name: u.nameEn || u.nameAr || id,
                        email: u.emailAddress || '-',
                        mobile: u.mobile || '-',
                        image: u.img
                    };
                });
            };

            const formattedParticipant = {
                id: participant.id,
                status: participant.status,
                currentApprovalLevel: participant.current_approval_level || null,
                workflowStatus: participant.workflow_status || null,
                activityType: participant.activityTypeName,
                createdAt: participant.createdAt,
                user: getUserData(participant.user_id),
                manager: getUserData(participant.manager_id),
                coordinator: getUserData(participant.coordinator_id),
                event: {
                    id: participant.event_id,
                    name: participant.eventName,
                    nameAr: participant.eventNameAr,
                    image: participant.eventImage,
                    year: participant.year,
                    startDate: participant.startDate,
                    endDate: participant.endDate,
                    startTime: participant.startTime,
                    endTime: participant.endTime,
                    location: participant.location,
                    numberOfHour: participant.numberOfHour,
                    status: participant.eventStatus,
                    eventActiveStatus: participant.eventActiveStatus,
                    eventDescription: participant.eventDescription,
                    activities: eventActivities,
                    eventCoordinators: resolvePeople(eventCoordinatorIds),
                    eventAdmins: resolvePeople(eventAdminIds),
                    selectedEmployees: resolvePeople(selectedEmployeeIds)
                },
                sportActivity: {
                    id: participant.activity_id,
                    name: participant.activityName
                }
            };

            return res.json({ status: true, data: formattedParticipant });

        } catch (error) {
            console.error('Error in show participant:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== UPDATE STATUS ====================
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, comment } = req.body; // '0' (Pending), '1' (Approved), '2' (Rejected)

            if (!['0', '1', '2'].includes(String(status))) {
                return res.status(400).json({ status: false, message: 'Invalid status value' });
            }

            const participant = await db.queryOne(
                'SELECT * FROM participates WHERE id = ? AND deletedAt IS NULL',
                [id]
            );

            if (!participant) {
                return res.status(404).json({ status: false, message: 'Participant record not found' });
            }

            const currentUserDomain = req.user?.userDomain;
            const action = status === '1' ? 'approve' : status === '2' ? 'reject' : 'pending';

            if (action === 'reject' && !comment) {
                return res.status(400).json({ status: false, message: 'Rejection reason is required' });
            }

            if (action !== 'pending') {
                // Use workflow engine to process approval/rejection
                const result = await approvalWorkflow.processApproval(
                    parseInt(id),
                    currentUserDomain,
                    action,
                    comment || null
                );

                if (!result.success) {
                    return res.status(400).json({ status: false, message: result.message });
                }

                // ── Send notifications & emails based on workflow result ──
                try {
                    const isApproval = action === 'approve';
                    const isFullyApproved = result.action === 'fully_approved';
                    const employeeDomain = participant.user_id;

                    // Fetch event + activity + schedule
                    const eventDetails = await db.queryOne(
                        `SELECT id, name, name_ar, location, startDate, endDate, startTime, endTime FROM events WHERE id = ? AND deletedAt IS NULL`,
                        [participant.event_id]
                    );
                    const activityDetails = await db.queryOne(
                        `SELECT sa.name, at.name as activityTypeName FROM sport_activities sa LEFT JOIN activity_types at ON sa.activityType = at.id WHERE sa.id = ? AND sa.deletedAt IS NULL`,
                        [participant.activity_id]
                    );
                    const scheduleDetails = await db.queryOne(
                        `SELECT start_time, end_time FROM event_activity_schedules WHERE event_id = ? AND activity_id = ? AND deletedAt IS NULL`,
                        [participant.event_id, participant.activity_id]
                    );

                    // Fetch employee CIAM data once
                    const userRes = await ciamService.getUserByDomainId([employeeDomain], req.headers.authorization);
                    const employeeCiam = userRes && !userRes.isError && userRes.value && userRes.value[0] ? userRes.value[0] : null;

                    if (isApproval) {
                        // ── Approved + next level: notify next approver (system only, no email) ──
                        if (result.nextLevel) {
                            const nextRecord = await db.queryOne(
                                `SELECT id, approval_level, approver_id, approver_name FROM participate_approval_history
                                 WHERE participate_id = ? AND approval_level = ? AND status = 'pending'`,
                                [id, result.nextLevel]
                            );
                            if (nextRecord && nextRecord.approver_id) {
                                await storeNotification({
                                    userId: nextRecord.approver_id,
                                    title_en: 'New Approval Request',
                                    title_ar: 'طلب موافقة جديد',
                                    message_en: 'Employee ' + (employeeCiam?.nameEn || employeeDomain) + ' requests approval for "' + (eventDetails?.name || 'Event') + '".',
                                    message_ar: '\u0627\u0644\u0645\u0648\u0638\u0641 ' + (employeeCiam?.nameAr || employeeCiam?.nameEn || employeeDomain) + ' \u064A\u0637\u0644\u0628 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 "' + (eventDetails?.name_ar || eventDetails?.name || '\u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629') + '".',
                                });
                            }
                        }

                        // ── Fully approved: email to employee with event details,
                        //     system notifications to section manager, department manager, and sports admin ──
                        if (isFullyApproved) {
                            // Employee receives email only (with full event details)
                            if (employeeCiam?.emailAddress) {
                                await sendEmail({
                                    to: employeeCiam.emailAddress,
                                    subject: `GDRFA - Registration Approved: ${eventDetails?.name || 'Event'}`,
                                    template: 'request-status-from-manager.ejs',
                                    data: {
                                        title: 'Registration Fully Approved',
                                        userFullName: employeeCiam.nameEn || employeeDomain,
                                        status: 'Approved',
                                        eventName: eventDetails?.name || 'N/A',
                                        eventLocation: eventDetails?.location || 'N/A',
                                        startDate: eventDetails?.startDate ? moment(eventDetails.startDate).format('DD-MM-YYYY') : 'N/A',
                                        endDate: eventDetails?.endDate ? moment(eventDetails.endDate).format('DD-MM-YYYY') : 'N/A',
                                        startTime: scheduleDetails?.start_time || null,
                                        endTime: scheduleDetails?.end_time || null,
                                        activityName: activityDetails?.name || 'N/A',
                                        activityType: activityDetails?.activityTypeName || 'N/A',
                                        rejectionReason: '',
                                        logoUrl: `${req.protocol}://${req.get('host')}/assets/images/Group.png`,
                                    },
                                });
                            }

                            // System notification to section manager, department manager, and sports admin
                            const historyApprovers = await db.query(
                                `SELECT DISTINCT approver_id, approval_level FROM participate_approval_history
                                 WHERE participate_id = ? AND approver_id IS NOT NULL AND status IN ('approved', 'escalated')`,
                                [id]
                            );
                            const notifyUserIds = (historyApprovers || []).map(h => h.approver_id).filter(Boolean);
                            const uniqueApprovers = [...new Set(notifyUserIds)];

                            if (uniqueApprovers.length > 0) {
                                for (const approverId of uniqueApprovers) {
                                    await storeNotification({
                                        userId: approverId,
                                        title_en: 'Participant Fully Approved',
                                        title_ar: 'تمت الموافقة الكاملة على المشارك',
                                        message_en: `Registration for "${eventDetails?.name || 'Event'}" by ${employeeCiam?.nameEn || employeeDomain} is fully approved.`,
                                        message_ar: `تمت الموافقة الكاملة على تسجيل "${eventDetails?.name_ar || eventDetails?.name || 'الفعالية'}" من قبل ${employeeCiam?.nameAr || employeeCiam?.nameEn || employeeDomain}.`,
                                    });
                                }
                            }

                            // System notification to all admins/super admins
                            const adminRoleId = String(process.env.ADMINROLEID || '').trim();
                            const superAdminRoleId = String(process.env.SUPERADMINROLEID || '').trim();
                            const accessToken = req.user?.token || req.session?.admin?.accessToken || req.headers.authorization?.split(' ')[1];
                            const allAdminIds = [];

                            if (adminRoleId && accessToken) {
                                const adminResp = await ciamService.getUserByRoleId(adminRoleId, accessToken);
                                if (adminResp && !adminResp.isError && adminResp.value) {
                                    adminResp.value.forEach(a => {
                                        const d = (a.userDomain || a.userName || '').toString().trim();
                                        if (d) allAdminIds.push(d);
                                    });
                                }
                            }
                            if (superAdminRoleId && accessToken) {
                                const superResp = await ciamService.getUserByRoleId(superAdminRoleId, accessToken);
                                if (superResp && !superResp.isError && superResp.value) {
                                    superResp.value.forEach(a => {
                                        const d = (a.userDomain || a.userName || '').toString().trim();
                                        if (d && !allAdminIds.includes(d)) allAdminIds.push(d);
                                    });
                                }
                            }

                            const uniqueIds = [...new Set(allAdminIds)];
                            if (uniqueIds.length > 0) {
                                const adminUsersResp = await ciamService.getUserByDomainId(uniqueIds, accessToken);
                                const adminUsers = adminUsersResp && !adminUsersResp.isError && adminUsersResp.value ? adminUsersResp.value : [];
                                for (const admin of adminUsers) {
                                    const adminDomain = (admin.userDomain || admin.userName || '').toString().trim();
                                    if (adminDomain) {
                                        await storeNotification({
                                            userId: adminDomain,
                                            title_en: 'Fully Approved Registration',
                                            title_ar: 'تسجيل تمت الموافقة عليه بالكامل',
                                            message_en: `Registration for "${eventDetails?.name || 'Event'}" by ${employeeCiam?.nameEn || employeeDomain} is fully approved.`,
                                            message_ar: `تمت الموافقة الكاملة على تسجيل "${eventDetails?.name_ar || eventDetails?.name || 'الفعالية'}" من قبل ${employeeCiam?.nameAr || employeeCiam?.nameEn || employeeDomain}.`,
                                        });
                                    }
                                }
                            }
                        }
                    } else {
                        // ── REJECTED: notify employee ──
                        await storeNotification({
                            userId: employeeDomain,
                            title_en: 'Registration Rejected',
                            title_ar: 'تم رفض التسجيل',
                            message_en: comment
                                ? `Your registration for "${eventDetails?.name || 'Event'}" was rejected. Reason: ${comment}`
                                : `Your registration for "${eventDetails?.name || 'Event'}" was rejected.`,
                            message_ar: comment
                                ? '\u062A\u0645 \u0631\u0641\u0636 \u062A\u0633\u062C\u064A\u0644\u0643 \u0641\u064A "' + (eventDetails?.name_ar || eventDetails?.name || '\u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629') + '". \u0627\u0644\u0633\u0628\u0628: ' + comment
                                : '\u062A\u0645 \u0631\u0641\u0636 \u062A\u0633\u062C\u064A\u0644\u0643 \u0641\u064A "' + (eventDetails?.name_ar || eventDetails?.name || '\u0627\u0644\u0641\u0639\u0627\u0644\u064A\u0629') + '".',
                        });

                        if (employeeCiam?.emailAddress) {
                            await sendEmail({
                                to: employeeCiam.emailAddress,
                                subject: `GDRFA - Registration Rejected: ${eventDetails?.name || 'Event'}`,
                                template: 'request-status-from-manager.ejs',
                                data: {
                                    title: 'Registration Rejected',
                                    userFullName: employeeCiam.nameEn || employeeDomain,
                                    status: 'Rejected',
                                    eventName: eventDetails?.name || 'N/A',
                                    eventLocation: eventDetails?.location || 'N/A',
                                    startDate: eventDetails?.startDate ? moment(eventDetails.startDate).format('DD-MM-YYYY') : 'N/A',
                                    endDate: eventDetails?.endDate ? moment(eventDetails.endDate).format('DD-MM-YYYY') : 'N/A',
                                    startTime: scheduleDetails?.start_time || null,
                                    endTime: scheduleDetails?.end_time || null,
                                    activityName: activityDetails?.name || 'N/A',
                                    activityType: activityDetails?.activityTypeName || 'N/A',
                                    rejectionReason: comment || 'Your request was not approved.',
                                    logoUrl: `${req.protocol}://${req.get('host')}/assets/images/Group.png`,
                                },
                            });
                        }
                    }
                } catch (notifErr) {
                    console.warn('[updateStatus] Notification/email error (non-blocking):', notifErr.message);
                }

                return res.json({ 
                    status: true, 
                    message: `Participant ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
                    workflow: result
                });
            } else {
                // Direct status update for pending (non-workflow)
                await db.query(
                    'UPDATE participates SET status = ?, updatedAt = SYSDATETIME() WHERE id = ?',
                    [status, id]
                );

                return res.json({ 
                    status: true, 
                    message: 'Participant status updated to Pending' 
                });
            }

        } catch (error) {
            console.error('Error in updateStatus:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== DELETE PARTICIPANT (soft delete) ====================
    static async delete(req, res) {
        try {
            const { id } = req.params;

            const participant = await db.queryOne(
                'SELECT * FROM participates WHERE id = ? AND deletedAt IS NULL',
                [id]
            );

            if (!participant) {
                return res.status(404).json({ status: false, message: 'Participant record not found' });
            }

            await db.query(
                'UPDATE participates SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?',
                [id]
            );

            return res.json({
                status: true,
                message: 'Participant removed successfully'
            });

        } catch (error) {
            console.error('Error in delete participant:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    static async deleteTeam(req, res) {
        try {
            const { teamId } = req.params;
            const eventId = parseInt(req.query.event_id, 10);

            if (!teamId || !eventId) {
                return res.status(400).json({ status: false, message: 'Team ID and Event ID are required' });
            }

            // Check if any participants exist for this team + event
            const existing = await db.query(
                `SELECT id FROM participates WHERE team_id = ? AND event_id = ? AND deletedAt IS NULL`,
                [teamId, eventId]
            );

            if (!existing || existing.length === 0) {
                return res.status(404).json({ status: false, message: 'No team participants found for this event' });
            }

            await db.query(
                `UPDATE participates SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE team_id = ? AND event_id = ? AND deletedAt IS NULL`,
                [teamId, eventId]
            );

            return res.json({
                status: true,
                message: 'Team removed from event successfully'
            });

        } catch (error) {
            console.error('Error in deleteTeam:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== MANUAL REGISTER ====================
    static async manualRegister(req, res) {
        try {
            const eventId = parseInt(req.params.id, 10);
            const { user_ids, activity_id, coordinator_id } = req.body;
            const currentUserId = req.user.userDomain;

            if (!eventId) {
                return res.status(400).json({ status: false, message: 'Event ID is required' });
            }
            if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
                return res.status(400).json({ status: false, message: 'At least one user ID is required' });
            }

            // Verify event exists
            const event = await db.queryOne(
                `SELECT id, activityId, eventCoordinators FROM events WHERE id = ? AND deletedAt IS NULL`,
                [eventId]
            );
            if (!event) {
                return res.status(404).json({ status: false, message: 'Event not found' });
            }

            // Resolve activity_id: use provided or first from event's activityId
            const resolvedActivityId = activity_id || (event.activityId ? event.activityId.split(',')[0].trim() : null);
            if (!resolvedActivityId) {
                return res.status(400).json({ status: false, message: 'Unable to determine activity for registration' });
            }

            const resolvedCoordinatorId = coordinator_id || event.eventCoordinators || currentUserId;

            const results = { inserted: [], skipped: [] };

            for (const userId of user_ids) {
                // Check for existing registration (including soft-deleted)
                const existing = await db.queryOne(
                    `SELECT id, deletedAt FROM participates WHERE event_id = ? AND user_id = ? AND activity_id = ? AND deletedAt IS NULL`,
                    [eventId, userId, resolvedActivityId]
                );

                if (existing) {
                    results.skipped.push({ user_id: userId, reason: 'Already registered' });
                    continue;
                }

                await db.query(
                    `INSERT INTO participates (event_id, user_id, manager_id, coordinator_id, activity_id, status, activity_type, createdAt, updatedAt)
                     VALUES (?, ?, ?, ?, ?, '1', '1', GETDATE(), GETDATE())`,
                    [eventId, userId, currentUserId, resolvedCoordinatorId, resolvedActivityId]
                );

                results.inserted.push({ user_id: userId });
            }

            return res.json({
                status: true,
                message: `${results.inserted.length} participant(s) registered successfully`,
                data: results
            });

        } catch (error) {
            console.error('Error in manualRegister:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // ==================== MANUAL REGISTER TEAM ====================
    static async manualRegisterTeam(req, res) {
        try {
            const eventId = parseInt(req.params.id, 10);
            const { team_ids } = req.body;
            const currentUserId = req.user.userDomain;

            if (!eventId) {
                return res.status(400).json({ status: false, message: 'Event ID is required' });
            }
            if (!team_ids || !Array.isArray(team_ids) || team_ids.length === 0) {
                return res.status(400).json({ status: false, message: 'At least one team ID is required' });
            }

            // Verify event exists
            const event = await db.queryOne(
                `SELECT id, activityId, eventCoordinators FROM events WHERE id = ? AND deletedAt IS NULL`,
                [eventId]
            );
            if (!event) {
                return res.status(404).json({ status: false, message: 'Event not found' });
            }

            // Resolve activity_id: use first from event's activityId
            const resolvedActivityId = event.activityId ? event.activityId.split(',')[0].trim() : null;
            if (!resolvedActivityId) {
                return res.status(400).json({ status: false, message: 'Unable to determine activity for registration' });
            }

            const resolvedCoordinatorId = event.eventCoordinators || currentUserId;
            const results = { inserted: 0, skipped: [], teamDetails: [] };

            for (const teamId of team_ids) {
                // Verify team exists
                const team = await db.queryOne(
                    `SELECT id, name FROM teams WHERE id = ? AND deletedAt IS NULL`,
                    [teamId]
                );
                if (!team) {
                    results.skipped.push({ team_id: teamId, reason: 'Team not found' });
                    continue;
                }

                // Get all active team members
                const teamPlayers = await db.query(
                    `SELECT player_id, isCaptain FROM team_players WHERE team_id = ? AND deletedAt IS NULL`,
                    [teamId]
                );

                if (teamPlayers.length === 0) {
                    results.skipped.push({ team_id: teamId, reason: 'Team has no members' });
                    continue;
                }

                const teamInserted = [];
                for (const player of teamPlayers) {
                    // Check for existing registration
                    const existing = await db.queryOne(
                        `SELECT id FROM participates WHERE event_id = ? AND user_id = ? AND activity_id = ? AND team_id = ? AND deletedAt IS NULL`,
                        [eventId, player.player_id, resolvedActivityId, teamId]
                    );

                    if (existing) {
                        continue;
                    }

                    await db.query(
                        `INSERT INTO participates (event_id, user_id, manager_id, coordinator_id, activity_id, team_id, status, activity_type, createdAt, updatedAt)
                         VALUES (?, ?, ?, ?, ?, ?, '1', '1', GETDATE(), GETDATE())`,
                        [eventId, player.player_id, currentUserId, resolvedCoordinatorId, resolvedActivityId, teamId]
                    );

                    teamInserted.push(player.player_id);
                    results.inserted++;
                }

                results.teamDetails.push({
                    team_id: teamId,
                    team_name: team.name,
                    members_added: teamInserted.length
                });
            }

            return res.json({
                status: true,
                message: `${results.inserted} team member(s) registered successfully across ${results.teamDetails.length} team(s)`,
                data: results
            });

        } catch (error) {
            console.error('Error in manualRegisterTeam:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }

    // GET /admin/participants/approval-history
    static async getApprovalHistory(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const participateId = req.query.participate_id || null;
            const eventId = req.query.event_id || null;
            const approvalStatus = req.query.status || null;

            let whereClauses = ['1=1'];
            let params = [];

            if (participateId) {
                whereClauses.push('pah.participate_id = ?');
                params.push(participateId);
            }
            if (eventId) {
                whereClauses.push('p.event_id = ?');
                params.push(parseInt(eventId));
            }
            if (approvalStatus) {
                whereClauses.push('pah.status = ?');
                params.push(approvalStatus);
            }

            const whereSQL = whereClauses.join(' AND ');

            const countResult = await db.queryOne(
                `SELECT COUNT(*) as total FROM participate_approval_history pah
                 JOIN participates p ON pah.participate_id = p.id
                 WHERE ${whereSQL}`,
                params
            );
            const total = countResult?.total || 0;

            const rows = await db.query(
                `SELECT pah.id, pah.participate_id, pah.approval_level, pah.approver_id, pah.approver_name,
                        pah.status, pah.assigned_date, pah.action_date, pah.comment,
                        p.event_id, p.activity_id,
                        e.name AS event_name_en, e.name_ar AS event_name_ar
                 FROM participate_approval_history pah
                 JOIN participates p ON pah.participate_id = p.id
                 LEFT JOIN events e ON p.event_id = e.id
                 WHERE ${whereSQL}
                 ORDER BY pah.assigned_date DESC
                 OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
                [...params, offset, parseInt(limit)]
            );

            return res.json({
                status: true,
                message: 'Approval history fetched successfully',
                data: {
                    data: rows || [],
                    total,
                    page,
                    limit
                }
            });

        } catch (error) {
            console.error('Error in getApprovalHistory:', error);
            return res.status(500).json({ status: false, message: error.message });
        }
    }
}

module.exports = ParticipantController;
