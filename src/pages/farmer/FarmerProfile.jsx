// What this file does: Farmer Account Profile page displaying verified producer credentials, farm land records, and direct escrow payout bank account.
// Adheres strictly to the Naam Uzhavar Buyer Profile Design System (card boxes, buttons, typography, font size, spacing).

import React, { useState, useRef } from 'react';
import {
  User,
  Camera,
  CheckCircle2,
  Check,
  ShieldCheck,
  Edit3,
  LogOut,
  Sprout,
  MapPin,
  Building2,
  Wheat
} from 'lucide-react';
import { useFarmer } from '../../context/FarmerContext';
import { INITIAL_FARMER_PROFILE } from '../../data/farmerMockData';
import EditFarmerProfileModal from '../../components/farmer/EditFarmerProfileModal';
import { ProfileSkeleton } from '../../components/Skeleton';
import './FarmerProfile.css';

export default function FarmerProfile() {
  const {
    isDataLoading,
    profile,
    handleSaveProfile,
    setSignOutModalOpen,
    showToast,
    lang
  } = useFarmer();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const photoInputRef = useRef(null);

  const p = profile || {};
  const farm = p.farmDetails || INITIAL_FARMER_PROFILE.farmDetails || {};
  const bank = p.bankDetails || INITIAL_FARMER_PROFILE.bankDetails || {};

  // Direct photo change handler
  const handleDirectPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', lang === 'ta' ? 'சரியான படக் கோப்பைத் தேர்ந்தெடுக்கவும்' : 'Please select a valid image file');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showToast('error', lang === 'ta' ? 'படத்தின் அளவு 4MB-க்கு குறைவாக இருக்க வேண்டும்' : 'Image size must be less than 4MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result;
      const updated = { ...p, avatar: dataUrl };
      const success = await handleSaveProfile(updated);
      if (success) {
        showToast('success', lang === 'ta' ? 'சுயவிவரப் புகைப்படம் புதுப்பிக்கப்பட்டது!' : 'Profile photo updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Format farm address nicely
  const formatFarmAddress = (f) => {
    if (!f) return 'SF No. 142/2, Kinathukadavu Main Road, Pollachi, Coimbatore, Tamil Nadu - 642001';
    const parts = [
      f.landAddress,
      f.village,
      f.district,
      f.state,
      f.pincode ? `- ${f.pincode}` : ''
    ].filter(Boolean);
    return parts.join(', ') || 'Pollachi, Coimbatore, Tamil Nadu - 642001';
  };

  // Mask bank account number cleanly
  const formatMaskedAccount = (num) => {
    if (!num) return '•••• •••• •••• 1034';
    const clean = String(num).replace(/\D/g, '');
    if (clean.length <= 4) return clean;
    return `•••• •••• •••• ${clean.slice(-4)}`;
  };

  if (isDataLoading && !profile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="buyer-view-container animate-fade-in">
      {/* 1. Header (Exact Buyer View Header) */}
      <div className="buyer-view-header">
        <div>
          <h1 className="buyer-view-title">
            {lang === 'ta' ? 'விவசாயி சுயவிவரம்' : 'Farmer Profile'}
          </h1>
          <p className="buyer-view-subtitle">
            {lang === 'ta'
              ? 'விவசாய அடையாள சான்றிதழ்கள், சாகுபடி பண்ணை நில விவரங்கள் மற்றும் நேரடி வங்கி கணக்கு மேலாண்மை'
              : 'Verified agricultural producer identity, farm cultivation records, and escrow payout bank account.'}
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
          onChange={handleDirectPhotoUpload}
        />

        <div className="buyer-profile-box">
          {/* Top Profile Banner with Photo & Verified Badge */}
          <div className="buyer-profile-top-banner">
            <div className="buyer-profile-photo-wrapper">
              {p.avatar ? (
                <img
                  src={p.avatar}
                  alt={p.name || 'Farmer'}
                  className="buyer-profile-photo-large"
                />
              ) : (
                <div className="buyer-profile-photo-fallback">
                  <User size={36} />
                </div>
              )}
              {/* Photo Change Badge Button */}
              <button
                type="button"
                className="buyer-profile-photo-change-btn"
                onClick={() => photoInputRef.current?.click()}
                title={lang === 'ta' ? 'புகைப்படம் மாற்ற' : 'Upload / Change Photo'}
                aria-label="Change photo"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="buyer-profile-header-text">
              <div className="buyer-profile-name-row">
                <h2 className="buyer-profile-firm-name">
                  {farm.farmName || p.name || (lang === 'ta' ? 'பசுமை பண்ணை' : 'Green Valley Natural Farm')}
                </h2>
                <span className="buyer-verified-badge">
                  <CheckCircle2 size={13} />
                  <span>{lang === 'ta' ? 'உறுதிசெய்யப்பட்ட விவசாயி' : 'Verified Farmer'}</span>
                </span>
              </div>
              <p className="buyer-profile-firm-sub">
                👤 {p.name || 'Ramesh Kumar'} •{' '}
                {lang === 'ta' ? 'வணிக இயற்கை விவசாய உற்பத்தியாளர்' : 'Commercial Harvest Producer'}
              </p>
              <div className="buyer-profile-meta-tags">
                <span className="buyer-category-pill">
                  <Sprout size={12} />
                  <span>
                    {farm.farmingMethod || (lang === 'ta' ? 'இயற்கை & நஞ்சில்லா விவசாயம்' : 'Natural & Organic Cultivation')}
                  </span>
                </span>
                <span className="buyer-id-pill">ID: {p.farmerId || 'FMR-TN-2026-01'}</span>
              </div>
            </div>
          </div>

          {/* Details Grid (Exact Buyer 2-Column Grid) */}
          <div className="buyer-profile-details-grid">
            {/* 1. Farmer Full Name */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'விவசாயி முழுப் பெயர்' : 'Farmer Full Name'}
              </span>
              <span className="detail-value">{p.name || '-'}</span>
              <span className="detail-subtext">
                {lang === 'ta' ? 'பதிவுசெய்யப்பட்ட முதன்மை விவசாய உற்பத்தியாளர்' : 'Registered Land Pattadhar & Primary Producer'}
              </span>
            </div>

            {/* 2. Mobile Number */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'கைபேசி எண்' : 'Mobile Number'}
              </span>
              <span className="detail-value font-mono">{p.phone || '-'}</span>
              <span className="detail-status-pill green">
                <Check size={11} /> {lang === 'ta' ? 'சரிபார்க்கப்பட்ட கைபேசி எண்' : 'Verified Mobile & Instant Alerts'}
              </span>
            </div>

            {/* 3. Email */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
              </span>
              <span className="detail-value">{p.email || '-'}</span>
              <span className="detail-status-pill green">
                <Check size={11} /> {lang === 'ta' ? 'மின்-ரசீதுகள் & அறிக்கைகள் இயக்கப்பட்டது' : 'E-Statements & Receipts Active'}
              </span>
            </div>

            {/* 4. Farm Name */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'பண்ணை பெயர்' : 'Farm / Estate Name'}
              </span>
              <span className="detail-value font-semibold">
                {farm.farmName || p.name || '-'}
              </span>
              <span className="detail-subtext">
                {lang === 'ta' ? 'வணிக கொள்முதல் பண்ணை மையம்' : 'Commercial Farm Gate Procurement Center'}
              </span>
            </div>

            {/* 5. Cultivation Land Area */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'விளைநில பரப்பளவு' : 'Cultivation Land Area'}
              </span>
              <span className="detail-value font-mono font-semibold">
                {farm.landArea ? `${farm.landArea} ${farm.landAreaUnit || 'Acres'}` : '4.5 Acres'}
              </span>
              <span className="detail-subtext">
                {lang === 'ta' ? 'மொத்த பதிவுசெய்யப்பட்ட சாகுபடி நிலம்' : 'Total Registered Agricultural Land'}
              </span>
            </div>

            {/* 6. Farming Method & Certification */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'விவசாய முறை & தரம்' : 'Farming Method & Certification'}
              </span>
              <span className="detail-value">
                {farm.farmingMethod || (lang === 'ta' ? 'இயற்கை & நஞ்சில்லா விவசாயம்' : 'Natural & Organic Horticulture')}
              </span>
              <span className="detail-subtext">
                {lang === 'ta' ? 'தரம் A தரச்சான்றிதழ் பெற்ற விளைச்சல்' : 'Grade A Table-grade Produce Certified'}
              </span>
            </div>

            {/* 7. Patta / Chitta Land Record Number */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'பட்டா / சிட்டா பதிவு எண்' : 'Patta / Chitta Land Record No.'}
              </span>
              <span className="detail-value font-mono font-semibold">
                {farm.pattaNumber || farm.pattaNo || p.pattaNo || p.pattaNumber || 'TN-2026-PT-4821'}
              </span>
              <span className="detail-status-pill green">
                <Check size={11} /> {lang === 'ta' ? 'வருவாய்த்துறை சரிபார்க்கப்பட்டது' : 'Verified Revenue Land Record'}
              </span>
            </div>

            {/* 8. Primary Farm Location & EV Pickup Point (Full Width) */}
            <div className="buyer-detail-item full-width">
              <span className="detail-label">
                {lang === 'ta' ? 'முதன்மை பண்ணை முகவரி & ஏற்றுமதி மையம்' : 'Primary Farm Location & EV Pickup Point'}
              </span>
              <span className="detail-value">{formatFarmAddress(farm)}</span>
              <span className="detail-subtext">
                {lang === 'ta'
                  ? 'நேரடி பண்ணை வாசல் சரக்கு ஏற்றுமதி மையம் • EV சரக்கு வாகனங்கள் எளிதில் அணுகக்கூடியது'
                  : 'Direct farm gate EV cargo loading point • Readily accessible for commercial transport'}
              </span>
            </div>

            {/* 8. Assigned Aggregation Hub */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'ஒதுக்கப்பட்ட வேளாண் மையம்' : 'Assigned Agri-Hub'}
              </span>
              <span className="detail-value">
                {p.hub || 'Pollachi Central Hub (12 Km)'}
              </span>
              <span className="detail-subtext">
                {lang === 'ta' ? 'குளிர்பதன கிடங்கு & துரித விநியோக இணைப்பு' : 'Integrated cold storage & direct buyer delivery corridor'}
              </span>
            </div>

            {/* 9. Direct Escrow Bank Account */}
            <div className="buyer-detail-item">
              <span className="detail-label">
                {lang === 'ta' ? 'நேரடி எஸ்க்ரோ வங்கி கணக்கு' : 'Direct Escrow Bank Payout'}
              </span>
              <span className="detail-value font-mono">
                {bank.bankName || 'State Bank of India'} • {formatMaskedAccount(bank.accountNumber)}
              </span>
              <span className="detail-status-pill green">
                <ShieldCheck size={11} />{' '}
                {lang === 'ta'
                  ? `நேரடி பணம் செலுத்துதல் சரிபார்க்கப்பட்டது (IFSC: ${bank.ifscCode || 'SBIN0001248'})`
                  : `Direct Payout Verified (IFSC: ${bank.ifscCode || 'SBIN0001248'})`}
              </span>
            </div>
          </div>

          {/* Profile Action Buttons (Exact Buyer Standards) */}
          <div className="buyer-profile-footer-actions">
            <button
              type="button"
              className="buyer-btn-outline"
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera size={15} />
              <span>{lang === 'ta' ? 'புகைப்படம் மாற்ற' : 'Change Photo'}</span>
            </button>
            <button
              type="button"
              className="buyer-btn-primary"
              onClick={() => setEditModalOpen(true)}
            >
              <Edit3 size={15} />
              <span>{lang === 'ta' ? 'பண்ணை விவரங்களை திருத்து' : 'Edit Farmer Profile'}</span>
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

      {/* Edit Farmer Profile Modal */}
      <EditFarmerProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        profile={p}
        onSave={handleSaveProfile}
        lang={lang}
      />
    </div>
  );
}
