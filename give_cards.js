const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

function runAsync(sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function migrateAndGive() {
    try {
        // Try adding columns. Ignore errors if they exist.
        try { await runAsync("ALTER TABLE users ADD COLUMN red_cards INTEGER DEFAULT 0"); console.log("Added red_cards column."); } catch (e) { }
        try { await runAsync("ALTER TABLE users ADD COLUMN ads_watched INTEGER DEFAULT 0"); console.log("Added ads_watched column."); } catch (e) { }
        try { await runAsync("ALTER TABLE users ADD COLUMN cards_earned_today INTEGER DEFAULT 0"); console.log("Added cards_earned_today column."); } catch (e) { }

        // Now update
        await runAsync("UPDATE users SET red_cards = red_cards + 10");
        console.log("Successfully added 10 red cards to all users.");

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        db.close();
    }
}

migrateAndGive();
