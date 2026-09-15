const { getServerBaseUrl } = require('../utils/baseUrl');
const utilsDeleteRecord = require('../utils/deleteRecord');
const utilsChangeStatus = require('../utils/changeStatus');
const Evaluation = require('../models/Evaluation');
const EvaluationResult = require('../models/EvaluationResult');
const { sendEmail } = require('../utils/emailService');
const Facilities = require('../models/Facilities');
const FacilityRequest = require('../models/FacilityRequest');
const TeamPlayer = require('../models/TeamPlayer');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const Team = require('../models/Team');
const Event = require('../models/Event');
const Participant = require('../models/Participate');
const User = require('../models/User');
const { storeNotification } = require('../utils/notificationHelper');
const Participate = require('../models/Participate');
const db = require('../config/dbDirect');
const ciamService = require('../ciam/ciam.service');
const { attemptTokenRefresh } = require('../utils/ciamTokenHelper');
const approvalWorkflow = require('../services/approvalWorkflowService');
const { tr, trTitle, trMessage, statusValue } = require('../utils/translationSheet');
class CommonController {

  static async deleteRecord(req, res) {
    const { id, model } = req.query;

    try {
      if (model === 'Team') {
        // 1. Force delete related TeamPlayer records
        await TeamPlayer.destroy({
          where: { team_id: id },
          force: true   // bypass paranoid (hard delete)
        });

        // 2. Delete the Team itself
        const result = await Team.destroy({
          where: { id },
          force: true   // hard delete
        });

        return res.success({}, 'Team and related TeamPlayer records deleted successfully');
      } else {
        const result = await utilsDeleteRecord(req, model, id);
        if (result.success) {
          return res.success({}, result.message);
        } else {
          return res.error(result.message, 400);
        }
      }
    } catch (error) {
      console.error("Error in deleteRecord:", error);
      return res.error('Error deleting record: ' + error.message, 500);
    }
  }

  // static async deleteRecord(req, res) {
  //   const { id, model } = req.query;
  //   if(model=='Team'){
  //     console.log("Call Team Model");
  //     return false;
  //   }else {
  //     console.log("Not working");
  //     return false;
  //   }
  //   const result = await utilsDeleteRecord(req, model, id);
  //   res.json(result);
  // }

  static async deleteEvaluation(req, res) {
    const { id } = req.query;
    try {
      // First delete related results
      await EvaluationResult.destroy({
        where: { evaluation_id: id }
      });

      // Then delete the evaluation itself
      await Evaluation.destroy({
        where: { id }
      });

      res.success({}, 'Evaluation and related results deleted.');
    } catch (err) {
      console.error(err);
      res.error('Error deleting evaluation.', 500);
    }
  }

  static async changeStatus(req, res) {
    const { id, model, status } = req.query;
    const result = await utilsChangeStatus(req, model, id, 'status', status);
    // Ensure both success and status keys are present for compatibility
    if (result.success) {
      res.success({}, result.message || 'Status updated successfully');
    } else {
      res.error(result.message || 'Failed to update status', 400);
    }
  }

  static async changeEmployeeStatus(req, res) {
    try {
      const { id, model, status } = req.query;

      // Restrict only if deactivation is requested
      if (status == '0') {
        // 1. Check if player exists in team_players
        const player = await TeamPlayer.findOne({ where: { player_id: id } });

        if (player) {
          // 2. Find ALL event participations for this player
          const participants = await Participant.findAll({
            where: { user_id: player.player_id }
          });

          if (participants && participants.length > 0) {
            // Look for any record that is NOT status 2
            const activeParticipant = participants.find(p => p.status != 2);

            if (activeParticipant) {
              const event = await Event.findOne({ where: { id: activeParticipant.event_id } });
              if (event) {
                const now = new Date();

                // Condition 1: Event already started
                if (event.startDate <= now) {
                  return res.error(
                    `You cannot deactivate the ${player.is_captain == '1' ? "captain" : "member"} because the event has already started.`,
                    400
                  );
                }

                // Condition 2: Team already participated
                return res.error(
                  `You cannot deactivate the ${player.is_captain == '1' ? "captain" : "member"} because the team has already participated.`,
                  400
                );
              }
            }
          }
        }
      }

      // ✅ Proceed with status change if no restrictions triggered
      const result = await utilsChangeStatus(req, model, id, 'status', status);
      if (result.success) {
        res.success({}, result.message || 'Status updated successfully');
      } else {
        res.error(result.message || 'Failed to update status', 400);
      }

    } catch (error) {
      res.error(error.message || 'Internal server error', 500);
    }
  }


