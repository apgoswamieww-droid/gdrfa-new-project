const db = require('../config/dbDirect');

const deleteRecord = async (req, modelName, id, force = false) => {
  try {
    // Handle Event model specifically with direct SQL (soft delete)
    if (modelName === 'Event') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM events WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE events SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Team model specifically with direct SQL (soft delete)
    if (modelName === 'Team') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM teams WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE teams SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Branch model specifically with direct SQL (soft delete)
    if (modelName === 'Branch') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM branches WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE branches SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Department model specifically with direct SQL (soft delete)
    if (modelName === 'Department') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM departments WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE departments SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Section model specifically with direct SQL (soft delete)
    if (modelName === 'Section') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM sections WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE sections SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Sector model specifically with direct SQL (soft delete)
    if (modelName === 'Sector') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM sectors WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE sectors SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Rank model specifically with direct SQL (soft delete)
    if (modelName === 'Rank') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM ranks WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE ranks SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Role model specifically with direct SQL (soft delete)
    if (modelName === 'Role') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM roles WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE roles SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Plan model specifically with direct SQL (soft delete)
    if (modelName === 'Plan') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM plans WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE plans SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle SportActivity model specifically with direct SQL (soft delete)
    if (modelName === 'SportActivity') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM sport_activities WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE sport_activities SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Media model specifically with direct SQL (soft delete)
    if (modelName === 'Media') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM media WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE media SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle JobTitle model specifically with direct SQL
    if (modelName === 'JobTitle') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM job_titles WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete using direct SQL
      await db.query(
        `UPDATE job_titles SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Rank model specifically with direct SQL
    if (modelName === 'Rank') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM ranks WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete using direct SQL
      await db.query(
        `UPDATE ranks SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Kpi model specifically with direct SQL
    if (modelName === 'Kpi') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM kpis WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete using direct SQL
      await db.query(
        `UPDATE kpis SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    if (modelName === 'ActivityType') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM activity_types WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete using direct SQL
      await db.query(
        `UPDATE activity_types SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    if (modelName === 'SportActivity') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM sport_activities WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete using direct SQL
      await db.query(
        `UPDATE sport_activities SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    if (modelName === 'Plan') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM plans WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete using direct SQL
      await db.query(
        `UPDATE plans SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    if (modelName === 'Participate') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM participates WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete using direct SQL
      await db.query(
        `UPDATE participates SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    if (modelName === 'Facilities') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM facilities WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete using direct SQL
      await db.query(
        `UPDATE facilities SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    if (modelName === 'FacilityRequest') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM facility_requests WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete using direct SQL
      await db.query(
        `UPDATE facility_requests SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    if (modelName === 'Contact') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM contacts WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete using direct SQL
      await db.query(
        `UPDATE contacts SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Faq model specifically with direct SQL (soft delete)
    if (modelName === 'Faq') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM faqs WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE faqs SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle HomeSlider model specifically with direct SQL (soft delete)
    if (modelName === 'HomeSlider') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM home_sliders WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE home_sliders SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle BlogPost model specifically with direct SQL (soft delete)
    if (modelName === 'BlogPost') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM blog_posts WHERE id = ? AND deletedAt IS NULL`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE blog_posts SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle FitnessCategory model specifically with direct SQL (soft delete)
    if (modelName === 'FitnessCategory') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM fitness_categories WHERE id = ? AND deletedAt IS NULL`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Soft delete by setting deletedAt timestamp
      await db.query(
        `UPDATE fitness_categories SET deletedAt = SYSDATETIME(), updatedAt = SYSDATETIME() WHERE id = ?`,
        [id]
      );

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // Handle Sponsor model specifically with direct SQL (soft delete)
    if (modelName === 'Sponsor') {
      const record = await db.queryOne(
        `SELECT * FROM sponsors WHERE id = ?`,
        [id]
      );

      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Sponsors table may not have deletedAt/updatedAt; hard delete instead.
      await db.query(`DELETE FROM sponsors WHERE id = ?`, [id]);

      return { success: true, message: req.t ? req.t('Record deleted successfully') : 'Record deleted successfully' };
    }

    // For other models, we would need to add them as needed
    return { success: false, message: 'Unsupported model for direct SQL delete' };

  } catch (error) {
    console.error('Delete Record Error:', error);
    return { success: false, message: req.t ? req.t('Failed to delete record') : 'Failed to delete record' };
  }
};

module.exports = deleteRecord;