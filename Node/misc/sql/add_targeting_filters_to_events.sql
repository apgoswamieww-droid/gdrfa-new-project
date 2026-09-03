USE [Sports]
GO

-- Add People of Determination column to events table
ALTER TABLE [dbo].[events]
ADD [peopleOfDetermination] [varchar](255) NULL
GO
