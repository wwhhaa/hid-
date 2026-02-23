const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const columnsToAdd = [
    "ALTER TABLE users ADD COLUMN vip_level INTEGER DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN vip_expiry TEXT;",
    "ALTER TABLE users ADD COLUMN last_vip_daily_claim TEXT;"
];

db.serialize(() => {
    columnsToAdd.forEach(query => {
        db.run(query, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('Column already exists, skipping.');
                } else {
                    console.error('Error running query:', query, err.message);
                }
            } else {
                console.log('Successfully ran:', query);
            }
        });
    });
});

db.close();
