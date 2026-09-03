USE [Sports]
GO

/****** Object:  Table [dbo].[event_activity_schedules]    Script Date: 2/3/2026 5:51:19 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[event_activity_schedules](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[event_id] [int] NOT NULL,
	[activity_id] [int] NOT NULL,
	[start_date] [datetime2](7) NOT NULL,
	[end_date] [datetime2](7) NOT NULL,
	[start_time] [varchar](255) NOT NULL,
	[end_time] [varchar](255) NOT NULL,
	[description] [varchar](255) NULL,
	[status] [varchar](255) NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deletedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[event_activity_schedules] ADD  DEFAULT ('0') FOR [status]
GO

ALTER TABLE [dbo].[event_activity_schedules] ADD  DEFAULT ('[object Object]') FOR [createdAt]
GO

ALTER TABLE [dbo].[event_activity_schedules] ADD  DEFAULT ('[object Object]') FOR [updatedAt]
GO