  static async changeEventStatus(req, res) {
    try {
      const { id, model, status } = req.query;
      const normalizedStatus = String(status || '').trim();
      const isApprovalRequest = model === 'Event' && normalizedStatus === '1';

      const extractCiamUsers = (response) => {
        if (Array.isArray(response?.value?.internalClientUsers)) {
          return response.value.internalClientUsers;
        }

        if (Array.isArray(response?.internalClientUsers)) {
          return response.internalClientUsers;
        }

        if (Array.isArray(response?.value?.users)) {
          return response.value.users;
        }

        if (Array.isArray(response?.value?.items)) {
          return response.value.items;
        }

        if (Array.isArray(response?.value)) {
          return response.value;
        }

        if (Array.isArray(response)) {
          return response;
        }

        return [];
      };

      const normalizeBirthDate = (birthDate) => {
        if (!birthDate) return null;

        const sanitizedValue = String(birthDate).trim().replace(/\s+/g, '');
        const directParse = new Date(sanitizedValue);
        if (!Number.isNaN(directParse.getTime())) {
          return directParse;
        }

        const datePart = sanitizedValue.split('T')[0];
        const fallbackParse = new Date(datePart);
        if (!Number.isNaN(fallbackParse.getTime())) {
          return fallbackParse;
        }

        return null;
      };

      const getNormalizedUserDomain = (user) => {
        const candidates = [
          user?.userDomain,
          user?.loginName,
          user?.domainId,
          user?.userId,
          user?.id
        ];

        for (const candidate of candidates) {
          const normalizedCandidate = String(candidate || '').trim();
          if (normalizedCandidate) {
            return normalizedCandidate;
          }
        }

        return '';
      };

      const isActiveUser = (user) => {
        const activeValue = user?.active ?? user?.status ?? user?.isActive ?? 1;
        const normalizedValue = String(activeValue).trim().toLowerCase();

        return activeValue === true || ['1', 'true', 'active', 'yes'].includes(normalizedValue);
      };

      const getAgeFromUser = (user) => {
        const explicitAge = Number(user?.age);
        if (Number.isFinite(explicitAge)) {
          return explicitAge;
        }

        const parsedBirthDate = normalizeBirthDate(user?.birthDate || user?.dob || user?.dateOfBirth);
        if (!parsedBirthDate || Number.isNaN(parsedBirthDate.getTime())) return null;

        const today = new Date();
        let age = today.getFullYear() - parsedBirthDate.getFullYear();
        const monthDiff = today.getMonth() - parsedBirthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedBirthDate.getDate())) {
          age -= 1;
        }

        return age;
      };

      const getEligibleNotificationRecipientIds = (users) => users
        .filter(isActiveUser)
        .filter((user) => {
          if (!Number.isFinite(minAge) && !Number.isFinite(maxAge)) {
            return true;
          }

          const computedAge = getAgeFromUser(user);
          if (!Number.isFinite(computedAge)) {
            return false;
          }

          if (Number.isFinite(minAge) && computedAge < minAge) {
            return false;
          }

          if (Number.isFinite(maxAge) && computedAge > maxAge) {
            return false;
          }

          return true;
        })
        .map(getNormalizedUserDomain)
        .filter(Boolean);

      let eventRecord = null;
      let shouldStoreNotifications = false;
      let minAge = null;
      let maxAge = null;
      let notificationRecipientIds = [];

