const db = require('../../config/dbDirect');
const ciamService = require('../../ciam/ciam.service');
const moment = require('moment');
const fitnessScoring = require('../../services/fitnessScoringService');

class EvaluationController {

  // GET /admin/evaluation/categories
  static async getCategories(req, res) {
    try {
      const categories = await db.query(
        `SELECT id, name, slug, unit_type, unit, status
         FROM fitness_categories
         WHERE status = '1' AND deletedAt IS NULL
         ORDER BY name ASC`
      );

      return res.json({
        status: true,
        data: categories || []
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // POST /admin/evaluation
  static async storeEvaluation(req, res) {
    try {
      const { user_id, categories, comments, gender, dob } = req.body;
      const evaluatorId = req.user?.userDomain || req.session?.user?.userDomain || 'admin';
      const evaluatorName = req.user?.nameEn || req.user?.name || evaluatorId;

      if (!user_id || !categories || !Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({ status: false, message: 'Invalid data provided' });
      }

      // Calculate age if DOB is provided
      let ageGroup = null;
      if (dob) {
        const age = fitnessScoring.calculateAge(dob);
        if (age !== null) {
          ageGroup = await fitnessScoring.findAgeGroup(age);
        }
      }

      let totalPoints = 0;

      // Create evaluation record
      const insertEvalQuery = `
        INSERT INTO evaluations (user_id, total_points, evaluation_points, evaluator_id, examiner_name, comments, status, createdAt, updatedAt)
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?, ?, '1', GETDATE(), GETDATE())
      `;
      const evalResult = await db.queryOne(insertEvalQuery, [
        user_id, 0, 0, evaluatorId, evaluatorName, comments || ''
      ]);

      const evaluationId = evalResult.id;

      // Fetch categories to determine unit_type for value conversions
      const allCategories = await db.query(
        `SELECT id, slug, unit_type FROM fitness_categories WHERE deletedAt IS NULL`
      );
      const catTypeMap = {};
      (allCategories || []).forEach(c => { catTypeMap[c.id] = c.unit_type; });

      for (const cat of categories) {
        let storedValue = cat.value !== undefined && cat.value !== '' ? String(cat.value) : '0';
        let points = 0;

        // If gender + ageGroup are available, do automatic scoring lookup
        if (gender && ageGroup) {
          const resolvedGender = gender.toLowerCase() === 'female' ? 'female' : 'male';
          let lookupValue = storedValue;
          // Convert MM:SS to seconds for time-based categories
          if (catTypeMap[cat.id] === 'time') {
            lookupValue = fitnessScoring.convertRunningToSeconds(storedValue) ?? storedValue;
          }
          points = await fitnessScoring.lookupScore(cat.id, resolvedGender, ageGroup.id, lookupValue);
        } else {
          // Fallback: use points sent from frontend (manual entry)
          points = parseFloat(cat.points) || 0;
        }

        totalPoints += points;

        await db.query(
          `INSERT INTO evaluation_results (evaluation_id, fitness_category_id, value, result, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, GETDATE(), GETDATE())`,
          [evaluationId, cat.id, storedValue, points]
        );
      }

      // Update total points
      await db.query(
        `UPDATE evaluations SET total_points = ?, evaluation_points = ?, updatedAt = GETDATE() WHERE id = ?`,
        [totalPoints, totalPoints, evaluationId]
      );

      return res.json({
        status: true,
        message: 'Evaluation saved successfully',
        data: { id: evaluationId, totalPoints }
      });

    } catch (error) {
      console.error('Error storing evaluation:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // GET /admin/evaluation/user/:userId
  static async getEvaluationsByUser(req, res) {
    try {
      const { userId } = req.params;
      const evaluations = await db.query(
        `SELECT e.* FROM evaluations e WHERE e.user_id = ? AND e.deletedAt IS NULL ORDER BY e.createdAt DESC`,
        [userId]
      );

      if (evaluations && evaluations.length > 0) {
        // Resolve examiner names from CIAM for all unique evaluator IDs
        const evalIds = evaluations.map(e => e.id);
        const uniqueEvalIds = [...new Set(evaluations.map(e => e.evaluator_id).filter(Boolean))];
        if (uniqueEvalIds.length > 0) {
          try {
            const ciamResponse = await ciamService.getUserByDomainId(uniqueEvalIds, req.user?.token || req.session?.user?.token);
            if (ciamResponse && !ciamResponse.isError) {
              const ciamUsers = ciamResponse.value || ciamResponse;
              const nameMap = {};
              (Array.isArray(ciamUsers) ? ciamUsers : []).forEach(u => {
                if (u.userDomain) {
                  nameMap[u.userDomain.toLowerCase()] = u.nameEn || u.userDomain;
                }
              });
              evaluations.forEach(e => {
                if (e.evaluator_id) {
                  const key = e.evaluator_id.toLowerCase();
                  if (nameMap[key]) {
                    e.examiner_name = nameMap[key];
                  }
                }
              });
            }
          } catch (ciamErr) {
            console.warn('[getEvaluationsByUser] CIAM name lookup failed, using stored names:', ciamErr.message);
          }
        }

        // Attach results with category info
        const placeholders = evalIds.map(() => '?').join(',');
        const results = await db.query(
          `SELECT er.*, fc.name as categoryName, fc.slug, fc.unit_type
           FROM evaluation_results er
           LEFT JOIN fitness_categories fc ON er.fitness_category_id = fc.id
           WHERE er.evaluation_id IN (${placeholders}) AND er.deletedAt IS NULL
           ORDER BY er.id ASC`,
          evalIds
        );

        const resultsByEval = {};
        (results || []).forEach(r => {
          if (!resultsByEval[r.evaluation_id]) resultsByEval[r.evaluation_id] = [];
          resultsByEval[r.evaluation_id].push(r);
        });

        evaluations.forEach(e => {
          e.results = resultsByEval[e.id] || [];
        });
      }

      return res.json({
        status: true,
        data: evaluations
      });
    } catch (error) {
      console.error('Error fetching user evaluations:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // POST /admin/evaluation/calculate-scores (live preview)
  static async calculateScores(req, res) {
    try {
      const { gender, dob, values } = req.body;
      console.log('[calculateScores] Input:', JSON.stringify({ gender, dob, values }));

      if (!gender || !dob || !values || !Array.isArray(values) || values.length === 0) {
        console.log('[calculateScores] Missing input, returning empty');
        return res.json({ status: true, data: { scores: [] } });
      }

      const cleanDob = String(dob).replace(/\s/g, '');
      const age = fitnessScoring.calculateAge(cleanDob);
      console.log('[calculateScores] age:', age, 'from dob:', cleanDob);
      if (age === null) {
        console.log('[calculateScores] age is null, returning 0 scores');
        return res.json({ status: true, data: { scores: values.map(v => ({ category_id: v.category_id, points: 0 })) } });
      }

      const ageGroup = await fitnessScoring.findAgeGroup(age);
      console.log('[calculateScores] ageGroup:', JSON.stringify(ageGroup));
      if (!ageGroup) {
        console.log('[calculateScores] ageGroup not found for age', age);
        return res.json({ status: true, data: { scores: values.map(v => ({ category_id: v.category_id, points: 0 })) } });
      }

      const resolvedGender = gender.toLowerCase() === 'female' ? 'female' : 'male';

      // Fetch unit_type for time-based conversion
      const allCats = await db.query('SELECT id, unit_type FROM fitness_categories WHERE deletedAt IS NULL');
      const catTypeMap = {};
      (allCats || []).forEach(c => { catTypeMap[c.id] = c.unit_type; });

      const scores = [];
      for (const v of values) {
        let lookupValue = String(v.value !== undefined && v.value !== '' ? v.value : '0');
        if (catTypeMap[v.category_id] === 'time') {
          lookupValue = fitnessScoring.convertRunningToSeconds(lookupValue) ?? lookupValue;
        }
        console.log('[calculateScores] lookup:', { catId: v.category_id, resolvedGender, ageGroupId: ageGroup.id, lookupValue });
        const points = await fitnessScoring.lookupScore(
          parseInt(v.category_id), resolvedGender, ageGroup.id, lookupValue
        );
        scores.push({ category_id: v.category_id, points });
      }

      return res.json({
        status: true,
        data: { age, age_group: ageGroup, scores }
      });
    } catch (error) {
      console.error('Error calculating scores:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  // GET /admin/evaluation/:id
  static async getEvaluationDetails(req, res) {
    try {
      const { id } = req.params;
      const evaluation = await db.queryOne(
        `SELECT * FROM evaluations WHERE id = ? AND deletedAt IS NULL`,
        [id]
      );

      if (!evaluation) {
        return res.status(404).json({ status: false, message: 'Evaluation not found' });
      }

      const results = await db.query(
        `SELECT er.*, fc.name as categoryName, fc.slug, fc.unit_type
         FROM evaluation_results er
         LEFT JOIN fitness_categories fc ON er.fitness_category_id = fc.id
         WHERE er.evaluation_id = ? AND er.deletedAt IS NULL`,
        [id]
      );

      return res.json({
        status: true,
        data: {
          ...evaluation,
          results
        }
      });
    } catch (error) {
      console.error('Error fetching evaluation details:', error);
      return res.status(500).json({ status: false, message: error.message });
    }
  }
}

module.exports = EvaluationController;
