// What this file does: Comprehensive detail view modal for a Buyer Purchase Request.
// Displays complete buyer verification, crop specifications, offered price, notes, and actions.

import React from 'react';
import {
  X,
  ShoppingBag,
  MapPin,
  Calendar,
  ShieldCheck,
  Phone,
  Check,
  XCircle
} from 'lucide-react';
import Modal from '../Modal';
import { formatDisplayOrderId } from '../../utils/orderId';
import { formatOrderStatus } from '../../utils/helpers';

export default function RequestDetailsModal({ request, onClose, onAccept, onReject, lang }) {
  if (!request) return null;

  const isPending = request.status === 'PENDING';
  const isAccepted = request.status === 'ACCEPTED' || request.status === 'CONVERTED_TO_ORDER';
  const isRejected = request.status === 'REJECTED';

  const b = request.buyerDetails || {};
  const c = request.cropDetails || {};

  return (
    <Modal isOpen={Boolean(request)} onClose={onClose} size="lg" hideHeader centered>
      <div style={{ padding: '24px 20px', position: 'relative' }}>
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
            cursor: 'pointer'
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header with Request ID & Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: 'var(--buyer-accent-subtle, #eaf3ec)',
              color: 'var(--buyer-primary, #2F6B3A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="font-mono fw-bold text-muted small">
                #{request.requestId} {request.orderId && `• Order #${formatDisplayOrderId(request.orderId)}`}
              </span>
              <span className={`status-pill ${isPending ? 'pending' : isAccepted ? 'success' : 'danger'}`}>
                {formatOrderStatus(request.status)}
              </span>
            </div>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--buyer-font)' }}>
              {lang === 'ta' ? 'வாங்குபவர் கொள்முதல் கோரிக்கை' : 'Buyer Purchase Request'}
            </h3>
          </div>
        </div>

        {/* Section A: Buyer Information */}
        <div
          style={{
            backgroundColor: 'var(--buyer-bg-card, #f8fafc)',
            border: '1px solid var(--buyer-border-light, #e3e3dd)',
            borderRadius: 'var(--buyer-radius-lg, 12px)',
            padding: 16,
            marginBottom: 16
          }}
        >
          <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--buyer-text-main, #1f2933)', marginBottom: 10 }}>
            {lang === 'ta' ? 'வாங்குபவர் விவரங்கள்' : 'Buyer Profile & Establishment'}
          </h4>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <img
              src={b.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80'}
              alt={b.businessName}
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--buyer-primary, #2F6B3A)' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: '1rem', color: 'var(--buyer-text-main, #1f2933)' }}>{b.businessName}</strong>
                {b.verified && (
                  <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1" style={{ fontSize: '0.68rem' }}>
                    <ShieldCheck size={11} />
                    Verified
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--buyer-text-dim, #667085)' }}>
                {b.contactPerson} • {b.buyerType}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--buyer-text-dim, #667085)', display: 'flex', gap: 14, marginTop: 4 }}>
                <span className="d-flex align-items-center gap-1">
                  <MapPin size={12} /> {b.location || request.deliveryLocation}
                </span>
                <span className="d-flex align-items-center gap-1 font-mono">
                  <Phone size={12} /> {b.phone || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section B: Produce & Commercial Terms Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            border: '1px solid var(--buyer-border-light, #e3e3dd)',
            borderRadius: 'var(--buyer-radius-lg, 12px)',
            padding: 16,
            marginBottom: 16
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'கோரப்பட்ட பயிர்' : 'Requested Crop'}
            </span>
            <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>
              {c.name || request.cropName}
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--buyer-text-dim, #667085)' }}>
              {c.variety || 'Commercial'} • {c.grade || 'Grade A'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'தேவையான அளவு' : 'Required Quantity'}
            </span>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'JetBrains Mono, monospace' }}>
              {request.quantity} {request.unit || 'Kg'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'வாங்குபவர் வழங்கும் விலை' : 'Buyer Offered Price'}
            </span>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--buyer-primary, #2F6B3A)' }}>
              ₹{request.offeredPrice} / {request.unit || 'Kg'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'மொத்த மதிப்பீடு' : 'Total Order Value'}
            </span>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--buyer-text-main, #1f2933)' }}>
              ₹{(request.totalEstimatedValue || request.offeredPrice * request.quantity).toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'கோரிய விநியோகத் தேதி' : 'Preferred Delivery Date'}
            </span>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} className="text-muted" />
              {request.preferredDeliveryDate || 'Immediate'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'கோரிக்கை பெறப்பட்ட நேரம்' : 'Request Received'}
            </span>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--buyer-text-dim, #667085)' }}>
              {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Today'}
            </div>
          </div>
        </div>

        {/* Section C: Additional Buyer Notes */}
        {request.notes && (
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 700, textTransform: 'uppercase' }}>
              {lang === 'ta' ? 'வாங்குபவர் கூடுதல் குறிப்புகள்' : 'Buyer Procurement Notes:'}
            </span>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--buyer-text-main, #1f2933)', backgroundColor: 'var(--buyer-bg-card, #f8fafc)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--buyer-border-light, #e3e3dd)' }}>
              "{request.notes}"
            </p>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--buyer-border-light, #e3e3dd)', paddingTop: 14 }}>
          {isPending ? (
            <>
              <button
                type="button"
                className="buyer-btn-danger"
                onClick={() => {
                  onClose();
                  onReject(request);
                }}
              >
                <XCircle size={15} />
                <span>{lang === 'ta' ? 'மறுக்க' : 'Decline Request'}</span>
              </button>
              <button
                type="button"
                className="buyer-btn-primary"
                onClick={() => {
                  onClose();
                  onAccept(request.requestId || request.orderId || request.id || request._id);
                }}
              >
                <Check size={15} />
                <span>{lang === 'ta' ? 'ஏற்றுக்கொண்டு ஆர்டராக்கு' : 'Accept & Create Order'}</span>
              </button>
            </>
          ) : (
            <button type="button" className="buyer-btn-outline" onClick={onClose}>
              <span>{lang === 'ta' ? 'மூடு' : 'Close'}</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