      if (isApprovalRequest) {
        eventRecord = await db.queryOne(
          `SELECT id, name, name_ar, eventStatus, ageRange, targetType, targetedEmployees, selectedEmployees, teamName, startDate, endDate, location
           FROM events
           WHERE id = ? AND deletedAt IS NULL`,
          [id]
        );

        if (!eventRecord) {
          return res.status(404).json({
            success: false,
            message: req.t ? req.t('Record not found') : 'Record not found'
          });
        }

        const targetType = eventRecord.targetType || 'ragular';
        const targetedEmployees = eventRecord.targetedEmployees || 'all';
        const selectedEmployees = eventRecord.selectedEmployees || '';
        const teamIds = eventRecord.teamName || '';

        console.log('=== NOTIFICATION DEBUG ===');
        console.log('targetType:', targetType);
        console.log('targetedEmployees:', targetedEmployees);
        console.log('selectedEmployees:', selectedEmployees);
        console.log('teamIds:', teamIds);

        let notificationUserDomains = [];

        if (targetType === 'competitive' && teamIds) {
          const teams = String(teamIds).split(',').map(t => t.trim()).filter(Boolean);
          const teamMembers = await db.query(
            `SELECT DISTINCT player_id FROM team_players WHERE team_id IN (${teams.map(() => '?').join(',')}) AND deletedAt IS NULL`,
            teams
          );
          notificationUserDomains = teamMembers.map(tm => tm.player_id).filter(Boolean);
        } else if (targetType === 'ragular' && targetedEmployees === 'selected' && selectedEmployees) {
          notificationUserDomains = String(selectedEmployees).split(',').map(x => x.trim()).filter(Boolean);
        } else if (targetType === 'ragular' && targetedEmployees === 'all') {
          const accessToken2 = req.session?.admin?.accessToken || null;
          if (accessToken2) {
            try {
              const allUsersResponse = await ciamService.getUserByRoleId(String(process.env.USERROLEID || '').trim(), accessToken2);
              if (allUsersResponse?.isError || allUsersResponse == null) {
                console.warn('[changeEventStatus] CIAM getUserByRoleId failed — skipping user fetch for notifications');
              } else {
                const allUsers = extractCiamUsers(allUsersResponse);
                notificationUserDomains = allUsers.map(getNormalizedUserDomain).filter(Boolean);
              }
            } catch (err) {
              console.error('Error fetching all users:', err.message);
            }
          }
        }

        console.log('notificationUserDomains:', notificationUserDomains.length);

        // For "selected" and "competitive" - use userDomains directly (no CIAM call needed)
        // For "all" - apply age filter via CIAM
        if (targetedEmployees === 'selected' || targetType === 'competitive') {
          notificationRecipientIds = notificationUserDomains;
        } else if (targetedEmployees === 'all' && notificationUserDomains.length > 0) {
          const normalizedAgeRange = String(eventRecord.ageRange || '').trim().toLowerCase();
          if (normalizedAgeRange) {
            const rangeMatch = normalizedAgeRange.match(/^(\d+)\s*-\s*(\d+)$/);
            if (rangeMatch) {
              minAge = Number(rangeMatch[1]);
              maxAge = Number(rangeMatch[2]);
            }
          }

          const accessToken = req.session?.admin?.accessToken || null;
          if (accessToken) {
            try {
              const usersResult = await ciamService.getUserByDomainId(notificationUserDomains);
              if (usersResult?.isError || usersResult == null) {
                console.warn('[changeEventStatus] CIAM getUserByDomainId failed — skipping age filter for notifications');
                notificationRecipientIds = notificationUserDomains;
              } else if (usersResult && !usersResult.isError && usersResult.value) {
                let eligibleUsers = usersResult.value;

                if (Number.isFinite(minAge) || Number.isFinite(maxAge)) {
                  eligibleUsers = eligibleUsers.filter(user => {
                    const computedAge = getAgeFromUser(user);
                    if (!Number.isFinite(computedAge)) return false;
                    if (Number.isFinite(minAge) && computedAge < minAge) return false;
                    if (Number.isFinite(maxAge) && computedAge > maxAge) return false;
                    return true;
                  });
                }

                notificationRecipientIds = eligibleUsers
                  .map(getNormalizedUserDomain)
                  .filter(Boolean);
              }
            } catch (err) {
              console.error('Error fetching users for notification:', err.message);
            }
          }
        }

        console.log('notificationRecipientIds:', notificationRecipientIds.length);

        if (notificationRecipientIds.length > 0) {
          shouldStoreNotifications = true;
        }
      }

      const result = await utilsChangeStatus(req, model, id, 'eventStatus', status);

      console.log('shouldStoreNotifications:', shouldStoreNotifications, 'notificationRecipientIds:', notificationRecipientIds.length);

      if (!result || !result.success || !shouldStoreNotifications) {
        if (result.success) {
          return res.success({}, result.message || 'Event status updated successfully');
        } else {
          return res.error(result.message || 'Failed to update event status', 400);
        }
      }

