// What this file does: Master layout shell for Naam Uzhavar Driver Dispatch Terminal.
// Strictly adheres to the Buyer Module UI architecture: Topbar + Horizontal Desktop Navbar + Mobile Offcanvas Drawer + Mobile Bottom Nav.

import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import Offcanvas from 'react-bootstrap/Offcanvas';
import {
  Navigation,
  DollarSign,
  User,
  LogOut,
  X,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Menu,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
import { DriverProvider, useDriver } from '../../context/DriverContext';
import { ROUTES } from '../../routes';
import Button from '../Button';
import Modal from '../Modal';
import '../BuyerDashboardLayout.css';
import '../farmer/FarmerDashboardLayout.css';
import './DriverDashboardLayout.css';

function DriverDashboardContent() {
  const location = useLocation();
  const driver = useDriver();

  const {
    profile,
    vehicle,
    trips,
    dutyStatus,
    toggleDutyStatus,
    signOutModalOpen,
    setSignOutModalOpen,
    handleSignOut,
    toastMessage,
    setToastMessage,
    lang,
    toggleLang
  } = driver;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [failedAvatar, setFailedAvatar] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile offcanvas on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const p = profile || {};
  const avatarSrc = p.avatar || p.photo || p.photoPreview;
  const driverRole = lang === 'ta' ? 'ஓட்டுநர்' : 'Driver';
  const driverName = p.name || (lang === 'ta' ? 'குமார் எம்.' : 'Kumar M.');
  const driverDisplayName = `${driverName} (${driverRole})`;
  const driverSecondaryInfo =
    p.associatedFarm ||
    p.company ||
    p.assignedHub ||
    vehicle?.model ||
    (lang === 'ta' ? 'திண்டுக்கல் மத்திய மையம்' : 'Dindigul Central Hub');
  const vehicleName = vehicle?.model || 'Tata Ace EV Cargo';
  const vehicleNo = vehicle?.vehicleNumber || 'TN 57 AB 1234';
  const batteryPct = vehicle?.currentBatteryPct ?? 82;

  return (
    <div className="buyer-dashboard-root driver-theme">
      {/* ====================================================================
          1. TOP NAVIGATION BAR (Header - Identical to Header.png Reference)
          ==================================================================== */}
      <header className="buyer-topbar">
        <div className="buyer-topbar-left">
          {/* Mobile hamburger menu button */}
          <button
            type="button"
            className="buyer-mobile-menu-btn d-lg-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo Brand Lockup: Left Section */}
          <Link
            to={ROUTES.DRIVER_DASHBOARD}
            className="buyer-brand-badge"
            title="Naam Uzhavar"
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

        {/* Topbar Right Actions: Language & Driver Profile */}
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

          {/* Driver Profile Pill with Dropdown */}
          <div
            ref={dropdownRef}
            className="buyer-topbar-dropdown-wrap buyer-topbar-profile-wrap"
          >
            <button
              type="button"
              className={`buyer-profile-chip-btn ${location.pathname === ROUTES.DRIVER_DASHBOARD_PROFILE ? 'active' : ''}`}
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              aria-label="Driver Profile Menu"
              aria-expanded={profileDropdownOpen}
              title={driverDisplayName}
            >
              <div className="buyer-avatar-badge has-photo">
                {avatarSrc && !failedAvatar ? (
                  <img
                    src={avatarSrc}
                    alt={driverDisplayName}
                    className="buyer-avatar-img"
                    onError={() => setFailedAvatar(true)}
                  />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className="buyer-profile-info-text d-none d-sm-flex">
                <span className="buyer-profile-full-name">{driverDisplayName}</span>
                <span className="buyer-role-subtext" title={driverSecondaryInfo}>
                  {driverSecondaryInfo}
                </span>
              </div>
              <ChevronDown size={14} className="buyer-dropdown-caret" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="buyer-dropdown-menu buyer-profile-dropdown d-none d-lg-block" style={{ display: 'block' }}>
                <div className="buyer-profile-card-header">
                  <div className="buyer-profile-card-icon has-photo">
                    <img
                      src={avatarSrc || 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&auto=format&fit=crop&q=80'}
                      alt={driverName}
                      className="buyer-profile-dropdown-img"
                    />
                  </div>
                  <div className="buyer-profile-header-info">
                    <h4 className="buyer-card-title">{driverName}</h4>
                    <p className="buyer-card-sub">🚚 {driverSecondaryInfo}</p>
                    <p className="buyer-card-sub font-mono">📞 {p.phone || '+91 94432 11098'}</p>
                    <p className="buyer-card-sub">✉️ {p.email || 'kumar.logistics@naamuzhavar.com'}</p>
                    <span className="farmer-verified-pill" style={{ background: '#eaf3ec', color: '#2f6b3a' }}>
                      <ShieldCheck size={12} />
                      <span>{lang === 'ta' ? 'சரிபார்க்கப்பட்ட ஓட்டுநர்' : 'Verified Driver Partner'}</span>
                    </span>
                  </div>
                </div>

                <div className="buyer-dropdown-divider" />

                <Link
                  to={ROUTES.DRIVER_DASHBOARD}
                  className="buyer-dropdown-item"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <LayoutDashboard size={15} />
                  <span>{lang === 'ta' ? 'முகப்பு பலகை' : 'Dashboard'}</span>
                </Link>

                <Link
                  to={ROUTES.DRIVER_DASHBOARD_TRIPS}
                  className="buyer-dropdown-item"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <Navigation size={15} />
                  <span>{lang === 'ta' ? 'என் பயணங்கள்' : 'My Trips'}</span>
                </Link>

                <Link
                  to={ROUTES.DRIVER_DASHBOARD_EARNINGS}
                  className="buyer-dropdown-item"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <DollarSign size={15} />
                  <span>{lang === 'ta' ? 'என் வருவாய்' : 'My Earnings'}</span>
                </Link>

                <Link
                  to={ROUTES.DRIVER_DASHBOARD_PROFILE}
                  className="buyer-dropdown-item"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <User size={15} />
                  <span>{lang === 'ta' ? 'சுயவிவரம்' : 'Profile'}</span>
                </Link>

                <div className="buyer-dropdown-divider" />

                <button
                  type="button"
                  className="buyer-dropdown-item text-danger"
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
          2. CENTERED NAVIGATION BAR (Under Header - Matches Header.png)
             Contains ONLY 4 items: Dashboard, My Trips, My Earnings, Profile
          ==================================================================== */}
      <nav className="buyer-desktop-top-navbar d-none d-md-flex" aria-label="Driver Module Navigation">
        <div className="buyer-top-nav-container">
          <div className="buyer-top-nav-links">
            <NavLink
              to={ROUTES.DRIVER_DASHBOARD}
              end
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={15} />
              <span className="buyer-top-nav-label">
                {lang === 'ta' ? 'முகப்பு பலகை' : 'Dashboard'}
              </span>
            </NavLink>

            <NavLink
              to={ROUTES.DRIVER_DASHBOARD_TRIPS}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <Navigation size={15} />
              <span className="buyer-top-nav-label">
                {lang === 'ta' ? 'என் பயணங்கள்' : 'My Trips'}
              </span>
            </NavLink>

            <NavLink
              to={ROUTES.DRIVER_DASHBOARD_EARNINGS}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <DollarSign size={15} />
              <span className="buyer-top-nav-label">
                {lang === 'ta' ? 'என் வருவாய்' : 'My Earnings'}
              </span>
            </NavLink>

            <NavLink
              to={ROUTES.DRIVER_DASHBOARD_PROFILE}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <User size={15} />
              <span className="buyer-top-nav-label">
                {lang === 'ta' ? 'சுயவிவரம்' : 'Profile'}
              </span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* ====================================================================
          3. DASHBOARD BODY & MAIN VIEWPORT (Exact Buyer Architecture)
          ==================================================================== */}
      <div className="farmer-dashboard-body">
        {/* Mobile Drawer via Bootstrap Offcanvas (Matches Buyer & Farmer Module) */}
        <Offcanvas
          show={mobileMenuOpen}
          onHide={() => setMobileMenuOpen(false)}
          placement="start"
          className="buyer-mobile-offcanvas text-white"
          style={{ maxWidth: 280, backgroundColor: '#0f172a' }}
        >
          <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-warning border-opacity-25 pb-3">
            <Offcanvas.Title>
              <Link
                to={ROUTES.DRIVER_DASHBOARD}
                className="d-flex align-items-center gap-2 text-decoration-none"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img
                  src="/logo.png"
                  alt="Naam Uzhavar"
                  width={38}
                  height={38}
                  className="rounded-circle border border-2 border-warning object-fit-cover"
                />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-white small lh-sm">
                    {lang === 'ta' ? 'நாம் உழவர் ஓட்டுநர்' : 'Naam Uzhavar EV Fleet'}
                  </span>
                  <span className="fw-bold text-warning" style={{ fontSize: '0.68rem' }}>
                    {lang === 'ta' ? 'விவசாயிகள் • வாங்குபவர்கள் • ஓட்டுநர்கள்' : 'Farmers • Buyers • Drivers'}
                  </span>
                </div>
              </Link>
            </Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
            <div className="d-flex flex-column gap-1">
              {/* Driver info card inside offcanvas */}
              <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="fw-bold text-white">{driverName}</div>
                  <button
                    type="button"
                    className={`driver-duty-toggle-btn ${dutyStatus === 'ON_DUTY' ? 'on-duty' : 'off-duty'}`}
                    onClick={toggleDutyStatus}
                  >
                    <span className="duty-dot" />
                    <span>{dutyStatus === 'ON_DUTY' ? (lang === 'ta' ? 'பணியில்' : 'On Duty') : (lang === 'ta' ? 'இடைவேளை' : 'Off Duty')}</span>
                  </button>
                </div>
                <div className="small text-warning mb-1">🚚 {vehicleName}</div>
                <div className="small text-white-50">{vehicleNo} • {batteryPct}% EV Battery</div>
              </div>

              <NavLink
                to={ROUTES.DRIVER_DASHBOARD}
                end
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard size={19} />
                <span className="buyer-nav-label">
                  {lang === 'ta' ? 'முகப்பு பலகை' : 'Dashboard'}
                </span>
              </NavLink>

              <NavLink
                to={ROUTES.DRIVER_DASHBOARD_TRIPS}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Navigation size={19} />
                <span className="buyer-nav-label">
                  {lang === 'ta' ? 'என் பயணங்கள்' : 'My Trips'}
                </span>
              </NavLink>

              <NavLink
                to={ROUTES.DRIVER_DASHBOARD_EARNINGS}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <DollarSign size={19} />
                <span className="buyer-nav-label">
                  {lang === 'ta' ? 'என் வருவாய்' : 'My Earnings'}
                </span>
              </NavLink>

              <NavLink
                to={ROUTES.DRIVER_DASHBOARD_PROFILE}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <User size={19} />
                <span className="buyer-nav-label">
                  {lang === 'ta' ? 'சுயவிவரம்' : 'Profile'}
                </span>
              </NavLink>
            </div>

            {/* Logout button in drawer */}
            <div className="border-top border-warning border-opacity-25 pt-3">
              <button
                type="button"
                className="buyer-nav-item text-danger border-0 bg-transparent w-100 text-start"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSignOutModalOpen(true);
                }}
              >
                <LogOut size={18} />
                <span className="buyer-nav-label">{lang === 'ta' ? 'வெளியேறு' : 'Sign Out'}</span>
              </button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Viewport Content */}
        <main className="farmer-main-viewport">
          <div className="farmer-viewport-content">
            <Outlet context={driver} />
          </div>
        </main>
      </div>

      {/* ====================================================================
          4. MOBILE TACTILE BOTTOM NAVIGATION (Exact Driver Format)
          ==================================================================== */}
      <nav className="buyer-mobile-bottom-nav" aria-label="Driver Mobile Navigation">
        <NavLink
          to={ROUTES.DRIVER_DASHBOARD}
          end
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={19} />
          <span>{lang === 'ta' ? 'முகப்பு' : 'Dashboard'}</span>
        </NavLink>

        <NavLink
          to={ROUTES.DRIVER_DASHBOARD_TRIPS}
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <Navigation size={19} />
          <span>{lang === 'ta' ? 'பயணங்கள்' : 'My Trips'}</span>
        </NavLink>

        <NavLink
          to={ROUTES.DRIVER_DASHBOARD_EARNINGS}
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <DollarSign size={19} />
          <span>{lang === 'ta' ? 'வருவாய்' : 'My Earnings'}</span>
        </NavLink>

        <NavLink
          to={ROUTES.DRIVER_DASHBOARD_PROFILE}
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <User size={19} />
          <span>{lang === 'ta' ? 'சுயவிவரம்' : 'Profile'}</span>
        </NavLink>
      </nav>

      {/* ====================================================================
          5. SIGN OUT CONFIRMATION MODAL (Exact Buyer & Farmer Architecture)
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

          <div className="buyer-signout-icon-ring driver-signout-icon-ring">
            <LogOut size={26} strokeWidth={2.2} />
          </div>

          <h3 className="buyer-signout-title">
            {lang === 'ta' ? 'வெளியேற உறுதிப்படுத்தவும்' : 'Confirm Sign Out'}
          </h3>

          <p className="buyer-signout-msg">
            {lang === 'ta'
              ? 'ஓட்டுநர் தளத்திலிருந்து வெளியேறி உள்நுழைவு திரைக்கு செல்ல விரும்புகிறீர்களா?'
              : 'Are you sure you want to exit your driver session and return to driver login?'}
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
          6. TOAST NOTIFICATIONS
          ==================================================================== */}
      {toastMessage && (
        <div className={`driver-toast-notification ${toastMessage.type}`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={18} color="#16a34a" />
          ) : (
            <AlertCircle size={18} color="#dc2626" />
          )}
          <span>{toastMessage.message}</span>
          <button
            type="button"
            className="farmer-toast-close ms-2"
            onClick={() => setToastMessage(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function DriverDashboardLayout() {
  return (
    <DriverProvider>
      <DriverDashboardContent />
    </DriverProvider>
  );
}
