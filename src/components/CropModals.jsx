// What this file does: Crop action modals including Decline modal and the integrated Order Confirmation & Demo Approval workflow.

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  User,
  Calendar,
  FileText,
  ChevronLeft,
  Check,
  X,
  PackageCheck,
  Clock,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { useT } from '../hooks/useT';
import { useBuyer } from '../context/BuyerContext';
import DemoPaymentModal from './common/DemoPaymentModal';
import { formatOrderStatus } from '../utils/helpers';

const FALLBACK_CROP_IMG =
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80';

export default function CropModals({
  declineModalCrop: propDeclineModalCrop,
  onDeclineClose: propOnDeclineClose,
  onConfirmDecline: propOnConfirmDecline,
  lang: propLang
}) {
  const buyer = useBuyer();
  const { t: hookT, lang: hookLang } = useT('buyerDashboard');
  const t = hookT;
  const lang = propLang || hookLang || 'en';

  // Context properties
  const {
    profile,
    declineModalCrop: ctxDeclineModalCrop,
    handleConfirmDecline: ctxHandleConfirmDecline,
    setDeclineModalCrop,
    workflowCrop,
    workflowModalOpen,
    workflowStep,
    activeWorkflowOrder,
    isSubmittingOrder,
    handleCloseWorkflow,
    handleConfirmCreateOrder,
    handleSimulateFarmerApproval,
    handleSimulateFarmerRejection,
    handleSimulateDeliveryArrangement,
    handleGoToDeliveryStatus
  } = buyer;

  const declineModalCrop = propDeclineModalCrop !== undefined ? propDeclineModalCrop : ctxDeclineModalCrop;
  const onDeclineClose = propOnDeclineClose || (() => setDeclineModalCrop(null));
  const onConfirmDecline = propOnConfirmDecline || ctxHandleConfirmDecline;

  // Local state for Step 2 Order Confirmation form fields
  const [orderQuantity, setOrderQuantity] = useState(200);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [validationError, setValidationError] = useState('');
  const [todayDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);

  // Synchronize initial form defaults when workflow opens with a crop
  useEffect(() => {
    if (workflowCrop) {
      const maxAvailable = Number(workflowCrop.availableKg || workflowCrop.quantityKg || 100);
      const minOrder = Number(workflowCrop.minOrderKg || 10);
      const initialQty = Math.min(200, Math.max(minOrder, Math.min(maxAvailable, 100)));
      setOrderQuantity(initialQty);

      const defaultAddress = profile?.address || 'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016';
      setDeliveryAddress(defaultAddress);

      // Default preferred delivery date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setPreferredDeliveryDate(`${yyyy}-${mm}-${dd}`);

      setOrderNotes('');
      setValidationError('');
    }
  }, [workflowCrop, profile?.address]);

  // Handle Order Confirmation Submission (Step 2 -> Step 3)
  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    setValidationError('');

    const maxAvailable = Number(workflowCrop?.availableKg || workflowCrop?.quantityKg || 0);
    const minOrder = Number(workflowCrop?.minOrderKg || 1);
    const qty = Number(orderQuantity);

    if (!qty || qty <= 0 || isNaN(qty)) {
      setValidationError('Please enter a valid order quantity in kg.');
      return;
    }
    if (qty < minOrder) {
      setValidationError(`Minimum order quantity for this crop lot is ${minOrder} kg.`);
      return;
    }
    if (qty > maxAvailable) {
      setValidationError(`Requested ${qty} kg exceeds current available stock of ${maxAvailable} kg.`);
      return;
    }
    if (!deliveryAddress.trim()) {
      setValidationError('Please provide a valid commercial delivery address.');
      return;
    }
    if (!preferredDeliveryDate) {
      setValidationError('Please select a preferred delivery date.');
      return;
    }

    setPendingOrderData({
      quantityKg: qty,
      deliveryAddress: deliveryAddress.trim(),
      preferredDeliveryDate,
      notes: orderNotes.trim()
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    if (pendingOrderData) {
      handleConfirmCreateOrder({
        ...pendingOrderData,
        paymentMethod: paymentResult.methodTitle || paymentResult.method,
        transactionRef: paymentResult.transactionRef,
        utrNumber: paymentResult.utrNumber
      });
    }
  };

  const crop = workflowCrop || activeWorkflowOrder;
  const maxStock = Number(crop?.availableKg || crop?.quantityKg || 100);
  const minStock = Number(crop?.minOrderKg || 10);
  const unitPrice = Number(crop?.pricePerKg || crop?.unitPrice || 0);
  const calculatedTotal = (Number(orderQuantity) || 0) * unitPrice;
  const presets = Array.from(new Set([50, 100, 200, 300, maxStock]))
    .filter((q) => q <= maxStock && q >= minStock)
    .sort((a, b) => a - b);

  return (
    <>
      {/* 1. Decline Confirmation Modal */}
      {declineModalCrop && (
        <div className="buyer-modal-backdrop" onClick={onDeclineClose}>
          <div className="buyer-modal-panel decline-modal" onClick={(e) => e.stopPropagation()}>
            <div className="buyer-modal-header">
              <div className="buyer-modal-icon-wrap amber">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="buyer-modal-title">{t('modals.declineTitle')}</h3>
                <p className="buyer-modal-subtitle">
                  {t('modals.declinePrompt', { name: declineModalCrop.name })}
                </p>
              </div>
              <button
                type="button"
                className="buyer-modal-close-btn"
                onClick={onDeclineClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="buyer-modal-body">
              <div className="buyer-decline-crop-preview">
                <img
                  src={declineModalCrop.image}
                  alt={declineModalCrop.name}
                  className="buyer-decline-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_CROP_IMG;
                  }}
                />
                <div>
                  <h4 className="buyer-preview-name">{declineModalCrop.name}</h4>
                  <p className="buyer-preview-meta">
                    {declineModalCrop.grade} • ₹{declineModalCrop.pricePerKg} / kg • Available:{' '}
                    {declineModalCrop.availableKg} kg
                  </p>
                  <p className="buyer-preview-sub">{t('modals.declineDesc')}</p>
                </div>
              </div>
            </div>

            <div className="buyer-modal-footer">
              <button type="button" className="buyer-btn-outline" onClick={onDeclineClose}>
                {t('common.cancel')}
              </button>
              <button type="button" className="buyer-btn-danger" onClick={onConfirmDecline}>
                {t('modals.declineBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Integrated Order Confirmation & Demo Approval Workflow Modal */}
      {workflowModalOpen && crop && (
        <div className="buyer-modal-backdrop" onClick={handleCloseWorkflow}>
          <div
            className="buyer-modal-panel workflow-modal"
            style={{ maxWidth: 640 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="buyer-modal-header">
              <div
                className={`buyer-modal-icon-wrap ${
                  workflowStep === 'REJECTED'
                    ? 'red'
                    : workflowStep === 'PENDING_APPROVAL'
                    ? 'amber'
                    : 'green'
                }`}
              >
                {workflowStep === 'CONFIRMATION' && <PackageCheck size={22} />}
                {workflowStep === 'PENDING_APPROVAL' && <Clock size={22} />}
                {workflowStep === 'CONFIRMED' && <CheckCircle2 size={22} />}
                {workflowStep === 'DELIVERY_ARRANGED' && <Truck size={22} />}
                {workflowStep === 'REJECTED' && <XCircle size={22} />}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="buyer-modal-title">
                    {workflowStep === 'CONFIRMATION' && (lang === 'ta' ? 'விளைபொருள் ஆர்டர் உறுதிப்படுத்தல்' : 'Order Confirmation')}
                    {workflowStep === 'PENDING_APPROVAL' && (lang === 'ta' ? 'விவசாயி ஒப்புதலுக்கு காத்திருக்கிறது' : 'Order Placed - Pending Farmer Approval')}
                    {workflowStep === 'CONFIRMED' && (lang === 'ta' ? 'விவசாயி ஒப்புதல் வழங்கினார்' : 'Order Confirmed - Farmer Approved')}
                    {workflowStep === 'DELIVERY_ARRANGED' && (lang === 'ta' ? 'விநியோகம் ஏற்பாடு செய்யப்பட்டது' : 'Delivery Dispatch Arranged')}
                    {workflowStep === 'REJECTED' && (lang === 'ta' ? 'ஆர்டர் நிராகரிக்கப்பட்டது' : 'Order Rejected by Farmer')}
                  </h3>
                </div>
                <p className="buyer-modal-subtitle">
                  {workflowStep === 'CONFIRMATION' && 'Review produce details, adjust consignment quantity, and set delivery address.'}
                  {workflowStep === 'PENDING_APPROVAL' && `Reference: ${activeWorkflowOrder?.orderId || 'NU-2026-PENDING'} • Awaiting farmer confirmation`}
                  {workflowStep === 'CONFIRMED' && `Reference: ${activeWorkflowOrder?.orderId} • Produce reserved successfully`}
                  {workflowStep === 'DELIVERY_ARRANGED' && `Reference: ${activeWorkflowOrder?.orderId} • Ready for EV logistics dispatch`}
                  {workflowStep === 'REJECTED' && `Reference: ${activeWorkflowOrder?.orderId} • Farmer unavailable for this consignment`}
                </p>
              </div>

              <button
                type="button"
                className="buyer-modal-close-btn"
                onClick={handleCloseWorkflow}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="buyer-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* CROP SUMMARY MINI CARD (Always visible for clarity) */}
              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  marginBottom: '16px'
                }}
              >
                <img
                  src={crop.image || FALLBACK_CROP_IMG}
                  alt={crop.name || crop.cropName}
                  style={{
                    width: '84px',
                    height: '84px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_CROP_IMG;
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        background: '#dcfce7',
                        color: '#15803d'
                      }}
                    >
                      {crop.grade || 'Grade A'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={12} /> {crop.location || crop.hubName || crop.hub || 'Tamil Nadu Hub'}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 2px 0', fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                    {crop.name || crop.cropName}{' '}
                    {(crop.tamilName || crop.tamilCropName) && (
                      <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#64748b' }}>
                        ({crop.tamilName || crop.tamilCropName})
                      </span>
                    )}
                  </h4>

                  <p style={{ margin: '0 0 4px 0', fontSize: '0.82rem', color: '#475569' }}>
                    👤 <strong>Farmer:</strong> {crop.farmer?.name || crop.farmerName || 'Ravi Kumar'}
                    {crop.farmer?.location ? ` (${crop.farmer.location})` : ''}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.86rem' }}>
                    <span style={{ fontWeight: '700', color: '#166534' }}>
                      ₹{unitPrice} <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b' }}>/ kg</span>
                    </span>
                    <span style={{ color: '#64748b' }}>
                      Available Stock: <strong style={{ color: '#0f172a' }}>{maxStock} kg</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* ===============================================================
                  STEP 2: ORDER CONFIRMATION FORM
                  =============================================================== */}
              {workflowStep === 'CONFIRMATION' && (
                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Quantity Selector Section */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label htmlFor="workflow-qty-input" style={{ fontWeight: '700', fontSize: '0.88rem', color: '#0f172a' }}>
                        {lang === 'ta' ? 'தேவையான அளவு (கிலோ) *' : 'Consignment Quantity (kg) *'}
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          id="workflow-qty-input"
                          type="number"
                          min={minStock}
                          max={maxStock}
                          step={5}
                          value={orderQuantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setOrderQuantity(val);
                            if (validationError) setValidationError('');
                          }}
                          style={{
                            width: '100px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1.5px solid #22c55e',
                            fontWeight: '700',
                            fontSize: '1rem',
                            textAlign: 'right',
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontWeight: '600', color: '#64748b' }}>{lang === 'ta' ? 'கிலோ' : 'kg'}</span>
                      </div>
                    </div>

                    {/* Range Slider */}
                    <input
                      type="range"
                      min={minStock}
                      max={maxStock}
                      step={5}
                      value={orderQuantity}
                      onChange={(e) => {
                        setOrderQuantity(Number(e.target.value));
                        if (validationError) setValidationError('');
                      }}
                      style={{ width: '100%', accentColor: '#166534', cursor: 'pointer' }}
                    />

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {presets.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setOrderQuantity(p);
                            if (validationError) setValidationError('');
                          }}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            border: orderQuantity === p ? '1.5px solid #166534' : '1px solid #cbd5e1',
                            background: orderQuantity === p ? '#dcfce7' : '#ffffff',
                            color: orderQuantity === p ? '#166534' : '#475569',
                            fontWeight: '600',
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          {p === maxStock ? `${lang === 'ta' ? 'அதிகபட்சம்' : 'Max'} (${p} kg)` : `${p} kg`}
                        </button>
                      ))}
                    </div>

                    {/* Total Price Banner */}
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '12px 14px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '600', display: 'block' }}>
                          {lang === 'ta' ? 'மொத்த தொகை கணக்கீடு' : 'Calculated Total Price'}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#15803d' }}>
                          {orderQuantity} kg × ₹{unitPrice}/kg ({lang === 'ta' ? 'இடைத்தரகர் கமிஷன் இல்லை' : 'Zero middleman markup'})
                        </span>
                      </div>
                      <span style={{ fontSize: '1.35rem', fontWeight: '900', color: '#15803d' }}>
                        ₹{calculatedTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Address & Preferred Date */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label
                        htmlFor="workflow-delivery-address"
                        style={{ display: 'block', fontWeight: '700', fontSize: '0.84rem', color: '#0f172a', marginBottom: '6px' }}
                      >
                        {lang === 'ta' ? 'டெலிவரி முகவரி *' : 'Delivery Address *'}
                      </label>
                      <textarea
                        id="workflow-delivery-address"
                        rows={2}
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        placeholder={lang === 'ta' ? 'உங்கள் சமையலறை அல்லது வணிக முகவரியை உள்ளிடவும்...' : 'Enter full commercial kitchen or hotel receiving address...'}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.88rem',
                          fontFamily: 'inherit',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div>
                        <label
                          htmlFor="workflow-delivery-date"
                          style={{ display: 'block', fontWeight: '700', fontSize: '0.84rem', color: '#0f172a', marginBottom: '6px' }}
                        >
                          <Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                          {lang === 'ta' ? 'விருப்பமான டெலிவரி தேதி *' : 'Preferred Delivery Date *'}
                        </label>
                        <input
                          id="workflow-delivery-date"
                          type="date"
                          value={preferredDeliveryDate}
                          min={todayDateStr}
                          onChange={(e) => {
                            setPreferredDeliveryDate(e.target.value);
                            if (validationError) setValidationError('');
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.88rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="workflow-notes"
                          style={{ display: 'block', fontWeight: '700', fontSize: '0.84rem', color: '#0f172a', marginBottom: '6px' }}
                        >
                          <FileText size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                          {lang === 'ta' ? 'கூடுதல் குறிப்புகள் (விருப்பத்தேர்வு)' : 'Optional Delivery Notes'}
                        </label>
                        <input
                          id="workflow-notes"
                          type="text"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder={lang === 'ta' ? 'எ.கா. சமையலறை கேட் எண் 2-ல் இறக்கவும்' : 'e.g. Unload at Kitchen Dock Gate 2'}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.88rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Validation Error Banner */}
                  {validationError && (
                    <div
                      style={{
                        padding: '10px 14px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#b91c1c',
                        fontSize: '0.84rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Modal Action Buttons: Confirm Order, Cancel and Back */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      marginTop: '6px',
                      paddingTop: '14px',
                      borderTop: '1px solid #e2e8f0',
                      gap: '10px'
                    }}
                  >
                    <button
                      type="button"
                      className="buyer-btn-outline"
                      onClick={handleCloseWorkflow}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ChevronLeft size={16} />
                      <span>{lang === 'ta' ? 'திரும்பு / ரத்து' : 'Back / Cancel'}</span>
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="buyer-btn-secondary"
                        onClick={handleCloseWorkflow}
                        style={{ padding: '8px 16px', borderRadius: '10px' }}
                      >
                        {lang === 'ta' ? 'ரத்து' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="buyer-btn-primary"
                        disabled={isSubmittingOrder}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 22px',
                          borderRadius: '10px',
                          fontWeight: '700'
                        }}
                      >
                        {isSubmittingOrder ? (
                          <span>{lang === 'ta' ? 'பதிவாகிறது...' : 'Submitting...'}</span>
                        ) : (
                          <>
                            <CreditCard size={16} />
                            <span>
                              {lang === 'ta'
                                ? `தொகையை செலுத்தி உறுதிசெய் (₹${calculatedTotal.toLocaleString('en-IN')})`
                                : `Pay & Confirm Order (₹${calculatedTotal.toLocaleString('en-IN')})`}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ===============================================================
                  STEP 3: DEMO FARMER APPROVAL PANEL (Order Pending)
                  =============================================================== */}
              {workflowStep === 'PENDING_APPROVAL' && activeWorkflowOrder && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Success Alert Banner */}
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      color: '#92400e'
                    }}
                  >
                    <CheckCircle2 size={20} style={{ color: '#d97706', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.92rem', marginBottom: '2px' }}>
                        Order Created Successfully: {activeWorkflowOrder.orderId}
                      </strong>
                      <span style={{ fontSize: '0.84rem' }}>
                        Order status is currently set to{' '}
                        <code style={{ background: '#fde68a', padding: '1px 6px', borderRadius: '4px' }}>
                          {formatOrderStatus('PENDING_FARMER_APPROVAL')}
                        </code>
                        . Delivery status is{' '}
                        <code style={{ background: '#fde68a', padding: '1px 6px', borderRadius: '4px' }}>
                          {formatOrderStatus('NOT_ASSIGNED')}
                        </code>
                        .
                      </span>
                    </div>
                  </div>

                  {/* Order Spec Grid */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>Order Reference</span>
                      <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{activeWorkflowOrder.orderId}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>Total Price</span>
                      <strong style={{ color: '#166534' }}>₹{activeWorkflowOrder.totalPrice?.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>Quantity</span>
                      <span>{activeWorkflowOrder.quantityKg} kg</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>Preferred Date</span>
                      <span>{activeWorkflowOrder.preferredDeliveryDate || 'Immediate'}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748b', fontSize: '0.76rem', display: 'block' }}>Delivery Address</span>
                      <span style={{ color: '#334155' }}>{activeWorkflowOrder.deliveryAddress}</span>
                    </div>
                    <div
                      style={{
                        gridColumn: 'span 2',
                        background: '#f0fdf4',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #bbf7d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldCheck size={16} color="#166534" />
                        <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>
                          {lang === 'ta' ? 'எஸ்க்ரோவில் பணம் பாதுகாக்கப்பட்டுள்ளது' : 'Agri-Escrow Secured'}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#15803d' }}>
                          • {activeWorkflowOrder.paymentMethod || 'UPI (Google Pay)'}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#166534', fontWeight: 700 }}>
                        {activeWorkflowOrder.transactionRef || 'TXN-UPI-SECURED'}
                      </span>
                    </div>
                  </div>

                  {/* DEMO MODE FARMER APPROVAL PANEL */}
                  <div
                    style={{
                      padding: '18px',
                      background: '#fffbeb',
                      border: '2px dashed #f59e0b',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          background: '#f59e0b',
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          letterSpacing: '0.5px'
                        }}
                      >
                        DEMO MODE: Farmer Dashboard Not Available
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f', lineHeight: 1.45 }}>
                      Since the Farmer Dashboard has not been developed yet, simulate the grower's response below to test the full lifecycle. These are simulated actions, not real farmer decisions.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleSimulateFarmerApproval(activeWorkflowOrder.orderId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '11px 16px',
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                        }}
                      >
                        <Check size={16} />
                        <span>Simulate Farmer Approval</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSimulateFarmerRejection(activeWorkflowOrder.orderId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '11px 16px',
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.2)'
                        }}
                      >
                        <X size={16} />
                        <span>Simulate Farmer Rejection</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button type="button" className="buyer-btn-outline" onClick={handleCloseWorkflow}>
                      Close & Keep Order Pending
                    </button>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  STEP 4: DEMO DELIVERY ARRANGEMENT (After Farmer Approval)
                  =============================================================== */}
              {workflowStep === 'CONFIRMED' && activeWorkflowOrder && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Approval Success Alert */}
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      color: '#15803d'
                    }}
                  >
                    <CheckCircle2 size={20} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.92rem', marginBottom: '2px' }}>
                        Farmer Approval Simulated: Order #{activeWorkflowOrder.orderId}
                      </strong>
                      <span style={{ fontSize: '0.84rem' }}>
                        Order status is now{' '}
                        <code style={{ background: '#dcfce7', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                          {formatOrderStatus('CONFIRMED')}
                        </code>
                        . Delivery status is currently{' '}
                        <code style={{ background: '#e2e8f0', padding: '1px 6px', borderRadius: '4px' }}>
                          {formatOrderStatus('NOT_ASSIGNED')}
                        </code>
                        . Proceed with delivery arrangement to unlock shipment tracking.
                      </span>
                    </div>
                  </div>

                  {/* Order & Delivery Summary Details */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '10px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.76rem' }}>Produce Lot</span>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>
                        {activeWorkflowOrder.cropName} ({activeWorkflowOrder.quantityKg} kg)
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.76rem' }}>Order Total</span>
                      <div style={{ fontWeight: '800', color: '#166534' }}>
                        ₹{activeWorkflowOrder.totalPrice?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748b', fontSize: '0.76rem' }}>Delivery Destination</span>
                      <div style={{ color: '#334155' }}>{activeWorkflowOrder.deliveryAddress}</div>
                    </div>
                  </div>

                  {/* Delivery Arrangement Simulation Section */}
                  <div
                    style={{
                      padding: '18px',
                      background: '#eff6ff',
                      border: '2px solid #bfdbfe',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          background: '#2563eb',
                          color: '#ffffff',
                          fontWeight: '800',
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        LOGISTICS DISPATCH ARRANGEMENT
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.45 }}>
                      Assign an EV Cargo dispatch vehicle and mark consignment as ready for pickup. Once arranged, shipment tracking will be enabled on the existing Delivery Status page.
                    </p>

                    <button
                      type="button"
                      onClick={() => handleSimulateDeliveryArrangement(activeWorkflowOrder.orderId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      <Truck size={18} />
                      <span>Simulate Delivery Arrangement</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  STEP 5: DELIVERY ARRANGED -> CONNECT TO EXISTING DELIVERY STATUS
                  =============================================================== */}
              {workflowStep === 'DELIVERY_ARRANGED' && activeWorkflowOrder && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Delivery Ready Alert */}
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      color: '#15803d'
                    }}
                  >
                    <CheckCircle2 size={20} style={{ color: '#16a34a', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.92rem', marginBottom: '2px' }}>
                        Demo Delivery Arrangement Completed!
                      </strong>
                      <span style={{ fontSize: '0.84rem' }}>
                        Delivery status updated to{' '}
                        <code style={{ background: '#dcfce7', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                          {formatOrderStatus('READY_FOR_PICKUP')}
                        </code>
                        . Consignment is packaged and assigned to EV fleet logistics driver.
                      </span>
                    </div>
                  </div>

                  {/* Assigned Driver Card */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1e293b'
                        }}
                      >
                        <User size={22} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                          {activeWorkflowOrder.driver?.name || 'Kumar M.'}
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {activeWorkflowOrder.driver?.vehicleType || activeWorkflowOrder.driver?.vehicle || 'Tata Ace EV Cargo'} •{' '}
                          {activeWorkflowOrder.driver?.vehicleNumber || 'TN 57 AB 1234'}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: '4px 10px',
                          background: '#fef3c7',
                          border: '1px solid #fde68a',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}
                      >
                        <span style={{ fontSize: '0.68rem', color: '#92400e', display: 'block', fontWeight: '600' }}>
                          HANDOVER PIN
                        </span>
                        <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#b45309' }}>
                          {activeWorkflowOrder.driver?.deliveryPin || '4892'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* VIEW DELIVERY STATUS BUTTON: DIRECT CONNECTION */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleGoToDeliveryStatus(activeWorkflowOrder.orderId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '14px 20px',
                        background: '#166534',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(22, 101, 52, 0.3)'
                      }}
                    >
                      <Truck size={20} />
                      <span>View Delivery Status</span>
                    </button>

                    <button
                      type="button"
                      className="buyer-btn-outline"
                      onClick={handleCloseWorkflow}
                      style={{ padding: '10px 16px', borderRadius: '10px' }}
                    >
                      Close & Browse Marketplace
                    </button>
                  </div>
                </div>
              )}

              {/* ===============================================================
                  REJECTED STATE
                  =============================================================== */}
              {workflowStep === 'REJECTED' && activeWorkflowOrder && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    style={{
                      padding: '16px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      color: '#991b1b'
                    }}
                  >
                    <XCircle size={22} style={{ color: '#dc2626', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>
                        Order #{activeWorkflowOrder.orderId} Declined by Farmer
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5, color: '#7f1d1d' }}>
                        Simulated farmer rejection completed. Order status changed to <strong>{formatOrderStatus('REJECTED')}</strong>. Delivery tracking is prevented, and reserved produce stock has been released back to the marketplace catalog.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="buyer-btn-primary"
                      onClick={handleCloseWorkflow}
                      style={{ padding: '10px 20px', borderRadius: '10px' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Demo Agri-Escrow Payment Gateway Modal */}
      <DemoPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={calculatedTotal}
        orderId={activeWorkflowOrder?.orderId || `NU-2026-${Math.floor(10000 + Math.random() * 90000)}`}
        cropName={workflowCrop?.name || 'Produce'}
        quantityKg={orderQuantity}
        lang={lang}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}
