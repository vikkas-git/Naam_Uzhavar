// What this file does: Reusable public navigation bar with branding, navigation links, language toggle, and login action.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import BNavbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import { LogIn } from 'lucide-react';
import { useT } from '../hooks/useT';
import { ROUTES } from '../routes';
import './Navbar.css';

/**
 * PublicNavbar Component (built with react-bootstrap/Navbar, Container, Nav)
 * Responsive with collapse on mobile viewports.
 */
export default function PublicNavbar({
  showNavLinks = true,
  showAuthButton = true,
  showLangToggle = true,
  onLoginClick,
  className = '',
}) {
  const { t, lang, toggleLang } = useT('common');
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBrandClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (window.location.pathname === ROUTES.HOME) {
      if (window.location.hash) {
        window.history.pushState(null, '', ROUTES.HOME);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(ROUTES.HOME);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAuthClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      navigate(ROUTES.ROLE_SELECT);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <BNavbar
      collapseOnSelect
      expand="lg"
      sticky="top"
      className={`public-navbar bg-white bg-opacity-95 border-bottom py-2 py-lg-2.5 ${
        lang === 'ta' ? 'navbar-lang-ta' : 'navbar-lang-en'
      } ${
        isScrolled ? 'shadow-sm border-secondary-subtle' : 'border-light-subtle'
      } ${className}`}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1030,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      <Container fluid="xl" className="public-navbar-container px-2 px-sm-3 px-md-4">
        {/* Top bar row: keeps Brand and Mobile Actions (Language button & Navbar toggle) unified and moved UP on mobile */}
        <div className="public-navbar-topbar">
          {/* Brand Logo & Title */}
          <BNavbar.Brand
            href="#home"
            onClick={handleBrandClick}
            className="public-navbar-brand d-flex align-items-center gap-2 text-decoration-none py-0 me-2 me-lg-3"
          >
            <img
              src="/logo.png"
              alt="Naam Uzhavar"
              width={44}
              height={44}
              className="public-navbar-logo rounded-circle border border-2 border-success object-fit-cover shadow-sm flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=100&auto=format&fit=crop&q=80';
              }}
            />
            <div className="public-navbar-brand-text d-flex flex-column">
              <span className="public-navbar-title fw-bolder fs-5 text-dark lh-sm" style={{ letterSpacing: '-0.3px' }}>
                {t('appName')}
              </span>
              <span className="public-navbar-subtitle fw-bold text-success">
                {t('appSubtitle')}
              </span>
            </div>
          </BNavbar.Brand>

          {/* Mobile Right Controls: Language switch button & Navbar button (hamburger) moved UP to the top row */}
          <div className="public-navbar-mobile-actions d-flex d-lg-none align-items-center gap-2 ms-auto flex-shrink-0">
            {showLangToggle && (
              <button
                type="button"
                className="public-navbar-lang-btn"
                onClick={toggleLang}
                aria-label="Toggle Language"
                title="Toggle English / தமிழ்"
              >
                <span className="public-navbar-lang-text">{t('switchLangText')}</span>
              </button>
            )}

            {showNavLinks && (
              <BNavbar.Toggle
                aria-controls="public-navbar-nav"
                className="public-navbar-toggler"
              />
            )}
          </div>
        </div>

        {/* Collapsible Nav Links & Desktop Actions */}
        <BNavbar.Collapse id="public-navbar-nav" className="public-navbar-collapse">
          {showNavLinks && (
            <Nav className="mx-auto my-2 my-lg-0 gap-lg-2">
              <Nav.Link href="#home" className="fw-semibold px-2.5 py-1.5 text-secondary">
                {t('navHome')}
              </Nav.Link>
              <Nav.Link href="#how-it-works" className="fw-semibold px-2.5 py-1.5 text-secondary">
                {t('navHowItWorks')}
              </Nav.Link>
              <Nav.Link href="#about" className="fw-semibold px-2.5 py-1.5 text-secondary">
                {t('navAbout')}
              </Nav.Link>
              <Nav.Link href="#contact" className="fw-semibold px-2.5 py-1.5 text-secondary">
                {t('navContact')}
              </Nav.Link>
            </Nav>
          )}

          {/* Desktop-Only Actions: Language button + Login button */}
          <div className="d-none d-lg-flex align-items-center gap-2 ms-lg-auto">
            {showLangToggle && (
              <button
                type="button"
                className="public-navbar-lang-btn"
                onClick={toggleLang}
                aria-label="Toggle Language"
                title="Toggle English / தமிழ்"
              >
                <span className="public-navbar-lang-text">{t('switchLangText')}</span>
              </button>
            )}

            {showAuthButton && (
              <button
                type="button"
                className="btn btn-primary btn-sm d-inline-flex align-items-center justify-content-center gap-1.5 rounded-pill px-3.5 py-1.5 fw-semibold shadow-sm"
                onClick={handleAuthClick}
              >
                <LogIn size={15} />
                <span>{t('btnLogin')}</span>
              </button>
            )}
          </div>

          {/* Note: Mobile view navbar login button removed as requested */}
        </BNavbar.Collapse>
      </Container>
    </BNavbar>
  );
}

export { PublicNavbar, PublicNavbar as Navbar };
