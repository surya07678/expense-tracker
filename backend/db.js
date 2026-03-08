const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false
});

// Test connection
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