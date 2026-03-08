# 💰 SpendWise – Full-Stack Expense Tracker

A modern, full-stack expense tracker web application built with **Node.js**, **Express**, **PostgreSQL**, and vanilla **JavaScript** with Chart.js analytics.

---

## 📁 Project Structure

```
expense-tracker/
├── server.js                     # Express app entry point
├── package.json
├── .env.example                  # Environment config template
│
├── backend/
│   ├── db.js                     # PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   └── routes/
│       ├── auth.js               # POST /signup, /login, /logout, GET /me
│       └── transactions.js       # Full CRUD + summary + CSV export
│
├── database/
│   └── schema.sql                # PostgreSQL schema + seed data
│
└── frontend/
    ├── index.html                # Landing page
    ├── css/
    │   └── style.css             # Main stylesheet (dark mode, animations)
    ├── js/
    │   ├── api.js                # API client, Auth, Toast, Format helpers
    │   └── layout.js             # Shared sidebar/topbar component
    └── pages/
        ├── login.html            # Login page
        ├── signup.html           # Registration page
        ├── dashboard.html        # Main dashboard with charts
        ├── transactions.html     # Full transaction management
        ├── analytics.html        # Charts & analytics
        └── profile.html          # User profile & settings
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v16+ ([nodejs.org](https://nodejs.org))
- **PostgreSQL** 14+ ([postgresql.org](https://www.postgresql.org))
- **npm** v7+

---

### Step 1 – Clone & Install

```bash
# Navigate into project directory
cd expense-tracker

# Install all Node.js dependencies
npm install
```

---

### Step 2 – Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Open .env and set your values:
nano .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=root
DB_PASSWORD=your_postgres_password
DB_NAME=expense_tracker

JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
```

---

### Step 3 – Initialize the Database

```bash
# Log into PostgreSQL
mysql -u root -p

# Run the schema file
source /path/to/expense-tracker/database/schema.sql;

# Or use the one-liner:
psql -U $DB_USER -d $DB_NAME -f database/schema.sql
```

This creates:
- `expense_tracker` database (create beforehand if necessary: `CREATE DATABASE expense_tracker;`)
- `users` table
- `transaction_type` enum type
- `transactions` table
- Demo user: **demo@example.com** / **demo1234**
- Sample seed transactions

---

### Step 4 – Start the Server

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

Open your browser: **http://localhost:3000**

---

## 🌐 Application Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/login` | Login |
| `/signup` | Register |
| `/dashboard` | Main dashboard |
| `/transactions` | Transaction management |
| `/analytics` | Charts & analytics |
| `/profile` | User profile |

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Transactions (JWT required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List with filters |
| GET | `/api/transactions/summary` | Dashboard summary |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/export/csv` | Export CSV |

**Query Parameters for GET /api/transactions:**
- `type` – `income` or `expense`
- `category` – Filter by category
- `search` – Search notes/categories
- `startDate` – From date (YYYY-MM-DD)
- `endDate` – To date (YYYY-MM-DD)
- `limit` – Results per page (default: 50)
- `offset` – Pagination offset

---

## 🗄️ Database Schema

### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| name | VARCHAR(100) | Display name |
| email | VARCHAR(150) UNIQUE | Login email |
| password | VARCHAR(255) | bcrypt hash |
| currency | VARCHAR(10) | Preferred currency |
| dark_mode | TINYINT | Dark mode preference |
| created_at | TIMESTAMP | Registration date |

### `transactions`
| Column | Type | Description |
|--------|------|-------------|
| id | INT AUTO_INCREMENT | Primary key |
| user_id | INT | Foreign key → users |
| type | ENUM | `income` or `expense` |
| category | VARCHAR(50) | Category name |
| amount | DECIMAL(12,2) | Transaction amount |
| date | DATE | Transaction date |
| note | TEXT | Optional description |
| created_at | TIMESTAMP | Creation timestamp |

---

## ✨ Features

### 🔐 Authentication
- JWT-based authentication (7-day tokens)
- bcrypt password hashing (10 salt rounds)
- HTTP-only cookies + Authorization header
- Protected routes with middleware

### 📊 Dashboard
- Total balance, income, expense cards
- Savings rate percentage
- Monthly income vs expense bar chart
- Expense breakdown doughnut chart
- Recent 5 transactions
- Quick add transaction widget
- Top categories with progress bars

### 💳 Transactions
- Full CRUD (Create, Read, Update, Delete)
- Categories: Food, Transport, Shopping, Bills, Health, Entertainment, Education, Other
- Income categories: Salary, Freelance, Investment, Gift, Other
- Date selection & notes
- Search by note/category
- Filter by type, category, date range
- Pagination (20 per page)
- Export to CSV

### 📈 Analytics
- Income vs Expenses line chart (trend)
- Category pie chart
- Horizontal bar chart (top categories)
- Monthly net balance chart
- Category details table with progress bars

### 🎨 UI/UX
- Modern fintech-style design
- Dark mode toggle (persisted)
- Fully responsive (mobile/tablet/desktop)
- Smooth animations & transitions
- Toast notifications
- Loading spinners
- Password strength indicator
- Sidebar navigation
- Sticky topbar

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | PostgreSQL 14+ |
| Auth | JWT + bcrypt |
| Frontend | Vanilla JavaScript |
| Charts | Chart.js 4 |
| Styling | Custom CSS (CSS Variables) |
| Fonts | DM Sans + DM Mono |

---

## 🔧 Troubleshooting

**Database connection failed**
- Ensure PostgreSQL is running (e.g. `sudo service postgresql start` or use PG Desktop)
- Verify credentials in `.env`

**Port already in use**
- Change `PORT` in `.env`
- Or kill the process: `lsof -ti:3000 | xargs kill`

**JWT errors after changing secret**
- Users will need to log in again (old tokens invalidated)

---

## 📄 Demo Account
- **Email:** demo@example.com
- **Password:** demo1234
