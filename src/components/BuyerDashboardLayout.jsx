// What this file does: Primary layout shell for commercial buyer dashboard, including header, navigation drawer, and subcomponents.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Sprout,
  ShoppingBag,
  Truck,
  PackageCheck,
  Receipt,
  CheckCircle2,
  ChevronDown,
  X,
  User,
  Building2,
  Info,
  Menu,
  LogOut,
  Edit3
} from 'lucide-react';
import './BuyerDashboardLayout.css';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { ROUTES } from '../routes';
import Button from './Button';
import Modal from './Modal';
import { BuyerProvider, useBuyer } from '../context/BuyerContext';
import CropModals from './CropModals';
import EditProfileModal from './EditProfileModal';
import LoadingPage from './LoadingPage';
import { ModulePageSkeleton } from './Skeleton';

/**
 * BuyerDashboardLayout Component
 * Serves as the primary layout shell for the commercial buyer dashboard:
 * - Header (Brand, Language switcher, Notifications, Profile dropdown)
 * - Collapsible desktop sidebar & mobile drawer (NavLink navigation)
 * - Main viewport hosting child route components via <Outlet />
 * - Mobile bottom nav bar
 * - Shared Modals (Sign Out confirmation, Edit Profile, Crop procurement)
 */
function BuyerDashboardContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainViewportRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const buyer = useBuyer();
  const {
    profile,
    filteredCrops,
    orders,
    toastMessage,
    setToastMessage,
    signOutModalOpen,
    setSignOutModalOpen,
    handleSignOut,
    editProfileOpen,
    setEditProfileOpen,
    editFormData,
    setEditFormData,
    handleOpenEditProfile,
    handleSaveProfile,
    declineModalCrop,
    setDeclineModalCrop,
    handleConfirmDecline,
    acceptModalCrop,
    setAcceptModalCrop,
    acceptedQuantity,
    setAcceptedQuantity,
    handleProceedToFarmer,
    farmerDetailsCrop,
    setFarmerDetailsCrop,
    handleConfirmOrder,
    orderConfirmationData,
    setOrderConfirmationData,
    handleGoToTracking,
    lang,
    toggleLang,
    t
  } = buyer;

  const p = profile || {};
  const avatarSrc = p.photo || p.photoPreview;
  const [failedAvatar, setFailedAvatar] = useState(null);
  const [failedDropdownAvatar, setFailedDropdownAvatar] = useState(null);

  const isAvatarValid = Boolean(avatarSrc && failedAvatar !== avatarSrc);
  const isDropdownAvatarValid = Boolean(avatarSrc && failedDropdownAvatar !== avatarSrc);

  const activeDeliveriesCount = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    return safeOrders.filter((o) => {
      if (o.orderStatus === 'REJECTED' || o.orderStatus === 'PENDING_FARMER_APPROVAL') return false;
      const s = o.deliveryStatus || o.status;
      return s === 'READY_FOR_PICKUP' || s === 'PICKED_UP' || s === 'IN_TRANSIT' || s === 'in_transit' || s === 'in-transit';
    }).length;
  }, [orders]);

  const buyerCategoryLabel = useMemo(() => {
    switch (p.buyerType) {
      case 'hotel':
        return t('profile.hotelCategory') || 'Hotel & Commercial Kitchen';
      case 'supermarket':
        return t('profile.supermarketCategory') || 'Supermarket & Hypermarket';
      case 'retailer':
        return t('profile.retailerCategory') || 'Local Produce Retailer';
      case 'mahal':
        return t('profile.mahalCategory') || 'Function Hall & Mahal';
      default:
        return p.businessType || 'Commercial Establishment';
    }
  }, [p.buyerType, p.businessType, t]);

  // Lock window / body scroll to prevent duplicate native scrollbars while inside Buyer Dashboard
  useEffect(() => {
    document.documentElement.classList.add('dashboard-shell-active');
    document.body.classList.add('dashboard-shell-active');
    return () => {
      document.documentElement.classList.remove('dashboard-shell-active');
      document.body.classList.remove('dashboard-shell-active');
    };
  }, []);

  // Auto-scroll viewport to top on route change
  useEffect(() => {
    if (mainViewportRef.current) {
      mainViewportRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Outside click & Escape listener for profile dropdown
  useEffect(() => {
    if (!profileDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdownOpen]);

  const handleProfileClick = () => {
    // On mobile view (< 992px), clicking the profile icon goes directly to the Profile page in buyer dashboard
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setProfileDropdownOpen(false);
      navigate(ROUTES.BUYER_DASHBOARD_PROFILE);
    } else {
      setProfileDropdownOpen((prev) => !prev);
    }
  };

  return (
    <div className="buyer-dashboard-root">
      {/* ====================================================================
          1. TOP NAVIGATION BAR (Header)
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

          {/* Logo Brand Lockup: Navigates to Home Page */}
          <Link
            to={ROUTES.HOME}
            className="buyer-brand-badge"
            style={{ textDecoration: 'none' }}
            title="Go to Home page"
          >
            <img src="/logo.png" alt="Naam Uzhavar" className="buyer-brand-logo-img" />
            <div className="buyer-brand-titles">
              <span className="buyer-brand-title">{t('brandName')}</span>
              <span className="buyer-brand-subtitle">{t('common.appSubtitle')}</span>
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
            {t('common.switchLangText')}
          </button>

          {/* Buyer Profile Pill with Dropdown */}
          <div
            ref={profileDropdownRef}
            className="buyer-topbar-dropdown-wrap buyer-topbar-profile-wrap"
          >
            <button
              type="button"
              className={`buyer-profile-chip-btn ${location.pathname === ROUTES.BUYER_DASHBOARD_PROFILE ? 'active' : ''}`}
              onClick={handleProfileClick}
              aria-label={t('navProfile')}
              aria-expanded={profileDropdownOpen}
            >
              <div className="buyer-avatar-badge has-photo">
                {isAvatarValid ? (
                  <img
                    key={avatarSrc}
                    src={avatarSrc}
                    alt={p.fullName || p.name || 'Commercial Buyer'}
                    className="buyer-avatar-img"
                    onError={() => setFailedAvatar(avatarSrc)}
                  />
                ) : (
                  <Building2 size={16} />
                )}
              </div>
              <div className="buyer-profile-info-text">
                <span className="buyer-profile-full-name">
                  {p.contactPerson || p.fullName || p.name || 'Commercial Buyer'}
                </span>
                <span className="buyer-role-subtext">
                  {p.shopName || p.businessName || 'Business Unit'}
                </span>
              </div>
              <ChevronDown size={14} className="buyer-dropdown-caret" />
            </button>

            {profileDropdownOpen && (
              <div className="buyer-dropdown-menu buyer-profile-dropdown d-none d-lg-block">
                <div className="buyer-profile-card-header">
                  <div className="buyer-profile-card-icon has-photo">
                    {isDropdownAvatarValid ? (
                      <img
                        key={avatarSrc}
                        src={avatarSrc}
                        alt={p.shopName || p.name || 'Commercial Buyer'}
                        className="buyer-profile-dropdown-img"
                        onError={() => setFailedDropdownAvatar(avatarSrc)}
                      />
                    ) : (
                      <Building2 size={24} />
                    )}
                  </div>
                  <div className="buyer-profile-header-info">
                    <h4 className="buyer-card-title">{p.shopName || p.businessName || 'Commercial Buyer'}</h4>
                    <p className="buyer-card-sub">👤 {p.contactPerson || p.fullName || p.name || 'Commercial Partner'}</p>
                    <p className="buyer-card-sub">🏢 {buyerCategoryLabel}</p>
                    <p className="buyer-card-sub font-mono">📞 {p.phone || 'N/A'}</p>
                    <p className="buyer-card-sub">✉️ {p.email || 'N/A'}</p>
                    {p.gstin && <span className="buyer-gstin-tag">GSTIN: {p.gstin}</span>}
                  </div>
                </div>
                <div className="buyer-dropdown-divider" />
                <NavLink
                  to={ROUTES.BUYER_DASHBOARD_PROFILE}
                  className="buyer-dropdown-item"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <User size={15} />
                  <span>{t('viewBusinessProfile')}</span>
                </NavLink>
                <button
                  type="button"
                  className="buyer-dropdown-item"
                  onClick={() => {
                    handleOpenEditProfile();
                    setProfileDropdownOpen(false);
                  }}
                >
                  <Edit3 size={15} />
                  <span>{t('editDetailsPhoto')}</span>
                </button>
                <NavLink
                  to={ROUTES.BUYER_DASHBOARD_ORDERS}
                  className="buyer-dropdown-item"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <PackageCheck size={15} />
                  <span>{t('allPastOrders')}</span>
                </NavLink>
                <NavLink
                  to={ROUTES.BUYER_DASHBOARD_INVOICES}
                  className="buyer-dropdown-item"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <Receipt size={15} />
                  <span>{t('navInvoices')}</span>
                </NavLink>
                <div className="buyer-dropdown-divider" />
                <button
                  type="button"
                  id="buyer-header-signout-btn"
                  className="buyer-dropdown-item logout"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setSignOutModalOpen(true);
                  }}
                >
                  <LogOut size={15} />
                  <span>{t('signOut')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ====================================================================
          2. TOP NAVBAR BELOW LOGO (Desktop Horizontal Navigation Bar)
          ==================================================================== */}
      <nav className="buyer-desktop-top-navbar d-none d-lg-flex" aria-label="Buyer Dashboard Navigation">
        <div className="buyer-top-nav-container">
          <div className="buyer-top-nav-links">
            <NavLink
              to={ROUTES.BUYER_DASHBOARD}
              end
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <Sprout size={15} />
              <span className="buyer-top-nav-label">{t('navHome')}</span>
            </NavLink>

            <NavLink
              to={ROUTES.BUYER_DASHBOARD_CROPS}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <ShoppingBag size={15} />
              <span className="buyer-top-nav-label">{t('navCrops')}</span>
              <span className="buyer-top-nav-badge">{filteredCrops?.length || 0}</span>
            </NavLink>

            <NavLink
              to={ROUTES.BUYER_DASHBOARD_ORDERS}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <PackageCheck size={15} />
              <span className="buyer-top-nav-label">{t('navOrders')}</span>
              <span className="buyer-top-nav-badge neutral">{orders?.length || 0}</span>
            </NavLink>

            <NavLink
              to={ROUTES.BUYER_DASHBOARD_TRACK}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <Truck size={15} />
              <span className="buyer-top-nav-label">{t('navTrack')}</span>
              {activeDeliveriesCount > 0 && (
                <span
                  className="buyer-top-nav-dot-pulse"
                  title={`${activeDeliveriesCount} ${lang === 'ta' ? 'நடப்பு விநியோகம்' : 'Active Delivery'}`}
                />
              )}
            </NavLink>

            <NavLink
              to={ROUTES.BUYER_DASHBOARD_INVOICES}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <Receipt size={15} />
              <span className="buyer-top-nav-label">{t('navInvoices')}</span>
              <span className="buyer-top-nav-badge neutral">{orders?.length || 0}</span>
            </NavLink>

            <NavLink
              to={ROUTES.BUYER_DASHBOARD_PROFILE}
              className={({ isActive }) => `buyer-top-nav-item ${isActive ? 'active' : ''}`}
            >
              <Building2 size={15} />
              <span className="buyer-top-nav-label">{t('navProfile')}</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* ====================================================================
          3. DASHBOARD BODY: MAIN CONTENT AREA
          ==================================================================== */}
      <div className="buyer-dashboard-body">
        {/* MOBILE DRAWER VIA BOOTSTRAP OFFCANVAS */}
        <Offcanvas
          show={mobileMenuOpen}
          onHide={() => setMobileMenuOpen(false)}
          placement="start"
          className="buyer-mobile-offcanvas text-white"
          style={{ maxWidth: 280, backgroundColor: '#052e16' }}
        >
          <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-success border-opacity-25 pb-3">
            <Offcanvas.Title>
              <Link
                to={ROUTES.HOME}
                className="d-flex align-items-center gap-2 text-decoration-none"
                onClick={() => setMobileMenuOpen(false)}
                title="Go to Home page"
              >
                <img src="/logo.png" alt="Naam Uzhavar" width={38} height={38} className="rounded-circle border border-2 border-success object-fit-cover" />
                <div className="d-flex flex-column">
                  <span className="fw-bold text-white small lh-sm">{t('brandName')}</span>
                  <span className="fw-bold text-success" style={{ fontSize: '0.68rem' }}>{t('common.appSubtitle')}</span>
                </div>
              </Link>
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
            <div className="d-flex flex-column gap-1">
              <NavLink
                to={ROUTES.BUYER_DASHBOARD}
                end
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Sprout size={19} />
                <span className="buyer-nav-label">{t('navHome')}</span>
              </NavLink>

              <NavLink
                to={ROUTES.BUYER_DASHBOARD_CROPS}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingBag size={19} />
                <span className="buyer-nav-label">{t('navCrops')}</span>
                <span className="buyer-nav-badge">{filteredCrops?.length || 0}</span>
              </NavLink>

              <NavLink
                to={ROUTES.BUYER_DASHBOARD_ORDERS}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <PackageCheck size={19} />
                <span className="buyer-nav-label">{t('navOrders')}</span>
                <span className="buyer-nav-badge neutral">{orders?.length || 0}</span>
              </NavLink>

              <NavLink
                to={ROUTES.BUYER_DASHBOARD_TRACK}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Truck size={19} />
                <span className="buyer-nav-label">{t('navTrack')}</span>
                {activeDeliveriesCount > 0 && (
                  <span
                    className="buyer-nav-dot-pulse"
                    title={`${activeDeliveriesCount} ${lang === 'ta' ? 'நடப்பு விநியோகம்' : 'Active Delivery'}`}
                  />
                )}
              </NavLink>

              <NavLink
                to={ROUTES.BUYER_DASHBOARD_INVOICES}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Receipt size={19} />
                <span className="buyer-nav-label">{t('navInvoices')}</span>
                <span className="buyer-nav-badge neutral">{orders?.length || 0}</span>
              </NavLink>

              <NavLink
                to={ROUTES.BUYER_DASHBOARD_PROFILE}
                className={({ isActive }) => `buyer-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Building2 size={19} />
                <span className="buyer-nav-label">{t('navProfile')}</span>
              </NavLink>

              <div style={{ margin: '10px 0 6px', borderTop: '1px solid var(--buyer-border-light)' }} />

              <button
                type="button"
                id="buyer-drawer-signout-btn"
                className="buyer-nav-item buyer-drawer-signout-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSignOutModalOpen(true);
                }}
                style={{ color: '#dc2626' }}
              >
                <LogOut size={19} />
                <span className="buyer-nav-label">{t('signOut')}</span>
              </button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* MAIN DASHBOARD CONTENT VIEWPORT: Renders matched child route via <Outlet /> */}
        <main className="buyer-main-viewport" ref={mainViewportRef}>
          {buyer.isDataLoading ? (
            <div className="buyer-view-container animate-fade-in" style={{ padding: '8px 0' }}>
              <ModulePageSkeleton />
            </div>
          ) : (
            <Outlet context={buyer} />
          )}
        </main>
      </div>

      {/* ====================================================================
          PRODUCE MODALS: DECLINE, ACCEPT, FARMER DOSSIER, ORDER CONFIRMED
          ==================================================================== */}
      <CropModals
        declineModalCrop={declineModalCrop}
        onDeclineClose={() => setDeclineModalCrop(null)}
        onConfirmDecline={handleConfirmDecline}
        acceptModalCrop={acceptModalCrop}
        acceptedQuantity={acceptedQuantity}
        onQuantityChange={setAcceptedQuantity}
        onAcceptClose={() => setAcceptModalCrop(null)}
        onProceedToFarmer={handleProceedToFarmer}
        farmerDetailsCrop={farmerDetailsCrop}
        onFarmerDetailsClose={() => setFarmerDetailsCrop(null)}
        onConfirmOrder={handleConfirmOrder}
        orderConfirmationData={orderConfirmationData}
        onGoToTracking={handleGoToTracking}
        onBrowseMore={() => {
          setOrderConfirmationData(null);
        }}
        lang={lang}
      />

      {/* ====================================================================
          EDIT BUSINESS PROFILE MODAL
          ==================================================================== */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        handleSaveProfile={handleSaveProfile}
        lang={lang}
      />

      {/* ====================================================================
          SIGN OUT CONFIRMATION MODAL (Clean Single-Box Architecture)
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

          <div className="buyer-signout-icon-ring">
            <LogOut size={26} strokeWidth={2.2} />
          </div>

          <h3 className="buyer-signout-title">
            {t('modals.confirmSignOutTitle')}
          </h3>

          <p className="buyer-signout-msg">
            {t('modals.confirmSignOutPrompt')}
          </p>

          <div className="buyer-signout-btn-row">
            <Button
              type="button"
              id="buyer-cancel-signout-btn"
              variant="secondary"
              onClick={() => setSignOutModalOpen(false)}
              className="buyer-signout-cancel-btn"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              id="buyer-confirm-signout-btn"
              variant="danger"
              leftIcon={<LogOut size={16} />}
              onClick={handleSignOut}
              className="buyer-signout-confirm-btn"
            >
              <span>{t('modals.yesSignOut')}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* ====================================================================
          MOBILE BOTTOM NAVIGATION BAR
          ==================================================================== */}
      <nav className="buyer-mobile-bottom-nav">
        <NavLink
          to={ROUTES.BUYER_DASHBOARD}
          end
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <Sprout size={18} />
          <span>{t('bottomNavHome')}</span>
        </NavLink>

        <NavLink
          to={ROUTES.BUYER_DASHBOARD_CROPS}
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <ShoppingBag size={18} />
          <span>{t('bottomNavCrops')}</span>
        </NavLink>

        <NavLink
          to={ROUTES.BUYER_DASHBOARD_ORDERS}
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <PackageCheck size={18} />
          <span>{t('bottomNavOrders')}</span>
        </NavLink>

        <NavLink
          to={ROUTES.BUYER_DASHBOARD_TRACK}
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <Truck size={18} />
          <span>{t('bottomNavTrack')}</span>
          {activeDeliveriesCount > 0 && <span className="buyer-mb-dot" />}
        </NavLink>

        <NavLink
          to={ROUTES.BUYER_DASHBOARD_INVOICES}
          className={({ isActive }) => `buyer-mb-item ${isActive ? 'active' : ''}`}
        >
          <Receipt size={18} />
          <span>{t('navInvoices')}</span>
        </NavLink>
      </nav>

      {/* TOAST NOTIFICATION POPUP */}
      {toastMessage && (
        <div className={`buyer-toast-notification ${toastMessage.type}`}>
          {toastMessage.type === 'success' && <CheckCircle2 size={16} />}
          {toastMessage.type === 'info' && <Info size={16} />}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="toast-close"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Default Export: Wraps BuyerDashboardContent in BuyerProvider
 */
export default function BuyerDashboardLayout() {
  return (
    <BuyerProvider>
      <BuyerDashboardContent />
    </BuyerProvider>
  );
}
