/**
 * Seed Script: Insert dummy approval history data for ml687 user
 *
 * This script checks if user 'ml687' has a participant record,
 * creates one if needed, and inserts a complete approval workflow
 * history (section manager → department manager → admin → all approved).
 *
 * Usage: cd Node && node scripts/seed-approval-history.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/dbDirect');

const USER_DOMAIN = 'ml687';
const SECTION_MANAGER_ID = 'section.mgr@gdrfa.ae';
const SECTION_MANAGER_NAME = 'Section Manager';
const DEPARTMENT_MANAGER_ID = 'dept.mgr@gdrfa.ae';
const DEPARTMENT_MANAGER_NAME = 'Department Manager';

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Approval History Seed Script for ml687            ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  try {
    // ── Step 1: Test DB connection ──
    console.log('📡 Testing database connection...');
    const connected = await db.testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database. Aborting.');
      process.exit(1);
    }
    console.log('✅ Database connected.\n');

    // ── Step 2: Find an active event ──
    console.log('🔍 Looking for an active event...');
    const events = await db.query(
      `SELECT TOP 3 id, name, startDate, endDate
       FROM events
       WHERE status = '1' AND deletedAt IS NULL
       ORDER BY startDate DESC`
    );

    if (!events || events.length === 0) {
      console.error('❌ No active events found. Cannot create participant record.');
      process.exit(1);
    }

    const targetEvent = events[0];
    console.log(`✅ Found event: ID=${targetEvent.id}, Name="${targetEvent.name}"\n`);

    // ── Step 3: Find an activity for the event ──
    console.log('🔍 Looking for activities for this event...');
    let activityId = null;

    // Try event_activity_schedules first
    const schedule = await db.queryOne(
      `SELECT TOP 1 activity_id FROM event_activity_schedules
       WHERE event_id = ? AND deletedAt IS NULL`,
      [targetEvent.id]
    );

    if (schedule && schedule.activity_id) {
      activityId = schedule.activity_id;
      console.log(`✅ Found activity ID=${activityId} from schedule.`);
    } else {
      // Try sport_activities table
      const activity = await db.queryOne(
        `SELECT TOP 1 id FROM sport_activities WHERE deletedAt IS NULL`
      );
      if (activity) {
        activityId = activity.id;
        console.log(`✅ Using fallback activity ID=${activityId} from sport_activities.`);
      } else {
        console.log('⚠️  No activities found. Will use activity_id = 1.');
        activityId = 1;
      }
    }
    console.log('');

    // ── Step 4: Check/Create participant record ──
    console.log('🔍 Checking if ml687 already has a participant record...');
    let participant = await db.queryOne(
      `SELECT id, user_id, event_id, status, workflow_status, current_approval_level
       FROM participates
       WHERE user_id = ? AND event_id = ? AND deletedAt IS NULL`,
      [USER_DOMAIN, targetEvent.id]
    );

    let participantId;
    if (participant) {
      participantId = participant.id;
      console.log(`✅ Existing participant record found: ID=${participantId}, status=${participant.status}\n`);

      // Reset the participant status for clean workflow data
      console.log('🔄 Resetting participant status to pending...');
      await db.query(
        `UPDATE participates
         SET status = '0', workflow_status = 'in_progress',
             current_approval_level = 'section', updatedAt = SYSDATETIME()
         WHERE id = ?`,
        [participantId]
      );
      console.log('✅ Participant status reset to pending.\n');
    } else {
      console.log('ℹ️  No existing participant record. Creating one...');
      await db.query(
        `INSERT INTO participates (event_id, user_id, manager_id, coordinator_id, activity_id, status, activity_type, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, '0', '1', SYSDATETIME(), SYSDATETIME())`,
        [targetEvent.id, USER_DOMAIN, DEPARTMENT_MANAGER_ID, SECTION_MANAGER_ID, activityId]
      );

      // Get the last inserted participant record for this user + event
      const newPart = await db.queryOne(
        `SELECT TOP 1 id FROM participates
         WHERE user_id = ? AND event_id = ?
         ORDER BY createdAt DESC`,
        [USER_DOMAIN, targetEvent.id]
      );
      participantId = newPart?.id;

      if (!participantId) {
        console.error('❌ Failed to create participant record.');
        process.exit(1);
      }
      console.log(`✅ Created participant record: ID=${participantId}\n`);
    }

    // ── Step 5: Clean existing approval history for this participant ──
    console.log('🧹 Cleaning existing approval history for this participant...');
    await db.query(
      `DELETE FROM participate_approval_history WHERE participate_id = ?`,
      [participantId]
    );
    console.log('✅ Existing approval history cleared.\n');

    // ── Step 6: Insert approval history records ──
    console.log('📝 Inserting approval history records...');

    // Level 1: Section Manager (approved)
    await db.query(
      `INSERT INTO participate_approval_history (participate_id, approval_level, approver_id, approver_name, status, assigned_date, action_date, comment)
       VALUES (?, 'section', ?, ?, 'approved', DATEADD(DAY, -5, SYSDATETIME()), DATEADD(DAY, -4, SYSDATETIME()), 'Approved - Section level okay')`,
      [participantId, SECTION_MANAGER_ID, SECTION_MANAGER_NAME]
    );
    console.log('  ✅ Level 1 (Section Manager) — approved');

    // Level 2: Department Manager (approved)
    await db.query(
      `INSERT INTO participate_approval_history (participate_id, approval_level, approver_id, approver_name, status, assigned_date, action_date, comment)
       VALUES (?, 'department', ?, ?, 'approved', DATEADD(DAY, -4, SYSDATETIME()), DATEADD(DAY, -2, SYSDATETIME()), 'Approved - Department level approved')`,
      [participantId, DEPARTMENT_MANAGER_ID, DEPARTMENT_MANAGER_NAME]
    );
    console.log('  ✅ Level 2 (Department Manager) — approved');

    // Level 3: Admin (pending — waiting for admin/super admin approval)
    await db.query(
      `INSERT INTO participate_approval_history (participate_id, approval_level, approver_id, approver_name, status, assigned_date)
       VALUES (?, 'admin', ?, 'Admin', 'pending', DATEADD(DAY, -2, SYSDATETIME()))`,
      [participantId, USER_DOMAIN]
    );
    console.log('  ✅ Level 3 (Admin) — pending (waiting for admin approval)\n');

    // ── Step 7: Update participant current approval level ──
    console.log('🔄 Updating participant current approval level...');
    await db.query(
      `UPDATE participates
       SET current_approval_level = 'admin', workflow_status = 'in_progress', updatedAt = SYSDATETIME()
       WHERE id = ?`,
      [participantId]
    );
    console.log(`✅ Participant now waiting at 'admin' level.\n`);

    // ── Summary ──
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║   ✅ Seed Complete!                                 ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   User:            ${USER_DOMAIN}`);
    console.log(`   Event:           ${targetEvent.name} (ID: ${targetEvent.id})`);
    console.log(`   Participant ID:  ${participantId}`);
    console.log(`   Activity ID:     ${activityId}`);
    console.log('');
    console.log('📋 Approval History:');
    console.log('   1. Section Manager  — Approved ✅');
    console.log('   2. Department Manager — Approved ✅');
    console.log('   3. Admin (Sports Admin) — Pending ⏳');
    console.log('');
    console.log('👉 Next: An admin can now approve the pending admin-level');
    console.log('   approval from the admin panel.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
