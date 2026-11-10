// What this file does: Reusable modal dialog for editing Farmer profile, farm land records, and direct escrow bank account.
// Adheres strictly to the Naam Uzhavar Buyer Design System (modal backdrop, grid, tokens, buttons).

import React, { useState, useEffect } from 'react';
import { Edit3, X, Camera, User, CheckCircle2 } from 'lucide-react';

const DISTRICTS_TN = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul',
  'Erode', 'Kallakurichi', 'Kancheepuram', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram',
  'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi',
  'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai',
  'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
];

export default function EditFarmerProfileModal({
  isOpen,
  onClose,
  profile,
  onSave,
  lang
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    avatar: '',
    farmDetails: {
      farmName: '',
      landAddress: '',
      village: '',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '',
      landArea: 4.5,
      landAreaUnit: 'Acres',
      farmingMethod: 'Natural & Organic'
    },
    bankDetails: {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: ''
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        avatar: profile.avatar || '',
        farmDetails: {
          farmName: profile.farmDetails?.farmName || '',
          landAddress: profile.farmDetails?.landAddress || '',
          village: profile.farmDetails?.village || '',
          district: profile.farmDetails?.district || 'Coimbatore',
          state: profile.farmDetails?.state || 'Tamil Nadu',
          pincode: profile.farmDetails?.pincode || '',
          landArea: profile.farmDetails?.landArea || 4.5,
          landAreaUnit: profile.farmDetails?.landAreaUnit || 'Acres',
          farmingMethod: profile.farmDetails?.farmingMethod || 'Natural & Organic'
        },
        bankDetails: {
          accountHolderName: profile.bankDetails?.accountHolderName || profile.name || '',
          bankName: profile.bankDetails?.bankName || '',
          accountNumber: profile.bankDetails?.accountNumber || '',
          ifscCode: profile.bankDetails?.ifscCode || '',
          branchName: profile.bankDetails?.branchName || ''
        }
      });
    }
  }, [profile]);

  if (!isOpen) return null;

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData((prev) => ({
        ...prev,
        avatar: ev.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await onSave(formData);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="buyer-modal-backdrop" onClick={onClose}>
      <div
        className="buyer-modal-panel profile-modal"
        style={{ maxWidth: 660, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="buyer-modal-header">
          <div className="buyer-modal-icon-wrap green">
            <Edit3 size={20} />
          </div>
          <div>
            <h3 className="buyer-modal-title">
              {lang === 'ta' ? 'பண்ணை சுயவிவரத்தை திருத்து' : 'Edit Farmer Profile'}
            </h3>
            <p className="buyer-modal-subtitle">
              {lang === 'ta'
                ? 'பண்ணை விவரங்கள், சாகுபடி நிலம் மற்றும் வங்கி கணக்கை புதுப்பிக்கவும்'
                : 'Update verified farm identity, land holding, and direct payout credentials.'}
            </p>
          </div>
          <button
            type="button"
            className="buyer-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="buyer-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Photo Row */}
            <div className="buyer-edit-photo-row">
              <div className="buyer-edit-photo-wrap">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Farmer preview"
                    className="buyer-edit-photo-img"
                  />
                ) : (
                  <User size={32} />
                )}
              </div>
              <div className="buyer-edit-photo-info">
                <span className="buyer-edit-photo-title">
                  {lang === 'ta' ? 'விவசாயி சுயவிவர புகைப்படம்' : 'Farmer Profile Photo'}
                </span>
                <p className="buyer-edit-photo-desc">
                  {lang === 'ta'
                    ? 'விவசாயி அல்லது பண்ணை புகைப்படத்தை பதிவேற்றவும் (PNG, JPG)'
                    : 'Clear farmer portrait or farm signage helps verify trust with institutional buyers.'}
                </p>
                <label className="buyer-btn-outline buyer-btn-xs buyer-upload-label" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Camera size={13} />
                  <span>{lang === 'ta' ? 'புதிய புகைப்படம் பதிவேற்ற' : 'Upload New Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoSelect}
                  />
                </label>
              </div>
            </div>

            {/* Grid of Inputs */}
            <div className="buyer-edit-grid">
              {/* Farmer Full Name */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'விவசாயி பெயர்' : 'Farmer Full Name'} *
                </label>
                <input
                  type="text"
                  className="buyer-text-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Farm / Estate Name */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'பண்ணை பெயர்' : 'Farm / Estate Name'} *
                </label>
                <input
                  type="text"
                  className="buyer-text-input"
                  value={formData.farmDetails.farmName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      farmDetails: { ...formData.farmDetails, farmName: e.target.value }
                    })
                  }
                  required
                />
              </div>

              {/* Mobile Number */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'கைபேசி எண்' : 'Mobile Number'} *
                </label>
                <input
                  type="tel"
                  className="buyer-text-input font-mono"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              {/* Email Address */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'மின்னஞ்சல் முகவரி' : 'Email Address'}
                </label>
                <input
                  type="email"
                  className="buyer-text-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Land Area */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'சாகுபடி நில பரப்பளவு' : 'Cultivation Land Area'} *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="buyer-text-input font-mono"
                    value={formData.farmDetails.landArea}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        farmDetails: { ...formData.farmDetails, landArea: e.target.value }
                      })
                    }
                    required
                  />
                  <select
                    className="buyer-text-input"
                    style={{ width: 110, flexShrink: 0 }}
                    value={formData.farmDetails.landAreaUnit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        farmDetails: { ...formData.farmDetails, landAreaUnit: e.target.value }
                      })
                    }
                  >
                    <option value="Acres">Acres</option>
                    <option value="Cents">Cents</option>
                    <option value="Hectares">Hectares</option>
                  </select>
                </div>
              </div>

              {/* Farming Method */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'விவசாய முறை' : 'Farming Method'}
                </label>
                <select
                  className="buyer-text-input"
                  value={formData.farmDetails.farmingMethod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      farmDetails: { ...formData.farmDetails, farmingMethod: e.target.value }
                    })
                  }
                >
                  <option value="Natural & Organic">Natural & Organic</option>
                  <option value="Zero Budget Natural Farming (ZBNF)">Zero Budget Natural Farming (ZBNF)</option>
                  <option value="Traditional Conventional">Traditional Conventional</option>
                  <option value="GAP Certified Integrated">GAP Certified Integrated</option>
                </select>
              </div>

              {/* Farm Street Address (Full Width) */}
              <div className="buyer-form-group full-width">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'பண்ணை முகவரி / சர்வே எண்' : 'Farm Street Address / Survey No'} *
                </label>
                <input
                  type="text"
                  className="buyer-text-input"
                  placeholder="e.g. SF No. 142/2, Kinathukadavu Main Road"
                  value={formData.farmDetails.landAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      farmDetails: { ...formData.farmDetails, landAddress: e.target.value }
                    })
                  }
                  required
                />
              </div>

              {/* Village / Town */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'கிராமம் / நகரம்' : 'Village / Town'} *
                </label>
                <input
                  type="text"
                  className="buyer-text-input"
                  placeholder="e.g. Pollachi"
                  value={formData.farmDetails.village}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      farmDetails: { ...formData.farmDetails, village: e.target.value }
                    })
                  }
                  required
                />
              </div>

              {/* District */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'மாவட்டம்' : 'District'} *
                </label>
                <select
                  className="buyer-text-input"
                  value={formData.farmDetails.district}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      farmDetails: { ...formData.farmDetails, district: e.target.value }
                    })
                  }
                >
                  {DISTRICTS_TN.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* PIN Code */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'அஞ்சல் குறியீடு (PIN)' : 'PIN Code'} *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className="buyer-text-input font-mono"
                  placeholder="e.g. 642001"
                  value={formData.farmDetails.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      farmDetails: { ...formData.farmDetails, pincode: e.target.value.replace(/\D/g, '') }
                    })
                  }
                  required
                />
              </div>

              {/* Bank Name */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'வங்கி பெயர்' : 'Bank Name'} *
                </label>
                <input
                  type="text"
                  className="buyer-text-input"
                  placeholder="e.g. State Bank of India"
                  value={formData.bankDetails.bankName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                    })
                  }
                  required
                />
              </div>

              {/* Account Number */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'வங்கி கணக்கு எண்' : 'Bank Account Number'} *
                </label>
                <input
                  type="text"
                  className="buyer-text-input font-mono"
                  placeholder="e.g. 30495821034"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountNumber: e.target.value.replace(/\D/g, '') }
                    })
                  }
                  required
                />
              </div>

              {/* IFSC Code */}
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {lang === 'ta' ? 'IFSC குறியீடு' : 'IFSC Code'} *
                </label>
                <input
                  type="text"
                  maxLength={11}
                  className="buyer-text-input font-mono"
                  placeholder="e.g. SBIN0001248"
                  style={{ textTransform: 'uppercase' }}
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                    })
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="buyer-modal-footer">
            <button
              type="button"
              className="buyer-btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {lang === 'ta' ? 'ரத்து செய்' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="buyer-btn-primary"
              disabled={isSubmitting}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? (lang === 'ta' ? 'சேமிக்கிறது...' : 'Saving...') : (lang === 'ta' ? 'மாற்றங்களை சேமி' : 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

