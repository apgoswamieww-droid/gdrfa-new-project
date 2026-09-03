USE [Sports]
GO

/****** Object:  Table [dbo].[fitness_category_levels]    Script Date: 2/3/2026 5:55:02 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[fitness_category_levels](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[fitness_category_id] [int] NOT NULL,
	[min] [float] NOT NULL,
	[max] [float] NOT NULL,
	[points] [float] NOT NULL,
	[label] [varchar](255) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deletedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[fitness_category_levels] ADD  DEFAULT ((0)) FOR [min]
GO

ALTER TABLE [dbo].[fitness_category_levels] ADD  DEFAULT ((0)) FOR [max]
GO

ALTER TABLE [dbo].[fitness_category_levels] ADD  DEFAULT ((0)) FOR [points]
GO


