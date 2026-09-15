-- ============================================================
-- Teams Module - Add name_ar column to teams table
-- ============================================================
-- This script adds an Arabic name column to the teams table.
-- The column is nullable to maintain backward compatibility with
-- existing team records (optional field).
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'teams' AND COLUMN_NAME = 'name_ar'
)
BEGIN
    ALTER TABLE teams ADD [name_ar] NVARCHAR(255) NULL;
END

PRINT 'Migration completed: Added name_ar column to teams table.';
GO