// src/components/common/DemoPaymentModal.jsx
// What this file does: Flipkart-style Real-World Payment Gateway simulation.
// Implements Flipkart's signature checkout structure:
// 1. UPI (PhonePe, GPay, Paytm, QR, UPI ID)
// 2. Credit / Debit / ATM Card (with 3D Secure Bank OTP verification)
// 3. Net Banking (All major Indian banks)
// 4. Cash on Delivery (COD) with Flipkart's iconic Captcha verification code
// 5. Authentic sound chime, bank SMS notification, and printable invoice.

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CreditCard,
  Building2,
  Smartphone,
  Lock,
  CheckCircle2,
  X,
  ArrowRight,
  QrCode,
  Printer,
  Clock,
  KeyRound,
  FileText,
  Check,
  Delete,
  Banknote,
  RotateCcw
} from 'lucide-react';
import { playPaymentSuccessChime } from '../../utils/paymentAudio';
import './DemoPaymentModal.css';

export default function DemoPaymentModal({
  isOpen,
  onClose,
  amount = 0,
  orderId = '',
  cropName = '',
  quantityKg = 0,
  lang = 'en',
  onPaymentSuccess
}) {
  // Method selection (Flipkart vertical radio accordion):
  // 'UPI' | 'CARD' | 'NET_BANKING' | 'COD'
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState('PhonePe');
  const [upiSubMode, setUpiSubMode] = useState('APP'); // 'APP' | 'QR' | 'VPA'
  const [upiId, setUpiId] = useState('buyer.commercial@okhdfcbank');

  // Card details
  const [cardNumber, setCardNumber] = useState('4532 8921 7843 4242');
  const [cardHolder, setCardHolder] = useState('TAMIL NADU AGRI BUYER');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('884');

  // Net Banking
  const [selectedBank, setSelectedBank] = useState('SBI');

  // Cash on Delivery (Flipkart's signature Captcha code verification)
  const [captchaCode, setCaptchaCode] = useState('583');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  // Flow State Machine:
  // 'SELECT' -> 'CHALLENGE_UPI_PIN' | 'CHALLENGE_3DS_OTP' | 'CHALLENGE_NETBANKING' -> 'PROCESSING' -> 'SUCCESS'
  const [paymentState, setPaymentState] = useState('SELECT');
  const [completedTxn, setCompletedTxn] = useState(null);

  // Challenge states
  const [upiPin, setUpiPin] = useState('');
  const [otpCode, setOtpCode] = useState('584910');
  const [otpTimer, setOtpTimer] = useState(25);
  const [showSmsBanner, setShowSmsBanner] = useState(false);
  const paymentTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
    };
  }, []);

  // Generate random 3-digit Captcha for COD
  const generateNewCaptcha = () => {
    const code = String(Math.floor(100 + Math.random() * 900));
    setCaptchaCode(code);
    setUserCaptchaInput(code); // Pre-filled for demo convenience
    setCaptchaError(false);
  };

  useEffect(() => {
    if (isOpen) {
      setPaymentState('SELECT');
      setCompletedTxn(null);
      setUpiPin('');
      setOtpCode('584910');
      setOtpTimer(25);
      setShowSmsBanner(false);
      generateNewCaptcha();
    }
  }, [isOpen]);

  // 3D Secure OTP resend countdown
  useEffect(() => {
    if (paymentState !== 'CHALLENGE_3DS_OTP') return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentState]);

  if (!isOpen) return null;

  const triggerConfettiCelebration = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  // Final payment execution
  const executePaymentSettlement = (methodOverride) => {
    const methodToUse = methodOverride || selectedMethod;
    setPaymentState('PROCESSING');

    paymentTimerRef.current = setTimeout(() => {
      const generatedRef = `TXN-${methodToUse.slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;
      const utrRef = `UTR-${selectedBank || 'RBIE'}-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const result = {
        success: true,
        method: methodToUse,
        methodTitle:
          methodToUse === 'UPI'
            ? `UPI (${selectedUpiApp})`
            : methodToUse === 'NET_BANKING'
            ? `Net Banking (${selectedBank})`
            : methodToUse === 'CARD'
            ? 'Credit/Debit Card (•• 4242)'
            : 'Cash on Delivery (Pay at Handover)',
        amount: Number(amount) || 0,
        transactionRef: generatedRef,
        utrNumber: utrRef,
        escrowStatus: methodToUse === 'COD' ? 'PAY_ON_DELIVERY' : 'ESCROW_LOCKED',
        paidAt: new Date().toISOString()
      };

      setCompletedTxn(result);
      setPaymentState('SUCCESS');
      setShowSmsBanner(true);

      // Play audio chime
      playPaymentSuccessChime();

      // Confetti burst
      triggerConfettiCelebration();

      if (onPaymentSuccess) {
        onPaymentSuccess(result);
      }
    }, 1200);
  };

  // Handle Initial "Pay" button per method:
  const handleInitiateMethodPay = () => {
    if (selectedMethod === 'UPI') {
      setUpiPin('');
      setPaymentState('CHALLENGE_UPI_PIN');
    } else if (selectedMethod === 'CARD') {
      setOtpCode('584910');
      setOtpTimer(25);
      setPaymentState('CHALLENGE_3DS_OTP');
    } else if (selectedMethod === 'NET_BANKING') {
      setPaymentState('CHALLENGE_NETBANKING');
    } else if (selectedMethod === 'COD') {
      if (userCaptchaInput.trim() !== captchaCode) {
        setCaptchaError(true);
        return;
      }
      executePaymentSettlement('COD');
    }
  };

  // UPI PIN Keypad click
  const handlePinKeyClick = (digit) => {
    if (upiPin.length < 4) {
      const nextPin = upiPin + digit;
      setUpiPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => executePaymentSettlement('UPI'), 350);
      }
    }
  };

  return (
    <div className="flipkart-payment-backdrop" role="dialog" aria-modal="true">
      {/* Real-world Bank SMS Notification Toast */}
      {showSmsBanner && completedTxn && (
        <div className="flipkart-sms-toast animate-slide-down">
          <div className="flipkart-sms-header">
            <div className="d-flex align-items-center gap-2">
              <span className="flipkart-sms-badge">📱 SMS ALERT</span>
              <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>
                {selectedMethod === 'COD' ? 'NAAM-ORDERS' : 'HDFC-ALERT'}
              </strong>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Just now</span>
          </div>
          <div className="flipkart-sms-body">
            {selectedMethod === 'COD' ? (
              <>Order #{orderId || '2026-001'} confirmed! Total payable at delivery: ₹{Number(completedTxn.amount).toLocaleString('en-IN')}. EV Driver will verify 4-digit PIN.</>
            ) : (
              <>Rs. {Number(completedTxn.amount).toLocaleString('en-IN')}.00 debited from A/c **4120 on {completedTxn.paidAt ? new Date(completedTxn.paidAt).toLocaleDateString('en-GB') : 'Today'}. Ref: {completedTxn.utrNumber}. Avl Bal: ₹1,48,250.00.</>
            )}
          </div>
        </div>
      )}

      <div className="flipkart-payment-card">
        {/* Flipkart Checkout Header */}
        <div className="flipkart-payment-topbar">
          <div className="d-flex align-items-center gap-2">
            <div className="flipkart-logo-icon">
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <div>
              <div className="flipkart-topbar-title">
                {lang === 'ta' ? 'பாதுகாப்பான கட்டண முறை' : 'Flipkart Payments'}
              </div>
              <div className="flipkart-topbar-sub">
                100% Safe & Secure Payments • Order #{orderId || 'NEW-ORDER'}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="text-end">
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.9 }}>
                {lang === 'ta' ? 'செலுத்த வேண்டிய தொகை' : 'Total Payable'}
              </div>
              <div className="flipkart-topbar-amount">
                ₹{Number(amount).toLocaleString('en-IN')}
              </div>
            </div>

            <button
              type="button"
              className="flipkart-close-btn"
              onClick={onClose}
              disabled={paymentState === 'PROCESSING'}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 1. UPI MPIN Screen */}
        {paymentState === 'CHALLENGE_UPI_PIN' && (
          <div className="flipkart-payment-body">
            <div className="flipkart-challenge-box">
              <div className="text-center mb-3">
                <span className="badge bg-light text-dark px-3 py-1.5 border mb-2">
                  <Smartphone size={14} className="me-1 text-success" />
                  UPI PIN Authorization
                </span>
                <h5 className="fw-bold text-dark mb-1">
                  {lang === 'ta' ? '4-இலக்க UPI பின்னை உள்ளிடவும்' : 'Enter 4-Digit UPI PIN'}
                </h5>
                <p className="text-muted small mb-0">
                  Paying <strong className="text-dark">₹{Number(amount).toLocaleString('en-IN')}</strong> to Naam Uzhavar Marketplace
                </p>
              </div>

              {/* Pin Circles */}
              <div className="d-flex justify-content-center gap-3 my-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`flipkart-pin-circle ${idx < upiPin.length ? 'filled' : ''}`}
                  />
                ))}
              </div>

              {/* Interactive Keypad */}
              <div className="flipkart-keypad-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="flipkart-keypad-btn"
                    onClick={() => handlePinKeyClick(String(n))}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  className="flipkart-keypad-btn text-muted"
                  onClick={() => setUpiPin((prev) => prev.slice(0, -1))}
                  aria-label="Backspace"
                >
                  <Delete size={18} />
                </button>
                <button
                  type="button"
                  className="flipkart-keypad-btn"
                  onClick={() => handlePinKeyClick('0')}
                >
                  0
                </button>
                <button
                  type="button"
                  className="flipkart-keypad-btn submit-btn"
                  onClick={() => {
                    if (upiPin.length === 4) executePaymentSettlement('UPI');
                  }}
                  disabled={upiPin.length !== 4}
                >
                  <Check size={20} />
                </button>
              </div>

              <div className="text-center mt-3">
                <button
                  type="button"
                  className="btn btn-link btn-sm text-secondary text-decoration-none"
                  onClick={() => setPaymentState('SELECT')}
                >
                  Cancel and change payment method
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. 3D Secure / Card OTP Screen */}
        {paymentState === 'CHALLENGE_3DS_OTP' && (
          <div className="flipkart-payment-body">
            <div className="flipkart-challenge-box">
              <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                <span className="fw-bold text-primary">HDFC BANK • 3D Secure</span>
                <span className="badge bg-light text-muted border">Verified by VISA</span>
              </div>

              <div className="p-3 rounded bg-light mb-3" style={{ fontSize: '0.84rem' }}>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Card Number:</span>
                  <strong className="font-mono">•••• 4242</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Amount:</span>
                  <strong className="text-success fs-6">₹{Number(amount).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="text-center mb-3">
                <label className="form-label small fw-bold text-dark">
                  Enter 6-digit OTP sent to registered mobile ending in ••4910
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="form-control text-center font-mono fs-4 fw-bold mx-auto"
                  style={{ maxWidth: 200, letterSpacing: '0.3em' }}
                />
                <span className="text-muted small mt-1 d-block">
                  Resend OTP in 00:{otpTimer.toString().padStart(2, '0')}
                </span>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-light w-50"
                  onClick={() => setPaymentState('SELECT')}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary w-50 fw-bold"
                  style={{ backgroundColor: '#2874f0', borderColor: '#2874f0' }}
                  onClick={() => executePaymentSettlement('CARD')}
                >
                  Submit OTP
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Net Banking Screen */}
        {paymentState === 'CHALLENGE_NETBANKING' && (
          <div className="flipkart-payment-body">
            <div className="flipkart-challenge-box">
              <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                <span className="fw-bold text-dark">{selectedBank} Internet Banking</span>
                <span className="badge bg-success-subtle text-success border">Secure Node</span>
              </div>

              <div className="p-3 rounded bg-light mb-4" style={{ fontSize: '0.84rem' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">User ID:</span>
                  <strong className="text-dark">COMMERCIAL_BUYER_01</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Account:</span>
                  <strong className="font-mono text-dark">•••• 4120</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Total Amount:</span>
                  <strong className="text-success fs-6">₹{Number(amount).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-light w-50"
                  onClick={() => setPaymentState('SELECT')}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary w-50 fw-bold"
                  style={{ backgroundColor: '#2874f0', borderColor: '#2874f0' }}
                  onClick={() => executePaymentSettlement('NET_BANKING')}
                >
                  Confirm Pay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Processing State */}
        {paymentState === 'PROCESSING' && (
          <div className="flipkart-payment-body text-center py-5">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem', color: '#2874f0' }} role="status" />
            <h5 className="fw-bold text-dark mb-1">Processing Payment...</h5>
            <p className="text-muted small mb-0">Please do not press back or refresh.</p>
          </div>
        )}

        {/* 5. Success State - Flipkart "Order Placed" Screen */}
        {paymentState === 'SUCCESS' && completedTxn && (
          <div className="flipkart-payment-body text-center py-4">
            <div className="flipkart-success-circle mb-3">
              <CheckCircle2 size={48} color="#ffffff" />
            </div>

            <h4 className="fw-bold text-success mb-1">
              {completedTxn.method === 'COD' ? 'Order Placed Successfully!' : 'Payment Successful!'}
            </h4>
            <p className="text-muted small mb-3">
              An SMS confirmation has been sent to your registered mobile number.
            </p>

            <div className="display-6 fw-bold font-mono text-dark mb-3">
              ₹{completedTxn.amount.toLocaleString('en-IN')}
            </div>

            <div className="flipkart-receipt-card mb-4">
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Order ID:</span>
                <strong className="text-dark font-mono">#{orderId || 'NEW-ORDER'}</strong>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted">Payment Mode:</span>
                <span className="text-dark fw-semibold">{completedTxn.methodTitle}</span>
              </div>
              {completedTxn.method !== 'COD' && (
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span className="text-muted">Bank UTR Ref:</span>
                  <strong className="font-mono text-success">{completedTxn.utrNumber}</strong>
                </div>
              )}
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted">Order Status:</span>
                <span className="badge bg-success-subtle text-success fw-bold">CONFIRMED ✓</span>
              </div>
            </div>

            <div className="d-flex gap-2 w-100">
              <button
                type="button"
                className="btn btn-outline-secondary w-50 d-inline-flex align-items-center justify-content-center gap-2"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Print Invoice</span>
              </button>

              <button
                type="button"
                className="btn btn-primary w-50 fw-bold"
                style={{ backgroundColor: '#2874f0', borderColor: '#2874f0' }}
                onClick={onClose}
              >
                <span>Continue</span>
                <ArrowRight size={15} className="ms-1" />
              </button>
            </div>
          </div>
        )}

        {/* 6. SELECT STATE - Flipkart's Real-World Payment Selector */}
        {paymentState === 'SELECT' && (
          <div className="flipkart-payment-body">
            {/* Payment Options Accordion */}
            <div className="flipkart-options-list">
              {/* Option 1: UPI */}
              <div className={`flipkart-option-row ${selectedMethod === 'UPI' ? 'selected' : ''}`}>
                <div
                  className="flipkart-option-header"
                  onClick={() => setSelectedMethod('UPI')}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'UPI'}
                    onChange={() => setSelectedMethod('UPI')}
                    className="form-check-input mt-0"
                  />
                  <div className="d-flex align-items-center justify-content-between flex-grow-1">
                    <span className="fw-bold text-dark">UPI</span>
                    <span className="flipkart-badges-row">
                      <span className="flipkart-mini-badge">PhonePe</span>
                      <span className="flipkart-mini-badge">GPay</span>
                      <span className="flipkart-mini-badge">Paytm</span>
                    </span>
                  </div>
                </div>

                {selectedMethod === 'UPI' && (
                  <div className="flipkart-option-expanded">
                    {/* UPI Subtabs */}
                    <div className="d-flex gap-2 mb-3">
                      {[
                        { id: 'APP', label: 'UPI Apps' },
                        { id: 'QR', label: 'Scan QR' },
                        { id: 'VPA', label: 'Enter UPI ID' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          className={`btn btn-sm ${upiSubMode === tab.id ? 'btn-primary' : 'btn-light border'}`}
                          style={upiSubMode === tab.id ? { backgroundColor: '#2874f0', borderColor: '#2874f0' } : {}}
                          onClick={() => setUpiSubMode(tab.id)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {upiSubMode === 'APP' && (
                      <div className="d-grid gap-2 mb-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        {['PhonePe', 'Google Pay', 'Paytm'].map((app) => (
                          <button
                            key={app}
                            type="button"
                            className={`flipkart-app-card ${selectedUpiApp === app ? 'active' : ''}`}
                            onClick={() => setSelectedUpiApp(app)}
                          >
                            <Smartphone size={16} />
                            <span>{app}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {upiSubMode === 'QR' && (
                      <div className="text-center p-3 border rounded bg-light mb-3">
                        <div className="flipkart-qr-box mx-auto mb-2">
                          <QrCode size={70} color="#0f172a" />
                        </div>
                        <span className="small text-muted d-block">Scan using any UPI App to Pay</span>
                      </div>
                    )}

                    {upiSubMode === 'VPA' && (
                      <div className="mb-3">
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="username@okhdfcbank"
                          className="form-control form-control-sm font-mono"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      className="flipkart-pay-btn"
                      onClick={handleInitiateMethodPay}
                    >
                      <span>Pay ₹{Number(amount).toLocaleString('en-IN')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Option 2: Credit / Debit / ATM Card */}
              <div className={`flipkart-option-row ${selectedMethod === 'CARD' ? 'selected' : ''}`}>
                <div
                  className="flipkart-option-header"
                  onClick={() => setSelectedMethod('CARD')}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'CARD'}
                    onChange={() => setSelectedMethod('CARD')}
                    className="form-check-input mt-0"
                  />
                  <div className="d-flex align-items-center justify-content-between flex-grow-1">
                    <span className="fw-bold text-dark">Credit / Debit / ATM Card</span>
                    <span className="flipkart-badges-row">
                      <span className="flipkart-mini-badge">Visa</span>
                      <span className="flipkart-mini-badge">MasterCard</span>
                      <span className="flipkart-mini-badge">RuPay</span>
                    </span>
                  </div>
                </div>

                {selectedMethod === 'CARD' && (
                  <div className="flipkart-option-expanded">
                    <div className="mb-2">
                      <label className="form-label small text-muted mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="form-control form-control-sm font-mono"
                        placeholder="•••• •••• •••• ••••"
                      />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small text-muted mb-1">Valid Thru (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="form-control form-control-sm font-mono"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-muted mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="form-control form-control-sm font-mono"
                          placeholder="•••"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flipkart-pay-btn"
                      onClick={handleInitiateMethodPay}
                    >
                      <span>Pay ₹{Number(amount).toLocaleString('en-IN')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Option 3: Net Banking */}
              <div className={`flipkart-option-row ${selectedMethod === 'NET_BANKING' ? 'selected' : ''}`}>
                <div
                  className="flipkart-option-header"
                  onClick={() => setSelectedMethod('NET_BANKING')}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'NET_BANKING'}
                    onChange={() => setSelectedMethod('NET_BANKING')}
                    className="form-check-input mt-0"
                  />
                  <div className="d-flex align-items-center justify-content-between flex-grow-1">
                    <span className="fw-bold text-dark">Net Banking</span>
                    <span className="text-muted small">All Indian Banks</span>
                  </div>
                </div>

                {selectedMethod === 'NET_BANKING' && (
                  <div className="flipkart-option-expanded">
                    <div className="d-grid gap-2 mb-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                      {[
                        { id: 'SBI', name: 'State Bank of India' },
                        { id: 'HDFC', name: 'HDFC Bank' },
                        { id: 'ICICI', name: 'ICICI Bank' },
                        { id: 'AXIS', name: 'Axis Bank' }
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className={`flipkart-bank-pill ${selectedBank === b.id ? 'active' : ''}`}
                          onClick={() => setSelectedBank(b.id)}
                        >
                          <Building2 size={16} />
                          <span>{b.name}</span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="flipkart-pay-btn"
                      onClick={handleInitiateMethodPay}
                    >
                      <span>Pay ₹{Number(amount).toLocaleString('en-IN')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Option 4: Cash on Delivery (Flipkart's Iconic Verification Code) */}
              <div className={`flipkart-option-row ${selectedMethod === 'COD' ? 'selected' : ''}`}>
                <div
                  className="flipkart-option-header"
                  onClick={() => setSelectedMethod('COD')}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'COD'}
                    onChange={() => setSelectedMethod('COD')}
                    className="form-check-input mt-0"
                  />
                  <div className="d-flex align-items-center justify-content-between flex-grow-1">
                    <div>
                      <span className="fw-bold text-dark d-block">Cash on Delivery</span>
                      <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                        Pay cash / UPI when consignment arrives at dock
                      </span>
                    </div>
                    <Banknote size={20} color="#15803d" />
                  </div>
                </div>

                {selectedMethod === 'COD' && (
                  <div className="flipkart-option-expanded">
                    {/* Flipkart's Iconic Captcha Code Step */}
                    <div className="flipkart-captcha-box mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="small text-muted fw-bold">
                          Enter characters shown below to confirm order:
                        </span>
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-secondary"
                          onClick={generateNewCaptcha}
                          title="Refresh Code"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>

                      <div className="d-flex align-items-center gap-3">
                        {/* Captcha Image Simulation */}
                        <div className="flipkart-captcha-display">
                          {captchaCode.split('').map((char, i) => (
                            <span key={i} className="flipkart-captcha-char">{char}</span>
                          ))}
                        </div>

                        {/* Input */}
                        <input
                          type="text"
                          maxLength={3}
                          value={userCaptchaInput}
                          onChange={(e) => {
                            setUserCaptchaInput(e.target.value);
                            setCaptchaError(false);
                          }}
                          placeholder="Enter code"
                          className={`form-control font-mono fw-bold fs-5 text-center ${captchaError ? 'is-invalid' : ''}`}
                          style={{ maxWidth: 140 }}
                        />
                      </div>
                      {captchaError && (
                        <div className="text-danger small mt-1">Please enter the correct 3-digit code.</div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="flipkart-pay-btn"
                      style={{ backgroundColor: '#fb641b', borderColor: '#fb641b' }}
                      onClick={handleInitiateMethodPay}
                    >
                      <span>Confirm Order (Pay ₹{Number(amount).toLocaleString('en-IN')} on Delivery)</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
