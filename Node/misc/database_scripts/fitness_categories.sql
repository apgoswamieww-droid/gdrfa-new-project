USE [Sports]
GO

/****** Object:  Table [dbo].[fitness_categories]    Script Date: 2/3/2026 5:54:26 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[fitness_categories](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](255) NOT NULL,
	[is_time] [varchar](255) NOT NULL,
	[points] [float] NOT NULL,
	[status] [varchar](255) NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deletedAt] [datetime2](7) NULL,
	[unit] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[fitness_categories] ADD  DEFAULT ('0') FOR [is_time]
GO

ALTER TABLE [dbo].[fitness_categories] ADD  DEFAULT ('1') FOR [status]
GO

ALTER TABLE [dbo].[fitness_categories] ADD  DEFAULT (NULL) FOR [unit]
GO


