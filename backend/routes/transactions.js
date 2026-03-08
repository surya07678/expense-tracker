// ============================================================
// backend/routes/transactions.js - Transaction CRUD Routes
// All routes protected by JWT authentication middleware
// ============================================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All transaction routes require authentication
router.use(authenticateToken);

// Valid categories
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

// ── GET /api/transactions ─────────────────────────────────────
// Fetch transactions with optional filters & search
router.get('/', async (req, res) => {
    const userId = req.user.id;
    const { type, category, search, startDate, endDate, limit = 50, offset = 0 } = req.query;

    try {
        // Build dynamic WHERE clause
        let conditions = ['user_id = $1'];
        let params = [userId];
        let paramIndex = 2;

        if (type && ['income', 'expense'].includes(type)) {
            conditions.push(`type = $${paramIndex}`);
            params.push(type);
            paramIndex++;
        }
        if (category) {
            conditions.push(`category = $${paramIndex}`);
            params.push(category);
            paramIndex++;
        }
        if (search) {
            conditions.push(`(note ILIKE $${paramIndex} OR category ILIKE $${paramIndex + 1})`);
            params.push(`%${search}%`, `%${search}%`);
            paramIndex += 2;
        }
        if (startDate) {
            conditions.push(`date >= $${paramIndex}`);
            params.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            conditions.push(`date <= $${paramIndex}`);
            params.push(endDate);
            paramIndex++;
        }

        const whereClause = conditions.join(' AND ');

        // Get paginated transactions
        const transactionsRes = await db.query(
            `SELECT * FROM transactions WHERE ${whereClause} ORDER BY date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        // Get total count for pagination
        const countResultRes = await db.query(
            `SELECT COUNT(*) AS total FROM transactions WHERE ${whereClause}`,
            params
        );

        res.json({
            success: true,
            transactions: transactionsRes.rows,
            total: parseInt(countResultRes.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error('Get transactions error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── GET /api/transactions/summary ─────────────────────────────
// Dashboard summary: totals and monthly breakdown
router.get('/summary', async (req, res) => {
    const userId = req.user.id;

    try {
        // Total income and expense
        const totalsRes = await db.query(
            `SELECT
                type,
                SUM(amount) AS total
             FROM transactions
             WHERE user_id = $1
             GROUP BY type`,
            [userId]
        );

        // Monthly data for last 6 months
        const monthlyRes = await db.query(
            `SELECT
                TO_CHAR(date, 'YYYY-MM') AS month,
                type,
                SUM(amount) AS total
             FROM transactions
             WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 months'
             GROUP BY month, type
             ORDER BY month ASC`,
            [userId]
        );

        // Expense breakdown by category
        const categoryBreakdownRes = await db.query(
            `SELECT
                category,
                SUM(amount) AS total
             FROM transactions
             WHERE user_id = $1 AND type = 'expense'
             GROUP BY category
             ORDER BY total DESC`,
            [userId]
        );

        // Recent transactions (last 5)
        const recentRes = await db.query(
            `SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT 5`,
            [userId]
        );

        // Compute totals
        let totalIncome = 0, totalExpense = 0;
        totalsRes.rows.forEach(row => {
            if (row.type === 'income') totalIncome = parseFloat(row.total);
            if (row.type === 'expense') totalExpense = parseFloat(row.total);
        });

        res.json({
            success: true,
            summary: {
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense,
                monthly: monthlyRes.rows,
                categoryBreakdown: categoryBreakdownRes.rows,
                recent: recentRes.rows
            }
        });
    } catch (err) {
        console.error('Summary error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── POST /api/transactions ────────────────────────────────────
// Add a new transaction
router.post('/', [
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('date').isDate().withMessage('Valid date is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { type, category, amount, date, note } = req.body;
    const userId = req.user.id;

    try {
        const result = await db.query(
            'INSERT INTO transactions (user_id, type, category, amount, date, note) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [userId, type, category, parseFloat(amount), date, note || null]
        );

        const newTransactionRes = await db.query('SELECT * FROM transactions WHERE id = $1', [result.rows[0].id]);

        res.status(201).json({
            success: true,
            message: 'Transaction added successfully!',
            transaction: newTransactionRes.rows[0]
        });
    } catch (err) {
        console.error('Add transaction error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── PUT /api/transactions/:id ─────────────────────────────────
// Update an existing transaction
router.put('/:id', [
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('date').isDate().withMessage('Valid date is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { type, category, amount, date, note } = req.body;
    const userId = req.user.id;

    try {
        // Ensure transaction belongs to this user
        const existingRes = await db.query(
            'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        if (existingRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transaction not found.' });
        }

        await db.query(
            'UPDATE transactions SET type = $1, category = $2, amount = $3, date = $4, note = $5 WHERE id = $6',
            [type, category, parseFloat(amount), date, note || null, id]
        );

        const updatedRes = await db.query('SELECT * FROM transactions WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'Transaction updated successfully!',
            transaction: updatedRes.rows[0]
        });
    } catch (err) {
        console.error('Update transaction error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── DELETE /api/transactions/:id ──────────────────────────────
// Delete a transaction
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const existingRes = await db.query(
            'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        if (existingRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Transaction not found.' });
        }

        await db.query('DELETE FROM transactions WHERE id = $1', [id]);

        res.json({ success: true, message: 'Transaction deleted successfully!' });
    } catch (err) {
        console.error('Delete transaction error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ── GET /api/transactions/export ──────────────────────────────
// Export all transactions as CSV
router.get('/export/csv', async (req, res) => {
    const userId = req.user.id;

    try {
        const transactionsRes = await db.query(
            'SELECT type, category, amount, date, note, created_at FROM transactions WHERE user_id = $1 ORDER BY date DESC',
            [userId]
        );

        // Build CSV string
        const headers = ['Type', 'Category', 'Amount', 'Date', 'Note', 'Created At'];
        const rows = transactionsRes.rows.map(t => [
            t.type,
            t.category,
            t.amount,
            t.date,
            `"${(t.note || '').replace(/"/g, '""')}"`,
            t.created_at
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
        res.send(csv);
    } catch (err) {
        console.error('Export CSV error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
