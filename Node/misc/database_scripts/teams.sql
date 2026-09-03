USE [Sports]
GO

/****** Object:  Table [dbo].[teams]    Script Date: 2/3/2026 5:59:35 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[teams](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](255) NOT NULL,
	[activity] [varchar](255) NOT NULL,
	[relatedActivity] [varchar](255) NULL,
	[staffMembers] [text] NOT NULL,
	[numberOfMembers] [varchar](255) NOT NULL,
	[image] [varchar](255) NULL,
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

ALTER TABLE [dbo].[teams] ADD  DEFAULT ('0') FOR [status]
GO


