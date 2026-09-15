-- ============================================================
-- Activity Types Module - Add name_ar column to activity_types table
-- ============================================================
-- This script adds an Arabic name column to the activity_types table.
-- The column is nullable to maintain backward compatibility with
-- existing activity type records (optional field).
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'activity_types' AND COLUMN_NAME = 'name_ar'
)
BEGIN
    ALTER TABLE activity_types ADD [name_ar] NVARCHAR(255) NULL;
END

PRINT 'Migration completed: Added name_ar column to activity_types table.';
GO