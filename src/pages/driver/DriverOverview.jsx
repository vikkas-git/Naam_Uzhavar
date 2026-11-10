// What this file does: Driver Dispatch Terminal - Active In-Cab Cockpit & Route Navigator.
// User-friendly real-time dispatch dashboard with live route corridor, tactile milestone advancement,
// crate inspection verification, and 4-digit PIN handover handshake.

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Navigation,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Zap,
  KeyRound,
  ShieldCheck,
  Clock,
  RotateCcw,
  Lock,
  X,
  Check,
  Layers,
  BatteryCharging,
  DollarSign,
  User,
  Sparkles,
  Building2,
  Store,
  CheckCheck,
  CheckSquare,
  RefreshCw,
  Power,
  PackageCheck,
  ExternalLink
} from 'lucide-react';
import { useDriver } from '../../context/DriverContext';
import { ROUTES } from '../../routes';
import SectionHeader from '../../components/SectionHeader';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { DashboardSkeleton } from '../../components/Skeleton';
import { formatOrderStatus } from '../../utils/helpers';
import './DriverDashboard.css';

export default function DriverOverview() {
  const navigate = useNavigate();

  const {
    profile,
    vehicle,
    activeTrip,
    trips,
    selectedTripId,
    selectActiveTrip,
    dutyStatus,
    toggleDutyStatus,
    metrics,
    assignedHub,
    advanceTripMilestone,
    completeCrateInspection,
    verifyDeliveryPin,
    isDataLoading,
    lang
  } = useDriver();

  if (isDataLoading && (!trips || trips.length === 0)) {
    return (
      <div className="farmer-view-container animate-fade-in">
        <DashboardSkeleton />
      </div>
    );
  }

  // Active ongoing dispatches only (strictly excluding DELIVERED)
  const activeDispatches = useMemo(() => {
    return (trips || []).filter(
      (t) => t && String(t.status || '').toUpperCase() !== 'DELIVERED'
    );
  }, [trips]);

  // Modals
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSubmitting, setPinSubmitting] = useState(false);

  const [crateModalOpen, setCrateModalOpen] = useState(false);
  const [crateCheckCount, setCrateCheckCount] = useState(true);
  const [crateCheckQuality, setCrateCheckQuality] = useState(true);
  const [crateCheckSeal, setCrateCheckSeal] = useState(true);

  const [gpsRefreshing, setGpsRefreshing] = useState(false);

  const driverName = profile?.name || 'Kumar M.';
  const vehicleName = vehicle?.model || 'Tata Ace EV Cargo';
  const vehicleNo = vehicle?.vehicleNumber || 'TN 57 AB 1234';

  // Handle PIN Submission
  const handlePinSubmit = (e) => {
    if (e) e.preventDefault();
    setPinError('');
    if (!pinValue || pinValue.trim().length !== 4) {
      setPinError(lang === 'ta' ? '4-இலக்க பின்னை உள்ளிடவும்.' : 'Please enter all 4 digits.');
      return;
    }

    setPinSubmitting(true);
    setTimeout(() => {
      const res = verifyDeliveryPin(activeTrip?.tripId, pinValue.trim());
      setPinSubmitting(false);
      if (res.success) {
        setPinModalOpen(false);
        setPinValue('');
      } else {
        setPinError(res.message);
      }
    }, 350);
  };

  // Handle Crate Inspection Completion
  const handleConfirmCrates = () => {
    completeCrateInspection(activeTrip?.tripId, {
      cratesVerified: crateCheckCount,
      qualityChecked: crateCheckQuality,
      sealApplied: crateCheckSeal
    });
    setCrateModalOpen(false);
  };

  // Helper for GPS refresh animation
  const handleRefreshGps = () => {
    setGpsRefreshing(true);
    setTimeout(() => {
      setGpsRefreshing(false);
    }, 600);
  };

  // Determine stage index for stepper and animated map vehicle position
  // 0: READY_FOR_PICKUP / CONFIRMED
  // 1: DRIVER_EN_ROUTE_PICKUP
  // 2: PICKED_UP (Loaded at Farm)
  // 3: IN_TRANSIT (Highway Corridor)
  // 4: DELIVERED (Verified by PIN)
  const currentStageIndex = useMemo(() => {
    if (!activeTrip) return 0;
    const status = activeTrip.status;
    if (status === 'DELIVERED') return 4;
    if (status === 'IN_TRANSIT') return 3;
    if (status === 'PICKED_UP') return 2;
    if (status === 'DRIVER_EN_ROUTE_PICKUP') return 1;
    return 0;
  }, [activeTrip]);

  // Stepper definition matching Buyer Track.jsx 4-stage architecture
  const trackingSteps = useMemo(() => {
    return [
      {
        id: 'farm_pickup',
        title: lang === 'ta' ? 'பண்ணை ஏற்றுதல்' : 'Farm Pickup',
        subtitle: lang === 'ta' ? 'கிணத்துக்கடவு, பொள்ளாச்சி' : 'Kinathukadavu, Pollachi',
        icon: Store
      },
      {
        id: 'ev_loaded',
        title: lang === 'ta' ? 'சரக்கு ஏற்றப்பட்டது' : 'Produce Loaded',
        subtitle: lang === 'ta' ? 'டாடா ஏஸ் EV சரக்கு' : 'Tata Ace EV Cargo',
        icon: Layers
      },
      {
        id: 'in_transit',
        title: lang === 'ta' ? 'நெடுஞ்சாலை வழி' : 'In Transit',
        subtitle: lang === 'ta' ? 'NH-83 வழித்தடம்' : 'NH-83 Corridor',
        icon: Truck
      },
      {
        id: 'delivered',
        title: lang === 'ta' ? 'விநியோகம் & பின்' : 'Handover & PIN',
        subtitle: lang === 'ta' ? 'காந்திபுரம், கோவை' : 'Gandhipuram Dock',
        icon: CheckCircle2
      }
    ];
  }, [lang]);

  // Map vehicle marker position based on stage index
  const vehicleCoordinates = useMemo(() => {
    switch (currentStageIndex) {
      case 0:
        return { x: 140, y: 100, label: 'At Farm Gate • Kinathukadavu' };
      case 1:
        return { x: 230, y: 140, label: 'En Route to Farm • 35 km/h' };
      case 2:
        return { x: 330, y: 210, label: 'Produce Loaded in EV • Inspected' };
      case 3:
        return { x: 500, y: 300, label: 'Highway In Transit • 42 km/h' };
      case 4:
      default:
        return { x: 660, y: 380, label: 'Delivered at Buyer Bay 1 • Verified' };
    }
  }, [currentStageIndex]);

  // Google Maps navigation links
  const farmMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    activeTrip?.pickup?.address || 'Kinathukadavu Pollachi'
  )}`;
  const buyerMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    activeTrip?.dropoff?.address || 'Gandhipuram Coimbatore'
  )}`;

  return (
    <div className="buyer-view-container animate-fade-in">
      {/* 0. HEADER WITH DUTY TOGGLE & RESET */}
      <SectionHeader
        className="buyer-view-header driver-view-header"
        title={
          <span>
            {lang === 'ta' ? 'வணக்கம், ' : 'Welcome back, '}
            <span style={{ color: '#b45309' }}>{driverName}</span>
          </span>
        }
        subtitle={
          lang === 'ta'
            ? `${vehicleName} (${vehicleNo}) • ${assignedHub} நேரலை சரக்கு வழித்தடம்`
            : `${vehicleName} (${vehicleNo}) • ${assignedHub} — Active Consignment Corridor`
        }
        action={
          <div className="d-flex align-items-center gap-2">
            {/* Live Duty Switch Button */}
            <button
              type="button"
              className={`driver-duty-toggle-btn ${dutyStatus === 'ON_DUTY' ? 'on-duty' : 'off-duty'}`}
              onClick={toggleDutyStatus}
              title={dutyStatus === 'ON_DUTY' ? 'Switch to Off Duty' : 'Go On Duty'}
            >
              <span className="duty-dot" />
              <span>
                {dutyStatus === 'ON_DUTY'
                  ? (lang === 'ta' ? 'பணியில் உள்ளார் (On Duty)' : 'On Duty')
                  : (lang === 'ta' ? 'இடைவேளை (Off Duty)' : 'Off Duty')}
              </span>
            </button>
          </div>
        }
      />

      {/* ====================================================================
          OFFLINE BANNER (When driver is OFF_DUTY)
          ==================================================================== */}
      {dutyStatus === 'OFF_DUTY' ? (
        <div className="driver-offline-card animate-fade-in">
          <div className="driver-offline-icon">
            <Power size={32} />
          </div>
          <h3 className="fw-bold text-dark mb-2" style={{ fontSize: '1.3rem' }}>
            {lang === 'ta' ? 'நீங்கள் தற்போது பணியில் இல்லை' : 'You are currently Offline'}
          </h3>
          <p className="text-muted mb-4" style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
            {lang === 'ta'
              ? 'விவசாயிகளிடமிருந்து புதிய அறுவடை சரக்குகளைப் பெற மற்றும் வழிசெலுத்தலைத் தொடங்க உங்கள் நிலையை ஆன்லைனுக்கு மாற்றவும்.'
              : 'Switch to On Duty to start receiving farm gate harvest dispatches, GPS navigation routes, and earning haulage pay.'}
          </p>
          <Button
            type="button"
            variant="primary"
            style={{ minHeight: '48px', padding: '0 24px', backgroundColor: '#16a34a', borderColor: '#16a34a' }}
            onClick={toggleDutyStatus}
          >
            <Zap size={16} />
            <span>{lang === 'ta' ? 'ஆன்லைனுக்கு செல் (Go On Duty)' : 'Go Online & Receive Dispatches'}</span>
          </Button>
        </div>
      ) : (
        <>
          {/* ==================================================================
              1. SUMMARY METRIC CARDS (Exact match to buyer-summary-row / buyer-summary-card)
              ================================================================== */}
          <div className="buyer-summary-row">
            {/* Metric 1: Active Dispatch */}
            <div className="buyer-summary-card">
              <div className="buyer-summary-number-wrap">
                <span className="buyer-summary-number font-mono" style={{ color: '#b45309' }}>
                  {activeTrip && activeTrip.status !== 'DELIVERED' ? '1' : '0'}
                </span>
                <span className="buyer-summary-trend" style={{ background: '#fef3c7', color: '#92400e' }}>
                  <Truck size={14} /> {lang === 'ta' ? 'செயலில்' : 'Active'}
                </span>
              </div>
              <span className="buyer-summary-label">
                {lang === 'ta' ? 'நடப்பு விநியோகம்' : 'Active Delivery'}
              </span>
              <span className="buyer-summary-hint">
                {activeTrip ? `${activeTrip.tripId} • ${activeTrip.cropName}` : 'No active trip assigned'}
              </span>
            </div>

            {/* Metric 2: Today's Earnings */}
            <div
              className="buyer-summary-card"
              onClick={() => navigate(ROUTES.DRIVER_DASHBOARD_EARNINGS)}
              style={{ cursor: 'pointer' }}
            >
              <div className="buyer-summary-number-wrap">
                <span className="buyer-summary-number font-mono" style={{ color: '#15803d' }}>
                  ₹{metrics?.todayEarnings?.toLocaleString('en-IN') || '1,424'}
                </span>
                <span className="buyer-summary-trend green">
                  <Zap size={14} /> {lang === 'ta' ? 'இன்றைய வருவாய்' : 'Earned'}
                </span>
              </div>
              <span className="buyer-summary-label">
                {lang === 'ta' ? 'இன்றைய வருவாய்' : "Today's Earnings"}
              </span>
              <span className="buyer-summary-hint">
                {metrics?.todayTripsCount || 2} {lang === 'ta' ? 'பயணங்கள் முடிந்தது' : 'Trips Completed'}
              </span>
            </div>

            {/* Metric 3: EV Battery Range */}
            <div className="buyer-summary-card">
              <div className="buyer-summary-number-wrap">
                <span className="buyer-summary-number font-mono">
                  {vehicle?.currentBatteryPct || 82}%
                </span>
                <span className="buyer-summary-trend green">
                  ⚡ {vehicle?.estimatedRangeKm || 68} km
                </span>
              </div>
              <span className="buyer-summary-label">
                {lang === 'ta' ? 'EV மின்கல இருப்பு' : 'EV Battery & Range'}
              </span>
              <span className="buyer-summary-hint">
                {assignedHub} • Fast Charger
              </span>
            </div>

            {/* Metric 4: All-time Dispatches */}
            <div className="buyer-summary-card">
              <div className="buyer-summary-number-wrap">
                <span className="buyer-summary-number font-mono">
                  {metrics?.totalDispatches || 148}
                </span>
                <span className="buyer-summary-trend green">
                  ★ {metrics?.rating || 4.92}
                </span>
              </div>
              <span className="buyer-summary-label">
                {lang === 'ta' ? 'மொத்த விநியோகங்கள்' : 'Total Deliveries'}
              </span>
              <span className="buyer-summary-hint">
                {metrics?.onTimeRatePct || 99.1}% {lang === 'ta' ? 'நேரத்தவறாமை' : 'On-time delivery'}
              </span>
            </div>
          </div>

          {/* ==================================================================
              2. MULTI-TRIP SELECTOR ROW (Active ongoing dispatches only)
              ================================================================== */}
          {activeDispatches.length > 1 && (
            <div className="driver-trip-selector-row">
              <span className="text-muted fw-bold small me-1">
                {lang === 'ta' ? 'பயணங்கள்:' : 'Dispatches:'}
              </span>
              {activeDispatches.map((t) => {
                const isSelected = t.tripId === activeTrip?.tripId;
                return (
                  <button
                    key={t.tripId}
                    type="button"
                    className={`driver-trip-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => selectActiveTrip(t.tripId)}
                  >
                    <span>#{t.tripId}</span>
                    <span className="fw-semibold">{(t?.cropName || 'Produce').split('(')[0]}</span>
                    <span className="chip-badge">{formatOrderStatus(t.status)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ==================================================================
              3. 4-STAGE MILESTONE STEPPER (Exact match to buyer-tracking-stepper-card)
              ================================================================== */}
          <div className="buyer-tracking-stepper-card mb-4">
            <div className="buyer-stepper-inner">
              {trackingSteps.map((step, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isActive = idx === currentStageIndex;
                const stepClass = isCompleted ? 'completed' : isActive ? 'active' : 'pending';
                const StepIcon = step.icon;

                return (
                  <React.Fragment key={step.id}>
                    <div className={`buyer-step ${stepClass}`}>
                      <div
                        className={`buyer-step-circle ${isActive ? 'pulse-circle' : ''}`}
                        style={
                          isCompleted
                            ? { backgroundColor: '#15803d', color: '#ffffff' }
                            : isActive
                            ? { backgroundColor: '#b45309', color: '#ffffff' }
                            : undefined
                        }
                      >
                        {isCompleted ? <Check size={14} /> : <StepIcon size={14} />}
                      </div>
                      <span
                        className={`buyer-step-title ${isActive ? 'active' : ''}`}
                        style={isActive ? { color: '#b45309', fontWeight: 700 } : undefined}
                      >
                        {step.title}
                      </span>
                      <span className="buyer-step-time">{step.subtitle}</span>
                    </div>
                    {idx < trackingSteps.length - 1 && (
                        <div
                        className={`buyer-step-line ${
                          idx < currentStageIndex
                            ? 'completed'
                            : idx === currentStageIndex
                            ? 'active'
                            : 'pending'
                        }`}
                        style={
                          idx < currentStageIndex
                            ? { backgroundColor: '#15803d' }
                            : idx === currentStageIndex
                            ? { background: 'linear-gradient(90deg, #15803d 0%, #b45309 100%)' }
                            : undefined
                        }
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ==================================================================
              4. SPLIT LIVE LOGISTICS MAP & IN-CAB TELEMETRY SIDEBAR
              ================================================================== */}
          {activeTrip ? (
            <div className="buyer-map-tracking-layout">
              {/* ==============================================================
                  LEFT: LIVE VECTOR LOGISTICS MAP & WAYPOINT STATIONS
                  ============================================================== */}
              <div className="driver-map-main-column">
                <div className="buyer-map-container">
                {/* Header Overlay: Legend + Live Speed Pill */}
                <div className="buyer-map-header-overlay">
                  <div className="buyer-map-legend">
                    <span className="legend-item">
                      <span className="dot hub" style={{ backgroundColor: '#16a34a' }} />
                      {lang === 'ta' ? 'பண்ணை ஏற்றுமிடம்' : 'Farm Gate Origin'}
                    </span>
                    <span className="legend-item">
                      <span className="dot vehicle" style={{ backgroundColor: '#b45309' }} />
                      {lang === 'ta' ? 'டாடா ஏஸ் EV சரக்கு' : 'EV Cargo Vehicle'}
                    </span>
                    <span className="legend-item">
                      <span className="dot destination" style={{ backgroundColor: '#b42318' }} />
                      {lang === 'ta' ? 'வாங்குபவர் முனையம்' : 'Buyer Receiving Bay'}
                    </span>
                  </div>
                  <div className="buyer-map-speed-pill" style={{ color: '#b45309', borderColor: '#fed7aa', backgroundColor: '#fefce8' }}>
                    <Zap size={14} color="#b45309" />{' '}
                    <span>
                      {activeTrip.status === 'DELIVERED'
                        ? (lang === 'ta' ? 'விநியோகம் முடிந்தது • பேட்டரி 80%' : 'Delivered • 80% Battery')
                        : (lang === 'ta' ? 'வேகம் 42 km/h • பேட்டரி 82%' : 'Speed 42 km/h • Battery 82%')}
                    </span>
                  </div>
                </div>

                {/* SVG Vector Map of Logistics Corridor */}
                <div className="buyer-svg-map-wrapper">
                  <svg
                    viewBox="0 0 800 480"
                    className="buyer-logistics-svg"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <linearGradient id="driverRouteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#16a34a" />
                        <stop offset="50%" stopColor="#b45309" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                      <filter id="driverShadowFilter" x="-10%" y="-10%" width="130%" height="130%">
                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.18" />
                      </filter>
                    </defs>

                    {/* Map Terrain Grid and Geography Lines */}
                    <rect width="800" height="480" fill="#f8fafc" rx="14" />

                    {/* Stylized Contour & River Features */}
                    <path
                      d="M0,180 Q220,160 400,240 T800,220"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="38"
                    />
                    <path
                      d="M0,320 Q200,340 450,290 T800,380"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="24"
                    />

                    {/* Secondary Connecting Arterials */}
                    <path d="M120,40 L180,440" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="4 4" />
                    <path d="M680,30 L640,430" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="4 4" />
                    <path d="M30,300 L760,110" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />

                    {/* Primary Highway Corridor */}
                    <path
                      id="driverHighwayCorridor"
                      d="M 140 100 C 260 120, 310 240, 430 250 S 580 340, 660 380"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />

                    {/* Active Route Delivery Polyline with pulsing dashes */}
                    <path
                      d="M 140 100 C 260 120, 310 240, 430 250 S 580 340, 660 380"
                      fill="none"
                      stroke="url(#driverRouteGradient)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      className="buyer-animated-route-path"
                    />

                    {/* Waypoint 1: Farm Gate Origin (Kinathukadavu, Pollachi) */}
                    <g transform="translate(140, 100)">
                      <circle r="20" fill="rgba(22, 163, 74, 0.18)" />
                      <circle r="11" fill="#16a34a" />
                      <circle r="4" fill="#ffffff" />
                      <text x="0" y="-24" textAnchor="middle" className="svg-node-label font-bold" fill="#0f172a" fontSize="13">
                        {activeTrip.pickup?.farmName || 'Pollachi Farm Gate'}
                      </text>
                      <text x="0" y="-10" textAnchor="middle" className="svg-node-sub" fill="#64748b" fontSize="11">
                        SF No. 142/2 • Kinathukadavu
                      </text>
                    </g>

                    {/* Waypoint 2: Intermediate Checkpoint (Highway Weighbridge) */}
                    <g transform="translate(320, 200)">
                      <circle r="6" fill="#64748b" />
                      <text x="12" y="4" className="svg-node-sub" fill="#475569" fontSize="11">
                        Highway Weighbridge (Cleared)
                      </text>
                    </g>

                    {/* Waypoint 3: Bypass Highway Junction */}
                    <g transform="translate(460, 260)">
                      <circle r="6" fill="#64748b" />
                      <text x="12" y="4" className="svg-node-sub" fill="#475569" fontSize="11">
                        City Outer Ring Junction
                      </text>
                    </g>

                    {/* Waypoint 4: Commercial Buyer Receiving Bay (Destination) */}
                    <g transform="translate(660, 380)">
                      <circle r="22" fill="rgba(180, 35, 24, 0.15)" />
                      <circle r="11" fill="#b42318" />
                      <circle r="4" fill="#ffffff" />
                      <text x="0" y="32" textAnchor="middle" className="svg-node-label font-bold" fill="#0f172a" fontSize="13">
                        {activeTrip.dropoff?.buyerName || 'Buyer Receiving Dock'}
                      </text>
                      <text x="0" y="46" textAnchor="middle" className="svg-node-sub" fill="#64748b" fontSize="11">
                        {activeTrip.dropoff?.location || 'Kitchen Gate 1'}
                      </text>
                    </g>

                    {/* Moving Delivery EV Vehicle Marker (Position adapts dynamically) */}
                    <g
                      transform={`translate(${vehicleCoordinates.x}, ${vehicleCoordinates.y})`}
                      filter="url(#driverShadowFilter)"
                      className="buyer-ev-marker-group"
                      style={{ transition: 'transform 0.5s ease-in-out' }}
                    >
                      <circle r="26" fill="rgba(180, 83, 9, 0.22)" className="animate-ping-slow" />
                      <rect
                        x="-24"
                        y="-18"
                        width="48"
                        height="36"
                        rx="8"
                        fill="#b45309"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <g
                        transform="translate(-11, -11) scale(0.9)"
                        stroke="#ffffff"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                        <path d="M15 18H9" />
                        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                        <circle cx="17" cy="18" r="2" />
                        <circle cx="7" cy="18" r="2" />
                      </g>

                      {/* Marker Floating Badge */}
                      <g transform="translate(0, -32)">
                        <rect x="-85" y="-12" width="170" height="24" rx="12" fill="#0f172a" opacity="0.92" />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10.5"
                          fontWeight="600"
                        >
                          {vehicleCoordinates.label}
                        </text>
                      </g>
                    </g>
                  </svg>
                </div>

                {/* Map Footer Bar */}
                <div className="buyer-map-footer-bar">
                  <span className="buyer-gps-text">
                    <span className="live-gps-dot" />
                    {lang === 'ta'
                      ? 'நேரலை GNSS சிக்னல் • டாடா ஏஸ் EV சரக்கு நேரலை'
                      : 'Live GNSS Differential Lock • Tata Ace EV Connected'}
                  </span>
                  <button
                    type="button"
                    className="buyer-map-action-btn"
                    onClick={handleRefreshGps}
                  >
                    <RotateCcw size={13} className={gpsRefreshing ? 'animate-spin' : ''} />
                    <span>{lang === 'ta' ? 'GPS புதுப்பி' : 'Refresh Telemetry'}</span>
                  </button>
                </div>
              </div>

              {/* Waypoint Stations Grid: Side-by-side Origin & Destination under the map */}
              <div className="driver-waypoints-grid">
                {/* 1. Farm Gate Origin Card */}
                <div className="driver-contact-card">
                  <div className="driver-contact-header">
                    <span className="driver-contact-tag origin">
                      🌾 {lang === 'ta' ? 'பண்ணை ஏற்றுமிடம்' : 'Farm-Gate Pickup'}
                    </span>
                    <span className="text-muted small">07:00 - 08:30 AM</span>
                  </div>
                  <div className="driver-contact-name">{activeTrip.pickup?.farmName}</div>
                  <div className="driver-contact-person">
                    👤 {activeTrip.pickup?.farmerName} • 📞 {activeTrip.pickup?.farmerPhone}
                  </div>
                  <div className="driver-contact-address">{activeTrip.pickup?.address}</div>
                  <div className="driver-contact-action-row">
                    <a
                      href={`tel:${activeTrip.pickup?.farmerPhone}`}
                      className="driver-contact-btn primary"
                    >
                      <Phone size={13} />
                      <span>{lang === 'ta' ? 'அழைக்க' : 'Call Farmer'}</span>
                    </a>
                    <a
                      href={farmMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="driver-contact-btn"
                    >
                      <Navigation size={13} />
                      <span>{lang === 'ta' ? 'வழிசெலுத்தல்' : 'Navigate'}</span>
                    </a>
                  </div>
                </div>

                {/* 2. Buyer Receiving Dock Card */}
                <div className="driver-contact-card">
                  <div className="driver-contact-header">
                    <span className="driver-contact-tag destination">
                      🏢 {lang === 'ta' ? 'வாங்குபவர் இறக்குமிடம்' : 'Buyer Receiving Dock'}
                    </span>
                    <span className="text-muted small">Today, by 11:30 AM</span>
                  </div>
                  <div className="driver-contact-name">{activeTrip.dropoff?.buyerName}</div>
                  <div className="driver-contact-person">
                    👤 {activeTrip.dropoff?.contactPerson} • 📞 {activeTrip.dropoff?.buyerPhone}
                  </div>
                  <div className="driver-contact-address">{activeTrip.dropoff?.address}</div>
                  <div className="driver-contact-action-row">
                    <a
                      href={`tel:${activeTrip.dropoff?.buyerPhone}`}
                      className="driver-contact-btn primary"
                    >
                      <Phone size={13} />
                      <span>{lang === 'ta' ? 'அழைக்க' : 'Call Buyer'}</span>
                    </a>
                    <a
                      href={buyerMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="driver-contact-btn"
                    >
                      <Navigation size={13} />
                      <span>{lang === 'ta' ? 'வழிசெலுத்தல்' : 'Navigate'}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* ==============================================================
                RIGHT: IN-CAB TELEMETRY & CONSIGNMENT SIDEBAR
                ============================================================== */}
            <div className="buyer-telemetry-sidebar">
                {/* 1. Consignment Specs Card */}
                <div className="driver-contact-card">
                  <div className="driver-consignment-head">
                    <img
                      src={activeTrip.cropImage}
                      alt={activeTrip.cropName}
                      className="driver-consignment-thumb"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="driver-consignment-info">
                      <div className="driver-consignment-title">{activeTrip.cropName}</div>
                      <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                        <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.78rem' }}>
                          📦 {activeTrip.cratesCount || 8} {lang === 'ta' ? 'பெட்டிகள்' : 'Crates'}
                        </span>
                        <span className="text-dark fw-bold small">
                          {activeTrip.quantityKg} Kg {lang === 'ta' ? 'மொத்த எடை' : 'Gross'}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div className="driver-payout-chip">
                          <Zap size={13} />
                          <span>₹{activeTrip.haulageEarnings?.totalEarnings || 744} {lang === 'ta' ? 'வருவாய்' : 'Trip Pay'}</span>
                        </div>
                        <div className="driver-payout-chip" style={{ background: '#dcfce7', borderColor: '#86efac', color: '#166534' }}>
                          <ShieldCheck size={13} />
                          <span>{lang === 'ta' ? 'எஸ்க்ரோ பாதுகாப்பானது' : 'Agri-Escrow Secured'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Tactile In-Cab Milestone Action Card */}
                <div className="driver-action-card">
                  <div className="driver-action-header">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span
                        className={`driver-milestone-tag ${
                          activeTrip.status === 'DELIVERED'
                            ? 'delivered'
                            : activeTrip.status === 'IN_TRANSIT'
                            ? 'in-transit'
                            : ''
                        }`}
                      >
                        ● {formatOrderStatus(activeTrip.status)}
                      </span>
                      <span className="text-muted font-mono" style={{ fontSize: '0.74rem' }}>
                        #{activeTrip.tripId}
                      </span>
                    </div>

                    <h4 className="driver-action-title">
                      {lang === 'ta' ? 'அடுத்த கட்ட ஓட்டுநர் செயல்பாடு' : 'Next In-Cab Action'}
                    </h4>
                    <p className="driver-action-desc">
                      {activeTrip.status === 'READY_FOR_PICKUP' || activeTrip.status === 'CONFIRMED'
                        ? (lang === 'ta' ? 'பண்ணைக்கு கிளம்பி காய்கறி ஏற்றுதலைத் தொடங்கவும்.' : 'Head to farm gate for produce loading & physical inspection.')
                        : activeTrip.status === 'DRIVER_EN_ROUTE_PICKUP'
                        ? (lang === 'ta' ? 'பண்ணையை அடைந்ததும் பெட்டிகளை சரிபார்த்து உறுதி செய்யவும்.' : 'Arrived at farm gate. Verify crate count and confirm loading.')
                        : activeTrip.status === 'PICKED_UP'
                        ? (lang === 'ta' ? 'நெடுஞ்சாலை வழியாக வாங்குபவர் முனையத்திற்கு புறப்படவும்.' : 'Begin transit via NH-83 towards buyer commercial kitchen bay.')
                        : activeTrip.status === 'IN_TRANSIT'
                        ? (lang === 'ta' ? 'வாங்குபவர் முனையத்தை அடைந்து 4-இலக்க பின்னை பெறவும்.' : 'Arrived at destination. Request 4-digit secret PIN from buyer.')
                        : (lang === 'ta' ? 'விநியோகம் வெற்றிகரமாக முடிந்தது! சரக்கு கூலி கணக்கில் வரவு வைக்கப்பட்டது.' : 'Consignment verified and haulage pay released to driver wallet.')}
                    </p>
                  </div>

                  {/* Primary Action Button */}
                  {(activeTrip.status === 'READY_FOR_PICKUP' || activeTrip.status === 'CONFIRMED') && (
                    <button
                      type="button"
                      className="driver-primary-cta"
                      onClick={() => advanceTripMilestone(activeTrip.tripId)}
                    >
                      <Navigation size={18} />
                      <span>
                        {lang === 'ta'
                          ? 'பண்ணைக்கு புறப்படு (Start Pickup Route) ➔'
                          : 'Start Navigation to Farm Gate ➔'}
                      </span>
                    </button>
                  )}

                  {activeTrip.status === 'DRIVER_EN_ROUTE_PICKUP' && (
                    <button
                      type="button"
                      className="driver-primary-cta"
                      onClick={() => setCrateModalOpen(true)}
                    >
                      <PackageCheck size={18} />
                      <span>
                        {lang === 'ta'
                          ? 'பெட்டிகளை சரிபார்த்து ஏற்று (Inspect Crates) ➔'
                          : 'Arrived at Farm • Inspect & Load Crates ➔'}
                      </span>
                    </button>
                  )}

                  {activeTrip.status === 'PICKED_UP' && (
                    <button
                      type="button"
                      className="driver-primary-cta"
                      onClick={() => advanceTripMilestone(activeTrip.tripId)}
                    >
                      <Truck size={18} />
                      <span>
                        {lang === 'ta'
                          ? 'வாங்குபவர் முனையத்திற்கு புறப்படு ➔'
                          : 'Start Highway Transit to Buyer Dock ➔'}
                      </span>
                    </button>
                  )}

                  {activeTrip.status === 'IN_TRANSIT' && (
                    <button
                      type="button"
                      className="driver-primary-cta pin-cta"
                      onClick={() => {
                        setPinError('');
                        setPinValue('');
                        setPinModalOpen(true);
                      }}
                    >
                      <KeyRound size={19} />
                      <span>
                        {lang === 'ta'
                          ? 'முனையம் அடைந்தது • 4-இலக்க பின்னை உள்ளிடவும் ➔'
                          : 'Arrived at Dock • Enter 4-Digit Handover PIN ➔'}
                      </span>
                    </button>
                  )}

                  {activeTrip.status === 'DELIVERED' && (
                    <div className="driver-delivered-banner">
                      <div className="driver-delivered-title">
                        <CheckCircle2 size={20} color="#16a34a" />
                        <span>{lang === 'ta' ? 'விநியோகம் முடிந்தது!' : 'Consignment Handover Verified!'}</span>
                      </div>
                      <div className="driver-delivered-subtitle">
                        {lang === 'ta'
                          ? `பாதுகாப்பு பின் சரிபார்க்கப்பட்டு ₹${activeTrip.haulageEarnings?.totalEarnings || 744} கூலி பணப்பையில் வரவு வைக்கப்பட்டது.`
                          : `Secret PIN verified. ₹${activeTrip.haulageEarnings?.totalEarnings || 744} haulage pay credited to driver wallet.`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Truck size={36} />}
              title={lang === 'ta' ? 'செயலில் பயணங்கள் இல்லை' : 'No active dispatches right now'}
              description={
                lang === 'ta'
                  ? 'விவசாயிகள் மற்றும் வணிகர்களின் புதிய சரக்கு பயணங்கள் ஒதுக்கப்படும் போது இங்கு தோன்றும்.'
                  : 'When new harvest orders are assigned to your EV fleet, real-time dispatch routes will appear here.'
              }
              action={
                <Button type="button" variant="primary" onClick={() => navigate(ROUTES.DRIVER_DASHBOARD_TRIPS)}>
                  <span>{lang === 'ta' ? 'பயண வரலாற்றைப் பார்க்கவும்' : 'View Trip History'}</span>
                </Button>
              }
            />
          )}
        </>
      )}

      {/* ====================================================================
          MODAL 1: CRATE INSPECTION & HARVEST VERIFICATION CHECKLIST
          ==================================================================== */}
      {crateModalOpen && (
        <div className="driver-modal-backdrop" role="dialog" aria-modal="true">
          <div className="driver-modal-card">
            <button
              type="button"
              className="driver-modal-x-btn"
              onClick={() => setCrateModalOpen(false)}
            >
              <X size={18} />
            </button>

            <div className="driver-modal-icon-wrap">
              <PackageCheck size={28} />
            </div>

            <h3 className="driver-modal-title">
              {lang === 'ta' ? 'பண்ணை ஏற்றுதல் சரிபார்ப்பு' : 'Farm Gate Crate Inspection'}
            </h3>

            <p className="driver-modal-desc">
              {lang === 'ta'
                ? 'பண்ணையில் விளைச்சல் பெட்டிகளை எண்ணி சரிபார்த்து ஏற்றுதலை உறுதிசெய்யவும்.'
                : `Verify harvest crates and seal with farmer ${activeTrip?.pickup?.farmerName || 'Ramesh Kumar'} before departure.`}
            </p>

            <div className="driver-checklist-wrap">
              <label className="driver-checklist-item">
                <input
                  type="checkbox"
                  checked={crateCheckCount}
                  onChange={(e) => setCrateCheckCount(e.target.checked)}
                />
                <span>
                  <strong>{activeTrip?.cratesCount || 8} Crates Counted:</strong>{' '}
                  {activeTrip?.cropName} ({activeTrip?.quantityKg} Kg)
                </span>
              </label>

              <label className="driver-checklist-item">
                <input
                  type="checkbox"
                  checked={crateCheckQuality}
                  onChange={(e) => setCrateCheckQuality(e.target.checked)}
                />
                <span>
                  <strong>Freshness & Spoilage Check:</strong> Morning harvest verified, no handling damage
                </span>
              </label>

              <label className="driver-checklist-item">
                <input
                  type="checkbox"
                  checked={crateCheckSeal}
                  onChange={(e) => setCrateCheckSeal(e.target.checked)}
                />
                <span>
                  <strong>Cargo Hold Sealed:</strong> Tamper-evident lock TN-SEAL-8095 attached
                </span>
              </label>
            </div>

            <Button
              type="button"
              variant="primary"
              disabled={!crateCheckCount || !crateCheckQuality || !crateCheckSeal}
              onClick={handleConfirmCrates}
              style={{ width: '100%', minHeight: '48px', fontSize: '1rem', backgroundColor: '#b45309', borderColor: '#b45309' }}
            >
              <CheckCheck size={18} />
              <span>{lang === 'ta' ? 'சரிபார்த்து ஏற்றுதலை உறுதிசெய் ➔' : 'Confirm Loaded & Start Transit ➔'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: SECURE DELIVERY PIN VERIFICATION WITH TOUCH KEYPAD
          ==================================================================== */}
      {pinModalOpen && (
        <div className="driver-modal-backdrop" role="dialog" aria-modal="true">
          <div className="driver-modal-card">
            <button
              type="button"
              className="driver-modal-x-btn"
              onClick={() => setPinModalOpen(false)}
            >
              <X size={18} />
            </button>

            <div className="driver-modal-icon-wrap">
              <KeyRound size={28} />
            </div>

            <h3 className="driver-modal-title">
              {lang === 'ta' ? 'வாங்குபவர் பாதுகாப்பு பின்' : 'Buyer Handover PIN'}
            </h3>

            <p className="driver-modal-desc">
              {lang === 'ta'
                ? 'இறக்குதலை முடித்ததும் வாங்குபவரிடம் 4-இலக்க பாதுகாப்பு பின்னை கேட்டு இங்கு உள்ளிடவும்.'
                : `Ask ${activeTrip?.dropoff?.contactPerson || 'Buyer Dock Manager'} for the 4-digit secret delivery PIN to verify handover.`}
            </p>

            <form onSubmit={handlePinSubmit}>
              {/* 4 Digit Display Boxes */}
              <div className="driver-pin-boxes-row">
                {[0, 1, 2, 3].map((idx) => {
                  const digit = pinValue[idx] || '';
                  return (
                    <div
                      key={idx}
                      className={`driver-pin-single-box ${digit ? 'filled' : ''}`}
                    >
                      {digit ? '•' : ''}
                    </div>
                  );
                })}
              </div>

              {/* Touch Numeric Keypad for fast in-cab entry */}
              <div className="driver-keypad-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className="driver-keypad-btn"
                    onClick={() => {
                      if (pinValue.length < 4) {
                        setPinValue((prev) => prev + num);
                        setPinError('');
                      }
                    }}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  className="driver-keypad-btn"
                  onClick={() => {
                    setPinValue('');
                    setPinError('');
                  }}
                  style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626' }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="driver-keypad-btn"
                  onClick={() => {
                    if (pinValue.length < 4) {
                      setPinValue((prev) => prev + '0');
                      setPinError('');
                    }
                  }}
                >
                  0
                </button>
                <button
                  type="button"
                  className="driver-keypad-btn"
                  onClick={() => {
                    setPinValue((prev) => prev.slice(0, -1));
                    setPinError('');
                  }}
                  style={{ fontSize: '0.9rem', fontWeight: 700 }}
                >
                  ⌫
                </button>
              </div>

              {pinError && <div className="driver-pin-err">⚠️ {pinError}</div>}

              <Button
                type="submit"
                variant="primary"
                disabled={pinSubmitting || pinValue.length !== 4}
                style={{ width: '100%', minHeight: '48px', fontSize: '1rem', backgroundColor: '#b45309', borderColor: '#b45309' }}
              >
                {pinSubmitting ? (
                  <span>{lang === 'ta' ? 'சரிபார்க்கிறது...' : 'Verifying Handshake...'}</span>
                ) : (
                  <>
                    <CheckCheck size={18} />
                    <span>{lang === 'ta' ? 'பின் சரிபார்த்து விநியோகத்தை முடிக்க ➔' : 'Verify PIN & Confirm Handover ➔'}</span>
                  </>
                )}
              </Button>

              <div className="driver-pin-hint">
                🔒 {lang === 'ta' ? 'டெமோ பின்' : 'Buyer Secret PIN'}:{' '}
                <strong style={{ color: '#b45309', fontSize: '1rem' }}>
                  {activeTrip?.deliveryPin || '4892'}
                </strong>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

