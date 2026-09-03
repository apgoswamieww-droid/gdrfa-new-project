USE [Sports]
GO

/****** Object:  Table [dbo].[post_tags]    Script Date: 2/3/2026 5:58:16 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[post_tags](
	[postId] [int] NOT NULL,
	[tagId] [int] NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[postId] ASC,
	[tagId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[post_tags] ADD  DEFAULT ('NOW') FOR [createdAt]
GO

ALTER TABLE [dbo].[post_tags] ADD  DEFAULT ('NOW') FOR [updatedAt]
GO


