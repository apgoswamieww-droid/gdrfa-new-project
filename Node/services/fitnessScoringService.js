const db = require('../config/dbDirect');

class FitnessScoringService {

  /**
   * Convert MM:SS running time to seconds
   */
  convertRunningToSeconds(timeStr) {
    if (!timeStr) return null;
    const str = String(timeStr).trim();
    const parts = str.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      return (minutes * 60) + seconds;
    }
    // Already numeric
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }

  /**
   * Calculate age from DOB string
   */
  calculateAge(dob) {
    if (!dob) return null;
    const birthDate = new Date(String(dob).replace(/\s/g, ''));
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Find the matching age group for a given age
   */
  async findAgeGroup(age) {
    if (age === null || age === undefined) return null;
    return db.queryOne(
      `SELECT id, age_from, age_to, group_name
       FROM fitness_age_groups
       WHERE age_from <= ? AND age_to >= ?
       ORDER BY age_from ASC`,
      [age, age]
    );
  }

  /**
   * Look up the score from the matrix for a given category, gender, age group, and value.
   * For time-based categories (running), value should already be in seconds.
   */
  async lookupScore(categoryId, gender, ageGroupId, value) {
    if (!categoryId || !gender || !ageGroupId || value === null || value === undefined) {
      console.warn(`[lookupScore] Missing params: cat=${categoryId} gen=${gender} ag=${ageGroupId} val=${value}`);
      return 0;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      console.warn(`[lookupScore] NaN value: "${value}"`);
      return 0;
    }

    // Try to find exact match within min_value and max_value ranges
    // min_value and max_value are stored as NVARCHAR to support both numeric and time format
    const sql = `SELECT score
       FROM fitness_score_matrix
       WHERE category_id = ?
         AND LOWER(gender) = LOWER(?)
         AND age_group_id = ?
         AND TRY_CAST(min_value AS FLOAT) IS NOT NULL
         AND TRY_CAST(max_value AS FLOAT) IS NOT NULL
         AND CAST(? AS FLOAT) >= TRY_CAST(min_value AS FLOAT)
         AND CAST(? AS FLOAT) <= TRY_CAST(max_value AS FLOAT)
       ORDER BY score DESC`;
    const params = [categoryId, gender, ageGroupId, numericValue, numericValue];
    console.log(`[lookupScore] SQL: ${sql} | params:`, JSON.stringify(params));
    const record = await db.queryOne(sql, params);
    console.log(`[lookupScore] Result:`, record ? JSON.stringify(record) : 'null');

    if (record) {
      return record.score;
    }

    return 0;
  }

  /**
   * Calculate points for all 3 fitness categories given employee data
   */
  async calculateAllScores(userId, pushups, situps, runningTime, employeeGender, employeeDob) {
    const gender = employeeGender || 'male';
    const age = this.calculateAge(employeeDob);
    const ageGroup = await this.findAgeGroup(age);

    if (!ageGroup) {
      return {
        pushup_points: 0,
        situp_points: 0,
        running_points: 0,
        total_points: 0,
        age,
        age_group_id: null,
        error: 'No matching age group found'
      };
    }

    // Get category IDs by slug
    const categories = await db.query(
      `SELECT id, slug, unit_type FROM fitness_categories WHERE deletedAt IS NULL`
    );

    const catMap = {};
    (categories || []).forEach(c => {
      catMap[c.slug] = { id: c.id, unitType: c.unit_type };
    });

    let pushupPoints = 0;
    let situpPoints = 0;
    let runningPoints = 0;

    // Pushups
    if (catMap.pushups && pushups !== null && pushups !== undefined && pushups !== '') {
      pushupPoints = await this.lookupScore(catMap.pushups.id, gender, ageGroup.id, pushups);
    }

    // Situps
    if (catMap.situps && situps !== null && situps !== undefined && situps !== '') {
      situpPoints = await this.lookupScore(catMap.situps.id, gender, ageGroup.id, situps);
    }

    // Running
    if (catMap.running && runningTime !== null && runningTime !== undefined && runningTime !== '') {
      const runningSeconds = this.convertRunningToSeconds(runningTime);
      if (runningSeconds !== null) {
        runningPoints = await this.lookupScore(catMap.running.id, gender, ageGroup.id, runningSeconds);
      }
    }

    const total = pushupPoints + situpPoints + runningPoints;

    return {
      pushup_points: pushupPoints,
      situp_points: situpPoints,
      running_points: runningPoints,
      total_points: total,
      age,
      age_group_id: ageGroup.id,
      age_group_name: ageGroup.group_name
    };
  }
}

module.exports = new FitnessScoringService();
