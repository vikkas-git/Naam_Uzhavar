// What this file does: Confirmation and reason modal for rejecting a buyer purchase request.

import React, { useState } from 'react';
import { XCircle, X } from 'lucide-react';
import Modal from '../Modal';

export default function RejectRequestModal({ request, onClose, onConfirm, lang }) {
  const [reason, setReason] = useState('Produce stock currently committed to another order');

  if (!request) return null;

  return (
    <Modal isOpen={Boolean(request)} onClose={onClose} size="sm" hideHeader centered>
      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
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
          <X size={18} />
        </button>

        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#fcebe9',
            color: '#b42318',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12
          }}
        >
          <XCircle size={26} />
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 6px', fontFamily: 'var(--buyer-font)' }}>
          {lang === 'ta' ? 'கோரிக்கையை நிராகரிக்கவா?' : 'Reject Buyer Request?'}
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--buyer-text-dim, #667085)', marginBottom: 16, fontFamily: 'var(--buyer-font)' }}>
          {lang === 'ta'
            ? `${request.buyerDetails?.businessName || 'வணிக வாங்குபவர்'}-ன் கோரிக்கையை நிராகரிக்க விரும்புகிறீர்களா?`
            : `Are you sure you want to decline the request from ${request.buyerDetails?.businessName || 'Buyer'}?`}
        </p>

        <div style={{ textAlign: 'left', marginBottom: 20 }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--buyer-text-main, #1f2933)', marginBottom: 6, display: 'block', fontFamily: 'var(--buyer-font)' }}>
            {lang === 'ta' ? 'நிராகரிப்பு காரணம் (விருப்பத்தேர்வு):' : 'Reason for Rejection (Optional):'}
          </label>
          <select
            className="form-select"
            style={{ borderRadius: 8, borderColor: 'var(--buyer-border-light, #e3e3dd)', fontSize: '0.88rem' }}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="Produce stock currently committed to another order">
              {lang === 'ta' ? 'விளைச்சல் வேறு ஆர்டருக்கு ஒதுக்கப்பட்டுள்ளது' : 'Produce stock currently committed to another order'}
            </option>
            <option value="Offered price is below farm gate expectation">
              {lang === 'ta' ? 'வழங்கப்பட்ட விலை எதிர்பார்க்கும் விலையை விடக் குறைவு' : 'Offered price is below farm gate expectation'}
            </option>
            <option value="Requested delivery date cannot be fulfilled">
              {lang === 'ta' ? 'கோரிய தேதியில் விநியோகம் செய்ய இயலாது' : 'Requested delivery date cannot be fulfilled'}
            </option>
            <option value="Quality grade requested is currently out of season">
              {lang === 'ta' ? 'கோரிய தரம் தற்போது அறுவடையில் இல்லை' : 'Quality grade requested is currently out of season'}
            </option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" className="buyer-btn-outline" onClick={onClose}>
            <span>{lang === 'ta' ? 'ரத்து செய்' : 'Cancel'}</span>
          </button>
          <button
            type="button"
            className="buyer-btn-danger solid"
            onClick={() => {
              onConfirm(request.requestId || request.orderId || request.id || request._id, reason);
              onClose();
            }}
          >
            <span>{lang === 'ta' ? 'நிராகரிக்கவும்' : 'Confirm Reject'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

