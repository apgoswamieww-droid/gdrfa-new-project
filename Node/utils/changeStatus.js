const db = require('../config/dbDirect');

const changeStatus = async (req, modelName, id, statusField = 'status', newStatus) => {
  try {
    // Handle Event model specifically with direct SQL
    if (modelName === 'Event') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM events WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE events SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle Team model specifically with direct SQL
    if (modelName === 'Team') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM teams WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE teams SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle Branch model specifically with direct SQL
    if (modelName === 'Branch') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM branches WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE branches SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle Department model specifically with direct SQL
    if (modelName === 'Department') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM departments WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE departments SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle Section model specifically with direct SQL
    if (modelName === 'Section') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM sections WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE sections SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle Sector model specifically with direct SQL
    if (modelName === 'Sector') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM sectors WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE sectors SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
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

      // Update status using direct SQL
      await db.query(
        `UPDATE ranks SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle Role model specifically with direct SQL
    if (modelName === 'Role') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM roles WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE roles SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle Permission model specifically with direct SQL
    if (modelName === 'Permission') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM permissions WHERE id = ?`,
        [id]
      );

      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE permissions SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle Plan model specifically with direct SQL
    if (modelName === 'Plan') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM plans WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE plans SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
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

      // Update status using direct SQL
      await db.query(
        `UPDATE participates SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
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

      // Update status using direct SQL
      await db.query(
        `UPDATE facilities SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
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

      // Update status using direct SQL
      await db.query(
        `UPDATE facility_requests SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle SportActivity model specifically with direct SQL
    if (modelName === 'SportActivity') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM sport_activities WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE sport_activities SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle Media model specifically with direct SQL
    if (modelName === 'Media') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM media WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE media SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
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

      // Update status using direct SQL
      await db.query(
        `UPDATE job_titles SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
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

      // Update status using direct SQL
      await db.query(
        `UPDATE ranks SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
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

      // Update status using direct SQL
      await db.query(
        `UPDATE kpis SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
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

      // Update status using direct SQL
      await db.query(
        `UPDATE activity_types SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    if (modelName === 'EventType') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM event_types WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE event_types SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
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

      // Update status using direct SQL
      await db.query(
        `UPDATE sport_activities SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle CmsPage model specifically with direct SQL
    if (modelName === 'CmsPage') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM cms_pages WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE cms_pages SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle Faq model specifically with direct SQL
    if (modelName === 'Faq') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM faqs WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE faqs SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle HomeSlider model specifically with direct SQL
    if (modelName === 'HomeSlider') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM home_sliders WHERE id = ?`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE home_sliders SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle BlogPost model specifically with direct SQL
    if (modelName === 'BlogPost') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM blog_posts WHERE id = ? AND deletedAt IS NULL`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE blog_posts SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle FitnessCategory model specifically with direct SQL
    if (modelName === 'FitnessCategory') {
      // Check if record exists
      const record = await db.queryOne(
        `SELECT * FROM fitness_categories WHERE id = ? AND deletedAt IS NULL`,
        [id]
      );
      
      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      // Update status using direct SQL
      await db.query(
        `UPDATE fitness_categories SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle Sponsor model specifically with direct SQL
    if (modelName === 'Sponsor') {
      const record = await db.queryOne(
        `SELECT * FROM sponsors WHERE id = ?`,
        [id]
      );

      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      await db.query(
        `UPDATE sponsors SET ${statusField} = ? WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // Handle GlimpseOfSport model specifically with direct SQL
    if (modelName === 'GlimpseOfSport') {
      const record = await db.queryOne(
        `SELECT * FROM glimpse_of_sports WHERE id = ?`,
        [id]
      );

      if (!record) {
        return { success: false, message: req.t ? req.t('Record not found') : 'Record not found' };
      }

      await db.query(
        `UPDATE glimpse_of_sports SET ${statusField} = ?, updatedAt = GETDATE() WHERE id = ?`,
        [newStatus, id]
      );

      return { success: true, message: req.t ? req.t('Status updated successfully') : 'Status updated successfully' };
    }

    // For other models, we would need to add them as needed
    return { success: false, message: 'Unsupported model for direct SQL update' };

  } catch (error) {
    console.error('Change Status Error:', error.message);
    return { success: false, message: req.t ? req.t('Failed to update status') : 'Failed to update status' };
  }
};

module.exports = changeStatus;