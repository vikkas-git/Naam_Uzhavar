// What this file does: Buyer account profile page displaying commercial business credentials, GSTIN, and settings.

import React, { useMemo, useState } from 'react';
import {
  Building2,
  Camera,
  CheckCircle2,
  ShoppingCart,
  Store,
  Check,
  ShieldCheck,
  Edit3,
  LogOut
} from 'lucide-react';
import './Profile.css';
import { useBuyer } from '../../context/BuyerContext';
import { ProfileSkeleton } from '../../components/Skeleton';

export default function Profile() {
  const {
    profile,
    photoInputRef,
    handlePhotoUpload,
    handleOpenEditProfile,
    setSignOutModalOpen,
    isDataLoading,
    t
  } = useBuyer();

  const p = profile || {};
  const photoSrc = p.photo || p.photoPreview;
  const [failedPhoto, setFailedPhoto] = useState(null);
  const [failedThumb, setFailedThumb] = useState(null);

  const isPhotoValid = Boolean(photoSrc && failedPhoto !== photoSrc);
  const isThumbValid = Boolean(photoSrc && failedThumb !== photoSrc);

  const buyerCategoryLabel = useMemo(() => {
    switch (p.buyerType) {
      case 'hotel':
        return t('profile.hotelCategory');
      case 'supermarket':
        return t('profile.supermarketCategory');
      case 'retailer':
        return t('profile.retailerCategory');
      case 'mahal':
        return t('profile.mahalCategory');
      default:
        return p.businessType || t('profile.commercialBuyerCategory');
    }
  }, [p.buyerType, p.businessType, t]);

  const BuyerCategoryIcon = useMemo(() => {
    switch (p.buyerType) {
      case 'supermarket':
        return ShoppingCart;
      case 'retailer':
        return Store;
      case 'hotel':
      case 'mahal':
      default:
        return Building2;
    }
  }, [p.buyerType]);

  if (isDataLoading && !profile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="buyer-view-container animate-fade-in">
      <div className="buyer-view-header">
        <div>
          <h1 className="buyer-view-title">{t('profile.title')}</h1>
          <p className="buyer-view-subtitle">
            {t('profile.subtitle')}
          </p>
        </div>
      </div>

      <div className="buyer-profile-layout">
        {/* Hidden File Input for Direct Photo Update */}
        <input
          type="file"
          ref={photoInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoUpload}
        />

        <div className="buyer-profile-box">
          {/* Top Profile Banner with Uploaded Photo & Verification */}
          <div className="buyer-profile-top-banner">
            <div className="buyer-profile-photo-wrapper">
              {isPhotoValid ? (
                <img
                  key={photoSrc}
                  src={photoSrc}
                  alt={p.shopName || p.name || 'Commercial Buyer'}
                  className="buyer-profile-photo-large"
                  onError={() => setFailedPhoto(photoSrc)}
                />
              ) : (
                <div className="buyer-profile-photo-fallback">
                  <Building2 size={36} />
                </div>
              )}
              {/* Photo Change Badge Button */}
              <button
                type="button"
                className="buyer-profile-photo-change-btn"
                onClick={() => photoInputRef.current?.click()}
                title="Upload / Change Photo"
                aria-label="Change photo"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="buyer-profile-header-text">
              <div className="buyer-profile-name-row">
                <h2 className="buyer-profile-firm-name">
                  {p.shopName || p.name || 'Commercial Buyer'}
                </h2>
                <span className="buyer-verified-badge">
                  <CheckCircle2 size={13} />
                  <span>{t('profile.verifiedBuyer')}</span>
                </span>
              </div>
              <p className="buyer-profile-firm-sub">
                👤 {p.contactPerson || p.name || 'Commercial Partner'} •{' '}
                {buyerCategoryLabel}
              </p>
              <div className="buyer-profile-meta-tags">
                <span className="buyer-category-pill">
                  <BuyerCategoryIcon size={12} />
                  <span>{buyerCategoryLabel}</span>
                </span>
                <span className="buyer-id-pill">ID: {p.id || 'NU-BYR-2026'}</span>
              </div>
            </div>
          </div>

          {/* Complete 8-Field Details Grid */}
          <div className="buyer-profile-details-grid">
            {/* 1. Contact Person */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {t('profile.contactPersonLabel')}
              </span>
              <span className="detail-value">{p.contactPerson || p.name || 'N/A'}</span>
              <span className="detail-subtext">
                {t('profile.contactPersonSub')}
              </span>
            </div>

            {/* 2. Phone Number */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {t('profile.mobileNumberLabel')}
              </span>
              <span className="detail-value font-mono">{p.phone || 'N/A'}</span>
              <span className="detail-status-pill green">
                <Check size={11} /> {t('profile.verifiedMobile')}
              </span>
            </div>

            {/* 3. Corporate Email */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {t('profile.emailLabel')}
              </span>
              <span className="detail-value">{p.email || 'N/A'}</span>
              <span className="detail-status-pill green">
                <Check size={11} /> {t('profile.eInvoicingEnabled')}
              </span>
            </div>

            {/* 4. Shop / Business Name */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {t('profile.shopNameLabel')}
              </span>
              <span className="detail-value font-semibold">
                {p.shopName || p.name || 'N/A'}
              </span>
              <span className="detail-subtext">
                {t('profile.shopNameSub')}
              </span>
            </div>

            {/* 5. Commercial Buyer Type */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {t('profile.buyerCategoryLabel')}
              </span>
              <span className="detail-value">
                {buyerCategoryLabel}
              </span>
              <span className="detail-subtext">
                {t('profile.buyerCategorySub')}
              </span>
            </div>

            {/* 6. GSTIN Number */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {t('profile.gstinLabel')}
              </span>
              <span className="detail-value font-mono">{p.gstin || 'N/A'}</span>
              <span className="detail-status-pill green">
                <ShieldCheck size={11} />{' '}
                {t('profile.verifiedGst')}
              </span>
            </div>

            {/* 7. Loading Bay Delivery Address */}
            <div className="buyer-detail-item full-width">
              <span className="detail-label">
                {t('profile.addressLabel')}
              </span>
              <span className="detail-value">{p.address || 'N/A'}</span>
              <span className="detail-subtext">
                {t('profile.addressSub')}
              </span>
            </div>

            {/* 8. KYC Document & Profile Photo Status */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {t('profile.kycLabel')}
              </span>
              <div className="buyer-doc-preview-chip">
                {isThumbValid ? (
                  <img
                    key={photoSrc}
                    src={photoSrc}
                    alt="Document Thumbnail"
                    className="buyer-doc-mini-thumb"
                    onError={() => setFailedThumb(photoSrc)}
                  />
                ) : (
                  <Building2 size={16} />
                )}
                <span>
                  {t('profile.photoAttached')}
                </span>
              </div>
            </div>

            {/* 9. Hub Allocation & PIN */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {t('profile.assignedHubLabel')}
              </span>
              <span className="detail-value">{p.assignedHub || t('profile.assignedHubVal')}</span>
              <span className="detail-subtext">
                {t('profile.securityPin', { pin: p.securityPin || '4892' })}
              </span>
            </div>
          </div>

          {/* Profile Action Buttons */}
          <div className="buyer-profile-footer-actions">
            <button
              type="button"
              className="buyer-btn-outline"
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera size={15} />
              <span>{t('profile.changePhoto')}</span>
            </button>
            <button
              type="button"
              className="buyer-btn-primary"
              onClick={handleOpenEditProfile}
            >
              <Edit3 size={15} />
              <span>{t('profile.editBusinessDetails')}</span>
            </button>
            <button
              type="button"
              id="buyer-profile-signout-btn"
              className="buyer-btn-danger"
              onClick={() => setSignOutModalOpen(true)}
            >
              <LogOut size={15} />
              <span>{t('signOut')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
