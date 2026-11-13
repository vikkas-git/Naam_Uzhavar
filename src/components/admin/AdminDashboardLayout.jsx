// components/admin/AdminDashboardLayout.jsx - Premium Enterprise SaaS Layout with Elegant Sidebar
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Store,
  Truck,
  ShoppingCart,
  Layers,
  Package,
  BarChart3,
  Search,
  Bell,
  LogOut,
  Calendar,
  User,
  FileText,
  ShieldCheck,
  X,
  ArrowRight,
  Menu,
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { ROUTES } from '../../routes';
import './AdminDashboardLayout.css';

export default function AdminDashboardLayout() {
  const { adminProfile, logout, toastMessage } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation and popover states
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  const actionsRef = useRef(null);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowProfileMenu(false);
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus and mobile drawer on route transition
  useEffect(() => {
    setShowProfileMenu(false);
    setShowNotifMenu(false);
    setShowSearchModal(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Global keyboard shortcut: Ctrl+K / Cmd+K opens search palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowSearchModal(false);
        setShowProfileMenu(false);
        setShowNotifMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.ADMIN);
  };

  // Structured sidebar navigation groups (Beginner-Friendly & Intuitive)
  const navigationGroups = [
    {
      groupLabel: 'MAIN',
      items: [
        { to: ROUTES.ADMIN, label: 'Dashboard', icon: LayoutDashboard, end: true }
      ]
    },
    {
      groupLabel: 'PEOPLE & FLEET',
      items: [
        { to: ROUTES.ADMIN_FARMERS, label: 'Farmers', icon: Sprout },
        { to: ROUTES.ADMIN_BUYERS, label: 'Buyers', icon: Store },
        { to: ROUTES.ADMIN_DRIVERS, label: 'Drivers', icon: Truck }
      ]
    },
    {
      groupLabel: 'COMMERCIAL',
      items: [
        { to: ROUTES.ADMIN_REQUESTS, label: 'Purchase Requests', icon: ShoppingCart },
        { to: ROUTES.ADMIN_DELIVERIES, label: 'Deliveries', icon: Layers },
        { to: ROUTES.ADMIN_ORDERS, label: 'Orders', icon: Package }
      ]
    },
    {
      groupLabel: 'ANALYTICS & SETTINGS',
      items: [
        { to: ROUTES.ADMIN_REPORTS, label: 'Reports', icon: BarChart3 },
        { to: ROUTES.ADMIN_PROFILE, label: 'Settings', icon: ShieldCheck }
      ]
    }
  ];

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const adminName = adminProfile?.name ? adminProfile.name.split(' ')[0] : 'Administrator';
  const adminFullName = adminProfile?.name || 'Central Operations Admin';
  const adminInitials = adminProfile?.name
    ? adminProfile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'NU';

  // Dynamic page context for breadcrumbs and title
  const getPageContext = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/farmers')) {
      return { category: 'People', title: 'Farmers', sub: 'View registered farmers and verified farm profiles' };
    }
    if (path.includes('/buyers')) {
      return { category: 'People', title: 'Buyers', sub: 'View commercial buyers, stores, and hotels' };
    }
    if (path.includes('/drivers')) {
      return { category: 'Fleet', title: 'Drivers', sub: 'Manage delivery drivers and vehicle details' };
    }
    if (path.includes('/requests')) {
      return { category: 'Orders', title: 'Purchase Requests', sub: 'Review purchase inquiries from buyers' };
    }
    if (path.includes('/deliveries')) {
      return { category: 'Fleet', title: 'Deliveries', sub: 'Track dispatches from farm gates to buyer destinations' };
    }
    if (path.includes('/orders')) {
      return { category: 'Orders', title: 'Orders', sub: 'Track customer orders, payments, and payouts' };
    }
    if (path.includes('/reports')) {
      return { category: 'Analytics', title: 'Reports', sub: 'View business performance and export data' };
    }
    if (path.includes('/profile')) {
      return { category: 'Settings', title: 'Admin Settings', sub: 'Manage administrator account and credentials' };
    }
    return { category: 'Home', title: 'Dashboard', sub: 'Welcome back. Here is a simple overview of your platform today.' };
  };

  const pageContext = getPageContext();

  const todayStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const searchResults = [
    { title: 'Farmer Directory', path: ROUTES.ADMIN_FARMERS, icon: Sprout, cat: 'People' },
    { title: 'Commercial Buyers', path: ROUTES.ADMIN_BUYERS, icon: Store, cat: 'People' },
    { title: 'Delivery Drivers', path: ROUTES.ADMIN_DRIVERS, icon: Truck, cat: 'Fleet' },
    { title: 'Purchase Requests', path: ROUTES.ADMIN_REQUESTS, icon: ShoppingCart, cat: 'Orders' },
    { title: 'Live Deliveries', path: ROUTES.ADMIN_DELIVERIES, icon: Layers, cat: 'Fleet' },
    { title: 'Orders & Payments', path: ROUTES.ADMIN_ORDERS, icon: Package, cat: 'Orders' },
    { title: 'Reports & Analytics', path: ROUTES.ADMIN_REPORTS, icon: BarChart3, cat: 'Analytics' },
    { title: 'Account Settings', path: ROUTES.ADMIN_PROFILE, icon: ShieldCheck, cat: 'Settings' }
  ].filter((item) => !quickSearchQuery.trim() || item.title.toLowerCase().includes(quickSearchQuery.toLowerCase()));

  return (
    <div className="admin-enterprise-shell">
      {/* Mobile Off-Canvas Backdrop */}
      {mobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ===================================================================== */}
      {/* 1. ELEGANT ENTERPRISE SIDEBAR                                         */}
      {/* ===================================================================== */}
      <aside className={`admin-enterprise-sidebar ${mobileOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-brand">
          <NavLink to={ROUTES.ADMIN} className="admin-brand-link" title="Naam Uzhavar Central Operations">
            <img
              src="/logo.png"
              alt="Naam Uzhavar"
              className="admin-sidebar-logo"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/logo-emblem.png';
              }}
            />
            <div className="admin-sidebar-brand-meta">
              <span className="admin-brand-name">Naam Uzhavar</span>
              <span className="admin-brand-tag">ADMIN PORTAL</span>
            </div>
          </NavLink>

          {/* Desktop Collapse Rail Toggle */}
          <button
            type="button"
            className="admin-sidebar-collapse-btn d-none d-lg-flex"
            onClick={toggleSidebarCollapse}
            title={sidebarCollapsed ? "Expand Sidebar (260px)" : "Collapse Sidebar (72px)"}
            aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronLeft size={14} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>

          {/* Mobile Drawer Close Button */}
          <button
            type="button"
            className="admin-sidebar-close-btn d-lg-none"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sidebar Nav Links with Groups */}
        <nav className="admin-sidebar-nav" aria-label="Operations Navigation">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="admin-nav-group">
              <span className="admin-nav-group-title">{group.groupLabel}</span>
              <ul className="admin-nav-list">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                        title={item.label}
                      >
                        <Icon size={16} className="admin-nav-icon" />
                        <span className="admin-nav-label">{item.label}</span>
                        <ChevronRight size={13} className="admin-nav-chevron ms-auto" />
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer Profile Capsule */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user-card" title={sidebarCollapsed ? `${adminFullName} (Super Admin)` : undefined}>
            <div className="admin-sidebar-user-avatar">
              {adminProfile?.avatar && !adminProfile.avatar.includes('photo-1534528741775-53994a69daeb') ? (
                <img src={adminProfile.avatar} alt="Admin" />
              ) : (
                <span>{adminInitials}</span>
              )}
              <span className="admin-sidebar-live-dot" title="Authenticated session" />
            </div>
            <div className="admin-sidebar-user-info">
              <div className="admin-sidebar-user-name" title={adminFullName}>{adminName}</div>
              <div className="admin-sidebar-user-role">Super Admin</div>
            </div>
            <button
              type="button"
              className="admin-sidebar-logout-action"
              onClick={handleLogout}
              title="Terminate Admin Session"
              aria-label="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* 2. MAIN WORKSPACE CONTAINER                                          */}
      {/* ===================================================================== */}
      <div className={`admin-enterprise-workspace ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Header Bar */}
        <header className="admin-workspace-header">
          <div className="d-flex align-items-center gap-2 min-w-0">
            {/* Mobile Hamburger Trigger */}
            <button
              type="button"
              className="admin-menu-toggle d-lg-none"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb Context */}
            <div className="admin-header-breadcrumbs d-none d-sm-flex align-items-center gap-1.5">
              <span className="admin-breadcrumb-root">Console</span>
              <span className="admin-breadcrumb-sep">/</span>
              <span className="admin-breadcrumb-cat">{pageContext.category}</span>
              <span className="admin-breadcrumb-sep">/</span>
              <span className="admin-breadcrumb-active">{pageContext.title}</span>
            </div>
          </div>

          {/* Center Search Palette Trigger */}
          <button
            type="button"
            className="admin-header-search-trigger"
            onClick={() => setShowSearchModal(true)}
            title="Search Platform (Ctrl+K)"
          >
            <Search size={14} className="text-muted flex-shrink-0" />
            <span className="admin-search-text">Search farmers, buyers, orders...</span>
            <kbd className="admin-search-kbd">Ctrl K</kbd>
          </button>

          {/* Right Action Icons Toolbar */}
          <div className="admin-header-actions" ref={actionsRef}>
            {/* System Online Status Badge */}
            <div className="admin-status-pill d-none d-md-flex align-items-center" title="All platform services are operational">
              <span className="admin-status-live-indicator" />
              <span className="admin-status-text">System Online</span>
            </div>

            {/* Notifications Popover Trigger */}
            <button
              type="button"
              className={`admin-icon-btn ${showNotifMenu ? 'active' : ''}`}
              title="Operational Alerts"
              aria-label="Notifications"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowProfileMenu(false);
              }}
            >
              <Bell size={16} />
              <span className="admin-notif-ping" />
            </button>

            {/* Notifications Dropdown */}
            {showNotifMenu && (
              <div className="admin-popover-menu admin-notif-popover">
                <div className="admin-notif-header">
                  <span className="admin-notif-title">Operational Alerts</span>
                  <span className="admin-notif-badge">3 New</span>
                </div>
                <div className="admin-notif-list">
                  <div className="admin-notif-item">
                    <div className="admin-notif-icon-box blue">
                      <Truck size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="admin-notif-text">EV Cargo #TN-57 en route to Madurai receiving dock</div>
                      <div className="admin-notif-time">12 mins ago · Logistics Fleet</div>
                    </div>
                  </div>

                  <div className="admin-notif-item">
                    <div className="admin-notif-icon-box green">
                      <Sprout size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="admin-notif-text">200 Kg Organic Tomatoes staged at Thanjavur Hub</div>
                      <div className="admin-notif-time">35 mins ago · Farmer Yield</div>
                    </div>
                  </div>

                  <div className="admin-notif-item">
                    <div className="admin-notif-icon-box ochre">
                      <ShieldCheck size={13} />
                    </div>
                    <div className="min-w-0">
                      <div className="admin-notif-text">Dindigul Central Hub cold storage at 82% capacity</div>
                      <div className="admin-notif-time">2 hrs ago · Storage Audit</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Profile Pill Trigger */}
            <button
              type="button"
              className={`admin-profile-pill ${showProfileMenu ? 'active' : ''}`}
              title="Administrator Profile"
              aria-label="Account Settings"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifMenu(false);
              }}
            >
              <div className="admin-profile-monogram">
                {adminProfile?.avatar && !adminProfile.avatar.includes('photo-1534528741775-53994a69daeb') ? (
                  <img src={adminProfile.avatar} alt="Admin" />
                ) : (
                  <span>{adminInitials}</span>
                )}
              </div>
              <span className="admin-profile-pill-label d-none d-sm-inline">{adminName}</span>
              <ChevronDown size={13} className="text-muted d-none d-sm-inline" />
            </button>

            {/* Profile Popover Menu */}
            {showProfileMenu && (
              <div className="admin-popover-menu admin-profile-popover">
                <div className="admin-dropdown-header">
                  <div className="admin-dropdown-avatar">
                    {adminProfile?.avatar && !adminProfile.avatar.includes('photo-1534528741775-53994a69daeb') ? (
                      <img src={adminProfile.avatar} alt="Admin" />
                    ) : (
                      <span>{adminInitials}</span>
                    )}
                  </div>
                  <div className="admin-dropdown-meta">
                    <div className="admin-dropdown-name">{adminFullName}</div>
                    <div className="admin-dropdown-email">{adminProfile?.email || 'admin@naamuzhavar.com'}</div>
                    <span className="admin-dropdown-role-badge">SUPER ADMIN</span>
                  </div>
                </div>

                <div className="admin-dropdown-divider" />

                <NavLink
                  to={ROUTES.ADMIN_PROFILE}
                  className="admin-dropdown-item"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User size={14} />
                  <span>Account & Security Settings</span>
                </NavLink>

                <NavLink
                  to={ROUTES.ADMIN_REPORTS}
                  className="admin-dropdown-item"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <FileText size={14} />
                  <span>Audit Reports & Ledger</span>
                </NavLink>

                <div className="admin-dropdown-divider" />

                <button
                  type="button"
                  className="admin-dropdown-item logout"
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  <span>Sign Out of Console</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* =================================================================== */}
        {/* CONTEXTUAL PAGE HEADER & GREETING BANNER                           */}
        {/* =================================================================== */}
        <div className="admin-context-bar">
          <div className="admin-context-title-group">
            <h2 className="admin-page-heading">
              <span>{pageContext.title}</span>
            </h2>
            <p className="admin-page-subtext">{pageContext.sub}</p>
          </div>

          <div className="admin-context-aside d-none d-sm-flex align-items-center gap-3">
            <div className="admin-time-greeting">
              <span className="admin-greeting-prefix">{getGreeting()}, </span>
              <strong className="text-dark">{adminName}</strong>
              <span className="ms-1">👋</span>
            </div>
            <div className="admin-date-capsule">
              <Calendar size={13} className="text-muted" />
              <span>{todayStr}</span>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* OUTLET: SUB-PAGE RENDER CONTAINER                                   */}
        {/* =================================================================== */}
        <main className="admin-page-viewport">
          <Outlet />
        </main>
      </div>

      {/* ===================================================================== */}
      {/* 3. GLOBAL SEARCH PALETTE DIALOG MODAL                                 */}
      {/* ===================================================================== */}
      {showSearchModal && (
        <div className="admin-search-backdrop" onClick={() => setShowSearchModal(false)}>
          <div className="admin-search-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-search-dialog-header">
              <Search size={16} className="text-muted flex-shrink-0" />
              <input
                type="text"
                className="admin-search-dialog-input"
                placeholder="Search farmers, buyers, EV dispatches, orders, reports..."
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setShowSearchModal(false)}
                aria-label="Close search"
              >
                <X size={14} />
              </button>
            </div>

            <div className="admin-search-dialog-list">
              <div className="admin-search-dialog-label">Quick Jump Navigation</div>
              {searchResults.length === 0 ? (
                <div className="text-muted small py-3 text-center">No matching operational records found.</div>
              ) : (
                searchResults.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="admin-search-dialog-item"
                      onClick={() => {
                        navigate(item.path);
                        setShowSearchModal(false);
                      }}
                    >
                      <div className="admin-search-dialog-item-icon">
                        <Icon size={14} />
                      </div>
                      <span className="admin-search-dialog-item-title">{item.title}</span>
                      <span className="admin-search-dialog-item-cat">{item.cat}</span>
                      <ArrowRight size={13} className="text-muted ms-auto" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className={`admin-toast-banner ${toastMessage.type}`}>
          <span>{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
}
