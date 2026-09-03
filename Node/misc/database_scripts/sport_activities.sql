USE [Sports]
GO

/****** Object:  Table [dbo].[sport_activities]    Script Date: 2/3/2026 5:58:40 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[sport_activities](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](255) NOT NULL,
	[name_ar] [nvarchar](255) NULL,
	[activityType] [int] NOT NULL,
	[image] [varchar](255) NULL,
	[isTeam] [varchar](255) NULL,
	[status] [varchar](255) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deletedAt] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[sport_activities] ADD  DEFAULT ('0') FOR [isTeam]
GO

ALTER TABLE [dbo].[sport_activities] ADD  DEFAULT ('0') FOR [status]
GO


