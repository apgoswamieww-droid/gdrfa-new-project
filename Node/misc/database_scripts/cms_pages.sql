USE [Sports]
GO

/****** Object:  Table [dbo].[cms_pages]    Script Date: 2/3/2026 5:49:55 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[cms_pages](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name_en] [nvarchar](255) NOT NULL,
	[slug] [varchar](255) NOT NULL,
	[name_ar] [nvarchar](255) NOT NULL,
	[description_en] [nvarchar](max) NULL,
	[description_ar] [nvarchar](max) NULL,
	[status] [varchar](255) NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deletedAt] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[cms_pages] ADD  DEFAULT ('1') FOR [status]
GO


