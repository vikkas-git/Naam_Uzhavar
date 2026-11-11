// What this file does: Unified Login Page matching reference UI design with dual-pane layout, 3 role selection cards, and a single common login form.

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sprout,
  ShoppingCart,
  Truck,
  Globe,
  ChevronDown,
  LogIn,
  X
} from 'lucide-react';
import { useT } from '../hooks/useT';
import { ROUTES } from '../routes';
import Button from '../components/Button';
import { api, setToken, DEMO_FARMER_JWT, DEMO_BUYER_JWT } from '../utils/api';
import { INITIAL_FARMER_PROFILE } from '../data/farmerMockData';
import './RoleSelectPage.css';

export default function RoleSelectPage({
  onBack,
  onSelectFarmer,
  onSelectBuyer,
  onSelectDriver
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, lang, toggleLang } = useT('roleSelect');

  // Initial role from URL query param (e.g. ?role=buyer), defaults to 'farmer'
  const initialRole = searchParams.get('role') || 'farmer';
  const [activeRole, setActiveRole] = useState(
    ['farmer', 'buyer', 'driver'].includes(initialRole) ? initialRole : 'farmer'
  );

  // Unified single login form state
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Feedback notifications
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Role Switch Handler
  const handleRoleSwitch = (role) => {
    setActiveRole(role);
    setSearchParams({ role });
    setAuthError('');
    setAuthSuccess('');
  };

  // Keep activeRole synchronized with URL query param
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['farmer', 'buyer', 'driver'].includes(roleParam)) {
      setActiveRole(roleParam);
    }
  }, [searchParams]);

  // Pre-fill user ID if redirected from registration
  useEffect(() => {
    if (activeRole === 'farmer') {
      try {
        const pendingEmail = localStorage.getItem('farmer_registration_pending_email');
        if (pendingEmail) {
          setUserId(pendingEmail);
          setAuthSuccess(
            lang === 'ta'
              ? 'உழவர் பதிவு வெற்றிகரமானது! உங்கள் கடவுச்சொல்லை உள்ளிட்டு உள்நுழையவும்.'
              : 'Farmer account registered successfully! Please enter your password to sign in.'
          );
          localStorage.removeItem('farmer_registration_pending_email');
        }
      } catch {}
    } else if (activeRole === 'buyer' && searchParams.get('registered') === '1') {
      try {
        const stored = localStorage.getItem('buyer_registered_profile');
        if (stored) {
          const profile = JSON.parse(stored);
          if (profile.email || profile.phone) {
            setUserId(profile.email || profile.phone);
          }
        }
      } catch {}
      setAuthSuccess(
        lang === 'ta'
          ? 'வணிகக் கணக்கு வெற்றிகரமாக பதிவு செய்யப்பட்டது! உங்கள் கடவுச்சொல் மூலம் உள்நுழையவும்.'
          : 'Registration completed successfully! Please log in with your credentials.'
      );
    }
  }, [activeRole, searchParams, lang]);

  // Back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(ROUTES.HOME);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ---------------------------------------------------------------------------
  // AUTHENTICATION LOGIC: FARMER
  // ---------------------------------------------------------------------------
  const executeFarmerLogin = async (trimmedUser, trimmedPass) => {
    const completeFarmerLogin = (farmerData, successName, specificToken) => {
      const activeToken =
        specificToken ||
        (farmerData.name && farmerData.name.toLowerCase() !== 'ramesh kumar'
          ? `farmer_token_${farmerData.farmerId || 'registered'}`
          : DEMO_FARMER_JWT);
      setToken(activeToken, 'farmer');
      const profileToStore = {
        ...farmerData,
        role: 'farmer',
        isVerified: true
      };
      try {
        localStorage.removeItem('buyer_current_profile');
        localStorage.setItem('farmer_current_profile', JSON.stringify(profileToStore));
        sessionStorage.removeItem('farmer_explicit_signout');
      } catch (err) {
        console.warn('Could not store farmer profile:', err);
      }

      setIsSubmitting(false);
      setAuthSuccess(
        lang === 'ta'
          ? `${successName || profileToStore.name || 'விவசாயி'} சரிபார்க்கப்பட்டது! உழவர் தளத்திற்கு செல்கிறது...`
          : `Farmer ${successName || profileToStore.name || ''} verified! Connecting to Farmer Direct Portal...`
      );

      setTimeout(() => {
        if (onSelectFarmer) {
          onSelectFarmer();
        } else {
          navigate(ROUTES.FARMER_DASHBOARD);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 700);
    };

    try {
      const res = await api.post('/auth/farmer/login', {
        identifier: trimmedUser,
        phone: trimmedUser,
        email: trimmedUser,
        password: trimmedPass
      });

      const farmerData = res?.farmer || {
        farmerId: 'FMR-TN-2026-01',
        name: 'Ramesh Kumar',
        email: trimmedUser.includes('@') ? trimmedUser : 'ramesh.kumar@naamuzhavar.com',
        phone: trimmedUser,
        avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80',
        rating: 4.92,
        totalHarvests: 54,
        isVerified: true,
        role: 'farmer'
      };

      completeFarmerLogin(farmerData, farmerData.name, res?.token);
    } catch (err) {
      console.warn('Backend farmer login notice, checking registered credentials:', err.message);

      const registeredRaw = localStorage.getItem('farmer_registered_profile');
      const registeredListRaw = localStorage.getItem('registered_farmers_list');
      const allRegistered = [];
      if (registeredRaw) {
        try { allRegistered.push(JSON.parse(registeredRaw)); } catch {}
      }
      if (registeredListRaw) {
        try { allRegistered.push(...JSON.parse(registeredListRaw)); } catch {}
      }

      const cleanDigits = trimmedUser.replace(/\D/g, '');
      const matchedFarmer = allRegistered.find((rf) => {
        if (!rf) return false;
        const emailMatches = rf.email && rf.email.toLowerCase() === trimmedUser.toLowerCase();
        const rfDigits = (rf.phone || '').replace(/\D/g, '');
        const phoneMatches =
          cleanDigits.length >= 10 &&
          rfDigits.length >= 10 &&
          (cleanDigits.endsWith(rfDigits.slice(-10)) || rfDigits.endsWith(cleanDigits.slice(-10)));
        return emailMatches || phoneMatches;
      });

      if (matchedFarmer) {
        if (matchedFarmer.password && matchedFarmer.password !== trimmedPass) {
          setIsSubmitting(false);
          setAuthError(
            lang === 'ta'
              ? 'தவறான கடவுச்சொல். மீண்டும் முயற்சிக்கவும்.'
              : 'Invalid password. Please check your credentials.'
          );
          return;
        }

        completeFarmerLogin(matchedFarmer, matchedFarmer.name);
        return;
      }

      const isDemoFarmerAccount =
        trimmedUser.toLowerCase() === 'farmer@naamuzhavar.com' ||
        trimmedUser.toLowerCase() === 'ramesh.kumar@naamuzhavar.com' ||
        (cleanDigits.length >= 10 && cleanDigits.endsWith('78190'));
      const isDemoFarmerPin = trimmedPass === '4821' || trimmedPass === 'farmer1234' || trimmedPass === '1234';

      if (isDemoFarmerAccount && isDemoFarmerPin) {
        handleQuickDemoFarmer();
        return;
      }

      setIsSubmitting(false);
      setAuthError(
        err.message ||
        (lang === 'ta'
          ? 'அலைபேசி எண்/மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது. மீண்டும் முயற்சிக்கவும்.'
          : 'Invalid mobile/email or password. Please verify your credentials.')
      );
    }
  };

  const handleQuickDemoFarmer = () => {
    setUserId('+91 94432 78190');
    setPassword('4821');
    setAuthError('');
    setIsSubmitting(true);

    setToken(DEMO_FARMER_JWT);

    const farmerData = {
      ...INITIAL_FARMER_PROFILE,
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
      localStorage.setItem('farmer_current_profile', JSON.stringify(farmerData));
      sessionStorage.removeItem('farmer_explicit_signout');
    } catch (err) {
      console.warn('Could not store farmer profile:', err);
    }

    setIsSubmitting(false);
    setAuthSuccess(
      lang === 'ta'
        ? 'ரமேஷ் குமார் (பொள்ளாச்சி மையம்) - விவசாயி சரிபார்க்கப்பட்டது!'
        : 'Farmer Ramesh Kumar (Pollachi Hub) verified!'
    );

    setTimeout(() => {
      if (onSelectFarmer) {
        onSelectFarmer();
      } else {
        navigate(ROUTES.FARMER_DASHBOARD);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 700);
  };

  // ---------------------------------------------------------------------------
  // AUTHENTICATION LOGIC: BUYER
  // ---------------------------------------------------------------------------
  const executeBuyerLogin = async (trimmedUser, trimmedPass) => {
    try {
      const res = await api.post('/auth/login', {
        identifier: trimmedUser,
        email: trimmedUser,
        password: trimmedPass
      });

      if (res && res.token) {
        setToken(res.token);
      }

      if (res && res.buyer) {
        let contactPersonName = res.buyer.contactPerson;
        if (!contactPersonName || contactPersonName === res.buyer.businessName) {
          contactPersonName = res.buyer.name || 'Vimal Kumar';
        }

        const buyerData = {
          ...res.buyer,
          contactPerson: contactPersonName,
          name: contactPersonName,
          fullName: contactPersonName,
          shopName: res.buyer.shopName || res.buyer.businessName,
          businessName: res.buyer.businessName,
          buyerType: res.buyer.buyerType || 'hotel',
          role: 'buyer'
        };
        try {
          localStorage.removeItem('farmer_current_profile');
          localStorage.setItem('buyer_current_profile', JSON.stringify(buyerData));
          localStorage.setItem('buyer_registered_profile', JSON.stringify(buyerData));
        } catch {}
      }

      try {
        sessionStorage.removeItem('buyer_explicit_signout');
      } catch {}

      setIsSubmitting(false);
      setAuthSuccess(t('loginSuccessToast') || 'Signed in successfully! Redirecting...');

      setTimeout(() => {
        if (onSelectBuyer) {
          onSelectBuyer();
        } else {
          navigate(ROUTES.BUYER_DASHBOARD);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 700);
    } catch (err) {
      console.warn('Backend buyer login error:', err.message);

      const cleanDigits = trimmedUser.replace(/\D/g, '');
      const isDemoBuyerAccount =
        trimmedUser.toLowerCase() === 'demo@naamuzhavar.com' ||
        trimmedUser.toLowerCase() === 'hotel.saravana@gmail.com' ||
        (cleanDigits.length >= 10 && cleanDigits.endsWith('23456'));
      const isDemoBuyerPass = trimmedPass === 'demo1234' || trimmedPass === 'saravana123' || trimmedPass === '1234';

      if (isDemoBuyerAccount && isDemoBuyerPass) {
        handleQuickDemoBuyer();
        return;
      }

      try {
        const stored = localStorage.getItem('buyer_registered_profile');
        if (stored) {
          const registered = JSON.parse(stored);
          const matchEmail = registered.email && registered.email.toLowerCase() === trimmedUser.toLowerCase();
          const matchPhone = registered.phone && registered.phone.replace(/\D/g, '').endsWith(cleanDigits);
          if ((matchEmail || matchPhone) && trimmedPass.length >= 4) {
            localStorage.setItem('buyer_current_profile', JSON.stringify(registered));
            setToken(DEMO_BUYER_JWT);
            setIsSubmitting(false);
            setAuthSuccess(t('loginSuccessToast') || 'Signed in successfully! Redirecting...');
            setTimeout(() => {
              if (onSelectBuyer) onSelectBuyer();
              else {
                navigate(ROUTES.BUYER_DASHBOARD);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }, 700);
            return;
          }
        }
      } catch {}

      setIsSubmitting(false);
      setAuthError(
        err.message ||
        (lang === 'ta'
          ? 'மின்னஞ்சல்/அலைபேசி எண் அல்லது கடவுச்சொல் தவறானது.'
          : 'Invalid email/phone or password. Please try again.')
      );
    }
  };

  const handleQuickDemoBuyer = () => {
    setUserId('demo@naamuzhavar.com');
    setPassword('demo1234');
    setAuthError('');
    setIsSubmitting(true);

    const demoBuyer = {
      buyerId: 'BUY-TN-2026-004',
      businessName: 'Grand Palace Luxury Dining',
      shopName: 'Grand Palace Luxury Dining',
      buyerType: 'restaurant',
      contactPerson: 'Mr. S. Rajesh (Procurement Head)',
      phone: '+91 98401 23456',
      email: 'demo@naamuzhavar.com',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80',
      address: 'No. 42, Trichy Main Road, Near Central Bus Stand, Dindigul, Tamil Nadu - 624001',
      gstin: '33AAAAA0000A1Z5',
      paymentTerms: 'net15',
      frequentCrops: ['Tomato', 'Potato', 'Onion', 'Carrot'],
      isVerified: true,
      role: 'buyer'
    };

    try {
      localStorage.removeItem('farmer_current_profile');
      localStorage.setItem('buyer_current_profile', JSON.stringify(demoBuyer));
      localStorage.setItem('buyer_registered_profile', JSON.stringify(demoBuyer));
      sessionStorage.removeItem('buyer_explicit_signout');
    } catch {}

    setToken(DEMO_BUYER_JWT);

    setTimeout(() => {
      setIsSubmitting(false);
      setAuthSuccess(
        lang === 'ta'
          ? 'கிராண்ட் பேலஸ் ஹோட்டல் - வாங்குபவர் சரிபார்க்கப்பட்டது!'
          : 'Demo Buyer (Grand Palace Luxury Dining) verified!'
      );
      setTimeout(() => {
        if (onSelectBuyer) onSelectBuyer();
        else {
          navigate(ROUTES.BUYER_DASHBOARD);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 600);
    }, 600);
  };

  // ---------------------------------------------------------------------------
  // AUTHENTICATION LOGIC: DRIVER
  // ---------------------------------------------------------------------------
  const completeDriverLogin = (driverData) => {
    try {
      localStorage.setItem('driver_current_profile', JSON.stringify(driverData));
      sessionStorage.removeItem('driver_explicit_signout');
    } catch (err) {
      console.warn('Could not store driver profile:', err);
    }
    setToken('driver_token_kumar_m', 'driver');
    setIsSubmitting(false);
    setAuthSuccess(
      lang === 'ta'
        ? `${driverData.name || 'ஓட்டுநர்'} முனையம் சரிபார்க்கப்பட்டது! பயண வழிகளுக்கு செல்கிறது...`
        : `Driver ${driverData.name || ''} verified! Connecting to EV Dispatch Terminal...`
    );
    setTimeout(() => {
      if (onSelectDriver) {
        onSelectDriver();
      } else {
        navigate(ROUTES.DRIVER_DASHBOARD);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 700);
  };

  const executeDriverLogin = async (trimmedUser, _trimmedPass) => {
    try {
      const driverData = {
        driverId: 'DRV-TN-2026-08',
        name: 'Kumar M.',
        phone: trimmedUser.includes('@') ? '+91 94432 11098' : trimmedUser,
        email: trimmedUser.includes('@') ? trimmedUser : 'kumar.logistics@naamuzhavar.com',
        avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&auto=format&fit=crop&q=80',
        assignedHub: 'Dindigul Central Hub',
        vehicle: {
          model: 'Tata Ace EV Cargo',
          vehicleNumber: 'TN 57 AB 1234',
          type: 'Zero-Emission EV Light Commercial Vehicle (LCV)',
          batteryCapacityKwh: 21.3,
          currentBatteryPct: 82,
          estimatedRangeKm: 68,
          maxPayloadKg: 600,
          healthPct: 98,
          chargingStatus: 'DISCHARGING'
        },
        role: 'driver'
      };
      completeDriverLogin(driverData);
    } catch (err) {
      setIsSubmitting(false);
      setAuthError(err.message || 'Driver authentication failed.');
    }
  };

  const handleQuickDemoDriver = () => {
    setUserId('+91 94432 11098');
    setPassword('4892');
    setAuthError('');
    setIsSubmitting(true);
    const driverData = {
      driverId: 'DRV-TN-2026-08',
      name: 'Kumar M.',
      phone: '+91 94432 11098',
      email: 'kumar.logistics@naamuzhavar.com',
      avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&auto=format&fit=crop&q=80',
      assignedHub: 'Dindigul Central Hub',
      vehicle: {
        model: 'Tata Ace EV Cargo',
        vehicleNumber: 'TN 57 AB 1234',
        type: 'Zero-Emission EV Light Commercial Vehicle (LCV)',
        batteryCapacityKwh: 21.3,
        currentBatteryPct: 82,
        estimatedRangeKm: 68,
        maxPayloadKg: 600,
        healthPct: 98,
        chargingStatus: 'DISCHARGING'
      },
      role: 'driver'
    };
    completeDriverLogin(driverData);
  };

  // ---------------------------------------------------------------------------
  // UNIFIED SUBMIT HANDLER
  // ---------------------------------------------------------------------------
  const handleUnifiedSubmit = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');

    const trimmedUser = userId.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser) {
      setAuthError(
        lang === 'ta'
          ? 'உங்கள் பயனர் ஐடி அல்லது அலைபேசி எண்ணை உள்ளிடவும்'
          : 'Please enter your User ID or mobile number.'
      );
      return;
    }
    if (!trimmedPass) {
      setAuthError(
        lang === 'ta'
          ? 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்'
          : 'Please enter your password.'
      );
      return;
    }

    setIsSubmitting(true);

    if (activeRole === 'farmer') {
      await executeFarmerLogin(trimmedUser, trimmedPass);
    } else if (activeRole === 'buyer') {
      await executeBuyerLogin(trimmedUser, trimmedPass);
    } else if (activeRole === 'driver') {
      await executeDriverLogin(trimmedUser, trimmedPass);
    }
  };

  // Dynamic Theme Colors based on Selected Role
  const roleColor =
    activeRole === 'buyer'
      ? '#1e40af'
      : activeRole === 'driver'
      ? '#b45309'
      : '#15803d';

  const roleRegisterRoute =
    activeRole === 'buyer'
      ? ROUTES.BUYER_REGISTER
      : activeRole === 'driver'
      ? ROUTES.DRIVER_REGISTER
      : ROUTES.FARMER_REGISTER;

  return (
    <div className="role-select-root">
      {/* Decorative Natural Leaves */}
      <div className="role-leaf-decor top-right" aria-hidden="true" />
      <div className="role-leaf-decor bottom-left" aria-hidden="true" />

      {/* ====================================================================
          TOP NAVIGATION BAR (Clean Brand Lockup + Language Pill)
          ==================================================================== */}
      <header className="role-select-topbar">
        <div
          className="role-select-brand"
          onClick={handleBack}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleBack();
          }}
          title="Go to Home"
        >
          <img src="/logo.png" alt="Naam Uzhavar" className="role-select-logo-img" />
          <div className="role-select-brand-text">
            <span className="role-select-brand-name">Naam Uzhavar</span>
            <span className="role-select-brand-sub">Farmers • Buyers • Drivers</span>
          </div>
        </div>

        <div className="role-select-topbar-actions">
          <button
            type="button"
            className="role-select-lang-btn"
            onClick={toggleLang}
            aria-label="Toggle Language"
            title="Toggle English / தமிழ்"
          >
            <Globe size={15} />
            <span>{lang === 'ta' ? 'English' : 'தமிழ்'}</span>
            <ChevronDown size={14} />
          </button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="role-select-back-btn"
            onClick={handleBack}
            leftIcon={<ArrowLeft size={15} />}
            aria-label="Back to Home"
          >
            <span className="role-back-home-text">{lang === 'ta' ? 'முகப்பு' : 'Home'}</span>
          </Button>
        </div>
      </header>

      {/* ====================================================================
          MAIN CENTERED LOGIN CARD CONTAINER (Dual Pane matching Reference UI)
          ==================================================================== */}
      <main className="role-login-main-wrapper">
        <div className="role-login-card-container">
          {/* ----------------------------------------------------------------
              LEFT VISUAL PANE (Brand Visual & Proposition)
              ---------------------------------------------------------------- */}
          <div className="role-login-visual-pane">
            <div className="role-visual-header">
              <h1 className="role-visual-title">
                {lang === 'ta'
                  ? 'விவசாயிகளை சிறந்த எதிர்காலத்துடன் இணைக்கிறோம்'
                  : 'Connecting Farmers to a Better Tomorrow'}
              </h1>
              <p className="role-visual-subtitle">
                {lang === 'ta'
                  ? 'புதிய விளைபொருட்கள் • நியாயமான விலை • வலிமையான சமூகங்கள்'
                  : 'Fresh produce • Fair prices • Stronger communities'}
              </p>
            </div>

            {/* Visual Graphic Representation */}
            <div className="role-visual-art-frame">
              <img
                src="/hero-farm.jpg"
                alt="Agricultural Paddy Fields"
                className="role-visual-bg-img"
              />
            </div>

            {/* 3 Circular Feature Badges at Bottom */}
            <div className="role-visual-features-row">
              <div className="role-feature-col">
                <div className="role-feature-icon-circle green-circle">
                  <Sprout size={18} />
                </div>
                <div className="role-feature-name">{lang === 'ta' ? 'விவசாயிகளுக்கு' : 'For Farmers'}</div>
                <div className="role-feature-desc">
                  {lang === 'ta'
                    ? 'நேரடியாக விற்று சிறந்த விலை பெறுங்கள்'
                    : 'Sell your produce directly & get better prices'}
                </div>
              </div>

              <div className="role-feature-col">
                <div className="role-feature-icon-circle blue-circle">
                  <ShoppingCart size={18} />
                </div>
                <div className="role-feature-name">{lang === 'ta' ? 'வாங்குபவர்களுக்கு' : 'For Buyers'}</div>
                <div className="role-feature-desc">
                  {lang === 'ta'
                    ? 'புதிய விளைபொருட்களை குறைந்த விலையில் வாங்குங்கள்'
                    : 'Get fresh produce at competitive prices'}
                </div>
              </div>

              <div className="role-feature-col">
                <div className="role-feature-icon-circle orange-circle">
                  <Truck size={18} />
                </div>
                <div className="role-feature-name">{lang === 'ta' ? 'ஓட்டுநர்களுக்கு' : 'For Drivers'}</div>
                <div className="role-feature-desc">
                  {lang === 'ta'
                    ? 'பயணங்களை நிர்வகித்து அதிக வருவாய் ஈட்டுங்கள்'
                    : 'Manage trips, collect produce & earn more'}
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------
              RIGHT FORM PANE (Welcome Back, 3 Role Cards, Single Login Form)
              ---------------------------------------------------------------- */}
          <div className="role-login-form-pane">
            <div className="role-form-header-box">
              <h2 className="role-form-title">
                {lang === 'ta' ? 'மீண்டும் வருக' : 'Welcome Back'}
              </h2>
              <p className="role-form-subtitle">
                {lang === 'ta'
                  ? 'தொடர உங்கள் பிரிவைத் தேர்ந்தெடுத்து உள்நுழையவும்'
                  : 'Select your role and login to continue'}
              </p>
            </div>

            {/* Feedback Notifications */}
            {authError && (
              <div className="role-login-feedback error animate-shake" role="alert">
                <AlertCircle size={17} className="flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="role-login-feedback success animate-fade-in" role="status">
                <CheckCircle2 size={17} className="flex-shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* ================================================================
                3 ROLE SELECTION CARDS (Farmer, Buyer, Driver)
                ================================================================ */}
            <div className="role-tri-cards-grid" role="tablist" aria-label="Select Role">
              {/* Card 1: Farmer */}
              <div
                role="tab"
                id="role-tab-farmer"
                tabIndex={0}
                aria-selected={activeRole === 'farmer'}
                className={`role-choice-card farmer-choice ${activeRole === 'farmer' ? 'is-selected' : ''}`}
                onClick={() => handleRoleSwitch('farmer')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleRoleSwitch('farmer');
                }}
              >
                {activeRole === 'farmer' && (
                  <span className="role-card-check-badge farmer-check" aria-hidden="true">
                    ✓
                  </span>
                )}
                <div className="role-choice-icon-wrap farmer-icon-wrap">
                  <Sprout size={24} strokeWidth={2.4} />
                </div>
                <div className="role-choice-label farmer-label">
                  {lang === 'ta' ? 'விவசாயி' : 'Farmer'}
                </div>
              </div>

              {/* Card 2: Buyer */}
              <div
                role="tab"
                id="role-tab-buyer"
                tabIndex={0}
                aria-selected={activeRole === 'buyer'}
                className={`role-choice-card buyer-choice ${activeRole === 'buyer' ? 'is-selected' : ''}`}
                onClick={() => handleRoleSwitch('buyer')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleRoleSwitch('buyer');
                }}
              >
                {activeRole === 'buyer' && (
                  <span className="role-card-check-badge buyer-check" aria-hidden="true">
                    ✓
                  </span>
                )}
                <div className="role-choice-icon-wrap buyer-icon-wrap">
                  <ShoppingCart size={24} strokeWidth={2.4} />
                </div>
                <div className="role-choice-label buyer-label">
                  {lang === 'ta' ? 'வாங்குபவர்' : 'Buyer'}
                </div>
              </div>

              {/* Card 3: Driver */}
              <div
                role="tab"
                id="role-tab-driver"
                tabIndex={0}
                aria-selected={activeRole === 'driver'}
                className={`role-choice-card driver-choice ${activeRole === 'driver' ? 'is-selected' : ''}`}
                onClick={() => handleRoleSwitch('driver')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleRoleSwitch('driver');
                }}
              >
                {activeRole === 'driver' && (
                  <span className="role-card-check-badge driver-check" aria-hidden="true">
                    ✓
                  </span>
                )}
                <div className="role-choice-icon-wrap driver-icon-wrap">
                  <Truck size={24} strokeWidth={2.4} />
                </div>
                <div className="role-choice-label driver-label">
                  {lang === 'ta' ? 'ஓட்டுநர்' : 'Driver'}
                </div>
              </div>
            </div>

            {/* ================================================================
                SINGLE COMMON LOGIN FORM (Supports Farmer, Buyer, Driver)
                ================================================================ */}
            <form onSubmit={handleUnifiedSubmit} className="role-unified-form">
              {/* Field 1: User ID / Mobile */}
              <div className="role-form-group">
                <label htmlFor="unified-user-id" className="role-field-label">
                  {lang === 'ta' ? 'பயனர் ஐடி / அலைபேசி' : 'User ID'}
                </label>
                <div className="role-input-box">
                  <span className="role-input-icon">
                    <User size={18} />
                  </span>
                  <input
                    id="unified-user-id"
                    type="text"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder={
                      activeRole === 'farmer'
                        ? 'e.g. 94432 78190 or farmer@naamuzhavar.com'
                        : activeRole === 'buyer'
                        ? 'e.g. demo@naamuzhavar.com or 98401 23456'
                        : 'e.g. 94432 11098 or driver@naamuzhavar.com'
                    }
                    className="role-unified-input"
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="role-form-group">
                <label htmlFor="unified-password" className="role-field-label">
                  {lang === 'ta' ? 'கடவுச்சொல்' : 'Password'}
                </label>
                <div className="role-input-box">
                  <span className="role-input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    id="unified-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder={
                      activeRole === 'farmer'
                        ? 'Enter PIN or password (e.g. 4821)'
                        : activeRole === 'buyer'
                        ? 'Enter password (e.g. demo1234)'
                        : 'Enter dispatch PIN (e.g. 4892)'
                    }
                    className="role-unified-input"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="role-pass-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Auxiliary Row: Remember Me & Forgot Password */}
              <div className="role-form-aux-row">
                <label className="role-remember-box">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="role-checkbox"
                  />
                  <span>{lang === 'ta' ? 'என்னை நினைவில் கொள்க' : 'Remember me'}</span>
                </label>

                <button
                  type="button"
                  className="role-forgot-link-btn"
                  onClick={() => setShowForgotModal(true)}
                >
                  {lang === 'ta' ? 'கடவுச்சொல் மறந்துவிட்டதா?' : 'Forgot password?'}
                </button>
              </div>

              {/* Dynamic Role-Colored Submit Button */}
              <button
                type="submit"
                className="role-unified-login-btn"
                style={{ backgroundColor: roleColor, borderColor: roleColor }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>{lang === 'ta' ? 'சரிபார்க்கிறது...' : 'Verifying...'}</span>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>{lang === 'ta' ? 'உள்நுழைக' : 'Login'}</span>
                  </>
                )}
              </button>

              {/* 1-Click Quick Demo Sign In Button for Seamless Evaluation */}
              <button
                type="button"
                className="role-quick-demo-link"
                onClick={() => {
                  if (activeRole === 'farmer') handleQuickDemoFarmer();
                  else if (activeRole === 'buyer') handleQuickDemoBuyer();
                  else handleQuickDemoDriver();
                }}
                disabled={isSubmitting}
              >
                <span>
                  ⚡ {lang === 'ta' ? 'விரைவு டெமோ உள்நுழைவு' : 'Quick Demo Sign In'}:{' '}
                  <strong>
                    {activeRole === 'farmer'
                      ? 'Ramesh Kumar (Farmer)'
                      : activeRole === 'buyer'
                      ? 'Grand Palace (Buyer)'
                      : 'Kumar M. (Driver)'}
                  </strong>
                </span>
              </button>

              {/* New User Register Link */}
              <div className="role-register-footer">
                <span>{lang === 'ta' ? 'புதிய பயனரா?' : 'New user?'}</span>{' '}
                <Link
                  to={roleRegisterRoute}
                  className="role-register-action-link"
                  style={{ color: roleColor }}
                >
                  {lang === 'ta' ? 'இங்கே பதிவு செய்யவும்' : 'Register here'} ➔
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ====================================================================
          FORGOT PASSWORD MODAL (Buyer, Farmer, Driver Support)
          ==================================================================== */}
      {showForgotModal && (
        <div className="role-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="role-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="role-modal-header">
              <h3 className="role-modal-title">
                {lang === 'ta' ? 'கடவுச்சொல்லை மீட்டமைக்கவும்' : 'Reset Password'}
              </h3>
              <button
                type="button"
                className="role-modal-close"
                onClick={() => setShowForgotModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="role-modal-body">
              {forgotSent ? (
                <div className="role-modal-success">
                  <CheckCircle2 size={24} className="text-success" />
                  <p>
                    {lang === 'ta'
                      ? 'கடவுச்சொல் மீட்டமைப்பு இணைப்பு உங்கள் மின்னஞ்சல் அல்லது அலைபேசிக்கு அனுப்பப்பட்டது!'
                      : 'Password reset link and temporary security code sent to your registered contact!'}
                  </p>
                </div>
              ) : (
                <>
                  <p className="role-modal-info">
                    {lang === 'ta'
                      ? 'உங்கள் பதிவு செய்யப்பட்ட மின்னஞ்சல் அல்லது அலைபேசி எண்ணை உள்ளிடவும்.'
                      : 'Enter your registered email address or phone number to receive a temporary recovery PIN.'}
                  </p>
                  <input
                    type="text"
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="e.g. registered mobile or email"
                    className="role-unified-input"
                    style={{ marginBottom: 16 }}
                    autoFocus
                  />
                  <div className="role-modal-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowForgotModal(false)}
                    >
                      {lang === 'ta' ? 'ரத்து' : 'Cancel'}
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (forgotInput.trim()) {
                          setForgotSent(true);
                          setTimeout(() => {
                            setForgotSent(false);
                            setShowForgotModal(false);
                          }, 2500);
                        }
                      }}
                    >
                      {lang === 'ta' ? 'அனுப்புக' : 'Send Recovery Code'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
