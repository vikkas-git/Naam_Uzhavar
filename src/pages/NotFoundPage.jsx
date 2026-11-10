// What this file does: 404 Page Not Found error view with navigation back to Home.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { useT } from '../hooks/useT';
import { ROUTES } from '../routes';
import Button from '../components/Button';
import Badge from '../components/Badge';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t, toggleLang } = useT('notFound');

  const handleBackHome = () => {
    navigate(ROUTES.HOME);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRole = () => {
    navigate(ROUTES.ROLE_SELECT);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="not-found-root">
      {/* Top Header */}
      <header className="not-found-topbar">
        <div
          className="not-found-brand"
          onClick={handleBackHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBackHome();
            }
          }}
          aria-label="Back to home"
          title="Go to Home page"
          style={{ cursor: 'pointer' }}
        >
          <img src="/logo.png" alt="Naam Uzhavar" className="not-found-logo-img" />
          <div className="not-found-brand-text">
            <span className="not-found-brand-name">
              {t('common.appName')}
            </span>
            <span className="not-found-brand-sub">
              {t('common.appSubtitle')}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="not-found-lang-btn"
          onClick={toggleLang}
          aria-label="Toggle Language"
        >
          <span>{t('common.switchLangText')}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="not-found-container">
        <div className="not-found-card animate-fade-in">
          <Badge variant="warning" style={{ margin: '0 auto 16px auto', display: 'inline-flex' }}>
            {t('badge')}
          </Badge>

          <div className="not-found-glitch-number">404</div>

          <h1 className="not-found-title">{t('title')}</h1>

          <p className="not-found-subtitle">{t('subtitle')}</p>

          <div className="not-found-actions">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleBackHome}
              leftIcon={<Home size={18} />}
            >
              <span>{t('backHome')}</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleSelectRole}
              leftIcon={<Compass size={18} />}
            >
              <span>{t('chooseRole')}</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
