-- ============================================================
-- Migration: Add approval workflow columns to participates
-- ============================================================

-- current_approval_level: which level the request is at
-- (null = fully approved or not in workflow)
IF NOT EXISTS (
    SELECT * FROM syscolumns WHERE id=OBJECT_ID('participates') AND name='current_approval_level'
)
ALTER TABLE participates ADD current_approval_level VARCHAR(255) NULL;

-- workflow_status: overall workflow state
-- 'in_progress', 'fully_approved', 'rejected'
IF NOT EXISTS (
    SELECT * FROM syscolumns WHERE id=OBJECT_ID('participates') AND name='workflow_status'
)
ALTER TABLE participates ADD workflow_status VARCHAR(255) NOT NULL DEFAULT 'in_progress';
