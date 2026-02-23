const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all("SELECT * FROM product_keys", [], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log("Total Keys:", rows.length);
    console.log(rows);
    db.close();
});
