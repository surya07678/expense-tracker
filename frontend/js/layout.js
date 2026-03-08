// ============================================================
// frontend/js/layout.js - Shared Layout Components
// Injects sidebar and topbar into authenticated pages
// ============================================================

/**
 * Renders the shared sidebar navigation into #sidebar-container
 * @param {string} pageTitle - Current page title for topbar
 * @param {string} breadcrumb - Breadcrumb subtitle
 */
function renderLayout(pageTitle = 'Dashboard', breadcrumb = 'Overview') {
    // Inject sidebar overlay for mobile
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    const sidebarHTML = `
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
            <div class="logo-icon">💰</div>
            <div>
                <div class="brand-name">SpendWise</div>
                <div class="brand-tagline">Smart Money Tracker</div>
            </div>
        </div>

        <nav class="sidebar-nav">
            <div class="sidebar-section-label">Main</div>
            <a href="/dashboard" class="sidebar-link">
                <span class="nav-icon">🏠</span> Dashboard
            </a>
            <a href="/transactions" class="sidebar-link">
                <span class="nav-icon">📋</span> Transactions
            </a>
            <a href="/analytics" class="sidebar-link">
                <span class="nav-icon">📊</span> Analytics
            </a>

            <div class="sidebar-section-label" style="margin-top:12px">Account</div>
            <a href="/profile" class="sidebar-link">
                <span class="nav-icon">👤</span> Profile
            </a>
            <button class="sidebar-link" data-action="logout" style="width:100%;text-align:left;border:none;background:none;color:var(--text-sidebar)">
                <span class="nav-icon">🚪</span> Logout
            </button>
        </nav>

        <div class="sidebar-footer">
            <a href="/profile" class="sidebar-user" style="text-decoration:none">
                <div class="user-avatar">U</div>
                <div class="user-info">
                    <div class="user-name">Loading...</div>
                    <div class="user-email">loading...</div>
                </div>
            </a>
        </div>
    </aside>`;

    const topbarHTML = `
    <div class="topbar">
        <div class="topbar-left">
            <button class="mobile-menu-btn" id="mobileMenuBtn">☰</button>
            <div>
                <div class="topbar-page-title">${pageTitle}</div>
                <div class="topbar-breadcrumb">${breadcrumb}</div>
            </div>
        </div>
        <div class="topbar-right">
            <button class="topbar-btn" id="notifBtn" title="Notifications" style="position:relative">
                🔔
                <span class="notification-dot" id="notifDot" style="display:none"></span>
            </button>
            <a href="/profile" class="topbar-btn" title="Profile">👤</a>
        </div>
    </div>`;

    // Inject into page
    const sidebarContainer = document.getElementById('sidebar-container');
    const topbarContainer  = document.getElementById('topbar-container');

    if (sidebarContainer) sidebarContainer.innerHTML = sidebarHTML;
    if (topbarContainer)  topbarContainer.innerHTML  = topbarHTML;
}
