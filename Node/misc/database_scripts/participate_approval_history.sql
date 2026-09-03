-- ============================================================
-- Table: participate_approval_history
-- Purpose: Tracks multi-level approval workflow for each
--          participant registration.
-- Each row = one approval level in the chain
-- Order: branch -> section -> department -> admin
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='participate_approval_history' AND xtype='U')
CREATE TABLE participate_approval_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    participate_id INT NOT NULL,
    approval_level VARCHAR(255) NOT NULL,        -- 'branch', 'section', 'department', 'admin'
    approver_id VARCHAR(255) NOT NULL,            -- CIAM domain ID of the manager, or 'automatic'
    approver_name VARCHAR(255) NULL,              -- Display name of the approver
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    assigned_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    action_date DATETIME2 NULL,
    comment TEXT NULL,
    FOREIGN KEY (participate_id) REFERENCES participates(id)
);
