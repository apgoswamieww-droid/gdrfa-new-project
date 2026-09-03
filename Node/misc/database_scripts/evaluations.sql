USE [Sports]
GO

/****** Object:  Table [dbo].[evaluations]    Script Date: 2/3/2026 5:50:57 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[evaluations](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[user_id] [varchar](255) NOT NULL,
	[total_points] [varchar](255) NULL,
	[evaluation_points] [varchar](255) NULL,
	[evaluator_id] [varchar](255) NOT NULL,
	[examiner_name] [varchar](255) NULL,
	[comments] [nvarchar](max) NULL,
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

ALTER TABLE [dbo].[evaluations] ADD  DEFAULT ((0)) FOR [total_points]
GO

ALTER TABLE [dbo].[evaluations] ADD  DEFAULT ((0)) FOR [evaluation_points]
GO

ALTER TABLE [dbo].[evaluations] ADD  DEFAULT ('1') FOR [status]
GO
