const db = require('../utils/db');

class WheelPrize {
    static async initDb() {
        const sql = `CREATE TABLE IF NOT EXISTS wheel_prizes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL,
            points INTEGER NOT NULL,
            color TEXT,
            probability INTEGER DEFAULT 10
        )`;
        await db.createTable(sql);

        const prizes = await db.all('SELECT * FROM wheel_prizes');
        if (prizes.length === 0) {
            // Seed
            await this.add('10', 10, '#FF0000', 20);
            await this.add('50', 50, '#FF0000', 10);
            await this.add('100', 100, '#FF0000', 5);
            await this.add('0', 0, '#000000', 30);
        }
    }

    static async getAll() {
        return db.all('SELECT * FROM wheel_prizes');
    }

    static async add(label, points, color, probability) {
        return db.run('INSERT INTO wheel_prizes (label, points, color, probability) VALUES (?, ?, ?, ?)', [label, points, color, probability]);
    }

    static async delete(id) {
        return db.run('DELETE FROM wheel_prizes WHERE id = ?', [id]);
    }
}

module.exports = WheelPrize;
