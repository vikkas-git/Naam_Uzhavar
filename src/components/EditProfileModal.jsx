// What this file does: Reusable modal dialog for editing buyer business profile details.

import React from 'react';
import { Edit3, X, Camera, Building2, CheckCircle2 } from 'lucide-react';
import { useT } from '../hooks/useT';

export default function EditProfileModal({
  isOpen,
  onClose,
  editFormData,
  setEditFormData,
  handleSaveProfile,
  _lang
}) {
  const { t } = useT('buyerDashboard');

  if (!isOpen) return null;

  return (
    <div className="buyer-modal-backdrop" onClick={onClose}>
      <div className="buyer-modal-panel profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="buyer-modal-header">
          <div className="buyer-modal-icon-wrap green">
            <Edit3 size={20} />
          </div>
          <div>
            <h3 className="buyer-modal-title">
              {t('modals.editProfileTitle')}
            </h3>
            <p className="buyer-modal-subtitle">
              {t('modals.editProfileSubtitle')}
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

        <form onSubmit={handleSaveProfile}>
          <div className="buyer-modal-body">
            {/* Photo Update Section */}
            <div className="buyer-edit-photo-row">
              <div className="buyer-edit-photo-wrap">
                {editFormData.photo || editFormData.photoPreview ? (
                  <img
                    src={editFormData.photo || editFormData.photoPreview}
                    alt="Profile preview"
                    className="buyer-edit-photo-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 size={32} />
                )}
              </div>
              <div className="buyer-edit-photo-info">
                <span className="buyer-edit-photo-title">
                  {t('modals.profilePhotoTitle')}
                </span>
                <p className="buyer-edit-photo-desc">
                  {t('modals.profilePhotoDesc')}
                </p>
                <label className="buyer-btn-outline buyer-btn-xs buyer-upload-label">
                  <Camera size={13} />
                  <span>{t('modals.uploadNewPhoto')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setEditFormData((prev) => ({
                          ...prev,
                          photo: ev.target.result,
                          photoPreview: ev.target.result
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="buyer-edit-grid">
              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {t('profile.contactPersonLabel')}
                </label>
                <input
                  type="text"
                  className="buyer-text-input"
                  value={editFormData.contactPerson || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
                  required
                />
              </div>

              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {t('profile.shopNameLabel')}
                </label>
                <input
                  type="text"
                  className="buyer-text-input"
                  value={editFormData.shopName || ''}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      shopName: e.target.value,
                      name: e.target.value
                    })
                  }
                  required
                />
              </div>

              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {t('buyerRegister.phoneLabel')}
                </label>
                <input
                  type="tel"
                  className="buyer-text-input"
                  value={editFormData.phone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {t('profile.procurementEmail')}
                </label>
                <input
                  type="email"
                  className="buyer-text-input"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />
              </div>

              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {t('profile.buyerCategoryLabel')}
                </label>
                <select
                  className="buyer-text-input"
                  value={editFormData.buyerType || 'hotel'}
                  onChange={(e) => setEditFormData({ ...editFormData, buyerType: e.target.value })}
                >
                  <option value="hotel">{t('profile.hotelShortCategory')}</option>
                  <option value="supermarket">{t('profile.supermarketShortCategory')}</option>
                  <option value="retailer">{t('profile.retailerShortCategory')}</option>
                  <option value="mahal">{t('profile.functionHallCategory')}</option>
                </select>
              </div>

              <div className="buyer-form-group">
                <label className="buyer-field-label">
                  {t('profile.gstinLabel')}
                </label>
                <input
                  type="text"
                  className="buyer-text-input font-mono"
                  value={editFormData.gstin || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, gstin: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="buyer-form-group full-width">
                <label className="buyer-field-label">
                  {t('profile.loadingBayAddressLabel')}
                </label>
                <textarea
                  rows={2}
                  className="buyer-text-input"
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
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
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="buyer-btn-primary"
            >
              <CheckCircle2 size={16} />
              <span>{t('common.saveChanges')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
