USE [Sports]
GO

/****** Object:  Table [dbo].[social_links]    Script Date: 8/27/2026 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[social_links](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[image] [nvarchar](500) NOT NULL,
	[link] [nvarchar](500) NOT NULL,
	[status] [varchar](255) NOT NULL DEFAULT ('1'),
	[createdAt] [datetime2](7) NOT NULL DEFAULT (SYSDATETIME()),
	[updatedAt] [datetime2](7) NOT NULL DEFAULT (SYSDATETIME()),
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
