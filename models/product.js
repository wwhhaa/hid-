const db = require('../utils/db');

class Product {
    static async initDb() {
        const sql = `CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            image TEXT,
            category TEXT,
            description TEXT
        )`;

        await db.createTable(sql);

        // Seed if empty
        const products = await db.all('SELECT * FROM products');
        if (products.length === 0) {
            await this.create('بطاقة جوجل بلاي 5$', 5000, '/images/googleplay.png', 'cards', 'رصيد 5 دولار أمريكي');
            await this.create('شدات ببجي 60', 1200, '/images/pubg.png', 'games', '60 شدة');
            await this.create('جواهر فري فاير 100', 1000, '/images/freefire.png', 'games', '100 جوهرة');
        }
    }

    static async create(name, price, image, category, description) {
        return db.run('INSERT INTO products (name, price, image, category, description) VALUES (?, ?, ?, ?, ?)', [name, price, image, category, description]);
    }

    static async getAll() {
        return db.all('SELECT * FROM products');
    }

    static async delete(id) {
        return db.run('DELETE FROM products WHERE id = ?', [id]);
    }
}

module.exports = Product;
