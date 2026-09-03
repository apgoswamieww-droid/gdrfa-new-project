USE [Sports]
GO

-- Add registration window columns to events table
-- These define when employees can register for an event, independent of event dates

ALTER TABLE [dbo].[events]
ADD [regStartDate] [datetime2](7) NULL
GO

ALTER TABLE [dbo].[events]
ADD [regEndDate] [datetime2](7) NULL
GO

-- Set default values: regStartDate = event startDate, regEndDate = event endDate for existing records
UPDATE [dbo].[events]
SET [regStartDate] = [startDate],
    [regEndDate] = [endDate]
WHERE [regStartDate] IS NULL
   OR [regEndDate] IS NULL
GO
