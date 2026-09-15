-- ============================================================
-- Facility Requests Module - Add name_ar column to facility_requests table
-- ============================================================
-- Stores the requestor's Arabic name captured from CIAM at request
-- creation time (when the employee is logged in). Nullable so legacy
-- rows without an Arabic name keep working.
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'facility_requests' AND COLUMN_NAME = 'name_ar'
)
BEGIN
    ALTER TABLE facility_requests ADD [name_ar] NVARCHAR(255) NULL;
END

PRINT 'Migration completed: Added name_ar column to facility_requests table.';
GO
