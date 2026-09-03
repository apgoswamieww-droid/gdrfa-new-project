USE [Sports]
GO

/****** Object:  Table [dbo].[events]    Script Date: 2/3/2026 5:51:59 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[events](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[activityId] [varchar](255) NULL,
	[userId] [varchar](255) NOT NULL,
	[year] [nvarchar](255) NULL,
	[name] [varchar](255) NOT NULL,
	[startDate] [datetime2](7) NOT NULL,
	[endDate] [datetime2](7) NOT NULL,
	[startTime] [varchar](255) NOT NULL,
	[endTime] [varchar](255) NOT NULL,
	[location] [varchar](255) NOT NULL,
	[locactionMap] [varchar](255) NULL,
	[lat] [varchar](255) NULL,
	[lng] [varchar](255) NULL,
	[numberOfHour] [decimal](10, 2) NULL,
	[targetType] [varchar](255) NULL,
	[teamName] [varchar](255) NULL,
	[targetedEmployees] [varchar](255) NULL,
	[selectedEmployees] [varchar](255) NULL,
	[image] [varchar](255) NULL,
	[eventStatus] [varchar](255) NULL,
	[gender] [varchar](255) NULL,
	[ageRange] [varchar](255) NULL,
	[eventDescription] [nvarchar](max) NULL,
	[sector] [varchar](255) NULL,
	[department] [varchar](255) NULL,
	[section] [varchar](255) NULL,
	[branch] [varchar](255) NULL,
	[status] [varchar](255) NULL,
	[createdAt] [datetime2](7) NOT NULL,
	[updatedAt] [datetime2](7) NOT NULL,
	[deletedAt] [datetime2](7) NULL,
	[eventCoordinators] [varchar](255) NULL,
	[eventAdmins] [varchar](255) NULL,
	[eventActiveStatus] [varchar](255) NULL,
	[name_ar] [nvarchar](255) NULL,
	[eventDescription_ar] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[events] ADD  DEFAULT ('0') FOR [eventStatus]
GO

ALTER TABLE [dbo].[events] ADD  DEFAULT ('1') FOR [status]
GO


