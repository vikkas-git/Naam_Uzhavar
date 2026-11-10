// What this file does: Centered popup modal for farmer order details ("pop message").
// Replaces the side-coming drawer with a centered modal dialog while preserving essential commercial details.

import React from 'react';
import {
  PackageCheck,
  MapPin,
  Calendar,
  Phone,
  Truck,
  X,
  ShieldCheck,
  Landmark
} from 'lucide-react';
import Modal from '../Modal';
import { formatDisplayOrderId } from '../../utils/orderId';
import { resolveCropFallbackImage } from '../../services/cropService';

export default function OrderDetailsDrawer({ order, isOpen, onClose, onClaimPayout, lang }) {
  if (!order) return null;

  const o = order;
  const b = o.buyerDetails || {};
  const c = o.cropDetails || {};
  const d = o.driver || {};

  // Produce info
  const cropName = c.name || o.cropName || o.displayCrop || (lang === 'ta' ? 'பயிர்' : 'Produce');
  const cropVariety = c.variety ? `${c.variety} • ${c.grade || 'Grade A'}` : (c.grade || 'Grade A');
  const cropImage = c.image || o.image || resolveCropFallbackImage(cropName);

  // Quantitative info with full multi-source fallback
  const rawQty = o.quantityKg ?? o.quantity ?? o.qty ?? o.displayQty ?? c.quantity ?? 0;
  const quantity = Number(rawQty) || 0;
  const unit = o.unit || o.displayUnit || c.unit || 'Kg';

  const rawPrice = o.pricePerUnit ?? o.offeredPrice ?? o.pricePerKg ?? o.price ?? o.displayPrice ?? c.pricePerKg ?? c.price ?? 0;
  const price = Number(rawPrice) || 0;

  const calculatedTotal = quantity > 0 && price > 0 ? quantity * price : 0;
  const rawTotal = o.totalPrice ?? o.totalEstimatedValue ?? o.totalAmount ?? o.total ?? calculatedTotal;
  const total = Number(rawTotal) || calculatedTotal || 0;

  // Buyer info
  const buyerName = b.businessName || o.buyerName || o.displayBuyer || (lang === 'ta' ? 'வணிக வாங்குபவர்' : 'Commercial Buyer');
  const contactPerson = b.contactPerson || o.contactPerson || b.buyerType || (lang === 'ta' ? 'கொள்முதல் பிரிவு' : 'Procurement');
  const phone = b.phone || o.phone || '+91 98421 22345';
  const deliveryAddress = o.deliveryAddress || o.deliveryLocation || o.displayLocation || b.address || b.location || 'Coimbatore';
  const deliveryDate = o.preferredDeliveryDate || o.deliveryDate || o.pickupDate || o.displayDate || '2026-11-03';

  // Status info
  const statusRaw = o.orderStatus || o.deliveryStatus || o.displayStatus || o.status || 'CONFIRMED';
  const isPending = statusRaw === 'PENDING' || statusRaw === 'PENDING_FARMER_APPROVAL';
  const isDelivered = statusRaw === 'DELIVERED';
  const isCancelled = statusRaw === 'CANCELLED' || statusRaw === 'REJECTED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideHeader
      centered
      size="md"
      dialogClassName="order-details-modal-dialog"
      style={{ fontFamily: 'var(--buyer-font)' }}
    >
      <div style={{ position: 'relative', padding: '18px 20px' }}>
        {/* Top Close 'X' Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'transparent',
            border: 'none',
            color: 'var(--buyer-text-dim, #667085)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6
          }}
          aria-label={lang === 'ta' ? 'மூடு' : 'Close'}
        >
          <X size={20} />
        </button>

        {/* 1. HEADER: Order ID + Status Badge */}
        <div className="d-flex align-items-center gap-3 mb-3 pe-4">
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              backgroundColor: 'var(--buyer-accent-subtle, #eaf3ec)',
              color: 'var(--buyer-primary, #2F6B3A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <PackageCheck size={22} />
          </div>

          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2">
              <span className="font-mono fw-bold fs-6" style={{ color: 'var(--buyer-text-main, #1f2933)' }}>
                #{formatDisplayOrderId(o.orderId || o.requestId)}
              </span>
              <span
                className={`status-pill ${
                  isDelivered ? 'success' : isCancelled ? 'danger' : isPending ? 'pending' : 'success'
                }`}
              >
                {isPending
                  ? (lang === 'ta' ? 'நிலுவையில்' : 'Pending Approval')
                  : isDelivered
                  ? (lang === 'ta' ? 'வழங்கப்பட்டது' : 'Delivered')
                  : isCancelled
                  ? (lang === 'ta' ? 'ரத்து செய்யப்பட்டது' : 'Cancelled')
                  : (lang === 'ta' ? 'உறுதியானது' : 'Confirmed')}
              </span>
            </div>
            <div className="text-muted small" style={{ fontSize: '0.76rem', marginTop: 2 }}>
              {lang === 'ta' ? 'வணிக ஆர்டர் விவரங்கள்' : 'Commercial Order Summary'}
            </div>
          </div>
        </div>

        {/* 2. PRODUCE & PRICING SUMMARY CARD */}
        <div
          style={{
            border: '1px solid var(--buyer-border-light, #e3e3dd)',
            borderRadius: 'var(--buyer-radius-lg, 12px)',
            padding: 14,
            backgroundColor: '#ffffff',
            marginBottom: 12
          }}
        >
          <div className="d-flex align-items-center gap-3 mb-2.5">
            <img
              src={cropImage}
              alt={cropName}
              style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }}
            />
            <div>
              <strong style={{ fontSize: '0.98rem', color: 'var(--buyer-text-main, #1f2933)' }}>
                {cropName}
              </strong>
              <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                {cropVariety}
              </div>
            </div>
          </div>

          {/* 3 Metrics Box */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              backgroundColor: 'var(--buyer-bg-card, #f8fafc)',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--buyer-border-light, #e3e3dd)'
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--buyer-text-dim, #667085)', textTransform: 'uppercase', fontWeight: 700 }}>
                {lang === 'ta' ? 'அளவு' : 'Quantity'}
              </span>
              <div className="fw-bold font-mono" style={{ fontSize: '0.96rem', marginTop: 2, color: 'var(--buyer-text-main, #1f2933)' }}>
                {quantity > 0 ? `${quantity.toLocaleString('en-IN')} ${unit}` : `-- ${unit}`}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--buyer-text-dim, #667085)', textTransform: 'uppercase', fontWeight: 700 }}>
                {lang === 'ta' ? 'விலை' : 'Unit Price'}
              </span>
              <div className="fw-bold font-mono" style={{ fontSize: '0.96rem', marginTop: 2, color: 'var(--buyer-text-main, #1f2933)' }}>
                {price > 0 ? `₹${price.toLocaleString('en-IN')} / ${unit}` : `-- / ${unit}`}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--buyer-text-dim, #667085)', textTransform: 'uppercase', fontWeight: 700 }}>
                {lang === 'ta' ? 'மொத்தம்' : 'Total Amount'}
              </span>
              <div className="fw-bold font-mono text-success" style={{ fontSize: '1.05rem', marginTop: 2 }}>
                ₹{(total || calculatedTotal).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Escrow Payment Status Row */}
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              background: o.paymentStatus === 'RELEASED_TO_FARMER' ? '#f0fdf4' : '#fffbeb',
              border: o.paymentStatus === 'RELEASED_TO_FARMER' ? '1px solid #bbf7d0' : '1px solid #fde68a',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color={(o.paymentStatus === 'RELEASED_TO_FARMER' || o.paymentStatus === 'PAID') ? '#166534' : '#b45309'} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: (o.paymentStatus === 'RELEASED_TO_FARMER' || o.paymentStatus === 'PAID') ? '#166534' : '#b45309' }}>
                {(o.paymentStatus === 'RELEASED_TO_FARMER' || o.paymentStatus === 'PAID')
                  ? (lang === 'ta' ? 'வங்கிக்கு வரவு வைக்கப்பட்டது ✓' : 'Settled to Bank Account ✓')
                  : (lang === 'ta' ? 'பணம் நிலுவையில் உள்ளது' : 'Payment Pending')}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                • {o.paymentMethod || 'UPI Payment'}
              </span>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
              {o.utrNumber || o.transactionRef || 'BANK-REF'}
            </span>
          </div>

          {o.paymentStatus !== 'RELEASED_TO_FARMER' && o.paymentStatus !== 'PAID' && onClaimPayout && (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="farmer-claim-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '8px 14px' }}
                onClick={() => onClaimPayout(o)}
              >
                <Landmark size={14} />
                <span>{lang === 'ta' ? 'வங்கிக்கு பணம் மாற்று' : 'Claim Payout to Bank Account'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. BUYER & DELIVERY LOCATION CARD */}
        <div
          style={{
            border: '1px solid var(--buyer-border-light, #e3e3dd)',
            borderRadius: 'var(--buyer-radius-lg, 12px)',
            padding: 14,
            backgroundColor: '#ffffff',
            marginBottom: 12
          }}
        >
          <h5
            style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--buyer-text-dim, #667085)',
              marginBottom: 8,
              letterSpacing: '0.03em'
            }}
          >
            {lang === 'ta' ? 'வாங்குபவர் & விநியோகம்' : 'Buyer & Delivery Information'}
          </h5>

          <div className="fw-bold" style={{ fontSize: '0.94rem', color: 'var(--buyer-text-main, #1f2933)' }}>
            {buyerName}
          </div>
          <div className="text-muted small mb-2" style={{ fontSize: '0.78rem' }}>
            {contactPerson}
          </div>

          <div className="d-flex flex-column gap-2 pt-2 border-top" style={{ fontSize: '0.82rem' }}>
            <div className="d-flex align-items-start gap-2">
              <MapPin size={14} className="text-success flex-shrink-0 mt-0.5" />
              <span style={{ color: 'var(--buyer-text-main, #1f2933)' }}>{deliveryAddress}</span>
            </div>

            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-1.5">
                <Phone size={13} className="text-muted" />
                <a
                  href={`tel:${phone}`}
                  className="font-mono text-decoration-none fw-semibold"
                  style={{ color: 'var(--buyer-primary, #2F6B3A)' }}
                >
                  {phone}
                </a>
              </div>

              <div className="d-flex align-items-center gap-1.5 text-muted small">
                <Calendar size={13} />
                <span>{lang === 'ta' ? 'விநியோகம்:' : 'Delivery:'} {deliveryDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. EV FLEET LOGISTICS DRIVER (Only if assigned) */}
        {d.name && (
          <div
            style={{
              border: '1px solid var(--buyer-border-light, #e3e3dd)',
              borderRadius: 'var(--buyer-radius-lg, 12px)',
              padding: 12,
              backgroundColor: '#fcfdfd',
              marginBottom: 12
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2.5">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: 'var(--buyer-accent-subtle, #eaf3ec)',
                    color: 'var(--buyer-primary, #2F6B3A)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Truck size={16} />
                </div>
                <div>
                  <div className="fw-bold small">{d.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>{d.vehicle}</div>
                </div>
              </div>
              {d.deliveryPin && (
                <div className="text-end">
                  <span className="text-muted" style={{ fontSize: '0.66rem', fontWeight: 600 }}>DELIVERY PIN</span>
                  <div className="font-mono fw-bold text-success" style={{ fontSize: '0.9rem' }}>{d.deliveryPin}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. FOOTER CLOSE BUTTON */}
        <div className="pt-1">
          <button
            type="button"
            className="buyer-btn-outline w-100"
            style={{ minHeight: 38, fontWeight: 700 }}
            onClick={onClose}
          >
            <span>{lang === 'ta' ? 'மூடு' : 'Close'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
