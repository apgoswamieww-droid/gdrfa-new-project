const db = require('../../config/dbDirect');

class FitnessCategoryController {

  // ======================================================================
  // FITNESS CATEGORIES CRUD
  // ======================================================================

  static async list(req, res) {
    try {
      const start = parseInt(req.query.start) || 0;
      const length = parseInt(req.query.length) || 10;
      const search = req.query.search || '';

      let whereClause = 'WHERE deletedAt IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (name LIKE ? OR unit LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const countResult = await db.queryOne(
        `SELECT COUNT(*) as total FROM fitness_categories ${whereClause}`,
        params
      );
      const total = countResult ? countResult.total : 0;

      const data = await db.query(
        `SELECT * FROM fitness_categories ${whereClause}
         ORDER BY createdAt DESC
         OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
        [...params, start, length]
      );

      return res.json({
        status: true,
        message: 'Fitness Categories retrieved successfully',
        data: { data, total }
      });
    } catch (error) {
      console.error('Error in list Fitness Categories:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async show(req, res) {
    try {
      const { id } = req.params;
      const category = await db.queryOne(
        `SELECT * FROM fitness_categories WHERE id = ? AND deletedAt IS NULL`,
        [id]
      );

      if (!category) {
        return res.status(404).json({ status: false, message: 'Fitness Category not found' });
      }

      return res.json({
        status: true,
        message: 'Fitness Category retrieved successfully',
        data: category
      });
    } catch (error) {
      console.error('Error in show Fitness Category:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async store(req, res) {
    try {
      const { name, slug, unit_type } = req.body;

      if (!name || !slug || !unit_type) {
        return res.status(400).json({ status: false, message: 'Name, Slug and Unit Type are required' });
      }

      const validUnitTypes = ['count', 'time'];
      if (!validUnitTypes.includes(unit_type)) {
        return res.status(400).json({ status: false, message: 'Unit Type must be "count" or "time"' });
      }

      const existing = await db.queryOne(
        `SELECT id FROM fitness_categories WHERE LOWER(RTRIM(name)) = LOWER(RTRIM(?)) AND deletedAt IS NULL`,
        [name.trim()]
      );

      if (existing) {
        return res.status(409).json({ status: false, message: 'Fitness Category already exists' });
      }

      const slugExists = await db.queryOne(
        `SELECT id FROM fitness_categories WHERE slug = ? AND deletedAt IS NULL`,
        [slug.trim().toLowerCase()]
      );

      if (slugExists) {
        return res.status(409).json({ status: false, message: 'Slug already exists' });
      }

      await db.query(
        `INSERT INTO fitness_categories (name, slug, unit_type, is_time, points, status, unit, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 0, '1', NULL, SYSDATETIME(), SYSDATETIME())`,
        [name.trim(), slug.trim().toLowerCase(), unit_type, unit_type === 'time' ? 1 : 0]
      );

      return res.json({ status: true, message: 'Fitness Category created successfully' });
    } catch (error) {
      console.error('Error in store Fitness Category:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, slug, unit_type, status } = req.body;

      const category = await db.queryOne('SELECT * FROM fitness_categories WHERE id = ? AND deletedAt IS NULL', [id]);
      if (!category) {
        return res.status(404).json({ status: false, message: 'Fitness Category not found' });
      }

      if (name) {
        const duplicate = await db.queryOne(
          `SELECT id FROM fitness_categories WHERE LOWER(RTRIM(name)) = LOWER(RTRIM(?)) AND id != ? AND deletedAt IS NULL`,
          [name.trim(), id]
        );
        if (duplicate) {
          return res.status(409).json({ status: false, message: 'Fitness Category with this name already exists' });
        }
      }

      if (slug) {
        const slugExists = await db.queryOne(
          `SELECT id FROM fitness_categories WHERE slug = ? AND id != ? AND deletedAt IS NULL`,
          [slug.trim().toLowerCase(), id]
        );
        if (slugExists) {
          return res.status(409).json({ status: false, message: 'Slug already exists' });
        }
      }

      if (unit_type && !['count', 'time'].includes(unit_type)) {
        return res.status(400).json({ status: false, message: 'Unit Type must be "count" or "time"' });
      }

      await db.query(
        `UPDATE fitness_categories SET
          name = COALESCE(?, name),
          slug = COALESCE(?, slug),
          unit_type = COALESCE(?, unit_type),
          status = COALESCE(?, status),
          updatedAt = SYSDATETIME()
         WHERE id = ?`,
        [name ? name.trim() : null, slug ? slug.trim().toLowerCase() : null, unit_type || null, status || null, id]
      );

      return res.json({ status: true, message: 'Fitness Category updated successfully' });
    } catch (error) {
      console.error('Error in update Fitness Category:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      const category = await db.queryOne('SELECT * FROM fitness_categories WHERE id = ? AND deletedAt IS NULL', [id]);

      if (!category) {
        return res.status(404).json({ status: false, message: 'Fitness Category not found' });
      }

      await db.query('UPDATE fitness_categories SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?', [id]);

      // Also clean up score matrix entries
      await db.query('DELETE FROM fitness_score_matrix WHERE category_id = ?', [id]);

      return res.json({ status: true, message: 'Fitness Category deleted successfully' });
    } catch (error) {
      console.error('Error in delete Fitness Category:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await db.query('UPDATE fitness_categories SET status = ?, updatedAt = SYSDATETIME() WHERE id = ?', [status, id]);
      return res.json({ status: true, message: 'Status updated successfully' });
    } catch (error) {
      console.error('Error in toggleStatus:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ======================================================================
  // AGE GROUPS CRUD
  // ======================================================================

  static async listAgeGroups(req, res) {
    try {
      const { search } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (group_name LIKE ?)';
        params.push(`%${search}%`);
      }

      const data = await db.query(
        `SELECT * FROM fitness_age_groups ${whereClause} ORDER BY age_from ASC`,
        params
      );

      return res.json({ status: true, data: data || [] });
    } catch (error) {
      console.error('Error listing age groups:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async showAgeGroup(req, res) {
    try {
      const { id } = req.params;
      const group = await db.queryOne('SELECT * FROM fitness_age_groups WHERE id = ?', [id]);
      if (!group) {
        return res.status(404).json({ status: false, message: 'Age Group not found' });
      }
      return res.json({ status: true, data: group });
    } catch (error) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async storeAgeGroup(req, res) {
    try {
      const { age_from, age_to, group_name } = req.body;

      if (age_from === undefined || age_to === undefined) {
        return res.status(400).json({ status: false, message: 'Age From and Age To are required' });
      }

      if (parseInt(age_from) > parseInt(age_to)) {
        return res.status(400).json({ status: false, message: 'Age From cannot be greater than Age To' });
      }

      // Check for overlapping ranges
      const overlap = await db.queryOne(
        `SELECT id FROM fitness_age_groups
         WHERE (age_from <= ? AND age_to >= ?)
            OR (age_from <= ? AND age_to >= ?)
            OR (age_from >= ? AND age_to <= ?)`,
        [parseInt(age_to), parseInt(age_from), parseInt(age_from), parseInt(age_to), parseInt(age_from), parseInt(age_to)]
      );

      if (overlap) {
        return res.status(409).json({ status: false, message: 'Age group range overlaps with an existing group' });
      }

      await db.query(
        `INSERT INTO fitness_age_groups (age_from, age_to, group_name, createdAt, updatedAt)
         VALUES (?, ?, ?, SYSDATETIME(), SYSDATETIME())`,
        [parseInt(age_from), parseInt(age_to), group_name || `${age_from}-${age_to}`]
      );

      return res.json({ status: true, message: 'Age Group created successfully' });
    } catch (error) {
      console.error('Error storing age group:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async updateAgeGroup(req, res) {
    try {
      const { id } = req.params;
      const { age_from, age_to, group_name } = req.body;

      const group = await db.queryOne('SELECT * FROM fitness_age_groups WHERE id = ?', [id]);
      if (!group) {
        return res.status(404).json({ status: false, message: 'Age Group not found' });
      }

      const finalAgeFrom = age_from !== undefined ? parseInt(age_from) : group.age_from;
      const finalAgeTo = age_to !== undefined ? parseInt(age_to) : group.age_to;

      if (finalAgeFrom > finalAgeTo) {
        return res.status(400).json({ status: false, message: 'Age From cannot be greater than Age To' });
      }

      // Check overlap excluding self
      const overlap = await db.queryOne(
        `SELECT id FROM fitness_age_groups WHERE id != ? AND
         ((age_from <= ? AND age_to >= ?)
            OR (age_from <= ? AND age_to >= ?)
            OR (age_from >= ? AND age_to <= ?))`,
        [id, finalAgeTo, finalAgeFrom, finalAgeFrom, finalAgeTo, finalAgeFrom, finalAgeTo]
      );

      if (overlap) {
        return res.status(409).json({ status: false, message: 'Age group range overlaps with an existing group' });
      }

      await db.query(
        `UPDATE fitness_age_groups SET age_from = ?, age_to = ?, group_name = ?, updatedAt = SYSDATETIME() WHERE id = ?`,
        [finalAgeFrom, finalAgeTo, group_name || `${finalAgeFrom}-${finalAgeTo}`, id]
      );

      return res.json({ status: true, message: 'Age Group updated successfully' });
    } catch (error) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async deleteAgeGroup(req, res) {
    try {
      const { id } = req.params;

      // Check if matrix entries reference this age group
      const refCount = await db.queryOne(
        `SELECT COUNT(*) as cnt FROM fitness_score_matrix WHERE age_group_id = ?`,
        [id]
      );

      if (refCount && refCount.cnt > 0) {
        return res.status(409).json({
          status: false,
          message: `Cannot delete age group: ${refCount.cnt} score matrix entries reference it. Delete those first.`
        });
      }

      await db.query('DELETE FROM fitness_age_groups WHERE id = ?', [id]);
      return res.json({ status: true, message: 'Age Group deleted successfully' });
    } catch (error) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ======================================================================
  // SCORE MATRIX CRUD
  // ======================================================================

  static async listScoreMatrix(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 1000;
      const offset = (page - 1) * limit;
      const { category_id, gender, age_group_id, score, search } = req.query;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (search) {
        whereClause += ' AND (fc.name LIKE ? OR fag.group_name LIKE ? OR fsm.gender LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (category_id) {
        whereClause += ' AND fsm.category_id = ?';
        params.push(parseInt(category_id));
      }
      if (gender) {
        whereClause += ' AND LOWER(fsm.gender) = LOWER(?)';
        params.push(gender);
      }
      if (age_group_id) {
        whereClause += ' AND fsm.age_group_id = ?';
        params.push(parseInt(age_group_id));
      }
      if (score) {
        whereClause += ' AND fsm.score = ?';
        params.push(parseInt(score));
      }

      const countResult = await db.queryOne(
        `SELECT COUNT(*) as total FROM fitness_score_matrix fsm ${whereClause}`,
        params
      );
      const total = countResult ? countResult.total : 0;

      const rows = await db.query(
        `SELECT fsm.*, fc.name AS category_name, fc.slug AS category_slug, fc.unit_type,
                fag.group_name AS age_group_name, fag.age_from, fag.age_to
         FROM fitness_score_matrix fsm
         LEFT JOIN fitness_categories fc ON fsm.category_id = fc.id
         LEFT JOIN fitness_age_groups fag ON fsm.age_group_id = fag.id
         ${whereClause}
         ORDER BY fc.name ASC, fsm.gender ASC, fag.age_from ASC, fsm.score DESC
         OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
        [...params, offset, limit]
      );

      return res.json({
        status: true,
        data: { data: rows || [], total, page, limit }
      });
    } catch (error) {
      console.error('Error listing score matrix:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async storeScoreMatrix(req, res) {
    try {
      const { category_id, gender, age_group_id, score, min_value, max_value } = req.body;

      if (!category_id || !gender || !age_group_id || score === undefined || !min_value || !max_value) {
        return res.status(400).json({ status: false, message: 'All fields are required: category_id, gender, age_group_id, score, min_value, max_value' });
      }

      const validGenders = ['male', 'female'];
      if (!validGenders.includes(gender.toLowerCase())) {
        return res.status(400).json({ status: false, message: 'Gender must be "male" or "female"' });
      }

      // Verify category exists and get unit_type
      const cat = await db.queryOne('SELECT id, unit_type FROM fitness_categories WHERE id = ? AND deletedAt IS NULL', [parseInt(category_id)]);
      if (!cat) {
        return res.status(404).json({ status: false, message: 'Fitness Category not found' });
      }

      // Verify age group exists
      const ag = await db.queryOne('SELECT id FROM fitness_age_groups WHERE id = ?', [parseInt(age_group_id)]);
      if (!ag) {
        return res.status(404).json({ status: false, message: 'Age Group not found' });
      }

      // Convert MM:SS to seconds for time-based categories
      let finalMin = String(min_value);
      let finalMax = String(max_value);
      if (cat.unit_type === 'time') {
        if (String(min_value).includes(':')) {
          const parts = String(min_value).split(':');
          finalMin = String((parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0));
        }
        if (String(max_value).includes(':')) {
          const parts = String(max_value).split(':');
          finalMax = String((parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0));
        }
      }

      // Check for duplicate range (use TRY_CAST to handle non-numeric legacy data)
      // Overlap condition: new_min <= existing_max AND new_max >= existing_min
      const duplicate = await db.queryOne(
        `SELECT id FROM fitness_score_matrix
         WHERE category_id = ? AND LOWER(gender) = LOWER(?) AND age_group_id = ?
           AND (
             (TRY_CAST(min_value AS FLOAT) IS NOT NULL AND TRY_CAST(max_value AS FLOAT) IS NOT NULL
              AND CAST(? AS FLOAT) <= TRY_CAST(max_value AS FLOAT)
              AND CAST(? AS FLOAT) >= TRY_CAST(min_value AS FLOAT))
             OR
             (TRY_CAST(min_value AS FLOAT) IS NULL AND TRY_CAST(max_value AS FLOAT) IS NULL
              AND ? <= max_value
              AND ? >= min_value)
           )`,
        [parseInt(category_id), gender, parseInt(age_group_id),
         parseFloat(finalMin), parseFloat(finalMax),
         String(finalMin), String(finalMax)]
      );

      if (duplicate) {
        return res.status(409).json({ status: false, message: 'Score range overlaps with an existing entry for this category, gender and age group' });
      }

      await db.query(
        `INSERT INTO fitness_score_matrix (category_id, gender, age_group_id, score, min_value, max_value, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, SYSDATETIME(), SYSDATETIME())`,
        [parseInt(category_id), gender.toLowerCase(), parseInt(age_group_id), parseInt(score), finalMin, finalMax]
      );

      return res.json({ status: true, message: 'Score matrix entry created successfully' });
    } catch (error) {
      console.error('Error storing score matrix:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async updateScoreMatrix(req, res) {
    try {
      const { id } = req.params;
      const { category_id, gender, age_group_id, score, min_value, max_value } = req.body;

      const existing = await db.queryOne('SELECT fsm.*, fc.unit_type FROM fitness_score_matrix fsm LEFT JOIN fitness_categories fc ON fsm.category_id = fc.id WHERE fsm.id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ status: false, message: 'Score matrix entry not found' });
      }

      const finalCategoryId = category_id !== undefined ? parseInt(category_id) : existing.category_id;
      const finalGender = gender || existing.gender;
      const finalAgeGroupId = age_group_id !== undefined ? parseInt(age_group_id) : existing.age_group_id;
      const finalScore = score !== undefined ? parseInt(score) : existing.score;
      let finalMin = min_value !== undefined ? String(min_value) : existing.min_value;
      let finalMax = max_value !== undefined ? String(max_value) : existing.max_value;

      if (gender && !['male', 'female'].includes(gender.toLowerCase())) {
        return res.status(400).json({ status: false, message: 'Gender must be "male" or "female"' });
      }

      // Convert MM:SS to seconds for time-based categories
      const unitType = existing.unit_type;
      if (unitType === 'time') {
        if (finalMin.includes(':')) {
          const parts = finalMin.split(':');
          finalMin = String((parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0));
        }
        if (finalMax.includes(':')) {
          const parts = finalMax.split(':');
          finalMax = String((parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0));
        }
      }

      await db.query(
        `UPDATE fitness_score_matrix SET
          category_id = ?, gender = ?, age_group_id = ?, score = ?,
          min_value = ?, max_value = ?, updatedAt = SYSDATETIME()
         WHERE id = ?`,
        [finalCategoryId, finalGender.toLowerCase(), finalAgeGroupId, finalScore, finalMin, finalMax, id]
      );

      return res.json({ status: true, message: 'Score matrix entry updated successfully' });
    } catch (error) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  static async deleteScoreMatrix(req, res) {
    try {
      const { id } = req.params;
      const existing = await db.queryOne('SELECT * FROM fitness_score_matrix WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ status: false, message: 'Score matrix entry not found' });
      }
      await db.query('DELETE FROM fitness_score_matrix WHERE id = ?', [id]);
      return res.json({ status: true, message: 'Score matrix entry deleted successfully' });
    } catch (error) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ======================================================================
  // BULK IMPORT SCORE MATRIX
  // ======================================================================

  static async bulkImportScoreMatrix(req, res) {
    try {
      const { entries } = req.body;

      if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ status: false, message: 'entries array is required' });
      }

      let imported = 0;
      let errors = [];

      for (let i = 0; i < entries.length; i++) {
        const row = entries[i];
        try {
          // Resolve category by slug or name
          let catId = row.category_id;
          if (!catId && row.category_slug) {
            const cat = await db.queryOne('SELECT id FROM fitness_categories WHERE slug = ? AND deletedAt IS NULL', [row.category_slug]);
            if (cat) catId = cat.id;
          }
          if (!catId && row.category_name) {
            const cat = await db.queryOne('SELECT id FROM fitness_categories WHERE LOWER(RTRIM(name)) = LOWER(RTRIM(?)) AND deletedAt IS NULL', [row.category_name.trim()]);
            if (cat) catId = cat.id;
          }

          // Resolve age group
          let agId = row.age_group_id;
          if (!agId && row.age_from !== undefined && row.age_to !== undefined) {
            const ag = await db.queryOne('SELECT id FROM fitness_age_groups WHERE age_from = ? AND age_to = ?', [parseInt(row.age_from), parseInt(row.age_to)]);
            if (ag) agId = ag.id;
          }

          if (!catId || !agId || !row.gender || row.score === undefined || !row.min_value || !row.max_value) {
            const missing = [];
            if (!catId) missing.push('category_id');
            if (!agId) missing.push('age_group_id');
            if (!row.gender) missing.push('gender');
            if (row.score === undefined) missing.push('score');
            if (!row.min_value) missing.push('min_value');
            if (!row.max_value) missing.push('max_value');
            const msg = 'Missing required fields: ' + missing.join(', ');
            console.error(`[Bulk Import Row ${i + 1}] ${msg}`, JSON.stringify(row));
            errors.push({ row: i + 1, message: msg, data: row });
            continue;
          }

          await db.query(
            `INSERT INTO fitness_score_matrix (category_id, gender, age_group_id, score, min_value, max_value, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, SYSDATETIME(), SYSDATETIME())`,
            [catId, row.gender.toLowerCase(), agId, parseInt(row.score), String(row.min_value), String(row.max_value)]
          );
          imported++;
        } catch (err) {
          console.error(`[Bulk Import Row ${i + 1}] SQL Error:`, err.message, JSON.stringify(row));
          errors.push({ row: i + 1, message: err.message, data: row });
        }
      }

      return res.json({
        status: true,
        message: `Imported ${imported} of ${entries.length} entries`,
        data: { imported, total: entries.length, errors: errors.length > 0 ? errors : undefined }
      });
    } catch (error) {
      console.error('Error in bulk import:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ======================================================================
  // FITNESS TEST (Evaluate participant with age/gender-based scoring)
  // ======================================================================

  static async storeFitnessTest(req, res) {
    try {
      const { user_id, pushups, situps, running_time, gender, dob, comments } = req.body;
      const evaluatorId = req.user?.userDomain || req.session?.user?.userDomain || 'admin';

      if (!user_id) {
        return res.status(400).json({ status: false, message: 'user_id is required' });
      }

      const scoringService = require('../../services/fitnessScoringService');
      const scores = await scoringService.calculateAllScores(user_id, pushups, situps, running_time, gender, dob);

      // Store in evaluations table (backward compatible)
      const totalPoints = scores.total_points;

      const insertEvalQuery = `
        INSERT INTO evaluations (user_id, total_points, evaluation_points, evaluator_id, examiner_name, comments, status, createdAt, updatedAt)
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, ?, '1', GETDATE(), GETDATE())
      `;
      const evalResult = await db.queryOne(insertEvalQuery, [
        user_id, totalPoints, totalPoints, evaluatorId, evaluatorId, comments || ''
      ]);

      const evaluationId = evalResult.id;

      // Get category IDs
      const categories = await db.query(
        `SELECT id, slug, name FROM fitness_categories WHERE deletedAt IS NULL`
      );
      const catMap = {};
      (categories || []).forEach(c => { catMap[c.slug] = c; });

      // Insert evaluation_results for each category that has a score
      const catSlugs = ['pushups', 'situps', 'running'];
      const catValues = { pushups, situps, running: running_time };
      const catPoints = { pushups: scores.pushup_points, situps: scores.situp_points, running: scores.running_points };

      for (const slug of catSlugs) {
        if (catMap[slug] && catValues[slug] !== undefined && catValues[slug] !== null && catValues[slug] !== '') {
          await db.query(
            `INSERT INTO evaluation_results (evaluation_id, fitness_category_id, value, result, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, GETDATE(), GETDATE())`,
            [evaluationId, catMap[slug].id, String(catValues[slug]), catPoints[slug]]
          );
        }
      }

      // Update fitness test into fitness_test_results if table exists
      try {
        await db.query(
          `INSERT INTO fitness_test_results (employee_id, pushups, situps, running_time, pushup_points, situp_points, running_points, total_points, test_date, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(GETDATE() AS DATE), GETDATE(), GETDATE())`,
          [user_id, pushups || null, situps || null, running_time || null, scores.pushup_points, scores.situp_points, scores.running_points, totalPoints]
        );
      } catch (tableErr) {
        // fitness_test_results table might not exist yet - non-blocking
        console.warn('[FitnessTest] Could not insert into fitness_test_results:', tableErr.message);
      }

      return res.json({
        status: true,
        message: 'Fitness test saved successfully',
        data: {
          evaluation_id: evaluationId,
          ...scores
        }
      });
    } catch (error) {
      console.error('Error storing fitness test:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }
}

module.exports = FitnessCategoryController;
