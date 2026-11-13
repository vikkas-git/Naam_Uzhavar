// pages/admin/AdminLogin.jsx - Administrator authentication gate
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { ROUTES } from '../../routes';
import './AdminLogin.css';

export default function AdminLogin() {
  const { login, isLoading } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both administrative email and password.');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      navigate(ROUTES.ADMIN);
    } else {
      setError(res.error || 'Authentication rejected. Verify credentials.');
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@naamuzhavar.com');
    setPassword('Admin@2026');
    setError(null);
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        {/* Header with Official Logo */}
        <div className="admin-login-header">
          <img
            src="/logo.png"
            alt="Naam Uzhavar"
            className="admin-login-logo-img"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/logo-emblem.png';
            }}
          />
          <h1 className="admin-login-title">Naam Uzhavar</h1>
          <p className="admin-login-subtitle">Centralized Operations & Logistics Administration</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="admin-login-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          {/* Email Field */}
          <div className="admin-field-group">
            <label className="admin-field-label">Administrator Email</label>
            <div className="admin-input-wrapper">
              <Mail size={17} className="admin-input-icon" />
              <input
                type="email"
                className="admin-input-control"
                placeholder="admin@naamuzhavar.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="admin-field-group">
            <label className="admin-field-label">Security Password</label>
            <div className="admin-input-wrapper">
              <Lock size={17} className="admin-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="admin-input-control with-eye"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="admin-input-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="admin-submit-btn"
            disabled={isLoading}
          >
            <span>{isLoading ? 'Verifying Access...' : 'Sign In to Operations Console'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Default Operational Credentials Card */}
        <div className="admin-demo-box">
          <div className="admin-demo-box-title">
            <KeyRound size={13} />
            <span>Default Operational Credentials</span>
          </div>
          <div className="admin-demo-creds">
            <div className="admin-demo-cred-row">
              <span className="admin-demo-label">Email:</span>
              <strong className="admin-demo-value font-monospace">admin@naamuzhavar.com</strong>
            </div>
            <div className="admin-demo-cred-row">
              <span className="admin-demo-label">Pass:</span>
              <strong className="admin-demo-value font-monospace">Admin@2026</strong>
            </div>
          </div>
          <button
            type="button"
            className="admin-demo-fill-btn"
            onClick={handleFillDemo}
          >
            <Sparkles size={13} />
            <span>Auto-fill Credentials</span>
          </button>
        </div>
      </div>
    </div>
  );
}
