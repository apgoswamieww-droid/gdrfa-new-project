const db = require('../config/dbDirect');
const ciamService = require('../ciam/ciam.service');

class ApprovalWorkflowService {

  /**
   * Start the multi-level approval workflow for a participant.
   * Called after employee self-registration.
   * Flow: Section Manager → Department Manager → Admin/Super Admin
   */
  async startWorkflow(participateId, employeeDomainId) {
    try {
      // 1. Resolve manager chain from CIAM (now only section + department)
      const chain = await ciamService.getManagerChain(employeeDomainId);
      if (!chain || chain.length === 0) {
        await db.query(
          `UPDATE participates SET status = '1', workflow_status = 'fully_approved', current_approval_level = NULL WHERE id = ?`,
          [participateId]
        );
        return { status: 'auto_approved', reason: 'No manager chain found' };
      }

      // 2. Insert history records for each manager level
      let firstLevel = null;
      for (let i = 0; i < chain.length; i++) {
        const level = chain[i];
        if (i === 0) firstLevel = level.level;

        await db.query(
          `INSERT INTO participate_approval_history (participate_id, approval_level, approver_id, approver_name, status, assigned_date)
           VALUES (?, ?, ?, ?, 'pending', SYSDATETIME())`,
          [participateId, level.level, level.domainId, level.nameEn || level.domainId]
        );
      }

      // 3. Add Admin level (no specific approver — any admin/super admin can approve)
      await db.query(
        `INSERT INTO participate_approval_history (participate_id, approval_level, approver_id, approver_name, status, assigned_date)
         VALUES (?, 'admin', NULL, 'Admin', 'pending', SYSDATETIME())`,
        [participateId]
      );

      // 4. Set current approval level to the first (section) manager
      await db.query(
        `UPDATE participates SET current_approval_level = ?, workflow_status = 'in_progress' WHERE id = ?`,
        [firstLevel || 'section', participateId]
      );

      return { status: 'workflow_started', levels: chain.length + 1 };
    } catch (error) {
      console.error('[ApprovalWorkflow] startWorkflow error:', error.message);
      await db.query(
        `UPDATE participates SET status = '1', workflow_status = 'fully_approved', current_approval_level = NULL WHERE id = ?`,
        [participateId]
      );
      return { status: 'auto_approved_fallback', reason: error.message };
    }
  }

  /**
   * Process an approval or rejection action from a manager or admin.
   * For managers: matches by approver_id.
   * For admin/super admin: matches the 'admin' level (approver_id IS NULL).
   */
  async processApproval(participateId, approverDomainId, action, comment) {
    try {
      // 1. Get current pending history record — match by approver_id first, then admin level
      let currentRecord = await db.queryOne(
        `SELECT id, approval_level, participate_id
         FROM participate_approval_history
         WHERE participate_id = ? AND approver_id = ? AND status = 'pending'
         ORDER BY assigned_date ASC`,
        [participateId, approverDomainId]
      );

      // If no match on approver_id, check if this is an admin/super admin approving the admin level
      if (!currentRecord) {
        currentRecord = await db.queryOne(
          `SELECT id, approval_level, participate_id
           FROM participate_approval_history
           WHERE participate_id = ? AND approval_level = 'admin' AND approver_id IS NULL AND status = 'pending'`,
          [participateId]
        );
      }

      if (!currentRecord) {
        return { success: false, message: 'No pending approval found for this approver' };
      }

      // 2. Update the history record
      await db.query(
        `UPDATE participate_approval_history
         SET status = ?, action_date = SYSDATETIME(), comment = ?, approver_id = COALESCE(approver_id, ?)
         WHERE id = ?`,
        [action === 'approve' ? 'approved' : 'rejected', comment || null, approverDomainId, currentRecord.id]
      );

      if (action === 'reject') {
        // Rejection ends the workflow
        await db.query(
          `UPDATE participates SET status = '2', workflow_status = 'rejected', current_approval_level = NULL WHERE id = ?`,
          [participateId]
        );
        return { success: true, action: 'rejected' };
      }

      // 3. Find the next pending level
      const nextRecord = await db.queryOne(
        `SELECT id, approval_level, approver_id
         FROM participate_approval_history
         WHERE participate_id = ? AND status = 'pending'
         ORDER BY assigned_date ASC`,
        [participateId]
      );

      if (nextRecord) {
        await db.query(
          `UPDATE participates SET current_approval_level = ? WHERE id = ?`,
          [nextRecord.approval_level, participateId]
        );
        return { success: true, action: 'approved', nextLevel: nextRecord.approval_level };
      }

      // 4. No more levels — fully approved
      await db.query(
        `UPDATE participates SET status = '1', workflow_status = 'fully_approved', current_approval_level = NULL WHERE id = ?`,
        [participateId]
      );
      return { success: true, action: 'fully_approved' };

    } catch (error) {
      console.error('[ApprovalWorkflow] processApproval error:', error.message);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new ApprovalWorkflowService();
