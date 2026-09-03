USE [Sports]
GO

/****** Object:  Table [dbo].[facility_requests]    Script Date: 2/3/2026 5:53:02 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[facility_requests](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[facility_id] [int] NOT NULL,
	[name] [varchar](255) NOT NULL,
	[email] [varchar](255) NOT NULL,
	[date] [datetime2](7) NOT NULL,
	[description] [nvarchar](max) NULL,
	[status] [varchar](255) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deletedAt] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[facility_requests] ADD  DEFAULT ('0') FOR [status]
GO


