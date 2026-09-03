USE [Sports]
GO

/****** Object:  Table [dbo].[home_sliders]    Script Date: 2/3/2026 5:55:27 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[home_sliders](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[media_type] [varchar](255) NOT NULL,
	[media_path] [varchar](255) NOT NULL,
	[title] [nvarchar](255) NOT NULL,
	[title_ar] [nvarchar](255) NOT NULL,
	[short_description] [nvarchar](255) NOT NULL,
	[short_description_ar] [nvarchar](255) NOT NULL,
	[status] [varchar](255) NOT NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deletedAt] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[home_sliders] ADD  DEFAULT ('1') FOR [status]
GO


