USE [Sports]
GO

-- Add slug column to fitness_categories
IF NOT EXISTS (
    SELECT * FROM syscolumns WHERE id=OBJECT_ID('fitness_categories') AND name='slug'
)
ALTER TABLE [dbo].[fitness_categories] ADD [slug] [nvarchar](50) NULL
GO

-- Add unit_type column ('count' or 'time')
IF NOT EXISTS (
    SELECT * FROM syscolumns WHERE id=OBJECT_ID('fitness_categories') AND name='unit_type'
)
ALTER TABLE [dbo].[fitness_categories] ADD [unit_type] [nvarchar](20) NULL DEFAULT 'count'
GO

-- Update existing rows with slugs based on name
UPDATE [dbo].[fitness_categories] SET [slug] = LOWER(REPLACE(REPLACE(REPLACE([name], ' ', '_'), '''', ''), '-', '_')) WHERE [slug] IS NULL
GO

-- Set unit_type based on is_time flag (existing column)
UPDATE [dbo].[fitness_categories] SET [unit_type] = 'time' WHERE [is_time] = '1'
GO
UPDATE [dbo].[fitness_categories] SET [unit_type] = 'count' WHERE [is_time] = '0' OR [is_time] IS NULL
GO

-- Make slug NOT NULL after populating
ALTER TABLE [dbo].[fitness_categories] ALTER COLUMN [slug] [nvarchar](50) NOT NULL
GO

-- Add unique constraint on slug
IF NOT EXISTS (
    SELECT * FROM sys.indexes WHERE name='UQ_fitness_categories_slug' AND object_id=OBJECT_ID('fitness_categories')
)
ALTER TABLE [dbo].[fitness_categories] ADD CONSTRAINT [UQ_fitness_categories_slug] UNIQUE ([slug])
GO
