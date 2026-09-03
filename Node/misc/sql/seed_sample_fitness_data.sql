USE [Sports]
GO

-- ============================================================
-- SEED: Sample data for fitness module
-- ============================================================

-- Insert sample age groups
IF NOT EXISTS (SELECT 1 FROM fitness_age_groups)
BEGIN
    INSERT INTO fitness_age_groups (age_from, age_to, group_name, createdAt, updatedAt) VALUES
    (18, 22, N'18-22', SYSDATETIME(), SYSDATETIME()),
    (23, 30, N'23-30', SYSDATETIME(), SYSDATETIME()),
    (31, 35, N'31-35', SYSDATETIME(), SYSDATETIME()),
    (36, 40, N'36-40', SYSDATETIME(), SYSDATETIME()),
    (41, 44, N'41-44', SYSDATETIME(), SYSDATETIME()),
    (45, 49, N'45-49', SYSDATETIME(), SYSDATETIME()),
    (50, 60, N'50-60', SYSDATETIME(), SYSDATETIME());
END
GO

-- Insert sample score matrix entries for Pushups (Male)
DECLARE @pushupsCatId BIGINT = (SELECT id FROM fitness_categories WHERE slug = 'pushups')
DECLARE @situpsCatId BIGINT = (SELECT id FROM fitness_categories WHERE slug = 'situps')
DECLARE @runningCatId BIGINT = (SELECT id FROM fitness_categories WHERE slug = 'running')

IF @pushupsCatId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM fitness_score_matrix WHERE category_id = @pushupsCatId AND gender = 'male')
BEGIN
    INSERT INTO fitness_score_matrix (category_id, gender, age_group_id, score, min_value, max_value, createdAt, updatedAt)
    SELECT @pushupsCatId, 'male', ag.id, 20, '40', '999', SYSDATETIME(), SYSDATETIME() FROM fitness_age_groups ag WHERE ag.group_name = '36-40'
    UNION ALL
    SELECT @pushupsCatId, 'male', ag.id, 19, '38', '39', SYSDATETIME(), SYSDATETIME() FROM fitness_age_groups ag WHERE ag.group_name = '36-40'
    UNION ALL
    SELECT @pushupsCatId, 'male', ag.id, 18, '36', '37', SYSDATETIME(), SYSDATETIME() FROM fitness_age_groups ag WHERE ag.group_name = '36-40';
END
GO
