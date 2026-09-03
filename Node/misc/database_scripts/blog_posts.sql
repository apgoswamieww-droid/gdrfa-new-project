USE [Sports]
GO

/****** Object:  Table [dbo].[blog_posts]    Script Date: 2/3/2026 5:49:36 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[blog_posts](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[title] [nvarchar](255) NOT NULL,
	[title_ar] [nvarchar](255) NOT NULL,
	[shortDescription] [nvarchar](255) NOT NULL,
	[shortDescription_ar] [nvarchar](255) NOT NULL,
	[media] [varchar](255) NULL,
	[mediaType] [varchar](255) NULL,
	[content] [nvarchar](max) NULL,
	[content_ar] [nvarchar](max) NULL,
	[status] [varchar](255) NULL,
	[deletedAt] [datetime2](7) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[blog_posts] ADD  DEFAULT ('1') FOR [status]
GO

ALTER TABLE [dbo].[blog_posts] ADD  DEFAULT ('NOW') FOR [createdAt]
GO

ALTER TABLE [dbo].[blog_posts] ADD  DEFAULT ('NOW') FOR [updatedAt]
GO
