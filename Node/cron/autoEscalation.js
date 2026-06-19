const cron = require('node-cron');
const db = require('../config/dbDirect');
const ciamService = require('../ciam/ciam.service');
const { storeNotification } = require('../utils/notificationHelper');

/**
 * Auto-escalation cron job
 * Runs daily at 6:00 AM to escalate pending requests that have been
 * waiting longer than 3 days at the current approval level.
 *
 * Flow: Section Manager (3 days) → Department Manager (3 days) → Sports Admin
 * If no action is taken within 3 days, the request is transferred
 * to the next approval level automatically.
 */
async function processAutoEscalations() {
  console.log('[AutoEscalation] Running batch check for pending approvals older than 3 days...');

  try {
    // Find all pending history records older than 3 days (excluding admin level)
    const pendingRecords = await db.query(
      `SELECT h.id, h.participate_id, h.approval_level, h.approver_id, h.approver_name,
              p.user_id as employee_domain, p.event_id, p.activity_id
       FROM participate_approval_history h
       INNER JOIN participates p ON h.participate_id = p.id AND p.deletedAt IS NULL
       WHERE h.status = 'pending'
         AND h.approval_level != 'admin'
         AND h.assigned_date < DATEADD(DAY, -3, SYSDATETIME())
         AND p.workflow_status = 'in_progress'
         AND p.deletedAt IS NULL`,
      []
    );

    if (!pendingRecords || pendingRecords.length === 0) {
      console.log('[AutoEscalation] No pending records older than 3 days found.');
      return;
    }

    console.log(`[AutoEscalation] Found ${pendingRecords.length} record(s) to escalate.`);

    for (const record of pendingRecords) {
      try {
        // Mark the current level as escalated
        await db.query(
          `UPDATE participate_approval_history
           SET status = 'escalated', action_date = SYSDATETIME()
           WHERE id = ?`,
          [record.id]
        );

        // Find the next pending level
        const nextRecord = await db.queryOne(
          `SELECT id, approval_level, approver_id, approver_name
           FROM participate_approval_history
           WHERE participate_id = ? AND status = 'pending'
           ORDER BY assigned_date ASC`,
          [record.participate_id]
        );

        const eventDetails = await db.queryOne(
          `SELECT id, name, name_ar FROM events WHERE id = ? AND deletedAt IS NULL`,
          [record.event_id]
        );

        const employeeRes = await ciamService.getUserByDomainId([record.employee_domain], null);
        const employeeData = employeeRes && !employeeRes.isError && employeeRes.value && employeeRes.value[0]
          ? employeeRes.value[0] : null;
        const employeeName = employeeData?.nameEn || employeeData?.firstName || record.employee_domain;

        if (nextRecord) {
          // Move to next level
          await db.query(
            `UPDATE participates SET current_approval_level = ? WHERE id = ?`,
            [nextRecord.approval_level, record.participate_id]
          );

          console.log(`[AutoEscalation] Record ${record.id}: escalated from ${record.approval_level} to ${nextRecord.approval_level}`);

          // ── Notify the next approver ──
          if (nextRecord.approver_id) {
            await storeNotification({
              userId: nextRecord.approver_id,
              title_en: 'New Escalated Approval Request',
              title_ar: 'طلب موافقة جديد (تصعيد تلقائي)',
              message_en: `The previous approver did not respond within 3 days. "${employeeName}" request for "${eventDetails?.name || 'Event'}" has been escalated to you.`,
              message_ar: `لم يستجب الموافِق السابق خلال 3 أيام. تم تصعيد طلب "${employeeName}" لفعالية "${eventDetails?.name_ar || eventDetails?.name || 'الفعالية'}" إليك.`,
            });
          } else if (nextRecord.approval_level === 'admin') {
            // No specific approver for admin level - we could notify all admins
            console.log(`[AutoEscalation] Record ${record.id}: escalated to admin level (approver_id is NULL)`);
          }
        } else {
          // No more levels — mark as fully approved
          await db.query(
            `UPDATE participates SET status = '1', workflow_status = 'fully_approved', current_approval_level = NULL WHERE id = ?`,
            [record.participate_id]
          );

          console.log(`[AutoEscalation] Record ${record.id}: escalated to final level — fully approved`);
        }

        // ── Notify the employee about the escalation ──
        await storeNotification({
          userId: record.employee_domain,
          title_en: 'Request Escalated',
          title_ar: 'تم تصعيد الطلب',
          message_en: `Your registration request for "${eventDetails?.name || 'Event'}" was not actioned within 3 days at ${record.approval_level} level and has been escalated to the next level.`,
          message_ar: `لم يتم البت في طلب تسجيلك لفعالية "${eventDetails?.name_ar || eventDetails?.name || 'الفعالية'}" خلال 3 أيام على مستوى ${record.approval_level === 'section' ? 'قسم' : 'إدارة'} وتم تصعيده إلى المستوى التالي.`,
        });

      } catch (err) {
        console.error(`[AutoEscalation] Error processing record ${record.id}:`, err.message);
      }
    }

    console.log('[AutoEscalation] Batch complete.');
  } catch (error) {
    console.error('[AutoEscalation] Error:', error.message);
  }
}

// Schedule: runs daily at 6:00 AM
cron.schedule('0 6 * * *', () => {
  processAutoEscalations();
});

console.log('[AutoEscalation] Cron job scheduled: runs daily at 06:00');

// Also expose for manual trigger
module.exports = { processAutoEscalations };