      const eventNameEn = String(eventRecord?.name || 'Sports event').trim();
      const eventNameAr = String(eventRecord?.name_ar || eventNameEn || 'Sports event').trim();
      const eventStartDate = eventRecord?.startDate ? moment(eventRecord.startDate).format('DD MMM YYYY') : 'TBD';
      const eventEndDate = eventRecord?.endDate ? moment(eventRecord.endDate).format('DD MMM YYYY') : 'TBD';
      const eventLocation = String(eventRecord?.location || 'TBD').trim();
      const frontendBaseUrl = String(
        process.env.FRONTEND_URL ||
        process.env.WEBSITE_URL ||
        process.env.APP_FRONTEND_URL ||
        process.env.APP_URL ||
        ''
      ).replace(/\/+$/, '');
      const eventDetailsPath = `/event-notification/${eventRecord?.id}`;
      const eventDetailsUrl = frontendBaseUrl ? `${frontendBaseUrl}${eventDetailsPath}` : eventDetailsPath;
      const eventToken = `[#event:${eventRecord?.id}]`;

      const titleEn = trTitle('D1', 'en', { Event: eventNameEn });
      const titleAr = trTitle('D2', 'ar', { event: eventNameAr });
      const messageEn = [
        trMessage('D1', 'en', { Event: eventNameEn }),
        trMessage('D2', 'en', { startDate: eventStartDate }),
        trMessage('D3', 'en', { endDate: eventEndDate }),
        trMessage('D4', 'en', { Location: eventLocation }),
        trMessage('D5', 'en', { url: eventDetailsUrl }),
        eventToken
      ].join('\n');
      const messageAr = [
        trMessage('D1', 'ar'),
        trMessage('D2', 'ar', { startDate: eventStartDate }),
        trMessage('D3', 'ar', { endDate: eventEndDate }),
        trMessage('D4', 'ar'),
        trMessage('D5', 'ar', { url: eventDetailsUrl }),
        eventToken
      ].join('\n');

      if (notificationRecipientIds.length) {
        const chunkSize = 50;

        for (let index = 0; index < notificationRecipientIds.length; index += chunkSize) {
          const recipientChunk = notificationRecipientIds.slice(index, index + chunkSize);

          await Promise.all(recipientChunk.map((recipientId) => storeNotification({
            userId: recipientId,
            title_en: titleEn,
            title_ar: titleAr,
            message_en: messageEn,
            message_ar: messageAr
          })));
        }
      }

