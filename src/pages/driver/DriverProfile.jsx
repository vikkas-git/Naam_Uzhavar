// What this file does: Driver Account Profile & EV Fleet Credentials.
// Strictly adheres to the Buyer Module Profile template: Top Banner with Photo & Badges,
// Complete 10-Field Details Grid, Footer Actions (Change Photo, Edit Details, Sign Out), and Edit Modal.

import React, { useState, useRef } from 'react';
import {
  Truck,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Check,
  Camera,
  Edit3,
  LogOut,
  MapPin,
  X,
  CheckCheck
} from 'lucide-react';
import Button from '../../components/Button';
import { ProfileSkeleton } from '../../components/Skeleton';
import { useDriver } from '../../context/DriverContext';
import '../buyer/Profile.css';
import './DriverDashboard.css';

export default function DriverProfile() {
  const {
    profile,
    vehicle,
    assignedHub,
    metrics,
    saveProfile,
    setSignOutModalOpen,
    isDataLoading,
    lang
  } = useDriver();

  if (isDataLoading && !profile) {
    return (
      <div className="buyer-view-container animate-fade-in">
        <ProfileSkeleton />
      </div>
    );
  }

  const photoInputRef = useRef(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [failedPhoto, setFailedPhoto] = useState(null);

  // Edit form state
  const [formData, setFormData] = useState({
    name: profile?.name || 'Kumar M.',
    phone: profile?.phone || '+91 94432 11098',
    email: profile?.email || 'kumar.logistics@naamuzhavar.com',
    assignedHub: profile?.assignedHub || 'Dindigul Central Hub',
    address: profile?.address || 'SF No. 18, Bypass Road, Near Central Agri Mandi, Dindigul, Tamil Nadu - 624001'
  });

  const photoSrc = profile?.avatar;
  const isPhotoValid = Boolean(photoSrc && failedPhoto !== photoSrc);

  const driverName = profile?.name || 'Kumar M.';
  const vehicleName = vehicle?.model || 'Tata Ace EV Cargo';
  const vehicleNo = vehicle?.vehicleNumber || 'TN 57 AB 1234';

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = {
          ...profile,
          avatar: reader.result
        };
        saveProfile(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = (e) => {
    if (e) e.preventDefault();
    const updated = {
      ...profile,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      assignedHub: formData.assignedHub,
      address: formData.address
    };
    saveProfile(updated);
    setEditModalOpen(false);
  };

  return (
    <div className="buyer-view-container animate-fade-in">
      {/* 0. VIEW HEADER */}
      <div className="buyer-view-header">
        <div>
          <h1 className="buyer-view-title">
            {lang === 'ta' ? 'ஓட்டுநர் சுயவிவரம் & வாகனம்' : 'Driver Profile & Vehicle'}
          </h1>
          <p className="buyer-view-subtitle">
            {lang === 'ta'
              ? 'சரிபார்க்கப்பட்ட ஓட்டுநர் உரிமம் மற்றும் டாடா ஏஸ் EV சரக்கு விவரங்கள்'
              : 'Commercial driver credentials, vehicle specifications, and logistics hub allocation'}
          </p>
        </div>
      </div>

      {/* 1. MAIN PROFILE CARD CONTAINER (Exact Buyer Template) */}
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
          {/* Top Profile Banner with Photo & Verified Badges */}
          <div className="buyer-profile-top-banner">
            <div className="buyer-profile-photo-wrapper">
              {isPhotoValid ? (
                <img
                  key={photoSrc}
                  src={photoSrc}
                  alt={driverName}
                  className="buyer-profile-photo-large"
                  onError={() => setFailedPhoto(photoSrc)}
                />
              ) : (
                <div className="buyer-profile-photo-fallback" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                  <Truck size={36} />
                </div>
              )}
              {/* Photo Change Badge Button */}
              <button
                type="button"
                className="buyer-profile-photo-change-btn"
                style={{ backgroundColor: '#b45309' }}
                onClick={() => photoInputRef.current?.click()}
                title="Upload / Change Photo"
                aria-label="Change photo"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="buyer-profile-header-text">
              <div className="buyer-profile-name-row">
                <h2 className="buyer-profile-firm-name">{driverName}</h2>
                <span className="buyer-verified-badge">
                  <CheckCircle2 size={13} />
                  <span>{profile?.license?.badge || 'Green Logistics Pro'}</span>
                </span>
              </div>

              <p className="buyer-profile-firm-sub">
                🚚 {vehicleName} ({vehicleNo}) • {lang === 'ta' ? 'வணிக ரீதியான EV ஓட்டுநர்' : 'Commercial EV Logistics Pilot'}
              </p>

              <div className="buyer-profile-meta-tags">
                <span className="buyer-category-pill">
                  <Zap size={12} color="#b45309" />
                  <span>Zero-Emission EV LCV</span>
                </span>
                <span className="buyer-id-pill">ID: {profile?.driverId || 'DRV-TN-2026-08'}</span>
                <span className="buyer-category-pill">
                  <MapPin size={12} color="#15803d" />
                  <span>{assignedHub || 'Dindigul Central Hub'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Complete 10-Field Details Grid (Exact Buyer Template) */}
          <div className="buyer-profile-details-grid">
            {/* 1. Driver Full Name */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'முழு பெயர்' : 'Driver Full Name'}
              </span>
              <span className="detail-value">{driverName} ({profile?.tamilName || 'குமார் எம்.'})</span>
              <span className="detail-subtext">
                {lang === 'ta' ? 'பதிவு செய்யப்பட்ட EV ஓட்டுநர்' : 'Registered Commercial EV Logistics Pilot'}
              </span>
            </div>

            {/* 2. Contact Phone Number */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'கைபேசி எண்' : 'Contact Phone Number'}
              </span>
              <span className="detail-value font-mono">{profile?.phone || '+91 94432 11098'}</span>
              <span className="detail-status-pill green">
                <Check size={11} /> {lang === 'ta' ? 'சரிபார்க்கப்பட்ட எண் & WhatsApp' : 'Verified WhatsApp & SMS Dispatches'}
              </span>
            </div>

            {/* 3. Official Email Address */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Official Driver Email'}
              </span>
              <span className="detail-value font-mono">{profile?.email || 'kumar.logistics@naamuzhavar.com'}</span>
              <span className="detail-status-pill green">
                <Check size={11} /> {lang === 'ta' ? 'டிஜிட்டல் ரசீது & பணப்பரிமாற்றம்' : 'Digital Trip Receipts & Payouts'}
              </span>
            </div>

            {/* 4. Commercial Driving License */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'வணிக ஓட்டுநர் உரிமம் (DL)' : 'Commercial Driving License (DL)'}
              </span>
              <span className="detail-value font-mono font-bold" style={{ color: '#b45309' }}>
                {profile?.license?.licenseNumber || 'TN-57-2020-008912'}
              </span>
              <span className="detail-status-pill green">
                <ShieldCheck size={11} /> {lang === 'ta' ? 'செல்லுபடி காலம்: 2028 வரை (Transport LCV)' : `Valid Until ${profile?.license?.validUntil || '2028-09-30'} (Transport LCV)`}
              </span>
            </div>

            {/* 5. Assigned Fleet Vehicle */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'ஒதுக்கப்பட்ட EV வாகனம்' : 'Assigned Fleet Vehicle'}
              </span>
              <span className="detail-value font-semibold">
                {vehicleName}
              </span>
              <span className="detail-status-pill green">
                <Check size={11} /> Reg: {vehicleNo}
              </span>
            </div>

            {/* 6. EV Battery & Range */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'மின்கல இருப்பு & தூரம்' : 'EV Battery & Estimated Range'}
              </span>
              <span className="detail-value font-mono text-success font-bold">
                {vehicle?.currentBatteryPct || 82}% Battery • {vehicle?.estimatedRangeKm || 68} km Range
              </span>
              <span className="detail-subtext">
                21.3 kWh LFP Battery • {vehicle?.healthPct || 98}% Health (CCS-2 Fast Charging)
              </span>
            </div>

            {/* 7. Payload Capacity */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'வாகன ஏற்று திறன்' : 'Vehicle Payload Capacity'}
              </span>
              <span className="detail-value font-mono font-semibold">
                {vehicle?.maxPayloadKg || 600} kg Gross Payload
              </span>
              <span className="detail-subtext">
                {lang === 'ta' ? 'தோராயமாக 24 காய்கறி பெட்டிகள் கொள்ளளவு' : 'Standardized for ~24 agricultural harvest crates'}
              </span>
            </div>

            {/* 8. Assigned Regional Hub */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'ஒதுக்கப்பட்ட சரக்கு மையம்' : 'Primary Agri Logistics Hub'}
              </span>
              <span className="detail-value">
                {assignedHub || 'Dindigul Central Hub'}
              </span>
              <span className="detail-subtext">
                Coimbatore - Dindigul - Madurai Corridor
              </span>
            </div>

            {/* 9. Performance & Safety Rating */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'செயல்திறன் & மதிப்பீடு' : 'Performance & Safety Rating'}
              </span>
              <span className="detail-value font-bold text-warning">
                ★ {metrics?.rating || 4.92} / 5.0 Rating
              </span>
              <span className="detail-subtext">
                {metrics?.totalDispatches || 148} Deliveries • {metrics?.onTimeRatePct || 99.1}% On-Time
              </span>
            </div>

            {/* 10. Operating Garage / Base Address (Full Width) */}
            <div className="buyer-detail-item full-width">
              <span className="detail-label">
                {lang === 'ta' ? 'பணிமனை / கிடங்கு முகவரி' : 'Operating Base / Garage Address'}
              </span>
              <span className="detail-value">
                {formData.address}
              </span>
              <span className="detail-subtext">
                {lang === 'ta' ? 'வாகன நிறுத்துமிடம், பேட்டரி பராமரிப்பு மற்றும் இரவு பணிமனை' : 'Official vehicle garaging, battery maintenance & night depot'}
              </span>
            </div>
          </div>

          {/* Profile Action Buttons (Exact Buyer Template) */}
          <div className="buyer-profile-footer-actions">
            <button
              type="button"
              className="buyer-btn-outline"
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera size={15} />
              <span>{lang === 'ta' ? 'புகைப்படம் மாற்று' : 'Change Photo'}</span>
            </button>

            <button
              type="button"
              className="buyer-btn-primary"
              style={{ backgroundColor: '#b45309', borderColor: '#b45309' }}
              onClick={() => setEditModalOpen(true)}
            >
              <Edit3 size={15} />
              <span>{lang === 'ta' ? 'விவரங்களை திருத்து' : 'Edit Driver Details'}</span>
            </button>

            <button
              type="button"
              className="buyer-btn-danger"
              onClick={() => setSignOutModalOpen(true)}
            >
              <LogOut size={15} />
              <span>{lang === 'ta' ? 'வெளியேறு' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. EDIT DRIVER PROFILE MODAL */}
      {editModalOpen && (
        <div className="driver-modal-backdrop" role="dialog" aria-modal="true">
          <div className="driver-modal-card" style={{ maxWidth: 480 }}>
            <button
              type="button"
              className="driver-modal-x-btn"
              onClick={() => setEditModalOpen(false)}
            >
              <X size={18} />
            </button>

            <div className="driver-modal-icon-wrap">
              <Edit3 size={26} />
            </div>

            <h3 className="driver-modal-title">
              {lang === 'ta' ? 'ஓட்டுநர் விவரங்களை திருத்து' : 'Edit Driver Details'}
            </h3>

            <p className="driver-modal-desc">
              {lang === 'ta'
                ? 'உங்கள் தொடர்பு எண்கள் மற்றும் பணிமனை முகவரியை இற்றைப்படுத்தவும்.'
                : 'Update your official commercial driver contact information and depot address.'}
            </p>

            <form onSubmit={handleEditSubmit}>
              <div className="mb-3 text-start">
                <label className="form-label small fw-bold text-muted">
                  {lang === 'ta' ? 'ஓட்டுநர் பெயர்' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="mb-3 text-start">
                <label className="form-label small fw-bold text-muted">
                  {lang === 'ta' ? 'கைபேசி எண்' : 'Mobile Number'}
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-control font-mono"
                  required
                />
              </div>

              <div className="mb-3 text-start">
                <label className="form-label small fw-bold text-muted">
                  {lang === 'ta' ? 'மின்னஞ்சல்' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-control font-mono"
                  required
                />
              </div>

              <div className="mb-3 text-start">
                <label className="form-label small fw-bold text-muted">
                  {lang === 'ta' ? 'ஒதுக்கப்பட்ட சரக்கு மையம்' : 'Assigned Hub'}
                </label>
                <input
                  type="text"
                  value={formData.assignedHub}
                  onChange={(e) => setFormData({ ...formData, assignedHub: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <div className="mb-4 text-start">
                <label className="form-label small fw-bold text-muted">
                  {lang === 'ta' ? 'பணிமனை / கிடங்கு முகவரி' : 'Depot / Garage Address'}
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-control"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                style={{ width: '100%', minHeight: '48px', backgroundColor: '#b45309', borderColor: '#b45309' }}
              >
                <CheckCheck size={18} />
                <span>{lang === 'ta' ? 'விவரங்களை சேமி ➔' : 'Save Driver Details ➔'}</span>
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
