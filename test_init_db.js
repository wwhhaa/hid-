const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use a temporary database file
const dbPath = path.resolve(__dirname, 'temp_test.sqlite');

// Remove if exists
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

// Mock the db require for the User model (a bit tricky without dependency injection, 
// so we'll just replicate the initDb logic lightly or we can import the module if it's structured well.
// Actually, the User model imports '../database.sqlite' inside. 
// To test this properly without modifying User model to accept a db instance, 
// we might need to rely on the fact that `initDb` logic is what we changed.
// Let's just create a quick replica of what we expect the table to be and see if it runs valid SQL.
// BETTER: Let's require the User model, but we need it to use OUR db.
// The User model hardcodes `const db = ...`. 
// So we can't easily swap the DB without changing the code or mocking `sqlite3`.
//
// Plan B: specific test.
// We will just verify that the SQL string inside `models/user.js` contains the new columns.
// This is a static analysis test.
const userModelContent = fs.readFileSync(path.join(__dirname, 'models/user.js'), 'utf8');

const missingColumns = ['vip_level', 'vip_expiry', 'last_vip_daily_claim'];
let missing = [];

missingColumns.forEach(col => {
    if (!userModelContent.includes(col)) {
        missing.push(col);
    }
});

if (missing.length > 0) {
    console.error('FAIL: Missing columns in models/user.js:', missing);
    process.exit(1);
} else {
    console.log('PASS: All columns present in models/user.js');
}

// Clean up
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}
