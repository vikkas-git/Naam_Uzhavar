// What this file does: Live order and consignment delivery tracking page with timeline, demo advancement controls, and driver details.

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Check,
  Truck,
  MapPin,
  Zap,
  RotateCcw,
  User,
  Phone,
  ShieldCheck,
  Clock,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import './Track.css';
import { ROUTES } from '../../routes';
import { useBuyer } from '../../context/BuyerContext';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import { TrackingSkeleton } from '../../components/Skeleton';
import { formatOrderStatus } from '../../utils/helpers';

export default function Track() {
  const navigate = useNavigate();
  const {
    isDataLoading,
    orders,
    selectedTrackingOrderId,
    setSelectedTrackingOrderId,
    trackingOrder,
    profile,
    showToast,
    handleAdvanceDeliveryStep,
    handleOpenOrderWorkflowForOrder,
    t
  } = useBuyer();

  // Normalize current delivery status across new and legacy status models
  const currentDeliveryStatus = useMemo(() => {
    if (!trackingOrder) return 'NOT_ASSIGNED';
    if (trackingOrder.deliveryStatus) return trackingOrder.deliveryStatus;
    const s = trackingOrder.status;
    if (s === 'delivered') return 'DELIVERED';
    if (s === 'in_transit' || s === 'on_the_way') return 'IN_TRANSIT';
    if (s === 'assigned' || s === 'preparing' || s === 'dispatched') return 'PICKED_UP';
    if (s === 'confirmed') return 'READY_FOR_PICKUP';
    return 'NOT_ASSIGNED';
  }, [trackingOrder]);

  // Delivery status is only accessible once the order is approved and delivery has been arranged
  const isDeliveryAccessible = useMemo(() => {
    if (!trackingOrder) return false;
    if (trackingOrder.orderStatus === 'REJECTED' || trackingOrder.orderStatus === 'PENDING_FARMER_APPROVAL') {
      return false;
    }
    return currentDeliveryStatus !== 'NOT_ASSIGNED';
  }, [trackingOrder, currentDeliveryStatus]);

  // 4 Milestone Stages:
  // 0: Ready for Pickup, 1: Picked Up, 2: In Transit, 3: Delivered
  const currentStageIndex = useMemo(() => {
    if (currentDeliveryStatus === 'DELIVERED') return 3;
    if (currentDeliveryStatus === 'IN_TRANSIT') return 2;
    if (currentDeliveryStatus === 'PICKED_UP') return 1;
    if (currentDeliveryStatus === 'READY_FOR_PICKUP') return 0;
    return -1;
  }, [currentDeliveryStatus]);

  const trackingSteps = useMemo(
    () => [
      {
        id: 'ready_for_pickup',
        statusCode: 'READY_FOR_PICKUP',
        title: 'Ready for Pickup',
        titleKey: 'track.stepConfirmed',
        time: trackingOrder?.orderTime || 'Today, 08:30 AM',
        icon: Check
      },
      {
        id: 'picked_up',
        statusCode: 'PICKED_UP',
        title: 'Picked Up',
        titleKey: 'track.stepPreparing',
        time: currentStageIndex >= 1 ? 'Hub Cleared' : 'Regional Hub',
        icon: Check
      },
      {
        id: 'in_transit',
        statusCode: 'IN_TRANSIT',
        title: 'In Transit',
        titleKey: 'track.stepOnTheWay',
        time:
          currentStageIndex === 2
            ? `${trackingOrder?.liveTracking?.estimatedMinutes ?? 18} min ETA`
            : currentStageIndex > 2
            ? 'Completed'
            : 'En Route',
        icon: Truck
      },
      {
        id: 'delivered',
        statusCode: 'DELIVERED',
        title: 'Delivered',
        titleKey: 'track.stepDelivered',
        time: currentStageIndex >= 3 ? 'Delivered' : 'Destination Bay',
        icon: MapPin
      }
    ],
    [trackingOrder, currentStageIndex]
  );

  // Dynamic telemetry attributes reflecting the selected order and current stage
  const dynamicTelemetry = useMemo(() => {
    if (currentDeliveryStatus === 'READY_FOR_PICKUP') {
      return {
        statusText: 'Consignment Graded & Packaged - Ready for Driver Pickup at Hub',
        locationText: `${trackingOrder?.hub || trackingOrder?.location || 'Central Supply'} Sorting Bay`,
        etaMinutes: 45,
        distanceKm: 24,
        speedKmh: 0,
        batteryPct: 94
      };
    }
    if (currentDeliveryStatus === 'PICKED_UP') {
      return {
        statusText: 'EV Cargo Picked Up from Regional Hub - Checkpoint Cleared',
        locationText: 'Kodai Road Logistics Corridor',
        etaMinutes: 30,
        distanceKm: 18,
        speedKmh: 35,
        batteryPct: 88
      };
    }
    if (currentDeliveryStatus === 'IN_TRANSIT') {
      return {
        statusText: 'EV Cargo In Transit along Highway Corridor',
        locationText: 'Near Samayanallur Bypass',
        etaMinutes: trackingOrder?.liveTracking?.estimatedMinutes ?? 15,
        distanceKm: trackingOrder?.liveTracking?.distanceKm ?? 8.5,
        speedKmh: trackingOrder?.liveTracking?.speedKmh ?? 42,
        batteryPct: trackingOrder?.liveTracking?.batteryPct ?? 82
      };
    }
    if (currentDeliveryStatus === 'DELIVERED') {
      return {
        statusText: 'Consignment Successfully Delivered & Verified at Destination Bay',
        locationText: trackingOrder?.deliveryAddress || profile?.address || 'Destination Unloading Bay 2',
        etaMinutes: 0,
        distanceKm: 0,
        speedKmh: 0,
        batteryPct: 65
      };
    }
    return {
      statusText: 'Awaiting Logistics Dispatch Arrangement',
      locationText: trackingOrder?.hub || 'Regional Agri Hub',
      etaMinutes: 60,
      distanceKm: 30,
      speedKmh: 0,
      batteryPct: 100
    };
  }, [currentDeliveryStatus, trackingOrder, profile?.address]);

  if (isDataLoading && (!orders || orders.length === 0)) {
    return <TrackingSkeleton />;
  }

  // If no orders exist or trackingOrder is missing, render graceful EmptyState
  if (!trackingOrder || (orders || []).length === 0) {
    return (
      <div className="buyer-view-container animate-fade-in">
        <div className="buyer-view-header">
          <div>
            <h1 className="buyer-view-title">{t('track.title')}</h1>
            <p className="buyer-view-subtitle">{t('track.subtitle')}</p>
          </div>
        </div>
        <EmptyState
          icon={<Truck size={36} />}
          title="No active deliveries to track"
          description="When you place produce orders and delivery is arranged, real-time shipment status, driver contact, and the secure handover PIN will appear here."
          action={
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate(ROUTES.BUYER_DASHBOARD_CROPS)}
            >
              <span>Browse Fresh Produce</span>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="buyer-view-container animate-fade-in">
      <div className="buyer-view-header">
        <div>
          <h1 className="buyer-view-title">{t('track.title')}</h1>
          <p className="buyer-view-subtitle">{t('track.subtitle')}</p>
        </div>

        {/* Active Tracking Order Switcher */}
        <div className="buyer-active-order-picker">
          <span className="buyer-picker-label">{t('track.trackingOrder')}</span>
          <div className="buyer-select-wrapper">
            <select
              className="buyer-select-input"
              value={selectedTrackingOrderId}
              onChange={(e) => setSelectedTrackingOrderId(e.target.value)}
            >
              {(orders || []).map((o) => {
                const s = o.deliveryStatus || (o.status === 'delivered' ? 'DELIVERED' : o.status === 'in_transit' ? 'IN_TRANSIT' : o.status);
                const isAccessible = s !== 'NOT_ASSIGNED' && o.orderStatus !== 'REJECTED' && o.orderStatus !== 'PENDING_FARMER_APPROVAL';
                return (
                  <option key={o.orderId} value={o.orderId}>
                    {o.orderId} - {o.cropName} ({o.quantityKg} kg) [{formatOrderStatus(isAccessible ? s : o.orderStatus || 'Pending')}]
                  </option>
                );
              })}
            </select>
            <ChevronDown size={14} className="buyer-select-arrow" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          INACCESSIBLE DELIVERY STATE (When order has not reached required stage)
          ===================================================================== */}
      {!isDeliveryAccessible ? (
        <div className="buyer-tracking-inaccessible-card">
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: trackingOrder.orderStatus === 'REJECTED' ? '#fee2e2' : '#fef3c7',
              color: trackingOrder.orderStatus === 'REJECTED' ? '#dc2626' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            {trackingOrder.orderStatus === 'REJECTED' ? <XCircle size={32} /> : <Clock size={32} />}
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
            {trackingOrder.orderStatus === 'REJECTED'
              ? 'Delivery Tracking Inaccessible - Order Rejected'
              : 'Delivery Tracking Not Available Yet'}
          </h3>

          <p style={{ maxWidth: '540px', color: '#475569', fontSize: '0.92rem', lineHeight: '1.55', margin: '0 0 20px 0' }}>
            {trackingOrder.orderStatus === 'REJECTED'
              ? `Order #${trackingOrder.orderId} was declined during farmer review. Delivery tracking is prevented for rejected orders.`
              : trackingOrder.orderStatus === 'PENDING_FARMER_APPROVAL'
              ? `Order #${trackingOrder.orderId} is currently pending farmer approval. Delivery tracking becomes accessible once the farmer approves and delivery is arranged.`
              : `Order #${trackingOrder.orderId} has been confirmed, but delivery dispatch arrangement is pending.`}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {trackingOrder.orderStatus === 'PENDING_FARMER_APPROVAL' && (
              <Button
                type="button"
                variant="primary"
                onClick={() => handleOpenOrderWorkflowForOrder(trackingOrder)}
              >
                <span>Demo: Simulate Farmer Approval</span>
              </Button>
            )}

            {trackingOrder.orderStatus === 'CONFIRMED' && currentDeliveryStatus === 'NOT_ASSIGNED' && (
              <Button
                type="button"
                variant="primary"
                onClick={() => handleOpenOrderWorkflowForOrder(trackingOrder)}
              >
                <span>Demo: Simulate Delivery Arrangement</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const activeDelivery = orders.find(
                  (o) => o.deliveryStatus && o.deliveryStatus !== 'NOT_ASSIGNED' && o.orderStatus !== 'REJECTED'
                );
                if (activeDelivery) {
                  setSelectedTrackingOrderId(activeDelivery.orderId);
                } else {
                  navigate(ROUTES.BUYER_DASHBOARD_CROPS);
                }
              }}
            >
              <span>Switch to Active Delivery</span>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* ===================================================================
              4-STAGE MILESTONE STEPPER: Ready for Pickup -> Picked Up -> In Transit -> Delivered
              =================================================================== */}
          <div className="buyer-tracking-stepper-card">
            <div className="buyer-stepper-inner">
              {trackingSteps.map((step, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isActive = idx === currentStageIndex;
                const stepClass = isCompleted ? 'completed' : isActive ? 'active' : 'pending';
                const StepIcon = step.icon;

                return (
                  <React.Fragment key={step.id}>
                    <div className={`buyer-step ${stepClass}`}>
                      <div className={`buyer-step-circle ${isActive ? 'pulse-circle' : ''}`}>
                        {isCompleted ? <Check size={14} /> : <StepIcon size={14} />}
                      </div>
                      <span className={`buyer-step-title ${isActive ? 'active' : ''}`}>
                        {step.title}
                      </span>
                      <span className="buyer-step-time">{step.time}</span>
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
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ===================================================================
              LIVE LOGISTICS MAP & SIDEBAR SPLIT LAYOUT
              =================================================================== */}
          <div className="buyer-map-tracking-layout">
            {/* Visual Logistics Map */}
            <div className="buyer-map-container">
              <div className="buyer-map-header-overlay">
                <div className="buyer-map-legend">
                  <span className="legend-item">
                    <span className="dot hub" /> {t('track.legendHub')}
                  </span>
                  <span className="legend-item">
                    <span className="dot vehicle" /> {t('track.legendVehicle')}
                  </span>
                  <span className="legend-item">
                    <span className="dot destination" /> {t('track.legendDestination')}
                  </span>
                </div>
                <div className="buyer-map-speed-pill">
                  <Zap size={14} />{' '}
                  {t('track.speedBattery', {
                    speed: dynamicTelemetry.speedKmh,
                    battery: dynamicTelemetry.batteryPct
                  })}
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
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1c3d5d" />
                      <stop offset="50%" stopColor="#2b5c8a" />
                      <stop offset="100%" stopColor="#c5d5e5" />
                    </linearGradient>
                    <filter id="shadowFilter" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.18" />
                    </filter>
                  </defs>

                  {/* Map Terrain Grid and Geography Lines */}
                  <rect width="800" height="480" fill="#f1f5f9" rx="14" />

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
                    id="highwayCorridor"
                    d="M 140 100 C 260 120, 310 240, 430 250 S 580 340, 660 380"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />

                  {/* Active Route Delivery Polyline with pulsing dashes */}
                  <path
                    d="M 140 100 C 260 120, 310 240, 430 250 S 580 340, 660 380"
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    className="buyer-animated-route-path"
                  />

                  {/* Waypoint 1: Supply Hub (Origin) */}
                  <g transform="translate(140, 100)">
                    <circle r="18" fill="rgba(43, 92, 138, 0.15)" />
                    <circle r="10" fill="#2b5c8a" />
                    <circle r="4" fill="#ffffff" />
                    <text x="0" y="-22" textAnchor="middle" className="svg-node-label font-bold">
                      {trackingOrder?.hub || trackingOrder?.location || 'Regional Supply Hub'}
                    </text>
                    <text x="0" y="-8" textAnchor="middle" className="svg-node-sub">
                      Origin Hub • {trackingOrder?.orderTime || '08:30 AM'}
                    </text>
                  </g>

                  {/* Waypoint 2: Intermediate Checkpoint */}
                  <g transform="translate(320, 200)">
                    <circle r="5" fill="#64748b" />
                    <text x="12" y="4" className="svg-node-sub">
                      Highway Weighbridge (Cleared)
                    </text>
                  </g>

                  {/* Waypoint 3: Bypass Highway Junction */}
                  <g transform="translate(460, 260)">
                    <circle r="5" fill="#64748b" />
                    <text x="12" y="4" className="svg-node-sub">
                      City Outer Ring Junction
                    </text>
                  </g>

                  {/* Destination: Buyer Kitchen / Loading Bay */}
                  <g transform="translate(660, 380)">
                    <circle r="22" fill="rgba(180, 35, 24, 0.12)" />
                    <circle r="11" fill="#b42318" />
                    <circle r="4" fill="#ffffff" />
                    <text x="0" y="32" textAnchor="middle" className="svg-node-label font-bold">
                      {profile?.shopName || profile?.name || 'Buyer Delivery Bay'}
                    </text>
                    <text x="0" y="46" textAnchor="middle" className="svg-node-sub">
                      Destination • Receiving Bay 2
                    </text>
                  </g>

                  {/* Moving Delivery EV Vehicle Marker (Position adapts to active stage) */}
                  <g
                    transform={
                      currentStageIndex === 0
                        ? 'translate(150, 105)'
                        : currentStageIndex === 1
                        ? 'translate(320, 200)'
                        : currentStageIndex === 2
                        ? 'translate(480, 275)'
                        : 'translate(660, 380)'
                    }
                    filter="url(#shadowFilter)"
                    className="buyer-ev-marker-group"
                  >
                    <circle r="26" fill="rgba(43, 92, 138, 0.18)" className="animate-ping-slow" />
                    <rect
                      x="-24"
                      y="-18"
                      width="48"
                      height="36"
                      rx="8"
                      fill="#2b5c8a"
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

                    <g transform="translate(0, -32)">
                      <rect x="-62" y="-12" width="124" height="24" rx="12" fill="#0f172a" opacity="0.9" />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="600"
                      >
                        {currentDeliveryStatus === 'DELIVERED'
                          ? 'EV Cargo • Delivered'
                          : `EV Cargo • ${dynamicTelemetry.speedKmh} km/h`}
                      </text>
                    </g>
                  </g>
                </svg>
              </div>

              <div className="buyer-map-footer-bar">
                <span className="buyer-gps-text">
                  <span className="live-gps-dot" /> {t('track.liveTelemetry')}
                </span>
                <button
                  type="button"
                  className="buyer-map-action-btn"
                  onClick={() => showToast('info', t('track.telemetryRefreshed'))}
                >
                  <RotateCcw size={13} /> {t('track.refreshGps')}
                </button>
              </div>
            </div>

            {/* SIDEBAR TELEMETRY & DRIVER INFORMATION CARDS */}
            <div className="buyer-telemetry-sidebar">
              {/* ===============================================================
                  DEMO CONTROLS CARD: ADVANCE STATUS SEQUENTIALLY
                  =============================================================== */}
              <div className="buyer-demo-controls-card">
                <div className="buyer-demo-controls-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="buyer-demo-badge">DEMO SIMULATION</span>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>
                      Milestone Controls
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.94rem', fontWeight: '800', color: '#0f172a' }}>
                    Advance Delivery Stage
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                    Simulate sequential logistics milestones for demonstration. These simulated actions cannot be mistaken for real GPS updates.
                  </p>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentDeliveryStatus === 'READY_FOR_PICKUP' && (
                    <button
                      type="button"
                      className="buyer-demo-advance-btn"
                      onClick={() => handleAdvanceDeliveryStep(trackingOrder.orderId)}
                    >
                      <Truck size={16} />
                      <span>Demo: Mark as Picked Up</span>
                    </button>
                  )}

                  {currentDeliveryStatus === 'PICKED_UP' && (
                    <button
                      type="button"
                      className="buyer-demo-advance-btn"
                      onClick={() => handleAdvanceDeliveryStep(trackingOrder.orderId)}
                    >
                      <Truck size={16} />
                      <span>Demo: Mark as In Transit</span>
                    </button>
                  )}

                  {currentDeliveryStatus === 'IN_TRANSIT' && (
                    <button
                      type="button"
                      className="buyer-demo-advance-btn success"
                      onClick={() => handleAdvanceDeliveryStep(trackingOrder.orderId)}
                    >
                      <CheckCircle2 size={16} />
                      <span>Demo: Mark as Delivered</span>
                    </button>
                  )}

                  {currentDeliveryStatus === 'DELIVERED' && (
                    <div className="buyer-demo-delivered-pill">
                      <CheckCircle2 size={16} />
                      <span>Order Delivered: Final Milestone Reached</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Status Card */}
              <div className="buyer-status-card">
                <div className="buyer-status-card-header">
                  <div className="buyer-radar-pulse">
                    <span className="pulse-dot-inner" />
                  </div>
                  <div>
                    <span className="buyer-status-label">{t('track.currentStatus')}</span>
                    <h4 className="buyer-status-main">{dynamicTelemetry.statusText}</h4>
                  </div>
                </div>

                <div className="buyer-status-grid">
                  <div className="buyer-status-stat">
                    <span className="stat-label">{t('track.currentLocation')}</span>
                    <span className="stat-val">{dynamicTelemetry.locationText}</span>
                  </div>
                  <div className="buyer-status-stat highlight">
                    <span className="stat-label">{t('track.estimatedArrival')}</span>
                    <span className="stat-val highlight">
                      {currentDeliveryStatus === 'DELIVERED' ? 'Arrived' : `${dynamicTelemetry.etaMinutes} min`}
                    </span>
                  </div>
                  <div className="buyer-status-stat">
                    <span className="stat-label">{t('track.distanceRemaining')}</span>
                    <span className="stat-val">{dynamicTelemetry.distanceKm} km</span>
                  </div>
                  <div className="buyer-status-stat">
                    <span className="stat-label">{t('track.lastUpdated')}</span>
                    <span className="stat-val">Just now</span>
                  </div>
                </div>
              </div>

              {/* Driver Details Card */}
              <div className="buyer-driver-card">
                <div className="buyer-driver-card-header">
                  <span className="buyer-driver-heading">{t('track.driverDetails')}</span>
                  <span className="buyer-vehicle-tag">{t('track.electricCargo')}</span>
                </div>

                <div className="buyer-driver-profile-row">
                  <div className="buyer-driver-avatar">
                    <User size={22} />
                    <span className="buyer-driver-status-dot" title="Active on route" />
                  </div>
                  <div className="buyer-driver-info">
                    <h4 className="buyer-driver-name">
                      {trackingOrder?.driver?.name || 'Kumar M.'}
                    </h4>
                    <div className="buyer-driver-rating">
                      <span className="buyer-rating-star">★ {trackingOrder?.driver?.rating ?? 4.9}</span>
                      <span className="buyer-dot">•</span>
                      <span className="buyer-deliveries-count">{t('track.deliveriesCount')}</span>
                    </div>
                  </div>
                </div>

                <div className="buyer-driver-vehicle-specs">
                  <div className="buyer-spec-row">
                    <span className="spec-name">{t('track.vehicle')}</span>
                    <span className="spec-value">
                      {trackingOrder?.driver?.vehicleType || trackingOrder?.driver?.vehicle || 'Tata Ace EV Cargo'}
                    </span>
                  </div>
                  <div className="buyer-spec-row">
                    <span className="spec-name">{t('track.registration')}</span>
                    <span className="spec-value font-mono">
                      {trackingOrder?.driver?.vehicleNumber || 'TN 57 AB 1234'}
                    </span>
                  </div>
                  <div className="buyer-spec-row">
                    <span className="spec-name">{t('track.capacity')}</span>
                    <span className="spec-value">
                      {trackingOrder?.driver?.capacityKg || 500} kg
                    </span>
                  </div>
                  <div className="buyer-spec-row pin-highlight">
                    <div className="pin-label-group">
                      <ShieldCheck size={14} className="pin-icon" />
                      <span className="spec-name">{t('track.deliveryPin')}</span>
                    </div>
                    <span className="spec-value pin-code">
                      {trackingOrder?.driver?.deliveryPin || '4892'}
                    </span>
                  </div>
                </div>

                <div className="buyer-driver-actions">
                  {trackingOrder?.driver?.phone ? (
                    <a
                      href={`tel:${trackingOrder.driver.phone}`}
                      className="buyer-btn-primary full-width"
                    >
                      <Phone size={15} />
                      <span>
                        {t('track.callDriver')} ({trackingOrder.driver.phone})
                      </span>
                    </a>
                  ) : (
                    <div className="text-muted text-center py-2 fs-7">
                      Driver contact available once truck is dispatched.
                    </div>
                  )}
                </div>
              </div>

              {/* Farmer and Origin Summary for this selected consignment */}
              <div className="buyer-farmer-dispatched-card">
                <div className="buyer-spec-row">
                  <span className="spec-name">{t('track.produceGrower')}</span>
                  <span className="spec-value">
                    {trackingOrder?.farmer?.name || 'Local Farmer'} ({trackingOrder?.farmer?.location || 'Tamil Nadu'})
                  </span>
                </div>
                <div className="buyer-spec-row">
                  <span className="spec-name">{t('track.dispatchedFrom')}</span>
                  <span className="spec-value">
                    {trackingOrder?.hub || trackingOrder?.location || 'Regional Agri Hub'}
                  </span>
                </div>
                <div className="buyer-spec-row">
                  <span className="spec-name">Consignment Details</span>
                  <span className="spec-value font-semibold">
                    {trackingOrder?.cropName} • {trackingOrder?.quantityKg} kg (₹{trackingOrder?.totalPrice?.toLocaleString('en-IN')})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
