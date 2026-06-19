const cron = require('node-cron');
const db = require('../config/dbDirect');
const approvalWorkflow = require('../services/approvalWorkflowService');

/**
 * Auto-approval cron job
 * Runs daily at midnight to auto-approve pending requests
 * that have been waiting longer than 3 days.
 *
 * Levels excluded from auto-approval: 'admin' (Sports Admin must manually approve)
 */
async function processAutoApprovals() {
  console.log('[AutoApproval] Running batch check for pending approvals older than 3 days...');

  try {
    // Find all pending history records older than 3 days (excluding admin level)
    const pendingRecords = await db.query(
      `SELECT h.id, h.participate_id, h.approval_level, h.approver_id, p.user_id
       FROM participate_approval_history h
       INNER JOIN participates p ON h.participate_id = p.id AND p.deletedAt IS NULL
       WHERE h.status = 'pending'
         AND h.approval_level != 'admin'
         AND h.assigned_date < DATEADD(DAY, -3, SYSDATETIME())
         AND p.deletedAt IS NULL`,
      []
    );

    if (!pendingRecords || pendingRecords.length === 0) {
      console.log('[AutoApproval] No pending records older than 3 days found.');
      return;
    }

    console.log(`[AutoApproval] Found ${pendingRecords.length} record(s) to auto-approve.`);

    for (const record of pendingRecords) {
      try {
        // Mark current history record as escalated
        await db.query(
          `UPDATE participate_approval_history
           SET status = 'escalated', action_date = SYSDATETIME()
           WHERE id = ?`,
          [record.id]
        );

        // Find next level
        const nextRecord = await db.queryOne(
          `SELECT id, approval_level
           FROM participate_approval_history
           WHERE participate_id = ? AND status = 'pending'
           ORDER BY assigned_date ASC`,
          [record.participate_id]
        );

        if (nextRecord) {
          // Move to next level
          await db.query(
            `UPDATE participates SET current_approval_level = ? WHERE id = ?`,
            [nextRecord.approval_level, record.participate_id]
          );
          console.log(`[AutoApproval] Record ${record.id}: auto-approved at ${record.approval_level}, moved to ${nextRecord.approval_level}`);
        } else {
          // No more levels — fully approved
          await db.query(
            `UPDATE participates SET status = '1', workflow_status = 'fully_approved', current_approval_level = NULL WHERE id = ?`,
            [record.participate_id]
          );
          console.log(`[AutoApproval] Record ${record.id}: fully auto-approved (all levels complete)`);
        }
      } catch (err) {
        console.error(`[AutoApproval] Error processing record ${record.id}:`, err.message);
      }
    }

    console.log('[AutoApproval] Batch complete.');
  } catch (error) {
    console.error('[AutoApproval] Error:', error.message);
  }
}

// Schedule: run daily at midnight (00:00)
// cron format: minute hour day-of-month month day-of-week
cron.schedule('0 0 * * *', () => {
  processAutoApprovals();
});

console.log('[AutoApproval] Cron job scheduled: runs daily at midnight');

// Also expose for manual trigger
module.exports = { processAutoApprovals };
