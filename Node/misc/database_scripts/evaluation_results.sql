USE [Sports]
GO

/****** Object:  Table [dbo].[evaluation_results]    Script Date: 2/3/2026 5:50:32 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[evaluation_results](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[evaluation_id] [int] NOT NULL,
	[fitness_category_id] [int] NOT NULL,
	[value] [varchar](255) NULL,
	[result] [varchar](255) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deletedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO


