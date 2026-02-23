const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
const crypto = require('crypto');

function generateKey() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

db.all("SELECT id, name FROM products", [], (err, products) => {
    if (err) throw err;

    if (products.length === 0) {
        console.log("No products found.");
        db.close();
        return;
    }

    console.log(`Found ${products.length} products. Adding 5 keys for each...`);

    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO product_keys (product_id, key_value) VALUES (?, ?)");

        products.forEach(p => {
            for (let i = 0; i < 5; i++) {
                const key = `KEY-${p.id}-${generateKey()}`;
                stmt.run(p.id, key);
            }
            console.log(`Added 5 keys for product: ${p.name}`);
        });

        stmt.finalize(() => {
            console.log("Done adding keys.");
            db.close();
        });
    });
});
