// ============================================================
// backend/db.js - PostgreSQL Database Connection Pool
// Compatible with Render DATABASE_URL
// ============================================================

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000
});

// Test the connection
async function testConnection() {
    try {
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL Database connected successfully');
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    }
}

testConnection();

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};