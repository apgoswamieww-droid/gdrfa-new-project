-- ============================================================
-- Migration: Add Arabic name column to kpis
-- ============================================================

-- name_ar: Arabic display name for the KPI
-- NOTE: Must be nvarchar (not varchar) to store Arabic characters.
IF NOT EXISTS (
    SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('kpis') AND name = 'name_ar'
)
ALTER TABLE kpis ADD name_ar NVARCHAR(255) NULL;

-- Safety: if the column was previously created as varchar
-- (which stores Arabic as ?????), convert it to nvarchar so Arabic works.
IF EXISTS (
    SELECT 1
    FROM sys.columns c
    JOIN sys.types t ON c.user_type_id = t.user_type_id
    WHERE c.object_id = OBJECT_ID('kpis') AND c.name = 'name_ar' AND t.name = 'varchar'
)
ALTER TABLE kpis ALTER COLUMN name_ar NVARCHAR(255) NULL;