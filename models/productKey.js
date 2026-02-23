const db = require('../utils/db');

class ProductKey {
    static async initDb() {
        const sql = `CREATE TABLE IF NOT EXISTS product_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            key_value TEXT UNIQUE NOT NULL,
            is_used INTEGER DEFAULT 0,
            used_by_user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(product_id) REFERENCES products(id)
        )`;
        await db.createTable(sql);
    }

    static async addKey(productId, items) { // items can be single or array, usually single here
        return db.run('INSERT INTO product_keys (product_id, key_value) VALUES (?, ?)', [productId, items]);
    }

    static async getAvailableKey(productId) {
        // LIMIT 1
        return db.get('SELECT * FROM product_keys WHERE product_id = ? AND is_used = 0 LIMIT 1', [productId]);
    }

    static async markUsed(id, userId) {
        return db.run('UPDATE product_keys SET is_used = 1, used_by_user_id = ? WHERE id = ?', [userId, id]);
    }

    static async getKeysByProduct(productId) {
        return db.all('SELECT * FROM product_keys WHERE product_id = ?', [productId]);
    }
}

module.exports = ProductKey;
