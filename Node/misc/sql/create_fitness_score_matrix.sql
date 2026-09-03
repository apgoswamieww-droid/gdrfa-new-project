USE [Sports]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='fitness_score_matrix' AND xtype='U')
CREATE TABLE [dbo].[fitness_score_matrix](
    [id] [bigint] IDENTITY(1,1) NOT NULL,
    [category_id] [bigint] NOT NULL,
    [gender] [nvarchar](20) NOT NULL,
    [age_group_id] [bigint] NOT NULL,
    [score] [int] NOT NULL,
    [min_value] [nvarchar](20) NOT NULL,
    [max_value] [nvarchar](20) NOT NULL,
    [createdAt] [datetime2](7) NOT NULL DEFAULT SYSDATETIME(),
    [updatedAt] [datetime2](7) NOT NULL DEFAULT SYSDATETIME(),
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_fitness_score_matrix_category] ON [dbo].[fitness_score_matrix] ([category_id])
GO
CREATE NONCLUSTERED INDEX [IX_fitness_score_matrix_gender] ON [dbo].[fitness_score_matrix] ([gender])
GO
CREATE NONCLUSTERED INDEX [IX_fitness_score_matrix_age_group] ON [dbo].[fitness_score_matrix] ([age_group_id])
GO
