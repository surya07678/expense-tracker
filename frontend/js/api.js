// ============================================================
// frontend/js/api.js - API Client & Shared Utilities
// Handles all communication with the backend
// ============================================================

const API_BASE = '/api';

// ── Token Management ──────────────────────────────────────────
const Auth = {
    getToken: () => localStorage.getItem('et_token'),
    setToken: (token) => localStorage.setItem('et_token', token),
    removeToken: () => localStorage.removeItem('et_token'),

    getUser: () => {
        const u = localStorage.getItem('et_user');
        return u ? JSON.parse(u) : null;
    },
    setUser: (user) => {
        localStorage.setItem('et_user', JSON.stringify(user));
        // Update dark mode if user preference exists
        if (typeof user.dark_mode !== 'undefined') {
            DarkMode.set(user.dark_mode === 1);
        }
    },
    removeUser: () => localStorage.removeItem('et_user'),

    isLoggedIn: () => !!localStorage.getItem('et_token'),

    logout: async () => {
        try { await apiRequest('/auth/logout', { method: 'POST' }); } catch(e) {}
        Auth.removeToken();
        Auth.removeUser();
        window.location.href = '/login';
    },

    requireAuth: () => {
        if (!Auth.isLoggedIn()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    },

    redirectIfLoggedIn: () => {
        if (Auth.isLoggedIn()) {
            window.location.href = '/dashboard';
            return true;
        }
        return false;
    }
};

// ── Core API Request Function ─────────────────────────────────
async function apiRequest(endpoint, options = {}) {
    const token = Auth.getToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        },
        ...options
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await res.json();

        if (res.status === 401) {
            Auth.removeToken();
            Auth.removeUser();
            window.location.href = '/login';
            return;
        }

        return { ok: res.ok, status: res.status, data };
    } catch (err) {
        console.error('API Error:', err);
        return { ok: false, status: 0, data: { success: false, message: 'Network error. Check your connection.' } };
    }
}

// ── Auth API ──────────────────────────────────────────────────
const AuthAPI = {
    signup: (payload) => apiRequest('/auth/signup', { method: 'POST', body: payload }),
    login:  (payload) => apiRequest('/auth/login',  { method: 'POST', body: payload }),
    logout: ()        => apiRequest('/auth/logout',  { method: 'POST' }),
    getMe:  ()        => apiRequest('/auth/me'),
    updateProfile: (payload) => apiRequest('/auth/profile', { method: 'PUT', body: payload })
};

// ── Transactions API ──────────────────────────────────────────
const TransactionsAPI = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return apiRequest(`/transactions${qs ? '?' + qs : ''}`);
    },
    getSummary: () => apiRequest('/transactions/summary'),
    create: (payload)     => apiRequest('/transactions', { method: 'POST', body: payload }),
    update: (id, payload) => apiRequest(`/transactions/${id}`, { method: 'PUT', body: payload }),
    delete: (id)          => apiRequest(`/transactions/${id}`, { method: 'DELETE' }),
    exportCSV: ()         => { window.location.href = `${API_BASE}/transactions/export/csv`; }
};

// ── Toast Notifications ───────────────────────────────────────
const Toast = {
    container: null,

    init() {
        this.container = document.querySelector('.toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 3500) {
        if (!this.container) this.init();

        const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success: (msg) => Toast.show(msg, 'success'),
    error:   (msg) => Toast.show(msg, 'error'),
    info:    (msg) => Toast.show(msg, 'info'),
    warning: (msg) => Toast.show(msg, 'warning')
};

// ── Format Helpers ────────────────────────────────────────────
const Format = {
    currency(amount, currency = 'INR') {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency, minimumFractionDigits: 2
        }).format(amount || 0);
    },

    date(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    shortDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    relativeTime(dateStr) {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return Format.date(dateStr.split('T')[0]);
    }
};

// ── Category Helpers ──────────────────────────────────────────
const Categories = {
    expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'],
    income:  ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],

    icons: {
        'Food': '🍔', 'Transport': '🚗', 'Shopping': '🛍️', 'Bills': '📄',
        'Health': '💊', 'Entertainment': '🎮', 'Education': '📚', 'Other': '📦',
        'Salary': '💼', 'Freelance': '💻', 'Investment': '📈', 'Gift': '🎁'
    },

    cssClass(category) {
        const map = {
            'Food': 'cat-food', 'Transport': 'cat-transport', 'Shopping': 'cat-shopping',
            'Bills': 'cat-bills', 'Health': 'cat-health', 'Entertainment': 'cat-entertainment',
            'Education': 'cat-education', 'Salary': 'cat-salary', 'Freelance': 'cat-freelance',
            'Investment': 'cat-investment', 'Gift': 'cat-investment', 'Other': 'cat-other'
        };
        return map[category] || 'cat-other';
    },

    icon(category) {
        return this.icons[category] || '💰';
    },

    chartColors: [
        '#4F46E5','#10B981','#EF4444','#F59E0B','#8B5CF6',
        '#06B6D4','#EC4899','#84CC16','#F97316','#6366F1'
    ]
};

// ── Sidebar Navigation ─────────────────────────────────────────
function initSidebar() {
    // Mark active link
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.startsWith(href) && href !== '/') {
            link.classList.add('active');
        } else if (href === '/dashboard' && currentPath === '/dashboard') {
            link.classList.add('active');
        }
    });

    // Populate user info
    const user = Auth.getUser();
    if (user) {
        const nameEl  = document.querySelector('.user-name');
        const emailEl = document.querySelector('.user-email');
        const avatarEl = document.querySelector('.user-avatar');
        if (nameEl)   nameEl.textContent  = user.name;
        if (emailEl)  emailEl.textContent = user.email;
        if (avatarEl) avatarEl.textContent = user.name?.charAt(0)?.toUpperCase() || 'U';
    }

    // Mobile menu toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (menuBtn && sidebar && overlay) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        });
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    }

    // Logout button
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', () => Auth.logout());
    });
}

// ── Initialize on DOM Load ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    Toast.init();
    if (document.querySelector('.sidebar')) {
        initSidebar();
    }
});
