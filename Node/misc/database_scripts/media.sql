USE [Sports]
GO

/****** Object:  Table [dbo].[media]    Script Date: 2/3/2026 5:56:22 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[media](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[title] [varchar](255) NOT NULL,
	[title_ar] [nvarchar](255) NULL,
	[description] [nvarchar](max) NULL,
	[description_ar] [nvarchar](max) NULL,
	[file] [varchar](255) NOT NULL,
	[fileType] [varchar](255) NOT NULL,
	[status] [varchar](255) NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deletedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[media] ADD  DEFAULT ('1') FOR [status]
GO

ALTER TABLE [dbo].[media] ADD  DEFAULT ('NOW') FOR [createdAt]
GO

ALTER TABLE [dbo].[media] ADD  DEFAULT ('NOW') FOR [updatedAt]
GO


