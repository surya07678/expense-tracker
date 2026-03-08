// ============================================================
// server.js - Main Express Application Entry Point
// Expense Tracker Backend Server
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true // Allow cookies
}));
app.use(express.json());             // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser());             // Parse cookies

// ── Serve Static Frontend Files ───────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));

// ── Serve Frontend Pages ──────────────────────────────────────
// For SPA-style routing, serve index.html for unknown routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'signup.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'dashboard.html'));
});

app.get('/transactions', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'transactions.html'));
});

app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'analytics.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'pages', 'profile.html'));
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found.' });
    }
    res.status(404).sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message
    });
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Expense Tracker Server running at http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
