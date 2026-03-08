-- ============================================================
-- Expense Tracker - PostgreSQL Database Schema
-- ============================================================

-- ============================================================
-- USERS TABLE
-- Stores registered user accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- TRANSACTIONS TABLE
-- Stores all income and expense transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- ============================================================
-- SAMPLE SEED DATA (Demo user and transactions)
-- ============================================================

-- Insert a demo user (password: demo1234)
INSERT INTO users (name, email, password) VALUES
('Demo User', 'demo@example.com', '$2b$10$fYoHTi2DIefaEGDba4sj9eWJJEKmgKVDKUezU4YLRO.ZBALma/6QC')
ON CONFLICT (email) DO NOTHING;

-- Insert sample transactions for demo user
INSERT INTO transactions (user_id, type, category, amount, date, note) VALUES
(1, 'income', 'Salary', 5000.00, CURRENT_DATE - INTERVAL '30 days', 'Monthly salary'),
(1, 'income', 'Freelance', 1200.00, CURRENT_DATE - INTERVAL '20 days', 'Web design project'),
(1, 'expense', 'Food', 320.50, CURRENT_DATE - INTERVAL '25 days', 'Groceries'),
(1, 'expense', 'Bills', 150.00, CURRENT_DATE - INTERVAL '22 days', 'Electricity bill'),
(1, 'expense', 'Transport', 80.00, CURRENT_DATE - INTERVAL '18 days', 'Monthly bus pass'),
(1, 'expense', 'Shopping', 220.00, CURRENT_DATE - INTERVAL '15 days', 'Clothes'),
(1, 'expense', 'Food', 45.00, CURRENT_DATE - INTERVAL '10 days', 'Restaurant dinner'),
(1, 'expense', 'Entertainment', 60.00, CURRENT_DATE - INTERVAL '8 days', 'Netflix + Spotify'),
(1, 'income', 'Other', 300.00, CURRENT_DATE - INTERVAL '5 days', 'Birthday gift received'),
(1, 'expense', 'Health', 90.00, CURRENT_DATE - INTERVAL '3 days', 'Gym membership'),
(1, 'expense', 'Bills', 75.00, CURRENT_DATE - INTERVAL '2 days', 'Internet bill'),
(1, 'expense', 'Food', 35.00, CURRENT_DATE - INTERVAL '1 day', 'Coffee shop')
ON CONFLICT DO NOTHING;

SELECT 'PostgreSQL database schema initialized successfully!' AS message;
