// ============================================================
// backend/db.js - PostgreSQL Database Connection Pool
// Uses pg (node-postgres) with promise support
// ============================================================

const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool for Postgres
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'expense_tracker',
    max: 10,               // max number of clients in the pool
    idleTimeoutMillis: 30000
});

// Test the connection on startup
async function testConnection() {
    try {
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL Database connected successfully');
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('Please check your .env configuration and ensure PostgreSQL is running.');
        process.exit(1);
    }
}

testConnection();

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
