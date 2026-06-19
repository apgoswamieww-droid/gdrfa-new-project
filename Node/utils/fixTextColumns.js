const db = require('../config/dbDirect');
require('dotenv').config();

async function fixTextToNvarcharColumns() {
  try {
    console.log('✅ Connected to SQL Server');

    // List of columns to convert from TEXT to NVARCHAR(MAX)
    const conversions = [
      { table: 'blog_posts', column: 'content_ar' },
      { table: 'cms_pages', column: 'description_ar' },
      { table: 'cms_pages', column: 'description_en' },
      { table: 'contacts', column: 'message' },
      { table: 'evaluations', column: 'comments' },
      { table: 'events', column: 'eventDescription' },
      { table: 'events', column: 'eventDescription_ar' },
      { table: 'facilities', column: 'description_ar' },
      { table: 'facility_requests', column: 'description' },
      { table: 'faqs', column: 'answer_ar' },
      { table: 'faqs', column: 'question_ar' },
      { table: 'media', column: 'description_ar' },
      { table: 'notifications', column: 'message_ar' },
      { table: 'notifications', column: 'message_en' },
      { table: 'permissions', column: 'description' },
      { table: 'TokenBlacklists', column: 'token' },
      { table: 'users', column: 'notification_preferences' }
    ];

    // console.log('🔧 Starting column type conversions...\n');

    for (const conversion of conversions) {
      try {
        // Check if table exists
        const tableCheckResult = await db.query(`
          SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME = '${conversion.table}'
        `);

        if (!tableCheckResult || tableCheckResult.length === 0) {
          // console.log(`⚠️  Table '${conversion.table}' does not exist, skipping...`);
          continue;
        }

        // Check if column exists and its current type
        const columnCheckResult = await db.query(`
          SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = '${conversion.table}' AND COLUMN_NAME = '${conversion.column}'
        `);

        if (!columnCheckResult || columnCheckResult.length === 0) {
          // console.log(`⚠️  Column '${conversion.column}' in '${conversion.table}' does not exist, skipping...`);
          continue;
        }

        const currentType = columnCheckResult[0].DATA_TYPE;
        
        if (currentType === 'text') {
          // Convert TEXT to NVARCHAR(MAX)
          await db.query(`
            ALTER TABLE ${conversion.table} ALTER COLUMN ${conversion.column} NVARCHAR(MAX) NULL
          `);
          // console.log(`✅ ${conversion.table}.${conversion.column}: TEXT → NVARCHAR(MAX)`);
        } else if (currentType === 'nvarchar') {
          // console.log(`ℹ️  ${conversion.table}.${conversion.column} is already NVARCHAR, skipping...`);
        } else {
          // console.log(`ℹ️  ${conversion.table}.${conversion.column} is ${currentType}, leaving as is...`);
        }
      } catch (error) {
        console.error(`❌ Error converting ${conversion.table}.${conversion.column}:`, error.message);
      }
    }

    console.log('\n✅ All columns processed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixTextToNvarcharColumns();
