// ============================================================
// backend/routes/auth.js - Authentication Routes
// POST /api/auth/signup  - Register new user
// POST /api/auth/login   - Login existing user
// POST /api/auth/logout  - Logout (clear cookie)
// GET  /api/auth/me      - Get current user profile
// ============================================================

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db'); // exported pool and query helper

const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10; // bcrypt cost factor

// ── Helper: Generate JWT Token ────────────────────────────────
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// ── POST /api/auth/signup ─────────────────────────────────────
router.post('/signup', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        // Check if email already exists
        const existingRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        const existing = existingRes.rows;
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert new user
        const insertRes = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
            [name, email, hashedPassword]
        );

        // Generate token
        const user = { id: insertRes.rows[0].id, email, name };
        const token = generateToken(user);

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: { id: user.id, name, email }
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Find user by email
        const loginRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const rows = loginRes.rows;
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = rows[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Reset demo account data on login
        if (email === 'demo@example.com') {
            try {
                await db.query('DELETE FROM transactions WHERE user_id = $1', [user.id]);
                console.log('Demo account transactions cleared');
            } catch (resetErr) {
                console.error('Error clearing demo transactions:', resetErr);
                // Don't fail login if reset fails
            }
        }

        // Generate token
        const token = generateToken(user);

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// ── POST /api/auth/logout ─────────────────────────────────────
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully.' });
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const meRes = await db.query(
            'SELECT id, name, email, currency, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        if (meRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, user: meRes.rows[0] });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── PUT /api/auth/profile ─────────────────────────────────────
router.put('/profile', authenticateToken, async (req, res) => {
    const { name, currency } = req.body;
    try {
        await db.query(
            'UPDATE users SET name = $1, currency = $2 WHERE id = $3',
            [name, currency || 'INR', req.user.id]
        );
        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
