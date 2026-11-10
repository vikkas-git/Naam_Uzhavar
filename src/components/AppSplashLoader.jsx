// What this file does: App entrance splash and logo loader screen that displays before the Home Page opens.
// Viva Note: Introduces the Naam Uzhavar brand identity with vibrant orbital animations surrounding the official logo.

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import './AppSplashLoader.css';
import { useT } from '../hooks/useT';

/**
 * AppSplashLoader Component
 *
 * Cinematic brand entrance with multi-layered orbital animations encircling
 * the central Naam Uzhavar logo emblem.
 *
 * Features:
 * - High-clarity, prominent, perfectly-framed official brand emblem display.
 * - Dynamic orbital rings (clockwise and counter-clockwise gyroscopic rotation).
 * - Concentric outward-expanding energy ripples and radiant solar aurora.
 * - Orbiting luminous celestial beads with glowing light trails.
 * - Clean editorial typography without clutter.
 * - Smooth exit dissolution into the Home Page.
 *
 * @param {Object} props
 * @param {number} [props.duration=2000] - Duration in ms before initiating transition to the Home Page.
 * @param {Function} [props.onStartExit] - Callback invoked when the exit transition initiates.
 * @param {Function} props.onFinish - Callback invoked when the intro and dissolution complete.
 */
export default function AppSplashLoader({ duration = 2000, onStartExit, onFinish }) {
  const { lang } = useT('splash');
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = useCallback(() => {
    setIsExiting(true);
    if (typeof onStartExit === 'function') {
      onStartExit();
    }
    setTimeout(() => {
      if (typeof onFinish === 'function') {
        onFinish();
      }
    }, 600); // 600ms silky optical dissolve
  }, [onStartExit, onFinish]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleExit();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleExit]);

  return (
    <div
      className={`nu-splash-overlay ${isExiting ? 'is-exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Naam Uzhavar Loading Screen"
    >
      {/* 1. Multi-Tone Ambient Respiration Auras */}
      <div className="nu-splash-ambient-aura primary-aura" aria-hidden="true" />
      <div className="nu-splash-ambient-aura secondary-aura" aria-hidden="true" />

      <div className="nu-splash-container">
        {/* 2. Emblem Stage with Multi-Ring Orbital Animations Around Logo */}
        <div className="nu-splash-logo-box">
          {/* Ambient Solar Aurora Glow */}
          <div className="nu-splash-aura-glow" aria-hidden="true" />

          {/* Outward Expanding Energy Ripples */}
          <div className="nu-splash-ripple-wave nu-ripple-1" aria-hidden="true" />
          <div className="nu-splash-ripple-wave nu-ripple-2" aria-hidden="true" />
          <div className="nu-splash-ripple-wave nu-ripple-3" aria-hidden="true" />

          {/* Outer Clockwise Orbit Ring with Dual Luminous Beads */}
          <div className="nu-splash-orbit-outer" aria-hidden="true">
            <span className="nu-splash-orbit-bead bead-primary" aria-hidden="true" />
            <span className="nu-splash-orbit-bead bead-amber" aria-hidden="true" />
          </div>

          {/* Middle Counter-Clockwise Dashed Gyro Ring with Emerald Node */}
          <div className="nu-splash-orbit-mid" aria-hidden="true">
            <span className="nu-splash-orbit-bead bead-emerald" aria-hidden="true" />
          </div>

          {/* Inner Cardinal Compass Nodes Ring */}
          <div className="nu-splash-cardinal-ring" aria-hidden="true">
            <span className="nu-cardinal-dot dot-north" aria-hidden="true" />
            <span className="nu-cardinal-dot dot-east" aria-hidden="true" />
            <span className="nu-cardinal-dot dot-south" aria-hidden="true" />
            <span className="nu-cardinal-dot dot-west" aria-hidden="true" />
          </div>

          {/* High-Definition Logo Circle */}
          <div className="nu-splash-logo-circle">
            <img
              src="/logo.png"
              alt="Naam Uzhavar Official Emblem"
              className="nu-splash-logo-img"
              onError={(e) => {
                e.currentTarget.src = '/logo.png';
              }}
            />
          </div>
        </div>

        {/* 3. Eyebrow Tag: Region & Digital Mission */}
        <div className="nu-splash-badge">
          <Sparkles size={13} className="nu-splash-sparkle" />
          <span>
            {lang === 'ta'
              ? 'தமிழ்நாடு • நேரடி வேளாண் சந்தை'
              : 'Direct Agri-Marketplace • Tamil Nadu'}
          </span>
        </div>

        {/* 4. Sculpted Editorial Brand Typography */}
        <h1 className="nu-splash-title">Naam Uzhavar</h1>
        <h2 className="nu-splash-tamil-title">நாம் உழவர்</h2>

        <p className="nu-splash-subtitle">
          {lang === 'ta'
            ? 'விவசாயிகள் • வாங்குவோர் • ஓட்டுநர்கள் — இடைத்தரகர் இல்லாத வணிகம்'
            : 'Farmers • Buyers • Drivers — Zero Middlemen'}
        </p>
      </div>
    </div>
  );
}
