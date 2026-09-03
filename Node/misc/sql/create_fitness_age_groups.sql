USE [Sports]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='fitness_age_groups' AND xtype='U')
CREATE TABLE [dbo].[fitness_age_groups](
    [id] [bigint] IDENTITY(1,1) NOT NULL,
    [age_from] [int] NOT NULL,
    [age_to] [int] NOT NULL,
    [group_name] [nvarchar](50) NULL,
    [createdAt] [datetime2](7) NOT NULL DEFAULT SYSDATETIME(),
    [updatedAt] [datetime2](7) NOT NULL DEFAULT SYSDATETIME(),
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO
