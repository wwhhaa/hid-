const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Granting 50 red cards to all users...');

db.run("UPDATE users SET red_cards = red_cards + 50", function (err) {
    if (err) {
        console.error(err.message);
    } else {
        console.log(`Updated ${this.changes} users.`);
    }
    db.close();
});
