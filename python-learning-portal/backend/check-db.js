const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./data/database.db');

// List tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('Error listing tables:', err);
  } else {
    console.log('Tables:', rows.map(r => r.name));
  }

  // Check E0_greet exercise
  db.get("SELECT * FROM exercises WHERE id = ?", ['E0_greet'], (err, row) => {
    if (err) {
      console.error('Error querying exercise:', err);
    } else if (row) {
      console.log('\nE0_greet exercise found:');
      console.log('ID:', row.id);
      console.log('Title:', row.title);
      console.log('Test code:');
      console.log(row.test_code);
    } else {
      console.log('\nE0_greet exercise not found');
    }
    
    db.close();
  });
});