-- Table: user_profile_image
-- Stores profile images for users (landing page users authenticated via CIAM)
CREATE TABLE user_profile_image (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_domain NVARCHAR(255) NOT NULL,
    user_image NVARCHAR(500) NOT NULL,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE(),
    deletedAt DATETIME2 NULL,
    CONSTRAINT UQ_user_profile_image_user_domain UNIQUE (user_domain)
);

-- Index for fast lookup by user_domain
CREATE INDEX IX_user_profile_image_user_domain ON user_profile_image (user_domain);
