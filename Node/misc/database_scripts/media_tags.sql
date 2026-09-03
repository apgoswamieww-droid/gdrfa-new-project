USE [Sports]
GO

/****** Object:  Table [dbo].[media_tags]    Script Date: 2/3/2026 5:56:45 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[media_tags](
	[mediaId] [int] NOT NULL,
	[tagId] [int] NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[media_tags] ADD  DEFAULT ('NOW') FOR [createdAt]
GO

ALTER TABLE [dbo].[media_tags] ADD  DEFAULT ('NOW') FOR [updatedAt]
GO