      return res.success({}, result.message || 'Event status updated successfully');
    } catch (error) {
      console.error('Error in changeEventStatus:', error);
      return res.error('Error changing event status: ' + error.message, 500);
    }
  }

  static async changeParticipantStatus(req, res) {
    try {
      const { id, model, status } = req.query;
      const currentUserDomain = req.user?.userDomain || req.session?.user?.userDomain;

      // Resolve the participant record
      const participantData = await Participate.findOne({
        where: { id },
        include: [{
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'name_ar', 'location', 'startDate', 'endDate', 'user_id']
        }]
      });

      if (!participantData) {
        return res.status(404).json({ success: false, message: 'Participant not found' });
      }

      // ── ADMIN OVERRIDE: Reject already-approved participant ──
      if (status === '2' && participantData.status === '1') {
        // Update participant status directly
        await db.query(
          `UPDATE participates SET status = '2', workflow_status = 'rejected_by_admin', current_approval_level = NULL, updatedAt = GETDATE() WHERE id = ?`,
          [id]
        );

        // Log to approval history
        await db.query(
          `INSERT INTO participate_approval_history (participate_id, approval_level, approver_id, approver_name, status, action_date, comment)
           VALUES (?, 'admin_override', ?, ?, 'approved', SYSDATETIME(), ?)`,
          [id, currentUserDomain, currentUserDomain, 'Post-approval rejection by admin']
        );

        // Fetch CIAM data for email
        let userCiam = null;
        try {
          const userRes = await ciamService.getUserByDomainId([participantData.user_id], req.headers.authorization);
          if (userRes && !userRes.isError && userRes.value && userRes.value[0]) {
            userCiam = userRes.value[0];
          }
        } catch (e) {
          console.warn('[changeParticipantStatus] CIAM fetch for email failed:', e.message);
        }

        // Store in-app notification
        await storeNotification({
          userId: participantData.user_id,
          title_en: trTitle('D6', 'en'),
          title_ar: trTitle('D6', 'ar'),
          message_en: trMessage('D6', 'en'),
          message_ar: trMessage('D6', 'ar')
        });

        // Send email
        try {
          const scheduleData = await db.queryOne(
            `SELECT start_time, end_time FROM event_activity_schedules WHERE event_id = ? AND activity_id = ? AND deletedAt IS NULL`,
            [participantData.event_id, participantData.activity_id]
          );

          const activityData = await db.queryOne(
            `SELECT sa.name, sa.name_ar, at.name as activityTypeName, at.name_ar as activityTypeNameAr
             FROM sport_activities sa
             LEFT JOIN activity_types at ON sa.activityType = at.id
             WHERE sa.id = ? AND sa.deletedAt IS NULL`,
            [participantData.activity_id]
          );

          await sendEmail({
            to: userCiam?.emailAddress || participantData.user_id,
            subject: tr('A1'),
            template: 'request-status-from-manager.ejs',
            data: {
              title: tr('B1'),
              userFullName: userCiam?.nameAr || userCiam?.nameEn || participantData.user_id,
              status: 'Cancelled',
              eventName: participantData.event?.name_ar || participantData.event?.name || tr('C2-13'),
              eventLocation: participantData.event?.location || tr('C2-13'),
              startDate: moment(participantData.event?.startDate).format('DD-MM-YYYY'),
              endDate: moment(participantData.event?.endDate).format('DD-MM-YYYY'),
              startTime: scheduleData ? scheduleData.start_time : null,
              endTime: scheduleData ? scheduleData.end_time : null,
              activityName: activityData?.name_ar || activityData?.name || tr('C2-13'),
              activityType: activityData?.activityTypeNameAr || activityData?.activityTypeName || tr('C2-13'),
              rejectionReason: tr('C1-4'),
              logoUrl: `${getServerBaseUrl()}/assets/images/Group.png`
            }
          });
        } catch (emailErr) {
          console.warn('[changeParticipantStatus] Email failed (non-blocking):', emailErr.message);
        }

        return res.success({}, 'Participant registration cancelled successfully');
      }

      // ── ADMIN RE-APPROVE: Approve a previously admin-rejected participant ──
      if (status === '1' && participantData.status === '2' && participantData.workflow_status === 'rejected_by_admin') {
        await db.query(
          `UPDATE participates SET status = '1', workflow_status = 'fully_approved', updatedAt = GETDATE() WHERE id = ?`,
          [id]
        );

        await db.query(
          `INSERT INTO participate_approval_history (participate_id, approval_level, approver_id, approver_name, status, action_date, comment)
           VALUES (?, 'admin_override', ?, ?, 'approved', SYSDATETIME(), ?)`,
          [id, currentUserDomain, currentUserDomain, 'Re-approved by admin']
        );

        try {
          const userRes = await ciamService.getUserByDomainId([participantData.user_id], req.headers.authorization);
          const userCiam = userRes && !userRes.isError && userRes.value && userRes.value[0] ? userRes.value[0] : null;

          await storeNotification({
            userId: participantData.user_id,
            title_en: trTitle('D7', 'en'),
            title_ar: trTitle('D7', 'ar'),
            message_en: trMessage('D7', 'en'),
            message_ar: trMessage('D7', 'ar')
          });

          const scheduleData = await db.queryOne(
            `SELECT start_time, end_time FROM event_activity_schedules WHERE event_id = ? AND activity_id = ? AND deletedAt IS NULL`,
            [participantData.event_id, participantData.activity_id]
          );
          const activityData = await db.queryOne(
            `SELECT sa.name, sa.name_ar, at.name as activityTypeName, at.name_ar as activityTypeNameAr
             FROM sport_activities sa
             LEFT JOIN activity_types at ON sa.activityType = at.id
             WHERE sa.id = ? AND sa.deletedAt IS NULL`,
            [participantData.activity_id]
          );

          const userCiamEmail = userCiam?.emailAddress || participantData.user_id;
          await sendEmail({
            to: userCiamEmail,
            subject: tr('A2'),
            template: 'request-status-from-manager.ejs',
            data: {
              title: tr('B2'),
              userFullName: userCiam?.nameAr || userCiam?.nameEn || participantData.user_id,
              status: 'Approved',
              eventName: participantData.event?.name_ar || participantData.event?.name || tr('C2-13'),
              eventLocation: participantData.event?.location || tr('C2-13'),
              startDate: moment(participantData.event?.startDate).format('DD-MM-YYYY'),
              endDate: moment(participantData.event?.endDate).format('DD-MM-YYYY'),
              startTime: scheduleData ? scheduleData.start_time : null,
              endTime: scheduleData ? scheduleData.end_time : null,
              activityName: activityData?.name_ar || activityData?.name || tr('C2-13'),
              activityType: activityData?.activityTypeNameAr || activityData?.activityTypeName || tr('C2-13'),
              rejectionReason: tr('C1-5'),
              logoUrl: `${getServerBaseUrl()}/assets/images/Group.png`
            }
          });
        } catch (e) {
          console.warn('[changeParticipantStatus] Non-blocking error during re-approve notification:', e.message);
        }

        return res.success({}, 'Participant re-approved successfully');
      }

      // ── NORMAL WORKFLOW ──
      const isApproval = status === '1';
      const action = isApproval ? 'approve' : 'reject';
      const actionLabel = isApproval ? 'approved' : 'rejected';
      const result = await approvalWorkflow.processApproval(id, currentUserDomain, action);

      if (!result.success) {
        return res.error(result.message || `${actionLabel} failed`, 400);
      }

      const isFullyApproved = result.action === 'fully_approved';

      // ── Fetch event + activity + schedule details for emails ──
      let eventDetails = null;
      let activityDetails = null;
      let scheduleDetails = null;
      try {
        eventDetails = await db.queryOne(
          `SELECT id, name, name_ar, location, startDate, endDate, startTime, endTime FROM events WHERE id = ? AND deletedAt IS NULL`,
          [participantData.event_id]
        );
        activityDetails = await db.queryOne(
          `SELECT sa.name, sa.name_ar, at.name as activityTypeName, at.name_ar as activityTypeNameAr FROM sport_activities sa LEFT JOIN activity_types at ON sa.activityType = at.id WHERE sa.id = ? AND sa.deletedAt IS NULL`,
          [participantData.activity_id]
        );
        scheduleDetails = await db.queryOne(
          `SELECT start_time, end_time FROM event_activity_schedules WHERE event_id = ? AND activity_id = ? AND deletedAt IS NULL`,
          [participantData.event_id, participantData.activity_id]
        );
      } catch (e) {
        console.warn('[changeParticipantStatus] Failed to fetch details for email:', e.message);
      }

      const employeeDomain = participantData.user_id;

      if (isApproval) {
        // ── APPROVED — Send notification to employee ──
        try {
          const userRes = await ciamService.getUserByDomainId([employeeDomain], req.headers.authorization);
          const userCiam = userRes && !userRes.isError && userRes.value && userRes.value[0] ? userRes.value[0] : null;

          await storeNotification({
            userId: employeeDomain,
            title_en: isFullyApproved ? trTitle('D8', 'en') : trTitle('D9', 'en'),
            title_ar: isFullyApproved ? trTitle('D8', 'ar') : trTitle('D9', 'ar'),
            message_en: isFullyApproved
              ? trMessage('D8', 'en', { Event: eventDetails?.name || 'Event' })
              : trMessage('D9', 'en', { Event: eventDetails?.name || 'Event' }),
            message_ar: isFullyApproved
              ? trMessage('D8', 'ar')
              : trMessage('D9', 'ar', { event: eventDetails?.name_ar || eventDetails?.name || 'الفعالية' }),
          });

          if (userCiam?.emailAddress) {
            await sendEmail({
              to: userCiam.emailAddress,
              subject: tr(isFullyApproved ? 'A3' : 'A4'),
              template: 'request-status-from-manager.ejs',
              data: {
                title: tr(isFullyApproved ? 'B3' : 'B4'),
                userFullName: userCiam?.nameAr || userCiam?.nameEn || employeeDomain,
                status: isFullyApproved ? 'Approved' : 'Approved & Advanced',
                eventName: eventDetails?.name_ar || eventDetails?.name || tr('C2-13'),
                eventLocation: eventDetails?.location || tr('C2-13'),
                startDate: eventDetails?.startDate ? moment(eventDetails.startDate).format('DD-MM-YYYY') : tr('C2-13'),
                endDate: eventDetails?.endDate ? moment(eventDetails.endDate).format('DD-MM-YYYY') : tr('C2-13'),
                startTime: scheduleDetails?.start_time || null,
                endTime: scheduleDetails?.end_time || null,
                activityName: activityDetails?.name_ar || activityDetails?.name || tr('C2-13'),
                activityType: activityDetails?.activityTypeNameAr || activityDetails?.activityTypeName || tr('C2-13'),
                rejectionReason: isFullyApproved ? '' : tr('C1-6'),
                logoUrl: `${getServerBaseUrl()}/assets/images/Group.png`,
              },
            });
          }
        } catch (notifErr) {
          console.warn('[changeParticipantStatus] Employee notification failed:', notifErr.message);
        }

        // ── Approved with next level — notify the next approver ──
        if (result.nextLevel) {
          try {
            const nextRecord = await db.queryOne(
              `SELECT id, approval_level, approver_id, approver_name FROM participate_approval_history
               WHERE participate_id = ? AND approval_level = ? AND status = 'pending'`,
              [id, result.nextLevel]
            );
            if (nextRecord && nextRecord.approver_id) {
              const approverRes = await ciamService.getUserByDomainId([nextRecord.approver_id], req.headers.authorization);
              const approverData = approverRes && !approverRes.isError && approverRes.value && approverRes.value[0] ? approverRes.value[0] : null;

              if (approverData) {
                await storeNotification({
                  userId: nextRecord.approver_id,
                  title_en: trTitle('D10', 'en'),
                  title_ar: trTitle('D10', 'ar'),
                  message_en: trMessage('D10', 'en', { Name: userCiam?.nameEn || employeeDomain, Event: eventDetails?.name || 'Event' }),
                  message_ar: trMessage('D10', 'ar', { name: userCiam?.nameAr || userCiam?.nameEn || employeeDomain, event: eventDetails?.name_ar || eventDetails?.name || 'الفعالية' }),
                });

                if (approverData.emailAddress) {
                  await sendEmail({
                    to: approverData.emailAddress,
                    subject: tr('A5'),
                    template: 'employee-participant-to-manager.ejs',
                    data: {
                      title: tr('B5'),
                      managerData: { name: approverData.nameAr || approverData.nameEn || nextRecord.approver_id },
                      userData: { name: userCiam?.nameAr || userCiam?.nameEn || employeeDomain, email: userCiam?.emailAddress || '', phone: userCiam?.mobile || '' },
                      eventData: { ...eventDetails, name: eventDetails?.name_ar || eventDetails?.name } || { name: tr('C2-13') },
                      logoUrl: `${getServerBaseUrl()}/assets/images/Group.png`,
                    },
                  });
                }
              }
            }
          } catch (nextErr) {
            console.warn('[changeParticipantStatus] Next approver notification failed:', nextErr.message);
          }
        }

        // ── Fully approved — notify admin/super admin ──
        if (isFullyApproved) {
          try {
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
                    title_en: trTitle('D11', 'en'),
                    title_ar: trTitle('D11', 'ar'),
                    message_en: trMessage('D11', 'en', { Event: eventDetails?.name || 'Event', Name: userCiam?.nameEn || employeeDomain }),
                    message_ar: trMessage('D11', 'ar', { event: eventDetails?.name_ar || eventDetails?.name || 'الفعالية', name: userCiam?.nameAr || userCiam?.nameEn || employeeDomain }),
                  });
                }
              }
            }
          } catch (adminNotifErr) {
            console.warn('[changeParticipantStatus] Admin notification failed:', adminNotifErr.message);
          }
        }

        res.success({}, isFullyApproved ? 'Participant fully approved' : `Approval advanced to ${result.nextLevel} level`);
      } else {
        // ── REJECTED — Notify employee with rejection details ──
        try {
          const userRes = await ciamService.getUserByDomainId([employeeDomain], req.headers.authorization);
          const userCiam = userRes && !userRes.isError && userRes.value && userRes.value[0] ? userRes.value[0] : null;

          const rejectComment = req.query.comment || null;

          await storeNotification({
            userId: employeeDomain,
            title_en: trTitle('D13', 'en'),
            title_ar: trTitle('D13', 'ar'),
            message_en: rejectComment
              ? trMessage('D14', 'en', { Event: eventDetails?.name || 'Event', Reason: rejectComment })
              : trMessage('D13', 'en', { Event: eventDetails?.name || 'Event' }),
            message_ar: rejectComment
              ? trMessage('D14', 'ar', { event: eventDetails?.name_ar || eventDetails?.name || 'الفعالية', reason: rejectComment })
              : trMessage('D13', 'ar', { event: eventDetails?.name_ar || eventDetails?.name || 'الفعالية' }),
          });

          if (userCiam?.emailAddress) {
            await sendEmail({
              to: userCiam.emailAddress,
              subject: tr('A6'),
              template: 'request-status-from-manager.ejs',
              data: {
                title: tr('B6'),
                userFullName: userCiam?.nameAr || userCiam?.nameEn || employeeDomain,
                status: 'Rejected',
                eventName: eventDetails?.name_ar || eventDetails?.name || tr('C2-13'),
                eventLocation: eventDetails?.location || tr('C2-13'),
                startDate: eventDetails?.startDate ? moment(eventDetails.startDate).format('DD-MM-YYYY') : tr('C2-13'),
                endDate: eventDetails?.endDate ? moment(eventDetails.endDate).format('DD-MM-YYYY') : tr('C2-13'),
                startTime: scheduleDetails?.start_time || null,
                endTime: scheduleDetails?.end_time || null,
                activityName: activityDetails?.name_ar || activityDetails?.name || tr('C2-13'),
                activityType: activityDetails?.activityTypeNameAr || activityDetails?.activityTypeName || tr('C2-13'),
                rejectionReason: rejectComment || tr('C1-7'),
                logoUrl: `${getServerBaseUrl()}/assets/images/Group.png`,
              },
            });
          }
        } catch (notifErr) {
          console.warn('[changeParticipantStatus] Rejection notification failed:', notifErr.message);
        }

        res.success({}, 'Participant rejected');
      }
    } catch (error) {
      console.error('Error in changeParticipantStatus:', error);
      res.error('Error updating participant status: ' + error.message, 500);
    }
  }

  static async changeFacilityRequestStatus(req, res) {
    try {
      const { id, model, status } = req.query;

      const facilityData = await FacilityRequest.findByPk(id);
      if (!facilityData) {
        return res.status(404).json({ success: false, message: 'Facility request not found' });
      }

      const facility = await db.queryOne(
        `SELECT title, title_ar FROM facilities WHERE id = ? AND deletedAt IS NULL`,
        [facilityData.facility_id]
      );
      const facilityName = facility ? (facility.title_ar || facility.title) : tr('C2-13');

      // Update status first
      const result = await utilsChangeStatus(req, model, id, 'status', status);
      
      // If status change failed, return immediately
      if (!result || !result.success) {
        console.error('Status change failed:', result);
        return res.status(400).json({ success: false, message: 'Failed to update status' });
      }

      const email = facilityData.email;
      const name = facilityData.name_ar || facilityData.name;
      const dbDate = facilityData.date;
      const approvedDate = dbDate ? moment.utc(dbDate).format('DD-MM-YYYY hh:mm A') : moment().format('DD-MM-YYYY hh:mm A');
      let facilityStatus = status;
      if (facilityStatus === '1') {
        facilityStatus = statusValue('G1');
      } else if (facilityStatus === '2') {
        facilityStatus = statusValue('G3');
      } else {
        facilityStatus = statusValue('G2');
      }

      // Store in-app notification (commented: user_id was storing email instead of actual user ID)
      // try {
      //   await storeNotification({
      //     userId: facilityData.email,
      //     title_en: 'Facility Request Status Changed',
      //     title_ar: 'تغيير حالة طلب المنشأة',
      //     message_en: `Your facility request for "${facilityName}" has been ${facilityStatus.toLowerCase()}.`,
      //     message_ar: `تم ${statusAr} طلب المنشأة "${facilityName}".`
      //   });
      // } catch (notifErr) {
      //   console.warn('Notification store failed (non-blocking):', notifErr.message);
      // }

      // Send email (non-blocking, but log errors)
      try {
        await sendEmail({
          to: email,
          subject: tr('A7'),
          template: 'facility-template.ejs',
          data: {
            title: tr('B7'),
            name,
            facilityName,
            facilityStatus,
            approvedDate,
            logoUrl: `${getServerBaseUrl()}/assets/images/Group.png`
          }
        });
      } catch (emailErr) {
        console.warn('Email sending failed (non-blocking):', emailErr.message);
      }

      return res.success({}, `Facility request ${facilityStatus.toLowerCase()} successfully`);

    } catch (error) {
      console.error('Error in changeFacilityRequestStatus:', error);
      return res.error('Error updating facility request status: ' + error.message, 500);
    }
  }

  static async changeLanguage(req, res) {
    try {
      let { lng } = req.query;
      // Normalize language code
      if (lng && lng.startsWith('en')) {
        lng = 'en';
      } else if (lng === 'ar') {
        lng = 'ar';
      } else {
        lng = 'en'; // Default to English for unknown codes
      }

      // Save language to session
      req.session.lng = lng;

      // Determine where to redirect
      const redirectUrl = req.headers.referer || '/admin';

      // Save session and redirect
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
        }
        res.redirect(redirectUrl);
      });
    } catch (error) {
      console.error('Language change error:', error);
      res.redirect('/admin');
    }
  }
}

module.exports = CommonController;

