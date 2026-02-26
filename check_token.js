require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkToken() {
    try {
        const res = await pool.query('SELECT email, reset_token, reset_token_expiry FROM users WHERE email = $1', ['test@test.com']);
        console.log('User Record:', res.rows[0]);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkToken();
