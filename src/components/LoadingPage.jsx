// What this file does: Comprehensive agricultural loading screen with live telemetry status and network delay handling.
// Viva Note: Displays a branded agricultural loader while fetching remote harvest/order data, with automatic delay detection (>2.5s) and offline fallback actions (>7.5s).

import React, { useState, useEffect } from 'react';
import {
  Sprout,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Clock
} from 'lucide-react';
import './LoadingPage.css';
import { useT } from '../hooks/useT';

/**
 * LoadingPage Component
 *
 * @param {Object} props
 * @param {boolean} [props.fullScreen=false] - Whether to render as fixed full-viewport overlay or embedded inside container.
 * @param {string} [props.message] - Custom primary loading headline.
 * @param {string} [props.subtitle] - Custom secondary descriptive subtitle.
 * @param {string} [props.badgeText] - Pill badge text above the title.
 * @param {boolean} [props.showSteps=true] - Whether to render the 3-step live pipeline track.
 * @param {number} [props.delayThreshold=2500] - Milliseconds before showing the delay notice ("Taking longer than usual?").
 * @param {number} [props.timeoutThreshold=7500] - Milliseconds before offering retry and continue offline actions.
 * @param {Function} [props.onRetry] - Optional callback when user clicks "Refresh Data".
 * @param {Function} [props.onContinueOffline] - Optional callback when user clicks "Continue Offline".
 * @param {string} [props.minHeight] - Custom minHeight for embedded mode.
 * @param {string} [props.className] - Additional CSS class names.
 */
export default function LoadingPage({
  fullScreen = false,
  message,
  subtitle,
  badgeText,
  showSteps = true,
  delayThreshold = 2500,
  timeoutThreshold = 7500,
  onRetry,
  onContinueOffline,
  minHeight,
  className = ''
}) {
  const { t } = useT('loadingScreen');

  const [isDelayed, setIsDelayed] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Monitor loading duration to gracefully notify user of network delay
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setIsDelayed(true);
    }, delayThreshold);

    const timeoutTimer = setTimeout(() => {
      setIsTimedOut(true);
    }, timeoutThreshold);

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(timeoutTimer);
    };
  }, [delayThreshold, timeoutThreshold]);

  const handleDefaultRetry = () => {
    if (typeof onRetry === 'function') {
      onRetry();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleDefaultOffline = () => {
    if (typeof onContinueOffline === 'function') {
      onContinueOffline();
    }
  };

  const resolvedTitle = message || t('title') || 'Fetching Farm Produce Data';
  const resolvedSubtitle =
    subtitle ||
    t('subtitle') ||
    'Connecting to Tamil Nadu regional hubs (Dindigul • Madurai • Theni)...';
  const resolvedBadge = badgeText || t('badge') || 'Live Hub Telemetry';

  return (
    <div
      className={`nu-loading-page-host ${
        fullScreen ? 'is-fullscreen' : 'is-embedded'
      } ${className}`}
      style={!fullScreen && minHeight ? { minHeight } : undefined}
      role="status"
      aria-live="polite"
    >
      <div className="nu-loading-card">
        {/* Animated Sprout Emblem & Orbit Rings */}
        <div className="nu-spinner-wrapper" aria-hidden="true">
          <div className="nu-spinner-aura" />
          <div className="nu-spinner-ring" />
          <div className="nu-spinner-icon-box">
            <Sprout size={30} strokeWidth={2.4} />
          </div>
        </div>

        {/* Live Telemetry Pill Badge */}
        <div className="nu-loading-badge">
          <span className="nu-live-dot" />
          <span>{resolvedBadge}</span>
        </div>

        {/* Primary Headlines */}
        <h2 className="nu-loading-title">{resolvedTitle}</h2>
        <p className="nu-loading-subtitle">{resolvedSubtitle}</p>

        {/* Animated Shimmer Progress Track */}
        <div className="nu-progress-track" aria-hidden="true">
          <div className="nu-progress-bar" />
        </div>

        {/* Multi-Step Pipeline Telemetry */}
        {showSteps && (
          <div className="nu-loading-steps">
            <div className="nu-step-item is-done">
              <span className="nu-step-icon done-icon">
                <CheckCircle2 size={16} />
              </span>
              <span>
                {t('step1') || 'Connected to regional agricultural hubs'}
              </span>
            </div>

            <div className="nu-step-item is-active">
              <span className="nu-step-icon active-icon">
                <RefreshCw size={14} />
              </span>
              <span>
                {t('step2') ||
                  'Fetching live crop listings & verified harvest stock'}
              </span>
            </div>

            <div className="nu-step-item">
              <span className="nu-step-icon pending-icon">
                <Clock size={15} />
              </span>
              <span>
                {t('step3') ||
                  'Synchronizing order status & EV cargo telemetry'}
              </span>
            </div>
          </div>
        )}

        {/* Gentle Notice Shown Only If Delay Occurs (> 2.5s) */}
        {isDelayed && (
          <div className="nu-delay-alert">
            <AlertCircle size={18} className="nu-delay-icon" />
            <div>
              <strong>Notice: </strong>
              <span>
                {t('delayNotice') ||
                  'Taking a little longer than usual? Loading live farm consignments directly from regional servers. Please wait a moment...'}
              </span>
            </div>
          </div>
        )}

        {/* Action Group Shown If Timeout Occurs (> 7.5s) */}
        {isTimedOut && (
          <div className="nu-action-group">
            <div className="nu-timeout-hint">
              {t('stillLoadingNotice') ||
                'Network response is delayed. You can refresh or continue using cached offline farm data.'}
            </div>
            <div className="nu-btn-row">
              <button
                type="button"
                className="nu-btn-retry"
                onClick={handleDefaultRetry}
              >
                <RefreshCw size={15} />
                <span>{t('retryBtn') || 'Refresh Data'}</span>
              </button>

              {onContinueOffline && (
                <button
                  type="button"
                  className="nu-btn-offline"
                  onClick={handleDefaultOffline}
                >
                  <span>{t('offlineBtn') || 'Continue Offline'}</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

