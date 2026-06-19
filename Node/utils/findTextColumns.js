const db = require('../config/dbDirect');

async function findAllTextColumns() {
  try {
    // console.log('🔍 Searching for all TEXT columns...\n');
    
    const result = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE DATA_TYPE = 'text' 
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);

    if (result.length === 0) {
      // console.log('✅ No TEXT columns found!');
    } else {
      // console.log('Found TEXT columns:\n');
      result.forEach(row => {
        // console.log(`  ${row.TABLE_NAME}.${row.COLUMN_NAME} -> ${row.DATA_TYPE}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findAllTextColumns();
