// What this file does: Primary layout shell for Farmer Portal, using the exact Buyer header design and structure.
// Strictly integrates Farmer Green theme (#2F6B3A), removes footer entirely, and provides responsive navigation.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Sprout,
  ShoppingBag,
  History,
  User,
  ChevronDown,
  X,
  Menu,
  LogOut,
  CheckCircle2,
  Info,
  AlertCircle,
  ShieldCheck,
  Wheat,
  PackageCheck
} from 'lucide-react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { ROUTES } from '../../routes';
import Button from '../Button';
import Modal from '../Modal';
import LoadingPage from '../LoadingPage';
import { ModulePageSkeleton } from '../Skeleton';
import { FarmerProvider, useFarmer } from '../../context/FarmerContext';
import './FarmerDashboardLayout.css';

function FarmerDashboardContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainViewportRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const farmer = useFarmer();
  const {
    profile,
    crops,
    requests,
    orders,
    toastMessage,
    setToastMessage,
    signOutModalOpen,
    setSignOutModalOpen,
    handleSignOut,
    lang,
    toggleLang
  } = farmer;

  const p = profile || {};
  const avatarSrc = p.avatar || p.photo || p.photoPreview;
  const [failedAvatar, setFailedAvatar] = useState(false);

  const farmerRole = lang === 'ta' ? 'விவசாயி' : 'Farmer';
  const farmerName = p.name || (lang === 'ta' ? 'ரமேஷ் குமார்' : 'Ramesh Kumar');
  const farmerDisplayName = `${farmerName} (${farmerRole})`;
  const farmSecondaryInfo = p.farmDetails?.farmName
    ? p.farmDetails.farmName
    : `${p.farmDetails?.village || 'Pollachi'}, ${p.farmDetails?.district || 'Coimbatore'}`;

  // Active counts for navigation badges
  const activeCropsCount = useMemo(() => {
    return (crops || []).filter((c) => c.status === 'active' || !c.status).length;
  }, [crops]);

  const pendingRequestsCount = useMemo(() => {
    return (requests || []).filter((r) => r.status === 'PENDING').length;
  }, [requests]);

  // Lock window / body scroll to prevent duplicate native scrollbars while inside Farmer Dashboard
  useEffect(() => {
    document.documentElement.classList.add('dashboard-shell-active');
    document.body.classList.add('dashboard-shell-active');
    return () => {
      document.documentElement.classList.remove('dashboard-shell-active');
      document.body.classList.remove('dashboard-shell-active');
    };
  }, []);

  // Auto-scroll to top on route change
  useEffect(() => {
    if (mainViewportRef.current) {
      mainViewportRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Outside click listener for profile dropdown
  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setProfileDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdownOpen]);

  const handleProfileClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setProfileDropdownOpen(false);
      navigate(ROUTES.FARMER_DASHBOARD_PROFILE);
    } else {
      setProfileDropdownOpen((prev) => !prev);
    }
  };

  return (
    <div className="buyer-dashboard-root farmer-theme">
      {/* ====================================================================
          1. EXACT BUYER TOP NAVIGATION BAR (Header: 64px)
          ==================================================================== */}
      <header className="buyer-topbar">
        <div className="buyer-topbar-left">
          {/* Mobile hamburger menu button */}
          <button
            type="button"
            className="buyer-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo Brand Lockup: Navigates to Farmer Dashboard */}
          <Link
            to={ROUTES.FARMER_DASHBOARD}
            className="buyer-brand-badge"
            style={{ textDecoration: 'none' }}
            title="Go to Home page"
          >
            <img src="/logo.png" alt="Naam Uzhavar" className="buyer-brand-logo-img" />
            <div className="buyer-brand-titles">
              <span className="buyer-brand-title">
                {lang === 'ta' ? 'நாம் உழவர்' : 'Naam Uzhavar'}
              </span>
              <span className="buyer-brand-subtitle">
                {lang === 'ta' ? 'விவசாயிகள் • வாங்குபவர்கள் • ஓட்டுநர்கள்' : 'Farmers • Buyers • Drivers'}
              </span>
            </div>
          </Link>
        </div>

        {/* Topbar Right Actions */}
        <div className="buyer-topbar-right">
          {/* Language Switcher */}
          <button
            type="button"
            className="buyer-lang-btn"
            onClick={toggleLang}
            title="Toggle English / தமிழ்"
          >
            {lang === 'ta' ? 'English' : 'தமிழ்'}
          </button>

          {/* Farmer Profile Pill with Dropdown */}
          <div
            ref={profileDropdownRef}
            className="buyer-topbar-dropdown-wrap buyer-topbar-profile-wrap"
          >
            <button
              type="button"
              className={`buyer-profile-chip-btn ${location.pathname === ROUTES.FARMER_DASHBOARD_PROFILE ? 'active' : ''}`}
              onClick={handleProfileClick}
              aria-label="Farmer Profile"
              aria-expanded={profileDropdownOpen}
              title={farmerDisplayName}
            >
              <div className="buyer-avatar-badge has-photo">
                {avatarSrc && !failedAvatar ? (
                  <img
                    src={avatarSrc}
                    alt={farmerDisplayName}
                    className="buyer-avatar-img"
                    onError={() => setFailedAvatar(true)}
                  />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className="buyer-profile-info-text">
                <span className="buyer-profile-full-name">
                  {farmerDisplayName}
                </span>
                <span className="buyer-role-subtext" title={farmSecondaryInfo}>
                  {farmSecondaryInfo}
                </span>
              </div>
              <ChevronDown size={14} className="buyer-dropdown-caret" />
            </button>

            {profileDropdownOpen && (
              <div className="buyer-dropdown-menu buyer-profile-dropdown d-none d-lg-block">
                <div className="buyer-profile-card-header">
                  <div className="buyer-profile-card-icon has-photo">
                    <img
                      src={avatarSrc || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80'}
                      alt={p.name || 'Farmer'}
                      className="buyer-profile-dropdown-img"
                    />
                  </div>
                  <div className="buyer-profile-header-info">
                    <h4 className="buyer-card-title">{p.name || 'Ramesh Kumar'}</h4>
                    <p className="buyer-card-sub">🌾 {p.farmDetails?.farmName || 'Green Valley Natural Farm'}</p>
                    <p className="buyer-card-sub font-mono">📞 {p.phone || '+91 94432 78190'}</p>
                    <p className="buyer-card-sub">✉️ {p.email || 'farmer@naamuzhavar.com'}</p>
                    <span className="farmer-verified-pill">
                      <ShieldCheck size={12} />
                      <span>{lang === 'ta' ? 'சரிபார்க்கப்பட்ட விவசாயி' : 'Verified Producer'}</span>
                    </span>
                  </div>
                </div>
                <div className="buyer-dropdown-divider" />
                <NavLink
                  to={ROUTES.FARMER_DASHBOARD_PROFILE}
                  className="buyer-dropdown-item"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <User size={15} />
                  <span>{lang === 'ta' ? 'விவசாயி சுயவிவரம்' : 'Farmer Profile & Land'}</span>
                </NavLink>
                <NavLink
                  to={ROUTES.FARMER_DASHBOARD_CROPS}
                  className="buyer-dropdown-item"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <Wheat size={15} />
                  <span>{lang === 'ta' ? 'பயிர் மேலாண்மை' : 'Produce & Active Listings'}</span>
                </NavLink>
                <NavLink
                  to={ROUTES.FARMER_DASHBOARD_REQUESTS}
                  className="buyer-dropdown-item"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <ShoppingBag size={15} />
                  <span>{lang === 'ta' ? 'வாங்குபவர் கோரிக்கைகள்' : 'Buyer Requests'}</span>
                </NavLink>
                <NavLink
                  to={ROUTES.FARMER_DASHBOARD_ORDERS}
                  className="buyer-dropdown-item"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <History size={15} />
                  <span>{lang === 'ta' ? 'ஆர்டர் வரலாறு' : 'Order History'}</span>
                </NavLink>
                <div className="buyer-dropdown-divider" />
                <button
                  type="button"
                  id="farmer-header-signout-btn"
                  className="buyer-dropdown-item logout"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setSignOutModalOpen(true);
                  }}
                >
                  <LogOut size={15} />
                  <span>{lang === 'ta' ? 'வெளியேறு' : 'Sign Out'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. EXACT DESKTOP HORIZONTAL CAPSULE NAVIGATION (Under Header)
          ==================================================================== */}
      <nav className="buyer-desktop-top-navbar d-none d-md-flex" aria-label="Farmer Portal Navigation">
        <div className="buyer-top-nav-container">
          <div className="buyer-top-nav-links">
            <NavLink
              to={ROUTES.FARMER_DASHBOARD}
              end
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <Sprout size={15} />
              <span className="buyer-top-nav-label">{lang === 'ta' ? 'முகப்பு பலகை' : 'Dashboard'}</span>
            </NavLink>

            <NavLink
              to={ROUTES.FARMER_DASHBOARD_CROPS}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <Wheat size={15} />
              <span className="buyer-top-nav-label">{lang === 'ta' ? 'விளைச்சல்' : 'Yields'}</span>
              <span className="buyer-top-nav-badge">{activeCropsCount}</span>
            </NavLink>

            <NavLink
              to={ROUTES.FARMER_DASHBOARD_REQUESTS}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <ShoppingBag size={15} />
              <span className="buyer-top-nav-label">{lang === 'ta' ? 'கோரிக்கைகள்' : 'Requests'}</span>
              {pendingRequestsCount > 0 ? (
                <span className="buyer-top-nav-badge">{pendingRequestsCount}</span>
              ) : (
                <span className="buyer-top-nav-badge neutral">0</span>
              )}
            </NavLink>

            <NavLink
              to={ROUTES.FARMER_DASHBOARD_ORDERS}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <PackageCheck size={15} />
              <span className="buyer-top-nav-label">{lang === 'ta' ? 'ஆர்டர் வரலாறு' : 'Order History'}</span>
              <span className="buyer-top-nav-badge neutral">{orders?.length || 0}</span>
            </NavLink>

            <NavLink
              to={ROUTES.FARMER_DASHBOARD_PROFILE}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <User size={15} />
              <span className="buyer-top-nav-label">{lang === 'ta' ? 'சுயவிவரம்' : 'Profile'}</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* ====================================================================
          3. DASHBOARD BODY & MAIN VIEWPORT (No Footer: reclaimed full height)
          ==================================================================== */}
      <div className="farmer-dashboard-body">
        {/* Mobile Drawer via Bootstrap Offcanvas */}
        <Offcanvas
          show={mobileMenuOpen}
          onHide={() => setMobileMenuOpen(false)}
          placement="start"
          className="buyer-mobile-offcanvas text-white"
          style={{ maxWidth: 280, backgroundColor: '#072a14' }}
        >
          <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-success border-opacity-25 pb-3">
            <Offcanvas.Title>
              <Link
                to={ROUTES.FARMER_DASHBOARD}
                className="d-flex align-items-center gap-2 text-decoration-none"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img src="/logo.png" alt="Naam Uzhavar" width={38} height={38} className="rounded-circle border border-2 border-success object-fit-cover" />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-white small lh-sm">{lang === 'ta' ? 'நாம் உழவர்' : 'Naam Uzhavar'}</span>
                  <span className="fw-bold text-success" style={{ fontSize: '0.68rem' }}>{lang === 'ta' ? 'விவசாயிகள் • வாங்குபவர்கள் • ஓட்டுநர்கள்' : 'Farmers • Buyers • Drivers'}</span>
                </div>
              </Link>
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
            <div className="d-flex flex-column gap-1">
              <NavLink
                to={ROUTES.FARMER_DASHBOARD}
                end
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Sprout size={19} />
                <span className="buyer-nav-label">{lang === 'ta' ? 'முகப்பு பலகை' : 'Dashboard'}</span>
              </NavLink>

              <NavLink
                to={ROUTES.FARMER_DASHBOARD_CROPS}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Wheat size={19} />
                <span className="buyer-nav-label">{lang === 'ta' ? 'விளைச்சல்' : 'Yields'}</span>
                <span className="buyer-nav-badge">{activeCropsCount}</span>
              </NavLink>

              <NavLink
                to={ROUTES.FARMER_DASHBOARD_REQUESTS}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingBag size={19} />
                <span className="buyer-nav-label">{lang === 'ta' ? 'கோரிக்கைகள்' : 'Requests'}</span>
                <span className="buyer-nav-badge">{pendingRequestsCount}</span>
              </NavLink>

              <NavLink
                to={ROUTES.FARMER_DASHBOARD_ORDERS}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <PackageCheck size={19} />
                <span className="buyer-nav-label">{lang === 'ta' ? 'ஆர்டர் வரலாறு' : 'Order History'}</span>
                <span className="buyer-nav-badge neutral">{orders?.length || 0}</span>
              </NavLink>

              <NavLink
                to={ROUTES.FARMER_DASHBOARD_PROFILE}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={19} />
                <span className="buyer-nav-label">{lang === 'ta' ? 'சுயவிவரம்' : 'Profile'}</span>
              </NavLink>

              <div style={{ margin: '14px 0 8px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }} />

              <button
                type="button"
                className="buyer-nav-item text-danger"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSignOutModalOpen(true);
                }}
              >
                <LogOut size={19} />
                <span className="buyer-nav-label">{lang === 'ta' ? 'வெளியேறு' : 'Sign Out'}</span>
              </button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Viewport (Full width container so scrollbar stays at the browser window edge) */}
        <main className="farmer-main-viewport" ref={mainViewportRef}>
          <div className="farmer-viewport-content">
            {farmer.isDataLoading && (!crops || crops.length === 0) ? (
              <div style={{ padding: '8px 0' }}>
                <ModulePageSkeleton />
              </div>
            ) : (
              <Outlet context={farmer} />
            )}
          </div>
        </main>
      </div>

      {/* ====================================================================
          4. MOBILE BOTTOM NAVIGATION BAR (Exact Buyer Mobile Bar)
          ==================================================================== */}
      <nav className="buyer-mobile-bottom-nav" aria-label="Farmer Mobile Navigation">
        <NavLink
          to={ROUTES.FARMER_DASHBOARD}
          end
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <Sprout size={18} />
          <span>{lang === 'ta' ? 'முகப்பு' : 'Dashboard'}</span>
        </NavLink>

        <NavLink
          to={ROUTES.FARMER_DASHBOARD_CROPS}
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <Wheat size={18} />
          <span>{lang === 'ta' ? 'விளைச்சல்' : 'Yields'}</span>
        </NavLink>

        <NavLink
          to={ROUTES.FARMER_DASHBOARD_REQUESTS}
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <ShoppingBag size={18} />
          <span>{lang === 'ta' ? 'கோரிக்கை' : 'Requests'}</span>
          {pendingRequestsCount > 0 && <span className="farmer-mb-dot" />}
        </NavLink>

        <NavLink
          to={ROUTES.FARMER_DASHBOARD_ORDERS}
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <PackageCheck size={18} />
          <span>{lang === 'ta' ? 'ஆர்டர்' : 'Orders'}</span>
        </NavLink>

        <NavLink
          to={ROUTES.FARMER_DASHBOARD_PROFILE}
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <User size={18} />
          <span>{lang === 'ta' ? 'சுயவிவரம்' : 'Profile'}</span>
        </NavLink>
      </nav>

      {/* ====================================================================
          5. SIGN OUT CONFIRMATION MODAL (Exact Buyer Modal Architecture)
          ==================================================================== */}
      <Modal
        isOpen={signOutModalOpen}
        onClose={() => setSignOutModalOpen(false)}
        size="sm"
        hideHeader
        centered
        className="buyer-signout-modal"
      >
        <div className="buyer-signout-box">
          <button
            type="button"
            className="buyer-signout-x-btn"
            onClick={() => setSignOutModalOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="buyer-signout-icon-ring farmer-signout-icon-ring">
            <LogOut size={26} strokeWidth={2.2} />
          </div>

          <h3 className="buyer-signout-title">
            {lang === 'ta' ? 'வெளியேற உறுதிப்படுத்தவும்' : 'Confirm Sign Out'}
          </h3>

          <p className="buyer-signout-msg">
            {lang === 'ta'
              ? 'விவசாயி தளத்திலிருந்து வெளியேறி உள்நுழைவு திரைக்கு செல்ல விரும்புகிறீர்களா?'
              : 'Are you sure you want to exit your farmer session and return to farmer login?'}
          </p>

          <div className="buyer-signout-btn-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSignOutModalOpen(false)}
              className="buyer-signout-cancel-btn"
            >
              {lang === 'ta' ? 'ரத்துசெய்' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="danger"
              leftIcon={<LogOut size={16} />}
              onClick={handleSignOut}
              className="buyer-signout-confirm-btn"
            >
              <span>{lang === 'ta' ? 'ஆம், வெளியேறு' : 'Yes, Sign Out'}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* ====================================================================
          6. TOAST NOTIFICATION POPUP
          ==================================================================== */}
      {toastMessage && (
        <div className={`farmer-toast-notification ${toastMessage.type}`}>
          {toastMessage.type === 'success' && <CheckCircle2 size={16} />}
          {toastMessage.type === 'info' && <Info size={16} />}
          {toastMessage.type === 'error' && <AlertCircle size={16} />}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="farmer-toast-close"
            aria-label="Close Notification"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function FarmerDashboardLayout() {
  return (
    <FarmerProvider>
      <FarmerDashboardContent />
    </FarmerProvider>
  );
}