const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Pool } = require('pg');

let db;
let isPostgres = false;

if (process.env.DATABASE_URL) {
    // Cloud / Production (PostgreSQL)
    isPostgres = true;
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    console.log('Connected to PostgreSQL (Cloud)');
} else {
    // Local (SQLite)
    const dbPath = path.resolve(__dirname, '../database.sqlite');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('SQLite connection error:', err);
        else console.log('Connected to SQLite (Local)');
    });
}

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (isPostgres) {
            // Convert ? to $1, $2, etc.
            let paramCount = 1;
            let pgSql = sql.replace(/\?/g, () => `$${paramCount++}`)
                .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');

            if (pgSql.toUpperCase().trim().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
                pgSql += ' RETURNING id';
            }

            db.query(pgSql, params, (err, res) => {
                if (err) return reject(err);
                const result = { changes: res.rowCount };
                if (res.rows && res.rows.length > 0 && res.rows[0].id) {
                    result.lastID = res.rows[0].id;
                }
                resolve(result);
            });
        } else {
            db.run(sql, params, function (err) {
                if (err) return reject(err);
                resolve(this); // { lastID, changes }
            });
        }
    });
};

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (isPostgres) {
            let paramCount = 1;
            const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);
            db.query(pgSql, params, (err, res) => {
                if (err) return reject(err);
                resolve(res.rows[0]);
            });
        } else {
            db.get(sql, params, (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        }
    });
};

const all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (isPostgres) {
            let paramCount = 1;
            const pgSql = sql.replace(/\?/g, () => `$${paramCount++}`);
            db.query(pgSql, params, (err, res) => {
                if (err) return reject(err);
                resolve(res.rows);
            });
        } else {
            db.all(sql, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        }
    });
};

// Helper to convert SQLite CREATE TABLE to PG compliant if possible, or just raw query
// Main issue vs SQLite: "INTEGER PRIMARY KEY AUTOINCREMENT" vs "SERIAL PRIMARY KEY"
const createTable = async (sql) => {
    if (isPostgres) {
        const pgSql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
            .replace(/DATETIME/gi, 'TIMESTAMP');
        try {
            await db.query(pgSql);
            console.log('Table verified (Postgres)');
        } catch (e) {
            console.error('Error creating table:', e);
        }
    } else {
        return run(sql);
    }
}

module.exports = { db, run, get, all, createTable, isPostgres };
