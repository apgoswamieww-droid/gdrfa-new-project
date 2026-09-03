-- ============================================================
-- Event Activities Module - Add name_ar column to sport_activities table
-- ============================================================
-- This script adds an Arabic name column to the sport_activities table.
-- The column is nullable to maintain backward compatibility with
-- existing activity records (optional field).
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'sport_activities' AND COLUMN_NAME = 'name_ar'
)
BEGIN
    ALTER TABLE sport_activities ADD [name_ar] NVARCHAR(255) NULL;
END

PRINT 'Migration completed: Added name_ar column to sport_activities table.';
GO
