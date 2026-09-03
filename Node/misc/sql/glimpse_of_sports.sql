-- ============================================================
-- Table: glimpse_of_sports
-- Description: Stores gallery images of sports activities
-- Columns:
--   id          - Primary key, auto-increment
--   image       - Relative path of uploaded image (e.g., uploads/glimpseOfSports/1234567890.jpg)
--   description - Short description of the image (max 100 characters)
--   status      - Active status: '1' = Active, '0' = Inactive
--   createdAt   - Record creation timestamp
--   updatedAt   - Record update timestamp
--   deletedAt   - Soft delete timestamp (NULL = not deleted)
-- ============================================================

CREATE TABLE glimpse_of_sports (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    image NVARCHAR(500) NOT NULL,
    description NVARCHAR(100) NULL,
    description_ar NVARCHAR(100) NULL,
    status NVARCHAR(10) NOT NULL DEFAULT '1',
    createdAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    deletedAt DATETIME2 NULL
);
GO
