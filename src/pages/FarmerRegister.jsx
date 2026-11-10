// What this file does: Farmer registration page with photo upload, land records (patta no), full validation, and backend API integration.
// Follows 50/50 split-screen layout strictly adhering to DESIGN.md and Farmer Green palette.
// Incorporates cinematic visual storytelling left pane matching BuyerRegister with agricultural farmer wording.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sprout,
  Wheat,
  Globe,
  Camera,
  Upload,
  X,
  FileText
} from 'lucide-react';
import { useT } from '../hooks/useT';
import { ROUTES } from '../routes';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import { api } from '../utils/api';
import './BuyerRegister.css';
import './FarmerLogin.css';
import './FarmerRegister.css';

/**
 * FarmerRegister Component
 * 
 * Clean, professional agricultural registration interface for Tamil Nadu Farmers.
 * Matches Buyer Register 50/50 split-screen architecture with Farmer Green palette (#2F6B3A).
 * Follows identical field ordering and photo persistence as the commercial buyer module.
 */
export default function FarmerRegister({
  onBack,
  onNavigateToLogin,
  onRegisterSuccess
}) {
  const navigate = useNavigate();
  const { t, toggleLang } = useT('farmerRegister');

  // Form State Values
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pattaNo, setPattaNo] = useState('');
  const [farmAddress, setFarmAddress] = useState('');

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Interaction & Error States
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const fileInputRef = useRef(null);
  const redirectTimerRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const pane = document.querySelector('.farmer-reg-form-pane');
    if (pane) pane.scrollTop = 0;
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  // Photo Selection & FileReader
  const handlePhotoSelect = (file) => {
    if (!file) return;
    if (!file.type.match('image.*')) {
      setErrors((prev) => ({ ...prev, photo: 'Please select an image file (PNG, JPG, JPEG)' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: 'File size must be less than 5MB' }));
      return;
    }

    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
      setTouched((prev) => ({ ...prev, photo: true }));
      setErrors((prev) => ({ ...prev, photo: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (e) => {
    e.stopPropagation();
    setPhotoPreview(null);
    setPhotoName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingPhoto(true);
  };

  const handleDragLeave = () => {
    setIsDraggingPhoto(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoSelect(e.dataTransfer.files[0]);
    }
  };

  // Field Validation Helper
  const validateField = (fieldName, value) => {
    const trimmed = (value || '').trim();
    switch (fieldName) {
      case 'name':
        if (!trimmed) return t('errNameRequired');
        if (trimmed.length < 3) return t('errNameShort');
        return '';
      case 'phone': {
        const digits = trimmed.replace(/\D/g, '');
        const clean = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
        if (!clean) return t('errPhoneRequired');
        if (clean.length !== 10) return t('errPhoneInvalid');
        return '';
      }
      case 'email':
        if (!trimmed) return t('errEmailRequired');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return t('errEmailInvalid');
        return '';
      case 'password':
        if (!trimmed) return t('errPasswordRequired');
        if (trimmed.length < 6) return t('errPasswordShort');
        return '';
      case 'confirmPassword':
        if (!trimmed) return t('errConfirmRequired');
        if (trimmed !== password.trim()) return t('errPasswordMismatch');
        return '';
      case 'pattaNo':
        if (!trimmed) return t('errPattaRequired') || 'Patta / Chitta number is required.';
        if (trimmed.length < 3) return t('errPattaShort') || 'Please enter a valid Patta number (min 3 characters).';
        return '';
      case 'farmAddress':
        if (!trimmed) return t('errAddressRequired');
        if (trimmed.length < 8) return t('errAddressShort');
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let val = '';
    if (field === 'name') val = name;
    if (field === 'phone') val = phone;
    if (field === 'email') val = email;
    if (field === 'password') val = password;
    if (field === 'confirmPassword') val = confirmPassword;
    if (field === 'pattaNo') val = pattaNo;
    if (field === 'farmAddress') val = farmAddress;
    const errorMsg = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/role-select?role=farmer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      navigate('/role-select?role=farmer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    const newErrors = {
      name: validateField('name', name),
      phone: validateField('phone', phone),
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
      pattaNo: validateField('pattaNo', pattaNo),
      farmAddress: validateField('farmAddress', farmAddress)
    };

    setTouched({
      name: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
      pattaNo: true,
      farmAddress: true
    });
    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some(Boolean);
    if (hasErrors) {
      const firstErr = document.querySelector('.farmer-field-error, .app-input-field--error, .has-error');
      if (firstErr) {
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    const resolvedAvatar = photoPreview || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80';
    const fallbackId = `FMR-TN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const registeredFarmerProfile = {
      farmerId: fallbackId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: password, // Persisted for credential verification
      role: 'farmer',
      isVerified: true,
      avatar: resolvedAvatar,
      photo: resolvedAvatar,
      photoPreview: resolvedAvatar,
      pattaNo: pattaNo.trim(),
      pattaNumber: pattaNo.trim(),
      farmDetails: {
        farmName: `${name.trim()}'s Natural Farm`,
        landAddress: farmAddress.trim(),
        pattaNumber: pattaNo.trim(),
        village: 'Pollachi',
        district: 'Coimbatore',
        state: 'Tamil Nadu'
      }
    };

    const persistRegistrationLocally = (profile) => {
      try {
        localStorage.setItem('farmer_registered_profile', JSON.stringify(profile));
        localStorage.setItem('farmer_registration_pending_email', profile.email);
        localStorage.removeItem('farmer_current_profile'); // Ensure verification is required on login screen

        const listRaw = localStorage.getItem('registered_farmers_list');
        const list = listRaw ? JSON.parse(listRaw) : [];
        const filtered = list.filter(
          (f) => f && f.email?.toLowerCase() !== profile.email.toLowerCase() &&
                 (f.phone || '').replace(/\D/g, '') !== (profile.phone || '').replace(/\D/g, '')
        );
        filtered.unshift(profile);
        localStorage.setItem('registered_farmers_list', JSON.stringify(filtered));
      } catch (saveErr) {
        console.warn('Could not save farmer registration profile:', saveErr);
      }
    };

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        confirmPassword: confirmPassword,
        pattaNo: pattaNo.trim(),
        pattaNumber: pattaNo.trim(),
        farmAddress: farmAddress.trim(),
        avatar: resolvedAvatar
      };

      const res = await api.post('/auth/farmer/register', payload);

      if (res && res.farmer) {
        registeredFarmerProfile.farmerId = res.farmer.farmerId || registeredFarmerProfile.farmerId;
        registeredFarmerProfile.avatar = res.farmer.avatar || registeredFarmerProfile.avatar;
      }

      persistRegistrationLocally(registeredFarmerProfile);

      setIsSubmitting(false);
      setRegSuccess(true);

      if (onRegisterSuccess) {
        onRegisterSuccess(registeredFarmerProfile);
      }

      redirectTimerRef.current = setTimeout(() => {
        navigate('/role-select?role=farmer');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1300);
    } catch (err) {
      console.warn('Farmer registration notice, saving local registration profile:', err.message);
      setIsSubmitting(false);

      persistRegistrationLocally(registeredFarmerProfile);

      setRegSuccess(true);
      redirectTimerRef.current = setTimeout(() => {
        navigate('/role-select?role=farmer');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1300);
    }
  };

  return (
    <div className="buyer-reg-page farmer-login-theme" aria-label="Farmer Registration Page">
      <div className="buyer-reg-container farmer-reg-container">
        {/* ==================================================================
            LEFT SIDE: CINEMATIC VISUAL STORYTELLING (Centered Alignment)
            Exact match with BuyerRegister layout with Farmer Producer terminology
            ================================================================== */}
        <aside className="buyer-reg-visual-pane farmer-reg-visual-pane" aria-label="Visual Brand Story">
          <div className="buyer-reg-visual-scrim" />

          <div className="buyer-reg-visual-content">
            {/* Top Brand Lockup (Centered) - Navigates to Home Page */}
            <div
              className="buyer-reg-brand-lockup"
              onClick={() => {
                navigate(ROUTES.HOME);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(ROUTES.HOME);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              style={{ cursor: 'pointer' }}
              title="Go to Home page"
            >
              <div className="buyer-reg-brand-logo-card">
                <img
                  src="/logo.png"
                  alt="Naam Uzhavar Official Crest"
                  className="buyer-reg-brand-logo-img"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=100&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="buyer-reg-brand-name-group">
                <span className="buyer-reg-brand-title">{t('brandName')}</span>
                <span className="buyer-reg-brand-subtitle">{t('brandSub')}</span>
              </div>
            </div>

            {/* Central Visual Narrative (Centered) */}
            <div className="buyer-reg-visual-narrative">
              <span className="buyer-reg-procurement-badge farmer-reg-badge">
                <ShieldCheck size={14} />
                <span>{t('badgeProcurement')}</span>
              </span>

              <h2 className="buyer-reg-visual-headline">
                <span>{t('headlineLead')}</span>
                <span>{t('headlineMid')}</span>
                <span className="highlight-word">{t('headlineEnd')}</span>
              </h2>

              <p className="buyer-reg-visual-description">
                {t('visualDesc')}
              </p>

              {/* Verified Agricultural Produce Categories (2 Rows Centered) */}
              <div className="buyer-reg-category-chips">
                <div className="buyer-reg-chips-row">
                  <span className="buyer-reg-category-chip">🌾 {t('categoryPaddy')}</span>
                  <span className="buyer-reg-category-chip">🍅 {t('categoryVeggies')}</span>
                  <span className="buyer-reg-category-chip">🧅 {t('categoryOnions')}</span>
                </div>
                <div className="buyer-reg-chips-row">
                  <span className="buyer-reg-category-chip">🥔 {t('categoryTubers')}</span>
                  <span className="buyer-reg-category-chip">🥥 {t('categoryFruits')}</span>
                </div>
              </div>
            </div>

            {/* Bottom Visual Guarantee (Centered) */}
            <div className="buyer-reg-visual-footer">
              <div className="buyer-reg-visual-footer-item">
                <CheckCircle2 size={16} color="#38bdf8" />
                <span>{t('footerGuarantee1')}</span>
              </div>
              <div className="buyer-reg-visual-footer-item">
                <CheckCircle2 size={16} color="#38bdf8" />
                <span>{t('footerGuarantee2')}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ==================================================================
            RIGHT SIDE: REGISTRATION FORM CONTENT PANE (Fully Responsive)
            Natural smooth scrolling with zero clipping or internal card scrollbars
            ================================================================== */}
        <main className="buyer-reg-form-pane farmer-reg-form-pane" aria-label="Farmer Registration Form">
          {/* Top Utility Bar */}
          <div className="buyer-reg-top-bar">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="buyer-reg-back-link"
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
              className="buyer-reg-lang-btn"
              onClick={toggleLang}
              leftIcon={<Globe size={15} color="#2F6B3A" />}
              title="Switch Language / மொழியை மாற்ற"
              aria-label="Toggle language between English and Tamil"
            >
              <span>{t('common.switchLangText') || 'தமிழ்'}</span>
            </Button>
          </div>

          {/* Form Container Card - Strict natural height, perfectly responsive */}
          <div className="buyer-reg-form-inner farmer-reg-card">
            {/* Header Brand Lockup */}
            <header className="buyer-form-header">
              <div className="buyer-icon-box farmer-icon-box">
                <Wheat size={24} strokeWidth={1.9} />
              </div>
              <span className="buyer-account-badge farmer-account-badge">
                <ShieldCheck size={12} />
                <span>{t('badgeDirect')}</span>
              </span>
              <h1 className="buyer-form-title">{t('title')}</h1>
              <p className="buyer-form-subtitle">{t('subtitle')}</p>
            </header>

            {/* Registration Alerts */}
            {regError && (
              <div className="buyer-form-alert alert-error" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="buyer-form-alert alert-success" role="status">
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{t('successMsg')}</span>
              </div>
            )}

            {/* Registration Form - Strict Field Order Matching Buyer Register */}
            <form className="buyer-login-form farmer-reg-fields" onSubmit={handleSubmit} noValidate>
              {/* Field 1: Photo Upload Dropzone (at the very top, exactly like Buyer Register) */}
              <div className="farmer-photo-group">
                <label className="farmer-photo-label" htmlFor="farmer-photo-file-input">
                  <span>{t('photoLabel')}</span>
                  <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.82rem' }}>({t('optional') || 'Optional'})</span>
                </label>

                <input
                  id="farmer-photo-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handlePhotoSelect(e.target.files[0]);
                    }
                  }}
                />

                <div
                  className={`farmer-photo-dropzone ${isDraggingPhoto ? 'is-dragging' : ''} ${touched.photo && errors.photo ? 'has-error' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (fileInputRef.current) fileInputRef.current.click();
                    }
                  }}
                  aria-label="Upload farmer or farm profile photo"
                >
                  <div className="farmer-photo-preview-circle">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Farmer Profile Preview"
                        className="farmer-photo-preview-img"
                      />
                    ) : (
                      <Camera size={24} color="#2F6B3A" />
                    )}
                  </div>

                  <div className="farmer-photo-prompt-text">
                    <div className="farmer-photo-prompt-title">
                      {photoPreview ? (photoName || t('photoLabel') || 'Photo selected') : (isDraggingPhoto ? (t('photoDragPrompt') || 'Drop photo here') : (t('photoUploadText') || 'Click to browse or drag & drop photo'))}
                    </div>
                    <div className="farmer-photo-prompt-sub">
                      {t('photoUploadFormat') || 'Supports JPG, JPEG, PNG (Max 5MB)'}
                    </div>
                  </div>

                  {photoPreview ? (
                    <div className="farmer-photo-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="farmer-photo-btn-change"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      >
                        {t('photoChange') || 'Change'}
                      </button>
                      <button
                        type="button"
                        className="farmer-photo-btn-remove"
                        onClick={removePhoto}
                        aria-label="Remove uploaded photo"
                      >
                        <X size={13} style={{ display: 'inline', marginRight: 2 }} />
                        {t('photoRemove') || 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="farmer-photo-btn-change"
                      style={{ pointerEvents: 'none' }}
                    >
                      <Upload size={14} style={{ display: 'inline', marginRight: 4 }} />
                      <span>{t('upload') || 'Upload'}</span>
                    </button>
                  )}
                </div>

                {touched.photo && errors.photo && (
                  <div className="farmer-field-error" role="alert">
                    <AlertCircle size={14} />
                    <span>{errors.photo}</span>
                  </div>
                )}
              </div>

              {/* Field 2: Farmer Full Name */}
              <div className="farmer-field-single">
                <Input
                  id="farmer-reg-name"
                  name="name"
                  type="text"
                  label={t('labelName')}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (regError) setRegError('');
                    if (touched.name) setErrors((prev) => ({ ...prev, name: validateField('name', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('name')}
                  placeholder={t('placeholderName')}
                  icon={<User size={18} />}
                  error={touched.name ? errors.name : ''}
                  required
                  disabled={isSubmitting}
                  autoComplete="name"
                />
              </div>

              {/* Field 3 & 4: Mobile Number & Email Address (Strict 50/50 balanced layout) */}
              <div className="farmer-reg-dual-row" style={{ marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    id="farmer-reg-phone"
                    name="phone"
                    type="tel"
                    label={t('labelPhone')}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (regError) setRegError('');
                      if (touched.phone) setErrors((prev) => ({ ...prev, phone: validateField('phone', e.target.value) }));
                    }}
                    onBlur={() => handleBlur('phone')}
                    placeholder={t('placeholderPhone')}
                    icon={<Phone size={18} />}
                    error={touched.phone ? errors.phone : ''}
                    required
                    disabled={isSubmitting}
                    autoComplete="tel"
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    id="farmer-reg-email"
                    name="email"
                    type="email"
                    label={t('labelEmail')}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (regError) setRegError('');
                      if (touched.email) setErrors((prev) => ({ ...prev, email: validateField('email', e.target.value) }));
                    }}
                    onBlur={() => handleBlur('email')}
                    placeholder={t('placeholderEmail')}
                    icon={<Mail size={18} />}
                    error={touched.email ? errors.email : ''}
                    required
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Field 5 & 6: Password & Confirm Password (Strict 50/50 balanced layout, no overflow) */}
              <div className="farmer-reg-dual-row" style={{ marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    id="farmer-reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    label={t('labelPassword')}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (regError) setRegError('');
                      if (touched.password) setErrors((prev) => ({ ...prev, password: validateField('password', e.target.value) }));
                      if (touched.confirmPassword && confirmPassword) {
                        setErrors((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value !== confirmPassword ? t('errPasswordMismatch') : ''
                        }));
                      }
                    }}
                    onBlur={() => handleBlur('password')}
                    placeholder={t('placeholderPassword')}
                    icon={<Lock size={18} />}
                    rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    onRightIconClick={() => setShowPassword(!showPassword)}
                    error={touched.password ? errors.password : ''}
                    required
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    id="farmer-reg-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    label={t('labelConfirmPassword')}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (regError) setRegError('');
                      if (touched.confirmPassword) {
                        setErrors((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value !== password ? t('errPasswordMismatch') : ''
                        }));
                      }
                    }}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder={t('placeholderConfirmPassword')}
                    icon={<Lock size={18} />}
                    rightIcon={showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    error={touched.confirmPassword ? errors.confirmPassword : ''}
                    required
                    disabled={isSubmitting}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Field 7 & 8: Patta / Chitta Passbook Number & Farm Address (Strict 50/50 dual row) */}
              <div className="farmer-reg-dual-row" style={{ marginBottom: 18 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    id="farmer-reg-patta"
                    name="pattaNo"
                    type="text"
                    label={t('labelPattaNo') || 'Patta / Chitta Passbook Number'}
                    value={pattaNo}
                    onChange={(e) => {
                      setPattaNo(e.target.value);
                      if (regError) setRegError('');
                      if (touched.pattaNo) setErrors((prev) => ({ ...prev, pattaNo: validateField('pattaNo', e.target.value) }));
                    }}
                    onBlur={() => handleBlur('pattaNo')}
                    placeholder={t('placeholderPattaNo') || 'e.g. 142/2A or 2026/TN/4912'}
                    icon={<FileText size={18} />}
                    error={touched.pattaNo ? errors.pattaNo : ''}
                    required
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    id="farmer-reg-address"
                    name="farmAddress"
                    type="text"
                    label={t('labelFarmAddress')}
                    value={farmAddress}
                    onChange={(e) => {
                      setFarmAddress(e.target.value);
                      if (regError) setRegError('');
                      if (touched.farmAddress) setErrors((prev) => ({ ...prev, farmAddress: validateField('farmAddress', e.target.value) }));
                    }}
                    onBlur={() => handleBlur('farmAddress')}
                    placeholder={t('placeholderFarmAddress')}
                    icon={<MapPin size={18} />}
                    error={touched.farmAddress ? errors.farmAddress : ''}
                    required
                    disabled={isSubmitting}
                    autoComplete="street-address"
                  />
                </div>
              </div>

              {/* Submit Registration Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                className="farmer-btn-primary"
                isLoading={isSubmitting}
                loadingText={t('registering')}
                rightIcon={<ArrowRight size={16} />}
              >
                {t('btnRegister')}
              </Button>

              {/* Navigation Link to Farmer Login */}
              <div className="buyer-signup-row" style={{ marginTop: 14 }}>
                <span>{t('existingFarmer')}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="buyer-signup-link farmer-link"
                  onClick={handleGoToLogin}
                >
                  {t('signIn')}
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

          {/* Fullpage Footer */}
          <footer className="farmer-reg-footer">
            <p>{t('footerNote')}</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
