// components/admin/AdminDashboardLayout.jsx - Modern Bento Box Layout (Nexora Standard)
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  LogOut,
  Sprout,
  Calendar,
  Sparkles,
  User,
  FileText,
  Shield,
  Truck,
  X,
  ArrowRight,
  ShoppingCart,
  Package
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { ROUTES } from '../../routes';
import './AdminDashboardLayout.css';

export default function AdminDashboardLayout() {
  const { adminProfile, logout, toastMessage } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  // Dropdown & modal states
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  const actionsRef = useRef(null);

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

  // Close dropdowns on route transition
  useEffect(() => {
    setShowProfileMenu(false);
    setShowNotifMenu(false);
    setShowSearchModal(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.ADMIN);
  };

  const navLinks = [
    { to: ROUTES.ADMIN, label: 'Dashboard', shortLabel: 'Dashboard', end: true },
    { to: ROUTES.ADMIN_FARMERS, label: 'Farmer Management', shortLabel: 'Farmer' },
    { to: ROUTES.ADMIN_BUYERS, label: 'Buyer Management', shortLabel: 'Buyer' },
    { to: ROUTES.ADMIN_DRIVERS, label: 'Driver Management', shortLabel: 'Driver' },
    { to: ROUTES.ADMIN_REQUESTS, label: 'Purchase Requests', shortLabel: 'Requests' },
    { to: ROUTES.ADMIN_DELIVERIES, label: 'Delivery Management', shortLabel: 'Delivery' },
    { to: ROUTES.ADMIN_ORDERS, label: 'Order Management', shortLabel: 'Orders' },
    { to: ROUTES.ADMIN_REPORTS, label: 'Reports & Analytics', shortLabel: 'Report' }
  ];

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const adminName = adminProfile?.name ? adminProfile.name.split(' ')[0] : 'Administrator';
  const adminInitials = adminProfile?.name
    ? adminProfile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'NU';

  // Dynamic page subtitle based on active admin route
  const getPageSubtitle = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/farmers')) return 'Farmer Accounts & Crop Directory';
    if (path.includes('/buyers')) return 'Commercial Buyers & Procurement Enquiries';
    if (path.includes('/drivers')) return 'Driver Roster & Fleet Assignment';
    if (path.includes('/requests')) return 'Procurement Enquiries & Commercial Purchase Offers';
    if (path.includes('/deliveries')) return 'Live Consignments & Dispatch Status';
    if (path.includes('/orders')) return 'Order Lifecycle, Escrow Holds & Financial Settlements';
    if (path.includes('/reports')) return 'Operations Reports & Data Export';
    if (path.includes('/profile')) return 'Administrator Account & Security Settings';
    return 'Platform Vitality & Ledger Overview';
  };

  const todayStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const searchResults = [
    { title: 'Farmer Producers Directory', path: ROUTES.ADMIN_FARMERS, icon: Sprout, cat: 'Directory' },
    { title: 'Commercial Buyers Network', path: ROUTES.ADMIN_BUYERS, icon: User, cat: 'Directory' },
    { title: 'EV Fleet Driver Roster', path: ROUTES.ADMIN_DRIVERS, icon: Truck, cat: 'Logistics' },
    { title: 'Purchase Requests & Inquiries', path: ROUTES.ADMIN_REQUESTS, icon: ShoppingCart, cat: 'Commercial' },
    { title: 'Live EV Fleet Dispatches', path: ROUTES.ADMIN_DELIVERIES, icon: Truck, cat: 'Logistics' },
    { title: 'Commercial Orders & Escrow Ledger', path: ROUTES.ADMIN_ORDERS, icon: Package, cat: 'Commercial' },
    { title: 'Commodity Supply & Demand Ledger', path: ROUTES.ADMIN_REPORTS, icon: FileText, cat: 'Analytics' }
  ].filter((item) => !quickSearchQuery.trim() || item.title.toLowerCase().includes(quickSearchQuery.toLowerCase()));

  return (
    <div className="admin-layout-wrapper">
      <div className="admin-main-container">
        {/* ================================================================= */}
        {/* TOP HEADER (Brand Logo + Circle Action Icons)                     */}
        {/* ================================================================= */}
        <header className="admin-top-navbar">
          {/* Left Brand */}
          <NavLink to={ROUTES.ADMIN} className="admin-brand-group" title="Naam Uzhavar Central Operations">
            <img
              src="/logo.png"
              alt="Naam Uzhavar"
              className="admin-brand-logo-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/logo-emblem.png';
              }}
            />
            <div className="d-flex flex-column">
              <h1 className="admin-brand-title">Naam Uzhavar</h1>
              <span className="admin-brand-subtitle">Central Operations Console</span>
            </div>
          </NavLink>

          {/* Right Action Icons (Unified Harmonious Luxury Toolbar) */}
          <div className="admin-header-actions" ref={actionsRef}>
            {/* 1. Quick Search Trigger */}
            <button
              type="button"
              className={`admin-circle-btn ${showSearchModal ? 'active' : ''}`}
              title="Search Directory"
              aria-label="Search Directory"
              onClick={() => setShowSearchModal(true)}
            >
              <Search size={17} />
            </button>

            {/* 2. Notifications Popover Trigger */}
            <button
              type="button"
              className={`admin-circle-btn ${showNotifMenu ? 'active' : ''}`}
              title="Operational Notifications"
              aria-label="Notifications"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowProfileMenu(false);
              }}
            >
              <Bell size={17} />
              <span className="admin-notification-dot" />
            </button>

            {/* Notifications Dropdown Popover */}
            {showNotifMenu && (
              <div className="admin-popover-menu admin-notif-popover">
                <div className="admin-notif-header">
                  <span className="admin-notif-title">Operational Alerts</span>
                  <span className="admin-notif-badge">3 New</span>
                </div>
                <div className="admin-notif-list">
                  <div className="admin-notif-item">
                    <div className="admin-notif-icon-box blue">
                      <Truck size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="admin-notif-text">EV Cargo #TN-57 en route to Madurai receiving dock</div>
                      <div className="admin-notif-time">12 mins ago · Logistics</div>
                    </div>
                  </div>

                  <div className="admin-notif-item">
                    <div className="admin-notif-icon-box lime">
                      <Sprout size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="admin-notif-text">200 Kg Organic Tomatoes staged at Thanjavur Hub</div>
                      <div className="admin-notif-time">35 mins ago · Farmer Yield</div>
                    </div>
                  </div>

                  <div className="admin-notif-item">
                    <div className="admin-notif-icon-box amber">
                      <Shield size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="admin-notif-text">Dindigul Central Hub storage at 82% capacity</div>
                      <div className="admin-notif-time">2 hrs ago · Hub Operations</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Executive Profile Monogram & Dropdown Trigger */}
            <button
              type="button"
              className="admin-profile-circle"
              title="Administrator Account & Settings"
              aria-label="Account Settings"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifMenu(false);
              }}
            >
              {adminProfile?.avatar && !adminProfile.avatar.includes('photo-1534528741775-53994a69daeb') ? (
                <img
                  src={adminProfile.avatar}
                  alt="Admin"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span>{adminInitials}</span>
              )}
              <span className="admin-profile-status-dot" title="Active Console Session" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="admin-popover-menu admin-profile-popover">
                <div className="admin-dropdown-header">
                  <div className="admin-dropdown-avatar">
                    {adminProfile?.avatar && !adminProfile.avatar.includes('photo-1534528741775-53994a69daeb') ? (
                      <img
                        src={adminProfile.avatar}
                        alt="Admin"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span>{adminInitials}</span>
                    )}
                  </div>
                  <div className="admin-dropdown-meta">
                    <div className="admin-dropdown-name">{adminProfile?.name || 'Administrator'}</div>
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
                  <User size={15} />
                  <span>Account & Security Settings</span>
                </NavLink>

                <NavLink
                  to={ROUTES.ADMIN_REPORTS}
                  className="admin-dropdown-item"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <FileText size={15} />
                  <span>Audit Ledger & Reports</span>
                </NavLink>

                <div className="admin-dropdown-divider" />

                <button
                  type="button"
                  className="admin-dropdown-item logout"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Sign Out of Console</span>
                </button>
              </div>
            )}

            {/* 4. Harmonious Direct Sign Out Action (Matching Clean White Circle) */}
            <button
              type="button"
              className="admin-circle-btn admin-logout-btn"
              onClick={handleLogout}
              title="Terminate Admin Session"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* ================================================================= */}
        {/* SECONDARY NAVIGATION BAR (Brought Down Under Header)              */}
        {/* ================================================================= */}
        <nav className="admin-navbar-subrow" aria-label="Admin Modules Navigation">
          <div className="admin-nav-pill-container">
            {navLinks.map((item) => (
              <NavLink
                key={item.to || item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav-pill ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Quick Search Modal Palette */}
        {showSearchModal && (
          <div className="admin-search-backdrop" onClick={() => setShowSearchModal(false)}>
            <div className="admin-search-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="admin-search-dialog-header">
                <Search size={18} className="text-muted" />
                <input
                  type="text"
                  className="admin-search-dialog-input"
                  placeholder="Quick search farmers, buyers, EV dispatches, reports..."
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="admin-micro-circle-btn"
                  onClick={() => setShowSearchModal(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="admin-search-dialog-list">
                <div className="admin-search-dialog-label">Quick Jump Navigation</div>
                {searchResults.map((item, idx) => {
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
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* HERO GREETING BANNER ("Good morning Benicio Baker 👋")             */}
        {/* ================================================================= */}
        <div className="admin-greeting-section">
          <div>
            <h2 className="admin-greeting-title">
              <span>{getGreeting()}</span>
              <span className="admin-greeting-name">{adminProfile?.name || 'Administrator'}</span>
              <span className="admin-greeting-wave">👋</span>
            </h2>
            <div className="text-muted small mt-1" style={{ fontSize: '12.5px' }}>
              {getPageSubtitle()}
            </div>
          </div>

          <div className="admin-date-pill">
            <span>{todayStr}</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* PAGE CONTENT ROUTE OUTLET                                         */}
        {/* ================================================================= */}
        <main className="admin-content-view">
          <Outlet />
        </main>
      </div>

      {/* Global Toast */}
      {toastMessage && (
        <div className={`admin-toast ${toastMessage.type}`}>
          <span>{toastMessage.message}</span>
        </div>
      )}
    </div>
  );
}
