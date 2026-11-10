// src/components/farmer/FarmerPayoutModal.jsx
// What this file does: Real-world, Flipkart Seller Hub-inspired Instant Bank Payout modal.
// Clean, user-friendly, zero developer clutter, authentic IMPS bank transfer simulation with instant SBI SMS alert.

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  X,
  CreditCard,
  Smartphone,
  Landmark,
  Printer,
  FileText,
  Clock,
  Check
} from 'lucide-react';
import Modal from '../Modal';
import { playPaymentSuccessChime } from '../../utils/paymentAudio';

export default function FarmerPayoutModal({
  isOpen,
  onClose,
  order,
  profile,
  lang = 'en',
  onPayoutSuccess
}) {
  const [payoutState, setPayoutState] = useState('IDLE'); // 'IDLE' | 'PROCESSING' | 'SUCCESS'
  const [generatedUtr, setGeneratedUtr] = useState('');
  const [showSmsAlert, setShowSmsAlert] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPayoutState('IDLE');
      setGeneratedUtr('');
      setShowSmsAlert(false);
    }
  }, [isOpen]);

  if (!order || !isOpen) return null;

  const bank = profile?.bankDetails || {
    bankName: 'State Bank of India',
    accountNumber: '30495821034',
    ifscCode: 'SBIN0001248',
    accountHolderName: profile?.name || 'Ramesh Kumar',
    branchName: 'Pollachi Bazaar'
  };

  const maskedAccount = bank.accountNumber
    ? `•••• ${bank.accountNumber.slice(-4)}`
    : '•••• 1034';

  const rawQty = order.quantityKg ?? order.quantity ?? 0;
  const rawPrice = order.pricePerUnit || order.cropDetails?.pricePerKg || order.offeredPrice || 0;
  const calculatedTotal = Number(rawQty) * Number(rawPrice);
  const totalAmount = Number(order.totalPrice ?? order.totalEstimatedValue ?? calculatedTotal) || 0;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  const handleProcessPayout = () => {
    setPayoutState('PROCESSING');

    timerRef.current = setTimeout(() => {
      const utr = `UTR-SBIN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedUtr(utr);
      setPayoutState('SUCCESS');
      setShowSmsAlert(true);

      // Authentic payment sound chime
      playPaymentSuccessChime();

      // Confetti celebration
      triggerConfetti();

      if (onPayoutSuccess) {
        onPayoutSuccess({
          orderId: order.orderId || order.id,
          amount: totalAmount,
          utrNumber: utr,
          method: 'Instant Bank Transfer (IMPS)',
          claimedAt: new Date().toISOString()
        });
      }
    }, 1400);
  };

  const handlePrintAdvice = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={payoutState === 'PROCESSING' ? undefined : onClose}
      hideHeader
      centered
      size="md"
    >
      <div style={{ padding: '24px 26px', fontFamily: 'var(--buyer-font)', position: 'relative' }}>
        {/* Simulated Real SBI SMS Toast Notification */}
        {showSmsAlert && (
          <div
            className="animate-slide-down"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 18,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <div className="d-flex align-items-center gap-2">
                <span
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4
                  }}
                >
                  📱 SMS ALERT
                </span>
                <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>SBI-INB</strong>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Just now</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#1e293b', lineHeight: 1.45 }}>
              Dear SBI Customer, Your A/c {maskedAccount} has been CREDITED with ₹{totalAmount.toLocaleString('en-IN')}.00 on{' '}
              {new Date().toLocaleDateString('en-GB')} via IMPS (Ref: {generatedUtr}). Available Balance: ₹42,650.00.
            </div>
          </div>
        )}

        {/* Modal Header - Flipkart Seller Hub Clean Header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h5 className="mb-1 fw-bold" style={{ fontSize: '1.15rem', color: '#0f172a' }}>
              {lang === 'ta' ? 'வங்கிக் கணக்கிற்கு பணம் மாற்று' : 'Withdraw to Bank Account'}
            </h5>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
              Order #{order.orderId || order.id} • {order.cropName || order.cropDetails?.name || 'Produce'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={payoutState === 'PROCESSING'}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* PROCESSING STATE */}
        {payoutState === 'PROCESSING' && (
          <div className="text-center py-5">
            <div
              className="spinner-border text-success mb-3"
              role="status"
              style={{ width: '3rem', height: '3rem' }}
            />
            <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem' }}>
              {lang === 'ta' ? 'வங்கிக்கு மாற்றப்படுகிறது...' : 'Transferring to Bank Account...'}
            </h5>
            <p className="text-muted small mb-0" style={{ maxWidth: 340, margin: '0 auto' }}>
              Transferring ₹{totalAmount.toLocaleString('en-IN')} to {bank.bankName} ({maskedAccount}).
            </p>
          </div>
        )}

        {/* SUCCESS STATE - Flipkart Seller Transfer Completed */}
        {payoutState === 'SUCCESS' && (
          <div className="text-center py-2">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#166534',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}
            >
              <CheckCircle2 size={40} />
            </div>

            <h4 className="fw-bold text-success mb-1" style={{ fontSize: '1.25rem' }}>
              {lang === 'ta' ? 'பணம் மாற்றப்பட்டது!' : 'Transfer Successful!'}
            </h4>

            <div className="display-6 fw-bold font-mono text-dark my-2">
              ₹{totalAmount.toLocaleString('en-IN')}
            </div>

            <p className="text-muted small mb-3">
              Credited directly to your verified bank account via instant IMPS.
            </p>

            {/* Clean Transfer Summary Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '14px 18px',
                textAlign: 'left',
                margin: '14px auto',
                fontSize: '0.84rem'
              }}
            >
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">{lang === 'ta' ? 'வங்கி' : 'Transferred To'}</span>
                <strong className="text-dark">{bank.bankName} ({maskedAccount})</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Account Holder</span>
                <span className="text-dark fw-semibold">{bank.accountHolderName}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Transfer Mode</span>
                <span className="text-dark fw-semibold">Instant IMPS (0s)</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted">{lang === 'ta' ? 'பரிவர்த்தனை குறிப்பு (UTR)' : 'Bank Reference (UTR)'}</span>
                <strong className="font-mono text-success">{generatedUtr}</strong>
              </div>
            </div>

            {/* Buttons */}
            <div className="d-flex gap-2 w-100 mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary w-50 d-inline-flex align-items-center justify-content-center gap-2"
                onClick={handlePrintAdvice}
              >
                <Printer size={15} />
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                className="buyer-btn-primary w-50 d-inline-flex align-items-center justify-content-center gap-2"
                style={{ minHeight: 44 }}
                onClick={onClose}
              >
                <span>{lang === 'ta' ? 'முடிந்தது' : 'Done'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* IDLE STATE - Clean Flipkart Seller Payout Screen */}
        {payoutState === 'IDLE' && (
          <div>
            {/* Amount Display */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #eaf8ee 100%)',
                border: '1px solid #bbf7d0',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {lang === 'ta' ? 'மாற்ற வேண்டிய தொகை' : 'Payout Amount'}
                </span>
                <div style={{ fontSize: '0.82rem', color: '#15803d', marginTop: 2 }}>
                  100% Direct Farmer Payment
                </div>
              </div>
              <div className="font-mono fw-bold text-success" style={{ fontSize: '1.75rem' }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Verified Beneficiary Bank Card (Flipkart Seller Style) */}
            <div
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 16
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {lang === 'ta' ? 'பணம் வரவு வைக்கப்படும் கணக்கு' : 'Deposit To Account'}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#166534',
                    background: '#dcfce7',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <Check size={12} /> Primary Bank A/c
                </span>
              </div>

              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Building2 size={22} />
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                    {bank.bankName}
                  </div>
                  <div className="text-muted small" style={{ fontSize: '0.82rem' }}>
                    {bank.accountHolderName} • <span className="font-mono fw-semibold text-dark">{maskedAccount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer Policy Transparency Row (Flipkart Style) */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 20,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#475569'
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <Zap size={15} color="#166534" />
                <span>Instant IMPS Transfer</span>
              </div>
              <div>
                Transfer Fee: <strong className="text-success">₹0 (Free)</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-light"
                style={{ flex: 1, minHeight: 46, borderRadius: 10, fontWeight: 600, color: '#475569' }}
                onClick={onClose}
              >
                <span>{lang === 'ta' ? 'ரத்து' : 'Cancel'}</span>
              </button>

              <button
                type="button"
                className="buyer-btn-primary"
                style={{ flex: 2, minHeight: 46, borderRadius: 10, fontSize: '0.95rem' }}
                onClick={handleProcessPayout}
              >
                <Zap size={16} />
                <span>
                  {lang === 'ta'
                    ? `₹${totalAmount.toLocaleString('en-IN')} வங்கிக்கு மாற்று`
                    : `Transfer ₹${totalAmount.toLocaleString('en-IN')} to Bank`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
