const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

async function checkAndFixDatabase() {
  console.log('🔧 Checking database status...');
  
  const sqliteFile = './database.sqlite';
  const dbFile = './database.db';
  
  // Check if sqlite file has data
  const sqliteDb = new sqlite3.Database(sqliteFile);
  
  sqliteDb.get('SELECT COUNT(*) as count FROM exercises', (err, row) => {
    if (err) {
      console.error('❌ Error checking sqlite file:', err);
      return;
    }
    
    console.log(`📊 Exercises in ${sqliteFile}:`, row.count);
    
    if (row.count > 0) {
      console.log('✅ SQLite database has data');
      
      // Copy sqlite file to .db file 
      try {
        fs.copyFileSync(sqliteFile, dbFile);
        console.log('✅ Copied data to database.db');
        console.log('🎉 Database fix complete! Please restart the backend service.');
      } catch (copyErr) {
        console.error('❌ Error copying database:', copyErr);
      }
    } else {
      console.log('❌ SQLite database is empty');
    }
    
    sqliteDb.close();
  });
}

checkAndFixDatabase();