// What this file does: Public landing page showcasing platform value proposition, roles, features, and call-to-actions.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import {
  Sparkles,
  ShieldCheck,
  LogIn,
  ArrowRight,
  Sprout,
  PackageCheck,
  Truck,
  CheckCircle2,
  Award,
  Leaf,
  MapPin,
} from 'lucide-react';
import { useT } from '../hooks/useT';
import { ROUTES } from '../routes';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SectionHeader from '../components/SectionHeader';
import Button from '../components/Button';
import AppSplashLoader from '../components/AppSplashLoader';
import './HomePage.css';

export default function HomePage({ onBuyerAuthSuccess: _onBuyerAuthSuccess }) {
  const navigate = useNavigate();
  const { t } = useT('home');

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const navigateToRoleSelect = () => {
    stopSpeaking();
    navigate(ROUTES.ROLE_SELECT);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Intro Splash Loader: App logo comes first on entering the app, next the Home Page opens
  const [showSplash, setShowSplash] = useState(true);
  const [isHeroRevealed, setIsHeroRevealed] = useState(false);

  return (
    <div className={`website-root ${isHeroRevealed ? 'hp-revealed' : ''}`}>
      {/* 0. APP LOGO INTRO SPLASH: Displays first when entering the app */}
      {showSplash && (
        <AppSplashLoader
          duration={2000}
          onStartExit={() => setIsHeroRevealed(true)}
          onFinish={() => {
            setIsHeroRevealed(true);
            setShowSplash(false);
          }}
        />
      )}

      {/* 1. NAVBAR */}
      <Navbar onLoginClick={navigateToRoleSelect} />

      {/* 2. ASYMMETRIC SPLIT HERO */}
      <section id="home" className="hp-hero-section">
        <Container fluid="xl" className="px-3 px-md-4">
          <div className="hp-hero-grid">
            {/* Left Content */}
            <div className="hp-hero-left">
              <div className="hp-badge-pill">
                <Sparkles size={15} className="text-success" />
                <span>{t('badgeDirect')}</span>
              </div>

              <h1 className="hp-hero-title">
                {t('tagline')}
              </h1>

              <p className="hp-hero-subtitle">
                {t('heroSubtitle')}
              </p>

              {/* Trust Indicators */}
              <div className="hp-trust-strip">
                <div className="hp-trust-item">
                  <Sprout size={16} className="hp-trust-icon" />
                  <span>{t('trustDirectTrade')}</span>
                </div>
                <div className="hp-trust-item">
                  <ShieldCheck size={16} className="hp-trust-icon" />
                  <span>{t('trustVerifiedNetwork')}</span>
                </div>
                <div className="hp-trust-item">
                  <MapPin size={16} className="hp-trust-icon" />
                  <span>{t('trustTamilNadu')}</span>
                </div>
              </div>
            </div>

            {/* Right Asset / Photographic Anchor */}
            <div className="hp-hero-right">
              <div className="hp-hero-image-card">
                <img
                  src="/hero-farm.jpg"
                  alt="Tamil Nadu lush agricultural paddy fields"
                  className="hp-hero-img"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80';
                  }}
                />
                {/* Floating Trust Card */}
                <div className="hp-floating-card">
                  <div className="hp-floating-badge-icon">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <div className="hp-floating-title">{t('stat4Num')} {t('stat4Label')}</div>
                    <div className="hp-floating-sub">{t('stat4Sub')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. HOW IT WORKS SECTION (TIMELINE CARDS) */}
      <section id="how-it-works" className="hp-section-how">
        <Container fluid="xl" className="px-3 px-md-4">
          <SectionHeader
            title={t('howItWorksTitle')}
            subtitle={t('howItWorksSub')}
            align="center"
          />

          <div className="hp-how-grid">
            {/* Step 1 */}
            <div className="hp-step-card hp-step-card-1">
              <div className="hp-step-card-header">
                <div className="hp-step-icon-wrap">
                  <Sprout size={26} />
                </div>
                <span className="hp-step-number">01</span>
              </div>
              <h3 className="hp-step-title">{t('step1Title')}</h3>
              <p className="hp-step-desc">{t('step1Desc')}</p>
            </div>

            {/* Step 2 */}
            <div className="hp-step-card hp-step-card-2">
              <div className="hp-step-card-header">
                <div className="hp-step-icon-wrap">
                  <PackageCheck size={26} />
                </div>
                <span className="hp-step-number">02</span>
              </div>
              <h3 className="hp-step-title">{t('step2Title')}</h3>
              <p className="hp-step-desc">{t('step2Desc')}</p>
            </div>

            {/* Step 3 */}
            <div className="hp-step-card hp-step-card-3">
              <div className="hp-step-card-header">
                <div className="hp-step-icon-wrap">
                  <Truck size={26} />
                </div>
                <span className="hp-step-number">03</span>
              </div>
              <h3 className="hp-step-title">{t('step3Title')}</h3>
              <p className="hp-step-desc">{t('step3Desc')}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. HIGH CONTRAST STATS SECTION */}
      <section className="hp-section-stats">
        <Container fluid="xl" className="px-3 px-md-4">
          <div className="hp-stats-grid">
            <div className="hp-stat-box">
              <div className="hp-stat-number">{t('stat1Num')}</div>
              <div className="hp-stat-main-label">{t('stat1Label')}</div>
              <div className="hp-stat-sub-label">{t('stat1Sub')}</div>
            </div>

            <div className="hp-stat-box">
              <div className="hp-stat-number">{t('stat2Num')}</div>
              <div className="hp-stat-main-label">{t('stat2Label')}</div>
              <div className="hp-stat-sub-label">{t('stat2Sub')}</div>
            </div>

            <div className="hp-stat-box">
              <div className="hp-stat-number">{t('stat3Num')}</div>
              <div className="hp-stat-main-label">{t('stat3Label')}</div>
              <div className="hp-stat-sub-label">{t('stat3Sub')}</div>
            </div>

            <div className="hp-stat-box hp-stat-box-highlight">
              <div className="hp-stat-number">{t('stat4Num')}</div>
              <div className="hp-stat-main-label">{t('stat4Label')}</div>
              <div className="hp-stat-sub-label">{t('stat4Sub')}</div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. STRUCTURED ABOUT US / MISSION SECTION */}
      <section id="about" className="hp-section-about">
        <Container fluid="xl" className="px-3 px-md-4">
          <div className="hp-about-grid">
            {/* Left Narrative */}
            <div className="hp-about-content">
              <div className="hp-badge-pill mb-3">
                <ShieldCheck size={16} className="text-success" />
                <span>{t('aboutBadge')}</span>
              </div>

              <h2 className="fw-bold text-dark mb-3" style={{ fontSize: 'clamp(1.75rem, 2.8vw, 2.4rem)', letterSpacing: '-0.02em' }}>
                {t('aboutTitle')}
              </h2>

              <p className="hp-about-text">
                {t('aboutText')}
              </p>

              <Button
                variant="primary"
                size="lg"
                onClick={navigateToRoleSelect}
                rightIcon={<ArrowRight size={18} />}
              >
                {t('aboutCta')}
              </Button>
            </div>

            {/* Right Pillars */}
            <div className="hp-about-pillars">
              <div className="hp-pillar-card">
                <div className="hp-pillar-icon">
                  <Award size={22} />
                </div>
                <div>
                  <h4 className="hp-pillar-title">{t('aboutPillar1Title')}</h4>
                  <p className="hp-pillar-desc">{t('aboutPillar1Desc')}</p>
                </div>
              </div>

              <div className="hp-pillar-card">
                <div className="hp-pillar-icon">
                  <Leaf size={22} />
                </div>
                <div>
                  <h4 className="hp-pillar-title">{t('aboutPillar2Title')}</h4>
                  <p className="hp-pillar-desc">{t('aboutPillar2Desc')}</p>
                </div>
              </div>

              <div className="hp-pillar-card">
                <div className="hp-pillar-icon">
                  <Truck size={22} />
                </div>
                <div>
                  <h4 className="hp-pillar-title">{t('aboutPillar3Title')}</h4>
                  <p className="hp-pillar-desc">{t('aboutPillar3Desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. REUSABLE FOOTER */}
      <Footer />

      {/* Mobile Floating Action Button (Pop Login) */}
      <button
        type="button"
        className="mobile-floating-login-fab"
        onClick={navigateToRoleSelect}
        aria-label="Login"
      >
        <LogIn size={15} />
        <span>{t('common.btnLogin')}</span>
      </button>
    </div>
  );
}
