// pages/admin/AdminProfile.jsx - Centralized Administrator Account & Security Settings
import React, { useState } from 'react';
import {
  ShieldCheck,
  Save,
  Server
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import './AdminCommon.css';

export default function AdminProfile() {
  const { adminProfile, updateProfile, isLoading } = useAdmin();
  const [name, setName] = useState(adminProfile?.name || 'Naam Uzhavar Central Administrator');
  const [phone, setPhone] = useState(adminProfile?.phone || '+91 94432 00000');
  const [avatar, setAvatar] = useState(() => {
    if (adminProfile?.avatar && !adminProfile.avatar.includes('photo-1534528741775-53994a69daeb')) {
      return adminProfile.avatar;
    }
    return '';
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setPwError(null);

    const cleanAvatar = avatar && !avatar.includes('photo-1534528741775-53994a69daeb') ? avatar.trim() : '';
    const payload = { name, phone, avatar: cleanAvatar };

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setPwError('New passwords do not match');
        return;
      }
      if (!currentPassword) {
        setPwError('Current password is required to change password');
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    const res = await updateProfile(payload);
    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="admin-card mb-4">
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <h3>Admin Profile & Security</h3>
            <p>Manage administrator credentials and account settings</p>
          </div>
          <span className="admin-pill verified">
            <ShieldCheck size={12} />
            <span>SUPER ADMIN</span>
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="p-3 p-sm-4 d-flex flex-column gap-4">
          {/* Identity Overview */}
          <div className="d-flex align-items-center gap-3 gap-sm-4 p-3 bg-light rounded-3 flex-wrap">
            {avatar && !avatar.includes('photo-1534528741775-53994a69daeb') ? (
              <img
                src={avatar}
                alt="Admin"
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #4f6df5' }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #181e2b 0%, #334155 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '22px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 4px 14px rgba(24, 30, 43, 0.25)',
                  flexShrink: 0
                }}
              >
                {name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
              </div>
            )}
            <div>
              <h4 className="m-0 fw-bold text-dark">{name || 'Administrator'}</h4>
              <div className="text-muted small">{adminProfile?.email || 'admin@naamuzhavar.com'}</div>
              <div className="badge bg-primary-subtle text-primary border border-primary-subtle mt-1" style={{ fontSize: '11px' }}>
                Full Operational Access (Farmers, Buyers, Logistics, Drivers)
              </div>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="admin-field-label">Administrator Name</label>
              <input
                type="text"
                className="admin-form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="admin-field-label">Administrative Email</label>
              <input
                type="email"
                className="admin-form-input"
                value={adminProfile?.email || 'admin@naamuzhavar.com'}
                disabled
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="admin-field-label">Contact Phone</label>
              <input
                type="text"
                className="admin-form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="admin-field-label">Custom Avatar Image URL (Optional)</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="Leave blank for executive initials badge"
                value={avatar.includes('photo-1534528741775-53994a69daeb') ? '' : avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
            </div>
          </div>

          <hr className="my-2" />

          {/* Security Credentials Change */}
          <div>
            <h5 className="fs-6 fw-bold text-dark mb-1">Update Security Password</h5>
            <p className="text-muted small mb-3">Leave blank if you do not wish to modify the administrative password.</p>

            {pwError && (
              <div className="alert alert-danger py-2 small mb-3">{pwError}</div>
            )}

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="admin-field-label">Current Password</label>
                <input
                  type="password"
                  className="admin-form-input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="admin-field-label">New Password</label>
                <input
                  type="password"
                  className="admin-form-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="admin-field-label">Confirm New Password</label>
                <input
                  type="password"
                  className="admin-form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end pt-2">
            <button
              type="submit"
              className="admin-btn primary"
              disabled={isLoading}
            >
              <Save size={14} />
              <span>{isLoading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* System Status Card */}
      <div className="admin-card p-3">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <Server size={18} className="text-success" />
            <div>
              <div className="fw-bold small text-dark">System Status</div>
              <div className="text-muted" style={{ fontSize: '11px' }}>
                Backend API & Database Operational
              </div>
            </div>
          </div>
          <span className="badge bg-success" style={{ fontSize: '11px' }}>
            OPERATIONAL (PORT 5000)
          </span>
        </div>
      </div>
    </div>
  );
}

