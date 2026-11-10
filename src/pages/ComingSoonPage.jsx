// What this file does: Coming soon page for Farmer and Driver portal flows with bilingual translation.

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useT } from '../hooks/useT';
import { ROUTES } from '../routes';
import Button from '../components/Button';
import Badge from '../components/Badge';
import './ComingSoonPage.css';

export default function ComingSoonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role'); // 'farmer' | 'driver' | null

  const { t, toggleLang } = useT('comingSoon');

  const handleBackToRoles = () => {
    navigate(ROUTES.ROLE_SELECT);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    navigate(ROUTES.HOME);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreBuyer = () => {
    navigate(ROUTES.BUYER_DASHBOARD);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFarmer = role === 'farmer';
  const isDriver = role === 'driver';

  const title = isFarmer
    ? t('farmerTitle')
    : isDriver
    ? t('driverTitle')
    : t('generalTitle');

  const desc = isFarmer
    ? t('farmerDesc')
    : isDriver
    ? t('driverDesc')
    : t('generalDesc');

  const roleCardClass = isFarmer
    ? 'role-farmer'
    : isDriver
    ? 'role-driver'
    : 'role-general';

  const icon = isFarmer ? '🌾' : isDriver ? '🚚' : '🌱';

  const features = isFarmer
    ? [t('feature1Farmer'), t('feature2Farmer'), t('feature3Farmer')]
    : isDriver
    ? [t('feature1Driver'), t('feature2Driver'), t('feature3Driver')]
    : [];

  return (
    <div className="coming-soon-root">
      {/* Top Header */}
      <header className="coming-soon-topbar">
        <div
          className="coming-soon-brand"
          onClick={handleGoHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleGoHome();
            }
          }}
          aria-label="Back to home page"
          title="Go to Home page"
          style={{ cursor: 'pointer' }}
        >
          <img src="/logo.png" alt="Naam Uzhavar" className="coming-soon-logo-img" />
          <div className="coming-soon-brand-text">
            <span className="coming-soon-brand-name">
              {t('common.appName')}
            </span>
            <span className="coming-soon-brand-sub">
              {t('common.appSubtitle')}
            </span>
          </div>
        </div>

        <div className="coming-soon-topbar-actions">
          <button
            type="button"
            className="coming-soon-lang-btn"
            onClick={toggleLang}
            aria-label="Toggle Language"
          >
            <span>{t('common.switchLangText')}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="coming-soon-container">
        <div className={`coming-soon-card ${roleCardClass} animate-fade-in`}>
          <div className="coming-soon-icon-wrap">{icon}</div>

          <Badge
            variant={isDriver ? 'warning' : 'brand'}
            style={{ margin: '0 auto 16px auto', display: 'inline-flex' }}
          >
            {t('badge')}
          </Badge>

          <h1 className="coming-soon-title">{title}</h1>

          <p className="coming-soon-desc">{desc}</p>

          {features.length > 0 && (
            <div className="coming-soon-features-list">
              {features.map((feat, idx) => (
                <div key={idx} className="coming-soon-feature-item">
                  <span className="coming-soon-feature-bullet" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}

          <div className="coming-soon-actions">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleBackToRoles}
              leftIcon={<ArrowLeft size={18} />}
            >
              <span>{t('backToRoles')}</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleExploreBuyer}
              leftIcon={<ShoppingBag size={18} />}
            >
              <span>{t('exploreBuyer')}</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
