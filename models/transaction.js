const db = require('../utils/db');

class Transaction {
    static async initDb() {
        const sql = `CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`;

        await db.createTable(sql);
    }

    static async create(userId, amount, description) {
        // user_id, amount, description
        return db.run('INSERT INTO transactions (user_id, amount, description) VALUES (?, ?, ?)', [userId, amount, description]);
    }

    static async getByUserId(userId) {
        return db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    }
}

module.exports = Transaction;
