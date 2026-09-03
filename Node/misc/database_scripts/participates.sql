USE [Sports]
GO

/****** Object:  Table [dbo].[participates]    Script Date: 2/3/2026 5:57:33 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[participates](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [varchar](255) NOT NULL,
	[event_id] [int] NOT NULL,
	[manager_id] [varchar](255) NOT NULL,
	[coordinator_id] [varchar](255) NOT NULL,
	[activity_id] [int] NOT NULL,
	[status] [varchar](255) NOT NULL,
	[activity_type] [varchar](255) NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deletedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[participates] ADD  DEFAULT ('0') FOR [status]
GO

ALTER TABLE [dbo].[participates] ADD  DEFAULT ('0') FOR [activity_type]
GO

ALTER TABLE [dbo].[participates] ADD  DEFAULT ('[object Object]') FOR [createdAt]
GO

ALTER TABLE [dbo].[participates] ADD  DEFAULT ('[object Object]') FOR [updatedAt]
GO


