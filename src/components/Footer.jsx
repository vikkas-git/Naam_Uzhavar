// What this file does: Reusable site footer component with platform information, links, and contact details.

import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useT } from '../hooks/useT';

/**
 * Reusable Site Footer Component (built with react-bootstrap Container, Row, Col)
 * Extracted with bilingual support via useT('common').
 */
export default function Footer({ className = '' }) {
  const { t } = useT('common');

  return (
    <footer id="contact" className={`bg-dark text-white pt-5 pb-4 mt-auto border-top border-dark-subtle ${className}`} style={{ backgroundColor: '#052e16' }}>
      <Container fluid="xl" className="px-3 px-md-4">
        <Row className="g-4 mb-5">
          {/* Column 1: Brand Info */}
          <Col xs={12} lg={5} className="pe-lg-5">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                if (typeof window !== 'undefined') {
                  if (window.location.hash) {
                    window.history.pushState(null, '', '/');
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="d-flex align-items-center gap-2.5 mb-3 text-decoration-none text-white"
              title="Go to Home page"
              style={{ cursor: 'pointer' }}
            >
              <img
                src="/logo.png"
                alt="Logo"
                width={42}
                height={42}
                className="rounded-circle border border-2 border-success object-fit-cover shadow-sm flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=100&auto=format&fit=crop&q=80';
                }}
              />
              <div className="d-flex flex-column">
                <span className="fw-bolder fs-4 text-white lh-sm" style={{ letterSpacing: '-0.3px' }}>
                  {t('appName')}
                </span>
                <span className="fw-bold text-success" style={{ fontSize: '0.74rem' }}>
                  {t('appSubtitle')}
                </span>
              </div>
            </a>

            <p className="text-white-50 mb-0 small lh-base" style={{ maxWidth: 420 }}>
              {t('footerDesc')}
            </p>
          </Col>

          {/* Column 2: Quick Links */}
          <Col xs={6} lg={3}>
            <h5 className="fw-bold text-white mb-3 fs-6 text-uppercase" style={{ letterSpacing: '0.5px' }}>
              {t('quickLinksTitle')}
            </h5>
            <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
              <li>
                <a href="#home" className="text-white-50 text-decoration-none small hover-text-white transition-colors">
                  {t('navHome')}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-white-50 text-decoration-none small hover-text-white transition-colors">
                  {t('navHowItWorks')}
                </a>
              </li>
              <li>
                <a href="#about" className="text-white-50 text-decoration-none small hover-text-white transition-colors">
                  {t('navAbout')}
                </a>
              </li>
              <li>
                <a href="#contact" className="text-white-50 text-decoration-none small hover-text-white transition-colors">
                  {t('navContact')}
                </a>
              </li>
            </ul>
          </Col>

          {/* Column 3: Contact Info */}
          <Col xs={12} sm={6} lg={4}>
            <h5 className="fw-bold text-white mb-3 fs-6 text-uppercase" style={{ letterSpacing: '0.5px' }}>
              {t('contactTitle')}
            </h5>
            <ul className="list-unstyled d-flex flex-column gap-2.5 mb-3 text-white-50 small">
              <li className="d-flex align-items-center gap-2">
                <Phone size={16} className="text-success flex-shrink-0" />
                <span>{t('helplineLabel')}</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <Mail size={16} className="text-success flex-shrink-0" />
                <span>{t('emailLabel')}</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <MapPin size={16} className="text-success flex-shrink-0" />
                <span>{t('addressLabel')}</span>
              </li>
            </ul>

            <div className="pt-2">
              <div className="small fw-semibold text-white-50 mb-2">
                {t('followUs')}
              </div>
              <div className="d-flex gap-2">
                <a
                  href="#contact"
                  className="btn btn-sm btn-outline-secondary rounded-circle p-0 d-inline-flex align-items-center justify-content-center text-decoration-none text-white border-secondary-subtle"
                  style={{ width: 34, height: 34 }}
                  title="WhatsApp"
                  aria-label="WhatsApp"
                >
                  💬
                </a>
                <a
                  href="#contact"
                  className="btn btn-sm btn-outline-secondary rounded-circle p-0 d-inline-flex align-items-center justify-content-center text-decoration-none text-white border-secondary-subtle"
                  style={{ width: 34, height: 34 }}
                  title="YouTube"
                  aria-label="YouTube"
                >
                  ▶️
                </a>
                <a
                  href="#contact"
                  className="btn btn-sm btn-outline-secondary rounded-circle p-0 d-inline-flex align-items-center justify-content-center text-decoration-none text-white border-secondary-subtle"
                  style={{ width: 34, height: 34 }}
                  title="Facebook"
                  aria-label="Facebook"
                >
                  f
                </a>
                <a
                  href="#contact"
                  className="btn btn-sm btn-outline-secondary rounded-circle p-0 d-inline-flex align-items-center justify-content-center text-decoration-none text-white border-secondary-subtle"
                  style={{ width: 34, height: 34 }}
                  title="Twitter"
                  aria-label="Twitter"
                >
                  𝕏
                </a>
              </div>
            </div>
          </Col>
        </Row>

        {/* Footer Bottom Row */}
        <div className="border-top border-secondary border-opacity-25 pt-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 small text-white-50">
          <div>{t('copyright')}</div>
          <div className="d-flex align-items-center gap-3">
            <a href="#home" className="text-white-50 text-decoration-none hover-text-white">
              {t('privacy')}
            </a>
            <span>•</span>
            <a href="#home" className="text-white-50 text-decoration-none hover-text-white">
              {t('terms')}
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
