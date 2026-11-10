// What this file does: Farmer authentication page with phone/email and password credentials.
// Matches Buyer Login 50/50 split-screen architecture strictly adhering to DESIGN.md.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sprout,
  Wheat,
  Globe
} from 'lucide-react';
import { useT } from '../hooks/useT';
import { ROUTES } from '../routes';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { api, setToken, DEMO_FARMER_JWT } from '../utils/api';
import './FarmerLogin.css';

/**
 * FarmerLogin Component
 * 
 * High-end agricultural authentication interface for Tamil Nadu Farmers
 * Mirrors Buyer Login layout and architecture with Farmer styling & palette (#2F6B3A).
 */
export default function FarmerLogin({ 
  onBack, 
  onNavigateToRegister, 
  onLoginSuccess 
}) {
  const navigate = useNavigate();
  const { t, toggleLang } = useT('farmerLogin');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Interaction & Error States
  const [touched, setTouched] = useState({ identifier: false, password: false });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Timer references for unmount cleanup
  const submitTimerRef = useRef(null);
  const forgotTimerRef = useRef(null);

  useEffect(() => {
    try {
      const pending = localStorage.getItem('farmer_registration_pending_email');
      if (pending) {
        setIdentifier(pending);
        setTouched((prev) => ({ ...prev, identifier: true }));
      }
    } catch {}

    const submitTimer = submitTimerRef;
    const forgotTimer = forgotTimerRef;

    return () => {
      if (submitTimer.current) clearTimeout(submitTimer.current);
      if (forgotTimer.current) clearTimeout(forgotTimer.current);
    };
  }, []);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Field Validation Logic
  const validateField = (fieldName, value) => {
    const trimmed = value.trim();
    if (fieldName === 'identifier') {
      if (!trimmed) {
        return t('errEmptyIdentifier');
      }
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      const digitsOnly = trimmed.replace(/\D/g, '');
      const isPhone = digitsOnly.length >= 10 && digitsOnly.length <= 13;

      if (!isEmail && !isPhone) {
        return t('errInvalidIdentifier');
      }
      return '';
    }

    if (fieldName === 'password') {
      if (!trimmed) {
        return t('errEmptyPassword');
      }
      if (trimmed.length < 4) {
        return t('errShortPassword');
      }
      return '';
    }

    return '';
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, field === 'identifier' ? identifier : password);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleIdentifierChange = (e) => {
    const val = e.target.value;
    setIdentifier(val);
    if (authError) setAuthError('');
    if (touched.identifier) {
      setErrors((prev) => ({ ...prev, identifier: validateField('identifier', val) }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (authError) setAuthError('');
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validateField('password', val) }));
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(ROUTES.ROLE_SELECT ? `${ROUTES.ROLE_SELECT}?role=farmer` : '/role-select');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToRegister = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else {
      navigate(ROUTES.FARMER_REGISTER);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const idError = validateField('identifier', identifier);
    const pwError = validateField('password', password);

    setTouched({ identifier: true, password: true });
    setErrors({ identifier: idError, password: pwError });

    if (idError || pwError) {
      return;
    }

    setIsSubmitting(true);
    const trimmedId = identifier.trim();

    // Client-side quick check: prevent buyer accounts from farmer login
    try {
      const buyerProfileRaw = localStorage.getItem('buyer_current_profile');
      if (buyerProfileRaw) {
        const buyerObj = JSON.parse(buyerProfileRaw);
        if (
          buyerObj?.email?.toLowerCase() === trimmedId.toLowerCase() ||
          (buyerObj?.phone && buyerObj.phone.replace(/\D/g, '').endsWith(trimmedId.replace(/\D/g, '')))
        ) {
          if (!trimmedId.toLowerCase().includes('farmer') && !trimmedId.toLowerCase().includes('ramesh')) {
            setIsSubmitting(false);
            setAuthError('This account is registered as a Commercial Buyer. Please use the Buyer Login portal.');
            return;
          }
        }
      }
    } catch {
      // ignore
    }

    try {
      // Connect to backend farmer login endpoint
      const res = await api.post('/auth/farmer/login', {
        identifier: trimmedId,
        email: trimmedId,
        password: password
      });

      if (res && res.token) {
        setToken(res.token);
      }

      let farmerData = (res && res.farmer) ? res.farmer : {
        farmerId: 'FMR-TN-2026-01',
        name: 'Ramesh Kumar',
        email: trimmedId.includes('@') ? trimmedId : 'ramesh.kumar@naamuzhavar.com',
        phone: trimmedId.includes('@') ? '+91 94432 78190' : trimmedId,
        role: 'farmer'
      };

      // Preserve registered photo and patta if registered locally
      try {
        const registeredRaw = localStorage.getItem('farmer_registered_profile');
        if (registeredRaw) {
          const reg = JSON.parse(registeredRaw);
          const regPhone = (reg.phone || '').replace(/\D/g, '');
          const curPhone = (farmerData.phone || '').replace(/\D/g, '');
          if (
            (reg.email && reg.email.toLowerCase() === (farmerData.email || '').toLowerCase()) ||
            (regPhone && curPhone && (regPhone.endsWith(curPhone) || curPhone.endsWith(regPhone)))
          ) {
            farmerData = {
              ...farmerData,
              ...reg,
              avatar: reg.avatar || reg.photo || farmerData.avatar,
              photo: reg.photo || reg.avatar || farmerData.photo,
              pattaNo: reg.pattaNo || reg.pattaNumber,
              farmDetails: {
                ...(farmerData.farmDetails || {}),
                ...(reg.farmDetails || {}),
                pattaNumber: reg.pattaNo || reg.pattaNumber
              }
            };
          }
        }
      } catch {}

      try {
        localStorage.removeItem('buyer_current_profile');
        localStorage.setItem('farmer_current_profile', JSON.stringify(farmerData));
        sessionStorage.removeItem('farmer_explicit_signout');
      } catch (e) {
        console.warn('Could not store farmer in localStorage:', e);
      }

      setIsSubmitting(false);
      setLoginSuccess(true);

      if (onLoginSuccess) {
        onLoginSuccess(farmerData);
      } else {
        navigate(ROUTES.FARMER_DASHBOARD);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.warn('Backend farmer login error:', err.message);

      // Check if credentials match a newly registered farmer account
      try {
        const registeredRaw = localStorage.getItem('farmer_registered_profile');
        const registeredListRaw = localStorage.getItem('registered_farmers_list');
        const allRegistered = [];
        if (registeredRaw) {
          try { allRegistered.push(JSON.parse(registeredRaw)); } catch {}
        }
        if (registeredListRaw) {
          try { allRegistered.push(...JSON.parse(registeredListRaw)); } catch {}
        }

        const idPhone = trimmedId.replace(/\D/g, '');
        const matched = allRegistered.find((registered) => {
          if (!registered) return false;
          const regPhone = (registered.phone || '').replace(/\D/g, '');
          const matchesEmail = registered.email && registered.email.toLowerCase() === trimmedId.toLowerCase();
          const matchesPhone = regPhone && idPhone.length >= 10 && (regPhone.endsWith(idPhone.slice(-10)) || idPhone.endsWith(regPhone.slice(-10)));
          return matchesEmail || matchesPhone;
        });

        if (matched) {
          if (matched.password && matched.password !== password) {
            setIsSubmitting(false);
            setAuthError(typeof t === 'function' && t('errInvalidCredentials') ? t('errInvalidCredentials') : 'Invalid password. Please check your credentials.');
            return;
          }

          const activeToken = matched.name && matched.name.toLowerCase() !== 'ramesh kumar'
            ? `farmer_token_${matched.farmerId || 'registered'}`
            : DEMO_FARMER_JWT;
          setToken(activeToken, 'farmer');
          const activeFarmer = {
            ...matched,
            role: 'farmer',
            isVerified: true
          };
          localStorage.removeItem('buyer_current_profile');
          localStorage.setItem('farmer_current_profile', JSON.stringify(activeFarmer));
          sessionStorage.removeItem('farmer_explicit_signout');
          setIsSubmitting(false);
          setLoginSuccess(true);
          if (onLoginSuccess) {
            onLoginSuccess(activeFarmer);
          } else {
            navigate(ROUTES.FARMER_DASHBOARD);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          return;
        }
      } catch (checkErr) {
        console.warn('Could not check registered farmer profile:', checkErr);
      }

      // Offline check: allow login only if credentials strictly match demo farmer account AND pin
      const cleanDigits = trimmedId.replace(/\D/g, '');
      const isDemoFarmerAccount =
        trimmedId.toLowerCase() === 'farmer@naamuzhavar.com' ||
        trimmedId.toLowerCase() === 'ramesh.kumar@naamuzhavar.com' ||
        (cleanDigits.length >= 10 && cleanDigits.endsWith('78190'));
      const isDemoFarmerPin = password === 'farmer1234' || password === 'demo1234' || password === '4821';

      if (isDemoFarmerAccount && isDemoFarmerPin) {
        setToken(DEMO_FARMER_JWT);
        const fallbackFarmer = {
          farmerId: 'FMR-TN-2026-01',
          name: 'Ramesh Kumar',
          email: 'ramesh.kumar@naamuzhavar.com',
          phone: '+91 94432 78190',
          avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80',
          rating: 4.92,
          totalHarvests: 54,
          isVerified: true,
          role: 'farmer'
        };
        try {
          localStorage.removeItem('buyer_current_profile');
          localStorage.setItem('farmer_current_profile', JSON.stringify(fallbackFarmer));
          sessionStorage.removeItem('farmer_explicit_signout');
        } catch {
          // ignore
        }
        setIsSubmitting(false);
        setLoginSuccess(true);
        if (onLoginSuccess) {
          onLoginSuccess(fallbackFarmer);
        } else {
          navigate(ROUTES.FARMER_DASHBOARD);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      setIsSubmitting(false);
      setAuthError(
        err.message ||
        (typeof t === 'function' && t('errInvalidCredentials')) ||
        'Invalid mobile/email or password. Please check your credentials.'
      );
    }
  };

  // Instant 1-click Demo Farmer Sign In
  const handleDemoSignIn = async () => {
    setIdentifier('farmer@naamuzhavar.com');
    setPassword('farmer1234');
    setTouched({ identifier: true, password: true });
    setErrors({});
    setIsSubmitting(true);
    setAuthError('');

    try {
      sessionStorage.removeItem('farmer_explicit_signout');
    } catch {
      // ignore
    }

    try {
      const res = await api.post('/auth/farmer/login', {
        identifier: 'farmer@naamuzhavar.com',
        email: 'farmer@naamuzhavar.com',
        password: 'farmer1234'
      });

      if (res && res.token) {
        setToken(res.token);
      }

      const demoFarmerData = (res && res.farmer) ? res.farmer : {
        farmerId: 'FMR-TN-2026-01',
        name: 'Ramesh Kumar',
        email: 'ramesh.kumar@naamuzhavar.com',
        phone: '+91 94432 78190',
        avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80',
        rating: 4.92,
        totalHarvests: 54,
        isVerified: true,
        role: 'farmer',
        farmDetails: {
          farmName: 'Green Valley Natural Farm',
          landOwnerName: 'Ramesh Kumar',
          landAddress: 'SF No. 142/2, Kinathukadavu Main Road',
          village: 'Kinathukadavu',
          taluk: 'Pollachi',
          district: 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: '642109',
          totalAcres: 8.5,
          cultivatedAcres: 7.0,
          irrigationSource: 'Borewell & Drip Irrigation',
          soilType: 'Red Loam & Clay Soil'
        }
      };

      try {
        localStorage.removeItem('buyer_current_profile');
        localStorage.setItem('farmer_current_profile', JSON.stringify(demoFarmerData));
      } catch (e) {
        console.warn('Could not store demo farmer in localStorage:', e);
      }

      setIsSubmitting(false);
      setLoginSuccess(true);

      if (onLoginSuccess) {
        onLoginSuccess(demoFarmerData);
      } else {
        navigate(ROUTES.FARMER_DASHBOARD);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.warn('Demo farmer login fallback:', err.message);
      // Fallback in-memory demo farmer
      setToken('farmer_demo_token_' + Date.now());
      const fallbackFarmer = {
        farmerId: 'FMR-TN-2026-01',
        name: 'Ramesh Kumar',
        email: 'ramesh.kumar@naamuzhavar.com',
        phone: '+91 94432 78190',
        avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80',
        rating: 4.92,
        totalHarvests: 54,
        isVerified: true,
        role: 'farmer',
        farmDetails: {
          farmName: 'Green Valley Natural Farm',
          village: 'Kinathukadavu',
          district: 'Coimbatore',
          totalAcres: 8.5
        }
      };

      try {
        localStorage.removeItem('buyer_current_profile');
        localStorage.setItem('farmer_current_profile', JSON.stringify(fallbackFarmer));
      } catch {
        // ignore
      }

      setIsSubmitting(false);
      setLoginSuccess(true);

      if (onLoginSuccess) {
        onLoginSuccess(fallbackFarmer);
      } else {
        navigate(ROUTES.FARMER_DASHBOARD);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Forgot password submission
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    setForgotLoading(true);
    forgotTimerRef.current = setTimeout(() => {
      setForgotLoading(false);
      setForgotSent(true);
    }, 700);
  };

  const resetForgotModal = () => {
    setShowForgotModal(false);
    setForgotInput('');
    setForgotSent(false);
    setForgotLoading(false);
  };

  // Determine which icon to show for identifier (Phone or Mail)
  const isInputNumber = /^\+?\d[\d\s-]*$/.test(identifier.trim());

  return (
    <main className="buyer-auth-page farmer-login-theme" aria-label="Farmer Login Page">
      <div className="buyer-auth-container">
        {/* ====================================================================
            1. LEFT VISUAL STORYTELLING PANE (50/50 Desktop Split)
            ==================================================================== */}
        <section className="buyer-visual-pane" aria-hidden="true">
          <div className="buyer-visual-overlay" />

          <div className="buyer-visual-inner">
            {/* Top Brand Block (Centered) */}
            <div className="buyer-brand-lockup">
              <div className="buyer-brand-logo-card">
                <img 
                  src="/logo.png" 
                  alt="Naam Uzhavar Logo" 
                  className="buyer-brand-logo-img"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=100&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="buyer-brand-name-group">
                <span className="buyer-brand-title">{t('brandName')}</span>
                <span className="buyer-brand-subtitle">{t('brandSub')}</span>
              </div>
            </div>

            {/* Narrative Editorial Text (Centered) */}
            <div className="buyer-visual-narrative">
              <span className="buyer-procurement-badge farmer-badge">
                <Sprout size={14} />
                <span>{t('badgeLedger')}</span>
              </span>

              <h2 className="buyer-visual-headline">
                <span>{t('headlineLead')}</span>
                <span>{t('headlineMid')}</span>
                <span className="highlight-word farmer-highlight">{t('headlineEnd')}</span>
              </h2>

              <p className="buyer-visual-description">
                {t('visualDesc')}
              </p>

              {/* Supported Agricultural Crop Categories */}
              <div className="buyer-category-chips">
                <div className="buyer-chips-row">
                  <span className="buyer-category-chip">🌾 {t('categoryPaddy')}</span>
                  <span className="buyer-category-chip">🍅 {t('categoryVeggies')}</span>
                </div>
                <div className="buyer-chips-row">
                  <span className="buyer-category-chip">🥥 {t('categoryFruits')}</span>
                  <span className="buyer-category-chip">🥔 {t('categoryTubers')}</span>
                </div>
              </div>
            </div>

            {/* Bottom Guarantee Row (Centered) */}
            <div className="buyer-visual-footer">
              <div className="buyer-visual-footer-item">
                <CheckCircle2 size={16} color="#4ade80" />
                <span>{t('footerGuarantee1')}</span>
              </div>
              <div className="buyer-visual-footer-item">
                <CheckCircle2 size={16} color="#4ade80" />
                <span>{t('footerGuarantee2')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            2. RIGHT AUTHENTICATION PANE (50/50 Desktop Split)
            ==================================================================== */}
        <section className="buyer-form-pane" aria-label="Farmer Sign In Form">
          {/* Top Utility Bar */}
          <div className="buyer-pane-top-bar">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              className="buyer-back-link" 
              onClick={handleBack}
              leftIcon={<ArrowLeft size={16} />}
              aria-label={t('backLink')}
            >
              <span className="back-link-text">{t('backLink')}</span>
            </Button>

            {/* Language Switcher */}
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              className="buyer-lang-btn" 
              onClick={toggleLang}
              leftIcon={<Globe size={15} color="#2F6B3A" />}
              title="Switch Language / மொழியை மாற்ற"
              aria-label="Toggle language between English and Tamil"
            >
              <span>{t('common.switchLangText')}</span>
            </Button>
          </div>

          {/* Form Card Content */}
          <div className="buyer-form-inner">
            {/* Mobile-Only Header Brand Lockup */}
            <div className="buyer-mobile-brand-header">
              <img 
                src="/logo.png" 
                alt="Naam Uzhavar" 
                className="buyer-mobile-logo"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=100&auto=format&fit=crop&q=80';
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  {t('brandName')}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2F6B3A' }}>
                  {t('brandSub')}
                </div>
              </div>
            </div>

            {/* Form Title & Subtitle */}
            <header className="buyer-form-header">
              <div className="buyer-icon-box farmer-icon-box">
                <Wheat size={24} strokeWidth={1.9} />
              </div>
              <span className="buyer-account-badge farmer-account-badge">
                <ShieldCheck size={12} />
                <span>{t('badgeAccount')}</span>
              </span>
              <h1 className="buyer-form-title">{t('title')}</h1>
              <p className="buyer-form-subtitle">{t('subtitle')}</p>
            </header>

            {/* Auth Alerts (Success / Error) */}
            {authError && (
              <div className="buyer-form-alert alert-error" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{authError}</span>
              </div>
            )}

            {loginSuccess && (
              <div className="buyer-form-alert alert-success" role="status">
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{t('signInSuccess')}</span>
              </div>
            )}

            {/* Login Form */}
            <form className="buyer-login-form" onSubmit={handleSubmit} noValidate>
              {/* Field 1: Email or Mobile Number */}
              <div style={{ marginBottom: 16 }}>
                <Input
                  id="farmer-identifier"
                  name="identifier"
                  type="text"
                  label={t('labelIdentifier')}
                  value={identifier}
                  onChange={handleIdentifierChange}
                  onBlur={() => handleBlur('identifier')}
                  placeholder={t('placeholderIdentifier')}
                  icon={isInputNumber ? <Phone size={18} /> : <Mail size={18} />}
                  error={touched.identifier ? errors.identifier : ''}
                  required
                  disabled={isSubmitting}
                  autoComplete="username"
                />
              </div>

              {/* Field 2: Password */}
              <div style={{ marginBottom: 16 }}>
                <Input
                  id="farmer-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label={t('labelPassword')}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  placeholder={t('placeholderPassword')}
                  icon={<Lock size={18} />}
                  rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                  error={touched.password ? errors.password : ''}
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="buyer-options-row">
                <label className="buyer-checkbox-label">
                  <input
                    type="checkbox"
                    className="buyer-checkbox farmer-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>{t('rememberMe')}</span>
                </label>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="buyer-forgot-btn farmer-link"
                  onClick={() => setShowForgotModal(true)}
                >
                  {t('forgotPassword')}
                </Button>
              </div>

              {/* Primary Farmer Sign In Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                className="farmer-btn-primary"
                isLoading={isSubmitting}
                loadingText={t('signingIn')}
                rightIcon={<ArrowRight size={16} />}
              >
                {t('signInBtn')}
              </Button>

              {/* Instant 1-Click Quick Demo Farmer Sign In */}
              <Button
                type="button"
                id="farmer-quick-demo-btn"
                variant="outline"
                size="md"
                fullWidth
                className="farmer-demo-btn"
                onClick={handleDemoSignIn}
                disabled={isSubmitting}
              >
                <span>⚡ Quick Demo Farmer Sign In (Ramesh Kumar - Green Valley Farm)</span>
              </Button>

              {/* Secondary Register Action */}
              <div className="buyer-signup-row">
                <span>{t('newFarmer')}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="buyer-signup-link farmer-link"
                  onClick={handleGoToRegister}
                >
                  {t('registerFarm')}
                </Button>
              </div>
            </form>

            {/* Farm Assurance Card */}
            <Card variant="default" className="buyer-assurance-card farmer-assurance-card" padding="sm">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <ShieldCheck size={22} className="farmer-assurance-icon" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="buyer-assurance-title">{t('assuranceTitle')}</div>
                  <div className="buyer-assurance-desc">{t('assuranceDesc')}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Pane Footer */}
          <footer className="buyer-pane-footer">
            <p>{t('footerNote')}</p>
          </footer>
        </section>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        isOpen={showForgotModal}
        onClose={resetForgotModal}
        title={t('forgotTitle')}
        description={t('forgotDesc')}
        size="sm"
      >
        {forgotSent ? (
          <div>
            <div className="farmer-modal-success-box">
              <CheckCircle2 size={18} />
              <span>{t('forgotSuccess')}</span>
            </div>
            <Button
              type="button"
              variant="primary"
              fullWidth
              className="farmer-btn-primary"
              onClick={resetForgotModal}
            >
              {t('close')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              id="farmer-forgot-input"
              type="text"
              label={t('labelIdentifier')}
              icon={<Phone size={18} />}
              value={forgotInput}
              onChange={(e) => setForgotInput(e.target.value)}
              placeholder={t('forgotPlaceholder')}
              required
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="farmer-btn-primary"
              disabled={!forgotInput.trim()}
              isLoading={forgotLoading}
              loadingText={t('sending')}
            >
              {t('forgotBtn')}
            </Button>
          </form>
        )}
      </Modal>
    </main>
  );
}
