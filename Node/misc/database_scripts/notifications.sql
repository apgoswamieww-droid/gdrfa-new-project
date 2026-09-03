USE [Sports]
GO

/****** Object:  Table [dbo].[notifications]    Script Date: 2/3/2026 5:57:06 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[notifications](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[userId] [varchar](255) NOT NULL,
	[title_en] [varchar](255) NOT NULL,
	[title_ar] [nvarchar](255) NULL,
	[message_en] [nvarchar](max) NULL,
	[message_ar] [nvarchar](max) NULL,
	[isRead] [bit] NULL,
	[status] [varchar](255) NOT NULL,
	[createdAt] [datetime2](7) NULL,
	[updatedAt] [datetime2](7) NULL,
	[deletedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[notifications] ADD  DEFAULT ((0)) FOR [isRead]
GO

ALTER TABLE [dbo].[notifications] ADD  DEFAULT ('1') FOR [status]
GO

ALTER TABLE [dbo].[notifications] ADD  DEFAULT ('[object Object]') FOR [createdAt]
GO

ALTER TABLE [dbo].[notifications] ADD  DEFAULT ('[object Object]') FOR [updatedAt]
GO


