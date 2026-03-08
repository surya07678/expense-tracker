// ============================================================
// backend/middleware/auth.js - JWT Authentication Middleware
// Verifies JWT tokens on protected routes
// ============================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to protect routes requiring authentication.
 * Reads token from Authorization header or cookie.
 */
const authenticateToken = (req, res, next) => {
    // Check Authorization header first, then cookie
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;
    const tokenFromCookie = req.cookies ? req.cookies.token : null;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user payload to request
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please log in again.'
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

module.exports = { authenticateToken };
