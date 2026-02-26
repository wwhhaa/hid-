require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkUsers() {
    try {
        const res = await pool.query('SELECT COUNT(*) as count FROM "users"');
        const res2 = await pool.query('SELECT id, username, email, points, vip_level, created_at FROM "users" ORDER BY created_at DESC LIMIT 10');

        console.log(`\n=================================================`);
        console.log(`إجمالي عدد الحسابات المسجلة: ${res.rows[0].count}`);
        console.log(`=================================================\n`);

        if (res2.rows.length > 0) {
            console.log('أحدث الحسابات المسجلة:');
            console.table(res2.rows);
        } else {
            console.log('لا يوجد حسابات مسجلة حتى الآن.');
        }
    } catch (err) {
        console.error('Error connecting to database:', err);
    } finally {
        await pool.end();
    }
}

checkUsers();
