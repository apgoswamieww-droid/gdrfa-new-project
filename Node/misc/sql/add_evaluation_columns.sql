-- ============================================================
-- Fitness Evaluation Module - Add columns to evaluations table
-- ============================================================
-- This script adds columns for the Fitness Evaluation Excel upload
-- feature. All columns are nullable to maintain backward compatibility
-- with existing evaluation records.
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'evaluations' AND COLUMN_NAME = 'rank'
)
BEGIN
    ALTER TABLE evaluations ADD [rank] NVARCHAR(255) NULL;
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'evaluations' AND COLUMN_NAME = 'grp'
)
BEGIN
    ALTER TABLE evaluations ADD [grp] NVARCHAR(255) NULL;
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'evaluations' AND COLUMN_NAME = 'employee_name'
)
BEGIN
    ALTER TABLE evaluations ADD [employee_name] NVARCHAR(500) NULL;
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'evaluations' AND COLUMN_NAME = 'sector'
)
BEGIN
    ALTER TABLE evaluations ADD [sector] NVARCHAR(255) NULL;
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'evaluations' AND COLUMN_NAME = 'fitness_status'
)
BEGIN
    ALTER TABLE evaluations ADD [fitness_status] NVARCHAR(255) NULL;
END

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'evaluations' AND COLUMN_NAME = 'year'
)
BEGIN
    ALTER TABLE evaluations ADD [year] INT NULL;
END

PRINT 'Migration completed: Added rank, grp, employee_name, sector, fitness_status, year columns to evaluations table.';
GO
