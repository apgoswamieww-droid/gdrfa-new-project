-- Migration: Add name_ar column to tags table
-- This enables Arabic translations for tags used in Blog and Media modules

-- Check if column already exists before adding
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('tags') AND name = 'name_ar'
)
BEGIN
    ALTER TABLE tags ADD name_ar NVARCHAR(255) NULL;
    PRINT 'Column name_ar added to tags table.';
END
ELSE
BEGIN
    PRINT 'Column name_ar already exists in tags table.';
END
