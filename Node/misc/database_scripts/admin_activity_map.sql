USE [Sports]
GO

/****** Object:  Table [dbo].[admin_activity_map]    Script Date: 2/3/2026 5:48:58 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[admin_activity_map](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[userDomain] [varchar](255) NOT NULL,
	[assignedActivity] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


