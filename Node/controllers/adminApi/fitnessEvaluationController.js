const db = require('../../config/dbDirect');
const fitnessScoring = require('../../services/fitnessScoringService');
const ciamService = require('../../ciam/ciam.service');

class FitnessEvaluationController {

  // ── LIST all fitness evaluations ──────────────────────────────────
  static async list(req, res) {
    try {
      const start = parseInt(req.query.start) || 0;
      const length = parseInt(req.query.length) || 10;
      const search = req.query.search || '';
      const year = req.query.year || '';

      let whereClause = 'WHERE e.deletedAt IS NULL';
      const params = [];

      if (search) {
        whereClause += ' AND (e.employee_name LIKE ? OR e.grp LIKE ? OR e.sector LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (year) {
        whereClause += ' AND e.year = ?';
        params.push(parseInt(year));
      }

      const countResult = await db.queryOne(
        `SELECT COUNT(*) as total FROM evaluations e ${whereClause}`,
        params
      );
      const total = countResult ? countResult.total : 0;

      const data = await db.query(
        `SELECT e.id, e.grp, e.employee_name, e.sector, e.fitness_status, e.year,
                e.total_points, e.rank, e.createdAt, e.updatedAt
         FROM evaluations e
         ${whereClause}
         ORDER BY e.createdAt DESC
         OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
        [...params, start, length]
      );

      return res.json({
        status: true,
        message: 'Fitness evaluations retrieved successfully',
        data: { data: data || [], total }
      });
    } catch (error) {
      console.error('Error in list fitness evaluations:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ── SHOW single evaluation with results ───────────────────────────
  static async show(req, res) {
    try {
      const { id } = req.params;

      const evaluation = await db.queryOne(
        `SELECT e.* FROM evaluations e WHERE e.id = ? AND e.deletedAt IS NULL`,
        [id]
      );

      if (!evaluation) {
        return res.status(404).json({ status: false, message: 'Evaluation not found' });
      }

      const results = await db.query(
        `SELECT er.*, fc.name as categoryName, fc.slug, fc.unit_type
         FROM evaluation_results er
         LEFT JOIN fitness_categories fc ON er.fitness_category_id = fc.id
         WHERE er.evaluation_id = ? AND er.deletedAt IS NULL
         ORDER BY er.id ASC`,
        [id]
      );

      return res.json({
        status: true,
        message: 'Evaluation retrieved successfully',
        data: { ...evaluation, results: results || [] }
      });
    } catch (error) {
      console.error('Error in show fitness evaluation:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ── STORE (upload Excel data) ─────────────────────────────────────
  static async store(req, res) {
    try {
      const { records } = req.body;

      if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ status: false, message: 'records array is required with at least one entry' });
      }

      let imported = 0;
      const errors = [];

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        try {
          const rowGrp = row.grp ? String(row.grp).trim() : null;
          const rowYear = row.year ? parseInt(row.year) : null;

          // Check if evaluation already exists for this employee + year
          if (rowGrp && rowYear) {
            const existing = await db.queryOne(
              `SELECT id FROM evaluations WHERE grp = ? AND [year] = ? AND deletedAt IS NULL`,
              [rowGrp, rowYear]
            );
            if (existing) {
              errors.push({ row: i + 1, message: `Evaluation already exists for GRP ${rowGrp} in year ${rowYear}`, data: row });
              continue;
            }
          }

          const rowUserDomain = rowGrp
            ? (rowGrp.startsWith('ml') ? rowGrp : 'ml' + rowGrp)
            : null;

          await db.query(
            `INSERT INTO evaluations ([rank], [grp], employee_name, sector, fitness_status, [year], user_id, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())`,
            [
              row.rank || null,
              rowGrp,
              row.employee_name || null,
              row.sector || null,
              row.fitness_status || null,
              rowYear,
              rowUserDomain
            ]
          );
          imported++;
        } catch (err) {
          errors.push({ row: i + 1, message: err.message, data: row });
          console.error(`[FitnessEval Import Row ${i + 1}] Error:`, err.message);
        }
      }

      return res.json({
        status: true,
        message: `Imported ${imported} of ${records.length} records successfully`,
        data: {
          imported,
          total: records.length,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (error) {
      console.error('Error in store fitness evaluations:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ── UPDATE single evaluation (basic fields + evaluation results) ──
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { rank, grp, employee_name, sector, fitness_status, year, categories, comments, gender, dob } = req.body;

      const existing = await db.queryOne(
        `SELECT id, grp FROM evaluations WHERE id = ? AND deletedAt IS NULL`,
        [id]
      );

      if (!existing) {
        return res.status(404).json({ status: false, message: 'Evaluation not found' });
      }

      // Resolve the employee's userDomain from grp
      const resolvedGrp = grp || existing.grp;
      const employeeUserDomain = resolvedGrp
        ? (String(resolvedGrp).startsWith('ml') ? String(resolvedGrp) : 'ml' + String(resolvedGrp))
        : null;

      const evaluatorId = req.user?.userDomain || req.session?.user?.userDomain || null;
      const examinerName = req.user?.nameEn || req.user?.name || evaluatorId;

      // Update basic fields
      await db.query(
        `UPDATE evaluations SET
          [rank] = COALESCE(?, [rank]),
          [grp] = COALESCE(?, [grp]),
          employee_name = COALESCE(?, employee_name),
          sector = COALESCE(?, sector),
          fitness_status = COALESCE(?, fitness_status),
          [year] = COALESCE(?, [year]),
          comments = COALESCE(?, comments),
          user_id = COALESCE(?, user_id),
          evaluator_id = COALESCE(?, evaluator_id),
          examiner_name = COALESCE(?, examiner_name),
          updatedAt = GETDATE()
         WHERE id = ?`,
        [
          rank || null,
          grp || null,
          employee_name || null,
          sector || null,
          fitness_status || null,
          year !== undefined && year !== null ? parseInt(year) : null,
          comments || null,
          employeeUserDomain,
          evaluatorId,
          examinerName,
          id
        ]
      );

      // If categories provided, replace old evaluation results with new ones
      if (categories && Array.isArray(categories) && categories.length > 0) {
        // Soft-delete existing results for this evaluation
        await db.query(
          `UPDATE evaluation_results SET deletedAt = GETDATE(), updatedAt = GETDATE()
           WHERE evaluation_id = ? AND deletedAt IS NULL`,
          [id]
        );

        // Resolve age group if gender + dob provided
        let ageGroup = null;
        if (gender && dob) {
          const age = fitnessScoring.calculateAge(dob);
          if (age !== null) {
            ageGroup = await fitnessScoring.findAgeGroup(age);
          }
        }

        // Get unit_type map for value conversion
        const allCategories = await db.query(
          `SELECT id, unit_type FROM fitness_categories WHERE deletedAt IS NULL`
        );
        const catTypeMap = {};
        (allCategories || []).forEach(c => { catTypeMap[c.id] = c.unit_type; });

        let totalPoints = 0;

        for (const cat of categories) {
          let storedValue = cat.value !== undefined && cat.value !== '' ? String(cat.value) : '0';
          let points = 0;

          if (gender && ageGroup) {
            const resolvedGender = gender.toLowerCase() === 'female' ? 'female' : 'male';
            let lookupValue = storedValue;
            if (catTypeMap[cat.id] === 'time') {
              lookupValue = fitnessScoring.convertRunningToSeconds(storedValue) ?? storedValue;
            }
            points = await fitnessScoring.lookupScore(cat.id, resolvedGender, ageGroup.id, lookupValue);
            // Fallback for count-based categories: use raw value as points
            if (points === 0 && catTypeMap[cat.id] !== 'time') {
              const raw = parseFloat(storedValue);
              if (!isNaN(raw) && raw > 0) {
                points = Math.round(raw);
              }
            }
          } else {
            points = parseFloat(cat.points) || 0;
          }

          totalPoints += points;

          await db.query(
            `INSERT INTO evaluation_results (evaluation_id, fitness_category_id, value, result, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, GETDATE(), GETDATE())`,
            [id, cat.id, storedValue, points]
          );
        }

        // Update total points
        await db.query(
          `UPDATE evaluations SET total_points = ?, evaluation_points = ?, updatedAt = GETDATE() WHERE id = ?`,
          [totalPoints, totalPoints, id]
        );
      }

      return res.json({
        status: true,
        message: 'Evaluation updated successfully'
      });
    } catch (error) {
      console.error('Error in update fitness evaluation:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ── DELETE single evaluation ──────────────────────────────────────
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await db.queryOne(
        `SELECT id FROM evaluations WHERE id = ? AND deletedAt IS NULL`,
        [id]
      );

      if (!existing) {
        return res.status(404).json({ status: false, message: 'Evaluation not found' });
      }

      // Soft delete
      await db.query(
        `UPDATE evaluations SET deletedAt = GETDATE(), updatedAt = GETDATE() WHERE id = ?`,
        [id]
      );

      return res.json({
        status: true,
        message: 'Evaluation deleted successfully'
      });
    } catch (error) {
      console.error('Error in delete fitness evaluation:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }
  // ── GET distinct years for filter dropdown ────────────────────────
  static async getYears(req, res) {
    try {
      const years = await db.query(
        `SELECT DISTINCT [year] FROM evaluations WHERE [year] IS NOT NULL AND deletedAt IS NULL ORDER BY [year] DESC`
      );

      return res.json({
        status: true,
        data: years || []
      });
    } catch (error) {
      console.error('Error fetching evaluation years:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ── LOOKUP user details by grp (user domain) ─────────────────────
  static async lookupUserByGrp(req, res) {
    try {
      const { id } = req.params;
      
      const evaluation = await db.queryOne(
        `SELECT grp FROM evaluations WHERE id = ? AND deletedAt IS NULL`,
        [id]
      );

      if (!evaluation || !evaluation.grp) {
        return res.json({
          status: true,
          data: null,
          message: 'No grp found for this evaluation'
        });
      }

      const grp = String(evaluation.grp).trim();
      const userDomain = grp.startsWith('ml') ? grp : `ml${grp}`;
      const token = req.user?.token || req.session?.user?.token || null;

      const ciamResponse = await ciamService.getUserByDomainId([userDomain], token);
      let userData = null;

      if (ciamResponse && !ciamResponse.isError) {
        const users = ciamResponse.value || ciamResponse;
        
        const user = Array.isArray(users) ? users.find(u =>
          String(u.userDomain || u.loginName || '').toLowerCase() === userDomain.toLowerCase()
        ) : null;

        if (user) {
          let gender = '';
          if (user.sex === 1 || user.sex === '1') gender = 'male';
          else if (user.sex === 2 || user.sex === '2') gender = 'female';

          let dob = '';
          if (user.birthDate) {
            const d = new Date(user.birthDate);
            if (!isNaN(d.getTime())) {
              dob = d.toISOString().split('T')[0];
            }
          }

          userData = {
            name: user.nameEn || user.name || null,
            gender,
            dob,
            user_id: user.loginName || user.userDomain || null,
          };
        }
      }
      
      return res.json({
        status: true,
        data: userData,
      });
    } catch (error) {
      console.error('Error in lookupUserByGrp:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ── UPDATE single evaluation result row ────────────────────────────
  static async updateResult(req, res) {
    try {
      const { id } = req.params;
      const { value, result } = req.body;

      const existing = await db.queryOne(
        `SELECT id, evaluation_id FROM evaluation_results WHERE id = ? AND deletedAt IS NULL`,
        [id]
      );

      if (!existing) {
        return res.status(404).json({ status: false, message: 'Result not found' });
      }

      await db.query(
        `UPDATE evaluation_results SET value = ?, result = ?, updatedAt = GETDATE() WHERE id = ?`,
        [value !== undefined ? String(value) : null, result !== undefined ? parseFloat(result) || 0 : null, id]
      );

      // Recalculate total_points from all non-deleted results for this evaluation
      const total = await db.queryOne(
        `SELECT COALESCE(SUM(CAST(result AS FLOAT)), 0) as total FROM evaluation_results
         WHERE evaluation_id = ? AND deletedAt IS NULL`,
        [existing.evaluation_id]
      );
      const newTotal = total ? total.total : 0;
      await db.query(
        `UPDATE evaluations SET total_points = ?, evaluation_points = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newTotal, newTotal, existing.evaluation_id]
      );

      return res.json({
        status: true,
        message: 'Result updated successfully'
      });
    } catch (error) {
      console.error('Error in updateResult:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ── DELETE single evaluation result row ────────────────────────────
  static async deleteResult(req, res) {
    try {
      const { id } = req.params;

      const existing = await db.queryOne(
        `SELECT id FROM evaluation_results WHERE id = ? AND deletedAt IS NULL`,
        [id]
      );

      if (!existing) {
        return res.status(404).json({ status: false, message: 'Result not found' });
      }

      await db.query(
        `UPDATE evaluation_results SET deletedAt = GETDATE(), updatedAt = GETDATE() WHERE id = ?`,
        [id]
      );

      return res.json({
        status: true,
        message: 'Result deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteResult:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // ── DELETE evaluation session (all results with given IDs) ──────────
  static async deleteSession(req, res) {
    try {
      const { id } = req.params;
      const { resultIds } = req.body;

      if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
        return res.status(400).json({ status: false, message: 'resultIds array is required' });
      }

      const placeholders = resultIds.map(() => '?').join(',');
      const existing = await db.query(
        `SELECT id FROM evaluation_results WHERE id IN (${placeholders}) AND evaluation_id = ? AND deletedAt IS NULL`,
        [...resultIds, id]
      );

      if (!existing || existing.length === 0) {
        return res.status(404).json({ status: false, message: 'No results found for this session' });
      }

      await db.query(
        `UPDATE evaluation_results SET deletedAt = GETDATE(), updatedAt = GETDATE() WHERE id IN (${placeholders}) AND evaluation_id = ? AND deletedAt IS NULL`,
        [...resultIds, id]
      );

      // Recalculate total_points from remaining results
      const remaining = await db.queryOne(
        `SELECT COALESCE(SUM(CAST(result AS FLOAT)), 0) as total FROM evaluation_results
         WHERE evaluation_id = ? AND deletedAt IS NULL`,
        [id]
      );
      const newTotal = remaining ? remaining.total : 0;
      await db.query(
        `UPDATE evaluations SET total_points = ?, evaluation_points = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newTotal, newTotal, id]
      );

      return res.json({
        status: true,
        message: `Session deleted (${existing.length} results)`
      });
    } catch (error) {
      console.error('Error in deleteSession:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }
}

module.exports = FitnessEvaluationController;
