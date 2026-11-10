// What this file does: Beginner-friendly Farmer Approval Status Bar with Track Live Map and Simulation controls.

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Copy,
  Check,
  PackageCheck,
  Play
} from 'lucide-react';
import './FarmerApprovalStatusBar.css';
import { ROUTES } from '../routes';
import { useBuyer } from '../context/BuyerContext';

export default function FarmerApprovalStatusBar() {
  const navigate = useNavigate();
  const {
    orders,
    setActiveDashboardOrderId,
    activeDashboardOrder,
    handleSimulateFarmerApproval,
    handleAdvanceDeliveryStep,
    setSelectedTrackingOrderId,
    t
  } = useBuyer();

  const [copiedId, setCopiedId] = useState(false);

  // Active ongoing orders only (strictly excluding delivered / cancelled)
  const activeOrders = useMemo(() => {
    return (orders || []).filter((o) => {
      if (!o) return false;
      const deliv = String(o.deliveryStatus || '').toUpperCase();
      const ordSt = String(o.orderStatus || '').toUpperCase();
      const st = String(o.status || '').toUpperCase();
      return (
        deliv !== 'DELIVERED' &&
        ordSt !== 'DELIVERED' &&
        st !== 'DELIVERED' &&
        ordSt !== 'CANCELLED' &&
        ordSt !== 'REJECTED'
      );
    });
  }, [orders]);

  // Active target order
  const order = activeDashboardOrder;

  const handleCopyOrderId = () => {
    if (!order?.orderId) return;
    navigator.clipboard?.writeText(order.orderId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleTrackLive = () => {
    if (!order) return;
    if (setSelectedTrackingOrderId) {
      setSelectedTrackingOrderId(order.orderId);
    }
    navigate(ROUTES.BUYER_DASHBOARD_TRACK);
  };

  // Determine stage progress
  const { isPendingFarmer, isFarmerApproved, isPickedUp, isDelivered } = useMemo(() => {
    if (!order) return { isPendingFarmer: true, isFarmerApproved: false, isPickedUp: false, isDelivered: false };

    const isPending = order.orderStatus === 'PENDING_FARMER_APPROVAL';
    const isApproved = order.orderStatus === 'CONFIRMED' || order.orderStatus === 'READY_FOR_PICKUP';
    const delivStatus = order.deliveryStatus || order.status;
    const delivered = delivStatus === 'DELIVERED' || delivStatus === 'delivered';
    const pickedUp = delivStatus === 'PICKED_UP' || delivStatus === 'IN_TRANSIT' || delivStatus === 'in_transit' || delivStatus === 'preparing';

    return {
      isPendingFarmer: isPending,
      isFarmerApproved: isApproved || pickedUp || delivered,
      isPickedUp: pickedUp,
      isDelivered: delivered
    };
  }, [order]);

  const handleSimulateNextStage = () => {
    if (!order) return;
    if (isPendingFarmer) {
      handleSimulateFarmerApproval(order.orderId);
    } else {
      handleAdvanceDeliveryStep(order.orderId);
    }
  };

  if (!order || isDelivered || activeOrders.length === 0) {
    return null;
  }

  const farmer = order.farmer || {
    name: 'Ravi Kumar',
    location: 'Siluvathur, Dindigul Hub'
  };

  return (
    <div className="farmer-status-card animate-fade-in" id="farmer-approval-tracker">
      {/* 1. CARD TOP HEADER: BADGES, ORDER ID & ORDER SWITCHER */}
      <div className="farmer-status-top-bar">
        <div className="farmer-status-left-group">
          {/* Status Badge */}
          {isPendingFarmer ? (
            <span className="farmer-pill-badge amber">
              <span className="status-pulse-dot amber" />
              <Clock size={13} />
              <span>{t('farmerApproval.statusPending') || 'Awaiting Farmer Approval'}</span>
            </span>
          ) : isDelivered ? (
            <span className="farmer-pill-badge green">
              <CheckCircle2 size={13} />
              <span>{t('farmerApproval.statusDelivered') || 'Delivered Successfully'}</span>
            </span>
          ) : isPickedUp ? (
            <span className="farmer-pill-badge blue">
              <Truck size={13} />
              <span>{t('farmerApproval.statusInTransit') || 'Driver In Transit'}</span>
            </span>
          ) : (
            <span className="farmer-pill-badge green">
              <CheckCircle2 size={13} />
              <span>{t('farmerApproval.statusApproved') || 'Farmer Approved ✓'}</span>
            </span>
          )}

          {/* Generated Order ID Display */}
          <div className="farmer-order-id-chip">
            <span className="farmer-id-prefix">{t('farmerApproval.orderIdLabel') || 'Order ID:'}</span>
            <strong className="farmer-id-value">{order.orderId}</strong>
            <button
              type="button"
              className="farmer-copy-id-btn"
              onClick={handleCopyOrderId}
              title={t('farmerApproval.copyId') || 'Copy Order ID'}
            >
              {copiedId ? (
                <>
                  <Check size={12} style={{ color: '#16a34a' }} />
                  <span style={{ color: '#16a34a' }}>{t('farmerApproval.copied') || 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>{t('farmerApproval.copyId') || 'Copy'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Multi-Order Switcher (Active ongoing orders only) */}
        {activeOrders && activeOrders.length > 1 && (
          <div className="farmer-order-selector-wrap">
            <label htmlFor="active-order-select" className="farmer-select-label">
              {t('farmerApproval.switchOrder') || 'Active Order:'}
            </label>
            <select
              id="active-order-select"
              value={order.orderId}
              onChange={(e) => setActiveDashboardOrderId(e.target.value)}
              className="farmer-order-select-box"
            >
              {activeOrders.map((o) => (
                <option key={o.orderId} value={o.orderId}>
                  {o.orderId} — {o.cropName} ({o.quantityKg} kg)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. PRODUCE SUMMARY STRIP */}
      <div className="farmer-produce-summary-strip">
        <div className="farmer-produce-thumb-wrap">
          <img
            src={order.image || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'}
            alt={order.cropName}
            className="farmer-produce-thumb"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80';
            }}
          />
        </div>
        <div className="farmer-produce-info-block">
          <div className="farmer-produce-name-row">
            <h3 className="farmer-produce-title">
              {order.quantityKg} kg {order.cropName}
            </h3>
            {order.tamilCropName && (
              <span className="farmer-produce-tamil-sub">({order.tamilCropName})</span>
            )}
            {order.grade && <span className="farmer-grade-tag">{order.grade}</span>}
          </div>
          <div className="farmer-produce-meta-row">
            <span className="farmer-meta-item">
              🌱 <strong>{t('farmerApproval.farmerLabel') || 'Farmer:'}</strong> {farmer.name}
            </span>
            <span className="farmer-meta-dot">•</span>
            <span className="farmer-meta-item">
              <MapPin size={12} className="inline-icon" /> {farmer.location || order.location || 'Dindigul Hub'}
            </span>
            <span className="farmer-meta-dot">•</span>
            <span className="farmer-meta-item farmer-total-price">
              {t('farmerApproval.totalAmount') || 'Total:'} <strong>₹{order.totalPrice?.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. STEPPED PROGRESS STATUS BAR */}
      <div className="farmer-stepper-container">
        <div className="farmer-stepper-track">
          {/* Step 1: Order Placed */}
          <div className="farmer-step-item completed">
            <div className="farmer-step-circle completed">
              <Check size={16} strokeWidth={2.6} />
            </div>
            <div className="farmer-step-content">
              <h4 className="farmer-step-title">{t('farmerApproval.step1Title') || 'Order Placed'}</h4>
              <p className="farmer-step-sub">{order.orderTime || 'Just now'}</p>
            </div>
          </div>

          <div className={`farmer-step-line ${isFarmerApproved ? 'active' : ''}`} />

          {/* Step 2: Farmer Approval */}
          <div className={`farmer-step-item ${isFarmerApproved ? 'completed' : 'current-pulse'}`}>
            <div className={`farmer-step-circle ${isFarmerApproved ? 'completed' : 'amber-pulse'}`}>
              {isFarmerApproved ? <Check size={16} strokeWidth={2.6} /> : <Clock size={16} />}
            </div>
            <div className="farmer-step-content">
              <h4 className="farmer-step-title">{t('farmerApproval.step2Title') || 'Farmer Approval'}</h4>
              <p className="farmer-step-sub">
                {isFarmerApproved
                  ? (t('farmerApproval.step2Approved') || 'Farmer approved order ✓')
                  : (t('farmerApproval.step2Pending') || 'Waiting for farmer confirmation')}
              </p>
            </div>
          </div>

          <div className={`farmer-step-line ${isPickedUp ? 'active' : isFarmerApproved ? 'in-progress' : ''}`} />

          {/* Step 3: Driver Pickup */}
          <div className={`farmer-step-item ${isPickedUp ? 'completed' : isFarmerApproved ? 'current-pulse' : 'pending'}`}>
            <div className={`farmer-step-circle ${isPickedUp ? 'completed' : isFarmerApproved ? 'blue-pulse' : 'pending'}`}>
              {isPickedUp ? <Check size={16} strokeWidth={2.6} /> : <Truck size={16} />}
            </div>
            <div className="farmer-step-content">
              <h4 className="farmer-step-title">{t('farmerApproval.step3Title') || 'Driver Pickup'}</h4>
              <p className="farmer-step-sub">
                {isPickedUp
                  ? (t('farmerApproval.step3PickedUp') || 'Crops loaded into vehicle')
                  : isFarmerApproved
                  ? (t('farmerApproval.step3EnRoute') || 'Driver heading to farm for pickup')
                  : (t('farmerApproval.step3Standby') || 'Driver on standby')}
              </p>
            </div>
          </div>

          <div className={`farmer-step-line ${isDelivered ? 'active' : ''}`} />

          {/* Step 4: Delivered */}
          <div className={`farmer-step-item ${isDelivered ? 'completed' : 'pending'}`}>
            <div className={`farmer-step-circle ${isDelivered ? 'completed' : 'pending'}`}>
              {isDelivered ? <Check size={16} strokeWidth={2.6} /> : <PackageCheck size={16} />}
            </div>
            <div className="farmer-step-content">
              <h4 className="farmer-step-title">{t('farmerApproval.step4Title') || 'Delivered'}</h4>
              <p className="farmer-step-sub">{t('farmerApproval.step4Desc') || 'Delivered to your kitchen'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ACTION BUTTONS: TRACK DELIVERY MAP & SIMULATE NEXT STAGE ALONE */}
      <div className="farmer-action-bar simple-bar">
        <button
          type="button"
          className="farmer-action-btn primary-green"
          onClick={handleTrackLive}
        >
          <Truck size={16} />
          <span>{t('farmerApproval.btnTrackLiveMap') || '🚚 Track Live Delivery Map'}</span>
        </button>

        {!isDelivered && (
          <button
            type="button"
            className="farmer-action-btn outline"
            onClick={handleSimulateNextStage}
          >
            <Play size={14} />
            <span>{t('farmerApproval.btnAdvanceStage') || 'Simulate Next Stage ➔'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
