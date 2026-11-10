// What this file does: Commercial buyer multi-step registration page with business validation and license details.

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Camera,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ShoppingCart,
  Store,
  Landmark,
  Building,
  MapPin,
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { useT } from '../hooks/useT';
import { ROUTES } from '../routes';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Card from '../components/Card';
import { api, setToken } from '../utils/api';
import './BuyerRegister.css';

/**
 * BuyerRegister Component
 * 
 * High-end, minimal agricultural registration interface for commercial produce buyers:
 * - Hotels & Restaurants
 * - Supermarkets
 * - Small Retailers
 * - Mahals / Function Halls
 */
export default function BuyerRegister({
  onBack,
  onNavigateToLogin,
  onRegisterSuccess
}) {
  const navigate = useNavigate();
  const { t, toggleLang } = useT('buyerRegister');

  // Form State Values
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoName, setPhotoName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [buyerType, setBuyerType] = useState('');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Dropdown & Drag States
  const [buyerTypeOpen, setBuyerTypeOpen] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Validation & Submit States
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle' | 'loading' | 'success'

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const regTimerRef = useRef(null);

  // Close dropdown on outside click and cleanup registration timer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setBuyerTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
            const currentTimerRef = regTimerRef.current;
      document.removeEventListener('mousedown', handleClickOutside);
      if (currentTimerRef) clearTimeout(currentTimerRef);
    };
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(ROUTES.BUYER_LOGIN);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigateLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      navigate(ROUTES.BUYER_LOGIN);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Buyer Type Options List with distinct icons
  const buyerTypeOptions = [
    {
      id: 'hotel',
      label: t('hotelLabel'),
      desc: t('hotelDesc'),
      icon: Building2
    },
    {
      id: 'supermarket',
      label: t('supermarketLabel'),
      desc: t('supermarketDesc'),
      icon: ShoppingCart
    },
    {
      id: 'retailer',
      label: t('retailerLabel'),
      desc: t('retailerDesc'),
      icon: Store
    },
    {
      id: 'mahal',
      label: t('mahalLabel'),
      desc: t('mahalDesc'),
      icon: Landmark
    }
  ];

  const selectedTypeObj = buyerTypeOptions.find(b => b.id === buyerType);

  // Field Validation Helper
  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'photo':
        return !value ? t('errPhotoRequired') : '';
      case 'name':
        if (!value || !value.trim()) return t('errNameRequired');
        if (value.trim().length < 3) return t('errNameShort');
        return '';
      case 'phone': {
        const digits = (value || '').replace(/\D/g, '');
        const clean = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
        if (!clean) return t('errPhoneRequired');
        if (clean.length !== 10) return t('errPhoneInvalid');
        return '';
      }
      case 'email':
        if (!value || !value.trim()) return t('errEmailRequired');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return t('errEmailInvalid');
        return '';
      case 'password':
        if (!value || !value.trim()) return t('errPasswordRequired') || 'Please enter a password for your account.';
        if (value.trim().length < 6) return t('errPasswordShort') || 'Password must be at least 6 characters long.';
        return '';
      case 'buyerType':
        return !value ? t('errBuyerTypeRequired') : '';
      case 'shopName':
        if (!value || !value.trim()) return t('errShopNameRequired');
        if (value.trim().length < 3) return t('errShopNameShort');
        return '';
      case 'address':
        if (!value || !value.trim()) return t('errAddressRequired');
        if (value.trim().length < 10) return t('errAddressShort');
        return '';
      case 'gstin': {
        const cleanGst = (value || '').trim().toUpperCase();
        if (!cleanGst) return t('errGstinRequired');
        if (cleanGst.length !== 15 || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGst)) {
          return t('errGstinInvalid');
        }
        return '';
      }
      case 'confirm':
        return !value ? t('errConfirmRequired') : '';
      default:
        return '';
    }
  };

  // Image Upload Handling (with FileReader for base64 preview)
  const handlePhotoSelect = (file) => {
    if (!file) return;
    if (!file.type.match('image.*')) {
      setErrors(prev => ({ ...prev, photo: 'Please select an image file (PNG, JPG)' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: 'File size must be less than 5MB' }));
      return;
    }

    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
      setTouched(prev => ({ ...prev, photo: true }));
      setErrors(prev => ({ ...prev, photo: '' }));
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
    setTouched(prev => ({ ...prev, photo: true }));
    setErrors(prev => ({ ...prev, photo: t('errPhotoRequired') }));
  };

  // Drag and Drop handlers
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

  // Handle Complete Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {
      photo: true,
      name: true,
      phone: true,
      email: true,
      password: true,
      buyerType: true,
      shopName: true,
      address: true,
      gstin: true,
      confirm: true
    };
    setTouched(allTouched);

    // Validate all fields
    const newErrors = {
      photo: validateField('photo', photoPreview),
      name: validateField('name', name),
      phone: validateField('phone', phone),
      email: validateField('email', email),
      password: validateField('password', password),
      buyerType: validateField('buyerType', buyerType),
      shopName: validateField('shopName', shopName),
      address: validateField('address', address),
      gstin: validateField('gstin', gstin),
      confirm: validateField('confirm', isConfirmed)
    };

    setErrors(newErrors);

    // Check if any error exists
    const hasError = Object.values(newErrors).some(err => Boolean(err));
    if (hasError) {
      const firstErrorEl = document.querySelector('.buyer-field-error, .has-error, .ui-input-field--error, .app-input-error-msg');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Submit Process
    setSubmitStatus('loading');
    setRegisterError('');
    const phoneDigits = phone.replace(/\D/g, '');
    const cleanPhone = phoneDigits.startsWith('91') && phoneDigits.length === 12 ? phoneDigits.slice(2) : phoneDigits;
    const formattedPhone = cleanPhone ? `+91 ${cleanPhone}` : phone;

    const resolvedName = (name || '').trim();
    const resolvedShop = (shopName || resolvedName).trim();

    const registeredData = {
      name: resolvedName,
      fullName: resolvedName,
      contactPerson: resolvedName,
      phone: formattedPhone,
      email: email.trim(),
      buyerType: buyerType || 'hotel',
      shopName: resolvedShop,
      businessName: resolvedShop,
      address,
      gstin,
      photo: photoPreview || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80',
      photoPreview: photoPreview || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80',
      role: 'buyer'
    };

    try {
      const res = await api.post('/auth/register', {
        businessName: resolvedShop,
        shopName: resolvedShop,
        contactPerson: resolvedName,
        name: resolvedName,
        fullName: resolvedName,
        buyerType: buyerType || 'hotel',
        email: email.trim(),
        password: password.trim(),
        phone: formattedPhone,
        gstin: gstin || '',
        address: address || 'Tamil Nadu',
        avatar: photoPreview || undefined
      });

      if (res && res.token) {
        setToken(res.token);
      }

      if (res && res.buyer) {
        registeredData.id = res.buyer.id;
        registeredData._id = res.buyer.id;
        registeredData.businessName = res.buyer.businessName;
        registeredData.shopName = res.buyer.shopName || res.buyer.businessName;
        registeredData.contactPerson = res.buyer.contactPerson || resolvedName;
        registeredData.name = res.buyer.name || resolvedName;
        registeredData.fullName = res.buyer.fullName || resolvedName;
        registeredData.buyerType = res.buyer.buyerType || registeredData.buyerType;
      }
    } catch (err) {
      console.warn('Backend register offline fallback, saving local registration:', err.message);
      registeredData.id = 'buyer_' + Date.now();
      registeredData._id = registeredData.id;
    }

    try {
      localStorage.setItem('buyer_current_profile', JSON.stringify(registeredData));
      localStorage.setItem('buyer_registered_profile', JSON.stringify(registeredData));
    } catch (storageErr) {
      console.warn('LocalStorage save notice:', storageErr);
    }

    try {
      sessionStorage.removeItem('buyer_explicit_signout');
    } catch {
      // ignore
    }

    setSubmitStatus('success');

    // Automatically navigate back to Buyer Login after short celebration (2 seconds)
    if (regTimerRef.current) clearTimeout(regTimerRef.current);
    regTimerRef.current = setTimeout(() => {
      navigate(`${ROUTES.BUYER_LOGIN}&registered=1`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2000);

    if (onRegisterSuccess) {
      onRegisterSuccess(registeredData);
    }
  };

  return (
    <div className="buyer-reg-page">
      <div className="buyer-reg-container">
        {/* ==================================================================
            LEFT SIDE: CINEMATIC VISUAL STORYTELLING (Centered Alignment)
            ================================================================== */}
        <aside className="buyer-reg-visual-pane" aria-label="Visual Brand Story">
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
                />
              </div>
              <div className="buyer-reg-brand-name-group">
                <span className="buyer-reg-brand-title">{t('common.appName')}</span>
                <span className="buyer-reg-brand-subtitle">{t('common.appSubtitle')}</span>
              </div>
            </div>

            {/* Central Visual Narrative (Centered) */}
            <div className="buyer-reg-visual-narrative">
              <span className="buyer-reg-procurement-badge">
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

              {/* Verified Commercial Buyer Categories (2 Rows Centered) */}
              <div className="buyer-reg-category-chips">
                <div className="buyer-reg-chips-row">
                  <span className="buyer-reg-category-chip">🏨 {t('categoryHotels')}</span>
                  <span className="buyer-reg-category-chip">🛒 {t('categorySupermarkets')}</span>
                  <span className="buyer-reg-category-chip">🏪 {t('categoryRetailers')}</span>
                </div>
                <div className="buyer-reg-chips-row">
                  <span className="buyer-reg-category-chip">☕ {t('categoryMahals')}</span>
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
            ================================================================== */}
        <main className="buyer-reg-form-pane">
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

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="buyer-reg-lang-btn"
              onClick={toggleLang}
              leftIcon={<Globe size={15} />}
              aria-label="Toggle language between English and Tamil"
            >
              <span>{t('common.switchLangText')}</span>
            </Button>
          </div>

          {/* Form Card Container */}
          <div className="buyer-reg-form-inner">
            {/* Mobile-only Top Brand Header - Navigates to Home Page */}
            <div
              className="buyer-reg-mobile-header"
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
              <img
                src="/logo.png"
                alt="Naam Uzhavar Logo"
                className="buyer-reg-mobile-logo"
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, fontSize: 17, color: '#0f172a', lineHeight: 1.2 }}>
                  {t('common.appName')}
                </span>
                <span style={{ fontSize: 12, color: '#15803d', fontWeight: 700 }}>
                  {t('common.appSubtitle')}
                </span>
              </div>
            </div>

            {/* Screen Header */}
            <div className="buyer-reg-header">
              <Badge variant="brand" icon={<Building2 size={13} />} className="buyer-reg-badge">
                {t('badgeAccount')}
              </Badge>
              <h1 className="buyer-reg-title">{t('title')}</h1>
              <p className="buyer-reg-subtitle">{t('subtitle')}</p>
            </div>

            {submitStatus === 'success' ? (
              /* Success Celebration State with Photo & Details Preview */
              <Card variant="tinted" className="buyer-reg-success-box" padding="lg">
                <div className="buyer-reg-success-icon">
                  <Check size={28} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--buyer-primary, #2b5c8a)', marginBottom: 8 }}>
                  {t('successTitle')}
                </h2>
                <p style={{ fontSize: 14.5, color: 'var(--buyer-text-muted, #4b5563)', lineHeight: 1.6, marginBottom: 16 }}>
                  {t('successDesc')}
                </p>

                {/* Profile Snapshot with Uploaded Photo */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  background: 'var(--buyer-bg-canvas, #f6f6f2)',
                  border: '1px solid var(--buyer-border-light, #e3e3dd)',
                  borderRadius: 'var(--radius-md, 8px)',
                  marginBottom: 20,
                  textAlign: 'left',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  {photoPreview ? (
                    <img 
                    src={photoPreview} 
                    alt="Uploaded Business Avatar" 
                    style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--buyer-primary, #2b5c8a)' }}
                  />
                ) : (
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--buyer-accent-subtle, #e8eff6)', color: 'var(--buyer-primary, #2b5c8a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={24} />
                  </div>
                )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {shopName || name}
                    </div>
                    <div style={{ fontSize: 13, color: '#475569' }}>
                      👤 {name} • 📞 {phone}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      ✉️ {email}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    if (regTimerRef.current) clearTimeout(regTimerRef.current);
                    navigate(`${ROUTES.BUYER_LOGIN}&registered=1`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  rightIcon={<ArrowRight size={14} />}
                  style={{ marginBottom: 8 }}
                >
                  <span>{t('goToBuyerLogin') || 'Proceed to Buyer Login ➔'}</span>
                </Button>

                <p style={{ fontSize: 13, color: '#15803d', fontWeight: 600, margin: '4px 0 0 0', textAlign: 'center' }}>
                  {t('redirectingToLogin') || 'Redirecting to Buyer Login...'}
                </p>
              </Card>
            ) : (
              /* Registration Form */
              <form className="buyer-reg-form" onSubmit={handleSubmit} noValidate>
                {/* --------------------------------------------------------
                    SECTION 1: PERSONAL DETAILS
                    -------------------------------------------------------- */}
                <div className="buyer-section-block">
                  <div className="buyer-section-header">
                    <h3 className="buyer-section-heading">
                      <User size={17} color="var(--buyer-primary)" />
                      <span>{t('section1Title')}</span>
                    </h3>
                  </div>

                  {/* 1. PHOTO UPLOAD */}
                  <div className="buyer-field-group">
                    <label className="buyer-input-label" htmlFor="buyer-photo-file-input">
                      <span>{t('photoLabel')}<span className="required-star">*</span></span>
                    </label>

                    <input
                      id="buyer-photo-file-input"
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
                      className={`buyer-photo-dropzone ${isDraggingPhoto ? 'is-dragging' : ''} ${touched.photo && errors.photo ? 'has-error' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }
                      }}
                      aria-label="Upload profile or business photo"
                    >
                      <div className="buyer-photo-preview-circle">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Buyer Profile Preview"
                            className="buyer-photo-preview-img"
                          />
                        ) : (
                          <Camera size={26} color="var(--buyer-accent-text)" />
                        )}
                      </div>

                      <div className="buyer-photo-prompt-text">
                        <div className="buyer-photo-prompt-title">
                          {photoPreview ? (photoName || t('photoLabel')) : (isDraggingPhoto ? t('photoDragPrompt') : t('photoUploadText'))}
                        </div>
                        <div className="buyer-photo-prompt-sub">
                          {t('photoUploadFormat')}
                        </div>
                      </div>

                      {photoPreview ? (
                        <div className="buyer-photo-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="buyer-photo-btn-change"
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          >
                            {t('photoChange')}
                          </button>
                          <button
                            type="button"
                            className="buyer-photo-btn-remove"
                            onClick={removePhoto}
                            aria-label="Remove uploaded photo"
                          >
                            <X size={13} style={{ display: 'inline', marginRight: 2 }} />
                            {t('photoRemove')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="buyer-photo-btn-change"
                          style={{ pointerEvents: 'none' }}
                        >
                          <Upload size={14} style={{ display: 'inline', marginRight: 4 }} />
                          {t('photoUploadText')}
                        </button>
                      )}
                    </div>

                    {touched.photo && errors.photo && (
                      <div className="buyer-field-error" role="alert">
                        <AlertCircle size={14} />
                        <span>{errors.photo}</span>
                      </div>
                    )}
                  </div>

                  {/* 2-COLUMN ROW ON DESKTOP: NAME & PHONE */}
                  <div className="buyer-fields-row">
                    {/* 2. NAME */}
                    <div style={{ flex: 1 }}>
                      <Input
                        id="buyer-name-input"
                        label={t('nameLabel')}
                        placeholder={t('namePlaceholder')}
                        value={name}
                        autoComplete="name"
                        required
                        icon={<User size={18} />}
                        error={touched.name ? errors.name : ''}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (touched.name) {
                            setErrors(prev => ({ ...prev, name: validateField('name', e.target.value) }));
                          }
                        }}
                        onBlur={() => {
                          setTouched(prev => ({ ...prev, name: true }));
                          setErrors(prev => ({ ...prev, name: validateField('name', name) }));
                        }}
                      />
                    </div>

                    {/* 3. PHONE NUMBER */}
                    <div className="buyer-field-group" style={{ flex: 1 }}>
                      <label className="buyer-input-label" htmlFor="buyer-phone-input">
                        <span>{t('phoneLabel')}<span className="required-star">*</span></span>
                      </label>
                      <div
                        className={`buyer-input-wrapper ${focusedField === 'phone' ? 'is-focused' : ''} ${touched.phone && errors.phone ? 'has-error' : ''}`}
                      >
                        <div className="buyer-phone-combo">
                          <span className="buyer-country-prefix">+91</span>
                          <input
                            id="buyer-phone-input"
                            type="tel"
                            className="buyer-phone-input"
                            placeholder={t('phonePlaceholder')}
                            value={phone}
                            maxLength={10}
                            autoComplete="tel"
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setPhone(val);
                              if (touched.phone) {
                                setErrors(prev => ({ ...prev, phone: validateField('phone', val) }));
                              }
                            }}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => {
                              setFocusedField(null);
                              setTouched(prev => ({ ...prev, phone: true }));
                              setErrors(prev => ({ ...prev, phone: validateField('phone', phone) }));
                            }}
                          />
                        </div>
                      </div>
                      {touched.phone && errors.phone && (
                        <div className="buyer-field-error" role="alert">
                          <AlertCircle size={14} />
                          <span>{errors.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2-COLUMN ROW ON DESKTOP: EMAIL & BUYER TYPE */}
                  <div className="buyer-fields-row">
                    {/* 4. EMAIL ADDRESS */}
                    <div style={{ flex: 1 }}>
                      <Input
                        id="buyer-email-input"
                        type="email"
                        label={t('emailLabel')}
                        placeholder={t('emailPlaceholder')}
                        value={email}
                        autoComplete="email"
                        required
                        icon={<Mail size={18} />}
                        error={touched.email ? errors.email : ''}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (touched.email) {
                            setErrors(prev => ({ ...prev, email: validateField('email', e.target.value) }));
                          }
                        }}
                        onBlur={() => {
                          setTouched(prev => ({ ...prev, email: true }));
                          setErrors(prev => ({ ...prev, email: validateField('email', email) }));
                        }}
                      />
                    </div>

                    {/* 5. BUYER TYPE */}
                    <div className="buyer-field-group" ref={dropdownRef} style={{ flex: 1 }}>
                      <label className="buyer-input-label" id="buyer-type-label">
                        <span>{t('buyerTypeLabel')}<span className="required-star">*</span></span>
                      </label>
                      <div className="buyer-select-wrapper">
                        <button
                          type="button"
                          className={`buyer-select-button ${buyerTypeOpen ? 'is-open' : ''} ${touched.buyerType && errors.buyerType ? 'has-error' : ''}`}
                          onClick={() => setBuyerTypeOpen(prev => !prev)}
                          aria-haspopup="listbox"
                          aria-expanded={buyerTypeOpen}
                          aria-labelledby="buyer-type-label"
                        >
                          <div className="buyer-select-selection">
                            {selectedTypeObj ? (
                              <>
                                <span className="buyer-select-icon-box">
                                  <selectedTypeObj.icon size={16} />
                                </span>
                                <span style={{ fontWeight: 600 }}>{selectedTypeObj.label}</span>
                              </>
                            ) : (
                              <span style={{ color: 'var(--buyer-text-dim)' }}>
                                {t('buyerTypePlaceholder')}
                              </span>
                            )}
                          </div>
                          <ChevronDown
                            size={16}
                            color="var(--buyer-text-muted)"
                            style={{
                              transform: buyerTypeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.16s ease'
                            }}
                          />
                        </button>

                        {buyerTypeOpen && (
                          <div className="buyer-select-dropdown" role="listbox">
                            {buyerTypeOptions.map((opt) => {
                              const IconComponent = opt.icon;
                              const isSelected = buyerType === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  className={`buyer-select-option ${isSelected ? 'is-selected' : ''}`}
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => {
                                    setBuyerType(opt.id);
                                    setBuyerTypeOpen(false);
                                    setTouched(prev => ({ ...prev, buyerType: true }));
                                    setErrors(prev => ({ ...prev, buyerType: '' }));
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span className="buyer-select-icon-box">
                                      <IconComponent size={15} />
                                    </span>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{opt.label}</div>
                                      <div style={{ fontSize: 11.5, color: 'var(--buyer-text-muted)' }}>{opt.desc}</div>
                                    </div>
                                  </div>
                                  {isSelected && <Check size={16} color="var(--buyer-accent-text)" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {touched.buyerType && errors.buyerType && (
                        <div className="buyer-field-error" role="alert">
                          <AlertCircle size={14} />
                          <span>{errors.buyerType}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5. ACCOUNT PASSWORD */}
                  <div style={{ marginTop: 14 }}>
                    <Input
                      id="buyer-password-input"
                      type={showPassword ? 'text' : 'password'}
                      label={t('passwordLabel')}
                      placeholder={t('passwordPlaceholder')}
                      value={password}
                      autoComplete="new-password"
                      required
                      icon={<Lock size={18} />}
                      rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      onRightIconClick={() => setShowPassword(prev => !prev)}
                      rightIconAriaLabel={showPassword ? 'Hide password' : 'Show password'}
                      error={touched.password ? errors.password : ''}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (registerError) setRegisterError('');
                        if (touched.password) {
                          setErrors(prev => ({ ...prev, password: validateField('password', e.target.value) }));
                        }
                      }}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, password: true }));
                        setErrors(prev => ({ ...prev, password: validateField('password', password) }));
                      }}
                    />
                  </div>
                </div>

                {/* --------------------------------------------------------
                    SECTION 2: BUSINESS DETAILS
                    -------------------------------------------------------- */}
                <div className="buyer-section-block">
                  <div className="buyer-section-header">
                    <h3 className="buyer-section-heading">
                      <Building size={17} color="var(--buyer-primary)" />
                      <span>{t('section2Title')}</span>
                    </h3>
                    <p className="buyer-section-subtext">{t('section2Desc')}</p>
                  </div>

                  {/* 6. SHOP / BUSINESS NAME */}
                  <div style={{ marginBottom: 16 }}>
                    <Input
                      id="buyer-shopname-input"
                      label={t('shopNameLabel')}
                      placeholder={t('shopNamePlaceholder')}
                      value={shopName}
                      autoComplete="organization"
                      required
                      icon={<Store size={18} />}
                      helperText={t('shopNameHelper')}
                      error={touched.shopName ? errors.shopName : ''}
                      onChange={(e) => {
                        setShopName(e.target.value);
                        if (touched.shopName) {
                          setErrors(prev => ({ ...prev, shopName: validateField('shopName', e.target.value) }));
                        }
                      }}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, shopName: true }));
                        setErrors(prev => ({ ...prev, shopName: validateField('shopName', shopName) }));
                      }}
                    />
                  </div>

                  {/* 7. BUSINESS ADDRESS */}
                  <div className="buyer-field-group">
                    <label className="buyer-input-label" htmlFor="buyer-address-input">
                      <span>{t('addressLabel')}<span className="required-star">*</span></span>
                    </label>
                    <div
                      className={`buyer-textarea-wrapper ${focusedField === 'address' ? 'is-focused' : ''} ${touched.address && errors.address ? 'has-error' : ''}`}
                    >
                      <span className="buyer-textarea-icon">
                        <MapPin size={18} />
                      </span>
                      <textarea
                        id="buyer-address-input"
                        rows={3}
                        className="buyer-textarea-input"
                        placeholder={t('addressPlaceholder')}
                        value={address}
                        autoComplete="street-address"
                        onChange={(e) => {
                          setAddress(e.target.value);
                          if (touched.address) {
                            setErrors(prev => ({ ...prev, address: validateField('address', e.target.value) }));
                          }
                        }}
                        onFocus={() => setFocusedField('address')}
                        onBlur={() => {
                          setFocusedField(null);
                          setTouched(prev => ({ ...prev, address: true }));
                          setErrors(prev => ({ ...prev, address: validateField('address', address) }));
                        }}
                      />
                    </div>
                    {touched.address && errors.address && (
                      <div className="buyer-field-error" role="alert">
                        <AlertCircle size={14} />
                        <span>{errors.address}</span>
                      </div>
                    )}
                  </div>

                  {/* 8. GSTIN NUMBER */}
                  <div style={{ marginTop: 16 }}>
                    <Input
                      id="buyer-gstin-input"
                      label={t('gstinLabel')}
                      placeholder={t('gstinPlaceholder')}
                      maxLength={15}
                      style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                      value={gstin}
                      required
                      icon={<FileText size={18} />}
                      helperText={t('gstinHelper')}
                      error={touched.gstin ? errors.gstin : ''}
                      onChange={(e) => {
                        const upper = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
                        setGstin(upper);
                        if (touched.gstin) {
                          setErrors(prev => ({ ...prev, gstin: validateField('gstin', upper) }));
                        }
                      }}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, gstin: true }));
                        setErrors(prev => ({ ...prev, gstin: validateField('gstin', gstin) }));
                      }}
                    />
                  </div>
                </div>

                {/* --------------------------------------------------------
                    FORM COMPLETION AREA
                    -------------------------------------------------------- */}
                {/* Confirmation Checkbox */}
                <div className="buyer-field-group">
                  <label
                    className="buyer-confirm-row"
                    htmlFor="buyer-confirm-checkbox"
                  >
                    <input
                      id="buyer-confirm-checkbox"
                      type="checkbox"
                      className="buyer-confirm-checkbox"
                      checked={isConfirmed}
                      onChange={(e) => {
                        setIsConfirmed(e.target.checked);
                        if (touched.confirm) {
                          setErrors(prev => ({ ...prev, confirm: e.target.checked ? '' : validateField('confirm', e.target.checked) }));
                        }
                      }}
                    />
                    <span className="buyer-confirm-text">
                      {t('confirmLabel')}
                    </span>
                  </label>
                  {touched.confirm && errors.confirm && (
                    <div className="buyer-field-error" role="alert">
                      <AlertCircle size={14} />
                      <span>{errors.confirm}</span>
                    </div>
                  )}
                </div>

                {/* Server Error Alert Banner */}
                {registerError && (
                  <div
                    className="buyer-reg-error-banner"
                    role="alert"
                    style={{
                      marginBottom: 16,
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{registerError}</span>
                  </div>
                )}

                {/* Primary CTA Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={submitStatus === 'loading'}
                  loadingText={t('submitLoading')}
                  rightIcon={<ArrowRight size={14} />}
                >
                  {t('submitNormal')}
                </Button>

                {/* Login Link */}
                <div className="buyer-reg-login-row">
                  <span>{t('alreadyHaveAccount')}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="buyer-reg-login-link"
                    onClick={handleNavigateLogin}
                  >
                    {t('signInLink')}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Form Pane Footer Note */}
          <footer className="buyer-reg-footer">
            <p>{t('footerProtected')}</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
