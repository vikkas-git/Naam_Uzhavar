// What this file does: Driver Haulage Earnings, Rate Card Transparency, and Instant Wallet Payouts.
// Provides complete financial clarity with distance formulas, incentives, and simulated UPI bank transfers.

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  DollarSign,
  CreditCard,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  X,
  CheckCheck,
  Building2,
  Smartphone,
  Sparkles,
  Printer
} from 'lucide-react';
import { useDriver } from '../../context/DriverContext';
import SectionHeader from '../../components/SectionHeader';
import Button from '../../components/Button';
import { EarningsSkeleton } from '../../components/Skeleton';
import { playPaymentSuccessChime } from '../../utils/paymentAudio';
import './DriverDashboard.css';

export default function DriverEarnings() {
  const { profile, metrics, trips, withdrawEarnings, isDataLoading, lang } = useDriver();

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawChannel, setWithdrawChannel] = useState('UPI'); // 'UPI' | 'BANK' | 'EV_CARD'
  const [withdrawStatus, setWithdrawStatus] = useState('IDLE'); // 'IDLE' | 'PROCESSING' | 'SUCCESS'
  const [processingStage, setProcessingStage] = useState(1);
  const [lastUtr, setLastUtr] = useState('');
  const [showDriverSms, setShowDriverSms] = useState(false);
  const [upiId, setUpiId] = useState('kumar.logistics@okhdfcbank');

  const todayEarnings = metrics?.todayEarnings || 1424;
  const walletBal = metrics?.walletBalance || 4250;

  const handleWithdrawSubmit = (e) => {
    if (e) e.preventDefault();
    setWithdrawStatus('PROCESSING');
    setProcessingStage(1);

    setTimeout(() => {
      setProcessingStage(2);
    }, 550);

    setTimeout(() => {
      setProcessingStage(3);
    }, 1100);

    setTimeout(() => {
      const dest =
        withdrawChannel === 'UPI'
          ? upiId
          : withdrawChannel === 'BANK'
          ? 'Canara Bank (A/c •••• 8912)'
          : 'Tata Ace EV Fleet Card (CARD-TN57)';
      const success = withdrawEarnings(withdrawAmount, dest);
      if (success) {
        const utr = `UTR-CNRB-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        setLastUtr(utr);
        setWithdrawStatus('SUCCESS');
        setShowDriverSms(true);
        playPaymentSuccessChime();
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {}
      } else {
        setWithdrawStatus('IDLE');
      }
    }, 1600);
  };

  const handleCloseWithdrawModal = () => {
    setWithdrawModalOpen(false);
    setWithdrawStatus('IDLE');
    setWithdrawAmount('');
    setShowDriverSms(false);
  };

  if (isDataLoading && !profile) {
    return (
      <div className="buyer-view-container animate-fade-in">
        <EarningsSkeleton />
      </div>
    );
  }

  return (
    <div className="buyer-view-container animate-fade-in">
      <SectionHeader
        className="buyer-view-header"
        title={
          <span>
            {lang === 'ta' ? 'என் வருவாய் & பணப்பை' : 'My Earnings & Wallet'}
          </span>
        }
        subtitle={
          lang === 'ta'
            ? 'வெளிப்படையான தூரக் கட்டணம் மற்றும் உடனடி UPI பணப்பரிமாற்றம்'
            : 'Transparent distance-based logistics pay and instant bank wallet payout'
        }
        action={
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setWithdrawAmount(String(walletBal));
              setWithdrawModalOpen(true);
            }}
            style={{ backgroundColor: '#15803d', borderColor: '#15803d' }}
          >
            <CreditCard size={15} />
            <span>{lang === 'ta' ? 'வங்கிக்கு மாற்று' : 'Withdraw to Bank / UPI'}</span>
          </Button>
        }
      />

      {/* Hero Wallet Card */}
      <div className="driver-wallet-hero">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <div className="text-white text-opacity-85 text-uppercase fw-bold" style={{ fontSize: '0.78rem', letterSpacing: '0.05em' }}>
              {lang === 'ta' ? 'நடப்பு பணப்பை இருப்பு' : 'Available Driver Wallet Balance'}
            </div>
            <div className="display-5 fw-bold text-white font-mono mt-1">
              ₹{walletBal.toLocaleString('en-IN')}
            </div>
            <div className="small text-white text-opacity-90 mt-1 d-flex align-items-center gap-1">
              <span>✓</span>
              <span>{lang === 'ta' ? '256-பிட் பாதுகாப்பான எஸ்க்ரோ விடுவிப்பு' : '256-bit Bank Grade Escrow Clearance'}</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-white text-dark shadow-sm px-3 py-2 fw-bold" style={{ fontSize: '0.85rem' }}>
              <Zap size={14} className="me-1 text-warning" />
              {lang === 'ta' ? 'இன்றைய கூலி' : "Today's Pay"}: ₹{todayEarnings.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Rate Breakdown and Formula */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="driver-rate-card h-100">
            <h4 className="fw-bold text-dark mb-3" style={{ fontSize: '1.05rem' }}>
              {lang === 'ta' ? 'பயணக் கட்டண கணக்கீட்டு முறை' : 'Trip Rate & Fare Formula'}
            </h4>
            <div className="driver-rate-item">
              <span className="text-muted">{lang === 'ta' ? 'அடிப்படை ஏற்றுதல் கட்டணம்' : 'Base Assignment Fare'}</span>
              <span className="fw-bold font-mono text-dark">₹250</span>
            </div>
            <div className="driver-rate-item">
              <span className="text-muted">{lang === 'ta' ? 'EV தூரக் கட்டணம்' : 'Distance Mileage (EV Rate)'}</span>
              <span className="fw-bold font-mono text-dark">₹12 / km</span>
            </div>
            <div className="driver-rate-item">
              <span className="text-muted">{lang === 'ta' ? 'பெட்டி ஏற்றுதல் ஊக்கத்தொகை' : 'Crate Handling Incentive'}</span>
              <span className="fw-bold font-mono text-dark">₹10 / crate</span>
            </div>
            <div className="driver-rate-item">
              <span className="text-muted">{lang === 'ta' ? 'நேரத்தவறாமை போனஸ்' : 'On-Time Delivery Bonus'}</span>
              <span className="fw-bold font-mono text-success">+ ₹50</span>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="driver-rate-card h-100">
            <h4 className="fw-bold text-dark mb-3" style={{ fontSize: '1.05rem' }}>
              {lang === 'ta' ? 'செயல்திறன் & பசுமை புள்ளிவிவரங்கள்' : 'Performance & Green Fleet Impact'}
            </h4>
            <div className="driver-rate-item">
              <span className="text-muted">{lang === 'ta' ? 'மொத்த தூரம்' : 'Total Kilometers Driven'}</span>
              <span className="fw-bold font-mono text-dark">{metrics?.totalDistanceKm || 4820} km</span>
            </div>
            <div className="driver-rate-item">
              <span className="text-muted">{lang === 'ta' ? 'சேமிக்கப்பட்ட CO2' : 'Carbon Emission Saved'}</span>
              <span className="fw-bold font-mono text-success">{metrics?.co2SavedKg || 1240} kg CO₂</span>
            </div>
            <div className="driver-rate-item">
              <span className="text-muted">{lang === 'ta' ? 'நேரத்தவறாமை விகிதம்' : 'On-Time Dispatch Rate'}</span>
              <span className="fw-bold font-mono text-dark">{metrics?.onTimeRatePct || 99.1}%</span>
            </div>
            <div className="driver-rate-item">
              <span className="text-muted">{lang === 'ta' ? 'மதிப்பீடு' : 'Buyer & Farmer Rating'}</span>
              <span className="fw-bold font-mono text-warning">★ {metrics?.rating || 4.92} / 5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="buyer-section-block">
        <div className="buyer-section-header">
          <div>
            <h2 className="buyer-section-heading">
              <Calendar size={18} color="#b45309" className="me-2 d-inline-block" />
              <span>{lang === 'ta' ? 'பணப்பரிவர்த்தனை வரலாறு' : 'Payment History'}</span>
            </h2>
            <p className="buyer-section-sub">
              {lang === 'ta'
                ? 'உங்கள் பணப்பையில் வரவு வைக்கப்பட்ட பயணக் கூலி விவரங்கள்'
                : 'Trip earnings and delivery payouts credited to your driver wallet'}
            </p>
          </div>
        </div>

        <div className="driver-manifest-table-wrap">
          <table className="driver-manifest-table">
            <thead>
              <tr>
                <th>{lang === 'ta' ? 'பயணம்' : 'Trip ID'}</th>
                <th>{lang === 'ta' ? 'பயிர் விவரம்' : 'Produce & Weight'}</th>
                <th>{lang === 'ta' ? 'வழித்தடம்' : 'Route'}</th>
                <th>{lang === 'ta' ? 'தூரம்' : 'Distance'}</th>
                <th>{lang === 'ta' ? 'பயணக் கூலி' : 'Trip Pay'}</th>
                <th>{lang === 'ta' ? 'நிலை' : 'Payment Status'}</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => {
                const isPaid = trip.status === 'DELIVERED';
                return (
                  <tr key={trip.tripId}>
                    <td>
                      <span className="font-mono fw-bold" style={{ color: '#b45309' }}>
                        #{trip.tripId}
                      </span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{trip.cropName}</div>
                      <div className="text-muted small">{trip.cratesCount || 8} Crates • {trip.quantityKg} Kg</div>
                    </td>
                    <td>
                      <div className="text-dark fw-semibold small">
                        {trip.pickup?.village} ➔ {trip.dropoff?.location}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-secondary">{trip.telemetry?.distanceKm || 34.5} km</span>
                    </td>
                    <td>
                      <span className="font-mono fw-bold text-success" style={{ fontSize: '1.05rem' }}>
                        ₹{trip.haulageEarnings?.totalEarnings || 744}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: isPaid ? '#dcfce7' : '#fef3c7',
                          color: isPaid ? '#15803d' : '#b45309',
                          padding: '6px 12px',
                          borderRadius: 9999,
                          fontWeight: 700,
                          fontSize: '0.78rem'
                        }}
                      >
                        {isPaid
                          ? (lang === 'ta' ? '✓ பணப்பையில் வரவு' : '✓ Paid to Wallet')
                          : (lang === 'ta' ? '⏳ செயலாக்கத்தில்' : '⏳ Processing')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ENHANCED DEMO WITHDRAWAL MODAL */}
      {withdrawModalOpen && (
        <div className="driver-modal-backdrop" role="dialog" aria-modal="true">
          <div className="driver-modal-card position-relative">
            {/* Simulated Live Driver SMS Notification Toast */}
            {showDriverSms && (
              <div
                className="animate-slide-down text-start mb-3"
                style={{
                  background: '#ffffff',
                  border: '1px solid #93c5fd',
                  borderRadius: 12,
                  padding: '10px 14px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <div className="d-flex align-items-center gap-1.5">
                    <span
                      style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4
                      }}
                    >
                      📱 SMS ALERT
                    </span>
                    <strong style={{ fontSize: '0.78rem', color: '#0f172a' }}>CANARA-ALERT</strong>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Just now</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#1e293b', lineHeight: 1.45 }}>
                  Dear Driver Partner, Your A/c **8912 has been CREDITED with ₹{Number(withdrawAmount).toLocaleString('en-IN')}.00 on{' '}
                  {new Date().toLocaleDateString('en-GB')} by IMPS Ref {lastUtr} (Naam Uzhavar Logistics Payout). Clear Bal: ₹18,450.00.
                </div>
              </div>
            )}

            <button
              type="button"
              className="driver-modal-x-btn"
              onClick={handleCloseWithdrawModal}
              disabled={withdrawStatus === 'PROCESSING'}
            >
              <X size={18} />
            </button>

            {withdrawStatus === 'PROCESSING' ? (
              <div className="py-4 text-center">
                <div className="spinner-border text-success mb-3" role="status" style={{ width: '3rem', height: '3rem' }} />
                <h4 className="fw-bold text-dark mb-1">
                  {lang === 'ta' ? 'வங்கிக் கணக்கிற்கு மாற்றப்படுகிறது...' : 'Transferring Payout to Bank...'}
                </h4>
                <p className="text-muted small">
                  {lang === 'ta' ? 'உடனடி வங்கி பரிமாற்றம் நடைபெறுகிறது.' : 'Instant zero-fee transfer in progress. Please wait...'}
                </p>
              </div>
            ) : withdrawStatus === 'SUCCESS' ? (
              <div className="py-2 text-center">
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>

                <h4 className="fw-bold text-success mb-1">
                  {lang === 'ta' ? 'பணம் மாற்றப்பட்டது!' : 'Withdrawal Successful!'}
                </h4>

                <div className="display-6 fw-bold font-mono text-dark my-2">
                  ₹{Number(withdrawAmount).toLocaleString('en-IN')}
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '12px 16px',
                    textAlign: 'left',
                    margin: '14px auto',
                    fontSize: '0.82rem'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                    <span className="fw-bold text-uppercase text-secondary" style={{ fontSize: '0.74rem' }}>
                      Haulage Payout Voucher
                    </span>
                    <span style={{ background: '#dcfce7', color: '#166534', fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem' }}>
                      IMPS SETTLED ✓
                    </span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">{lang === 'ta' ? 'மாற்றப்பட்ட கணக்கு' : 'Destination'}:</span>
                    <strong className="text-dark">
                      {withdrawChannel === 'UPI' ? upiId : withdrawChannel === 'BANK' ? 'Canara Bank (•••• 8912)' : 'EV Fleet Card (TN-57)'}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">{lang === 'ta' ? 'முறை' : 'Channel'}:</span>
                    <strong className="text-success">{withdrawChannel === 'UPI' ? 'Instant UPI VPA' : withdrawChannel === 'BANK' ? 'Direct Bank IMPS' : 'EV Fleet Card'}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">{lang === 'ta' ? 'வங்கி UTR எண்' : 'Bank UTR Ref'}:</span>
                    <strong className="font-mono text-dark">{lastUtr}</strong>
                  </div>
                </div>

                <div className="d-flex gap-2 w-100">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-50 d-inline-flex align-items-center justify-content-center gap-2"
                    onClick={() => window.print()}
                  >
                    <Printer size={15} />
                    <span>Print Voucher</span>
                  </button>

                  <Button
                    type="button"
                    variant="primary"
                    style={{ width: '50%', backgroundColor: '#15803d', borderColor: '#15803d' }}
                    onClick={handleCloseWithdrawModal}
                  >
                    <span>{lang === 'ta' ? 'முடிந்தது' : 'Done'}</span>
                    <ArrowRight size={15} />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="driver-modal-icon-wrap success">
                  <CreditCard size={28} />
                </div>

                <h3 className="driver-modal-title">
                  {lang === 'ta' ? 'வங்கிக் கணக்கிற்கு பணம் மாற்று' : 'Withdraw to Bank / UPI'}
                </h3>

                <p className="driver-modal-desc">
                  {lang === 'ta'
                    ? 'உங்கள் ஓட்டுநர் பணப்பையிலிருந்து உடனடியாக உங்கள் வங்கிக் கணக்கிற்கு பணம் மாற்றப்படும்.'
                    : 'Instant zero-fee transfer to your verified commercial driver bank account or UPI VPA.'}
                </p>

                <form onSubmit={handleWithdrawSubmit}>
                  {/* Select Channel */}
                  <div className="mb-3 text-start">
                    <label className="form-label small fw-bold text-muted">
                      {lang === 'ta' ? 'மாற்ற வேண்டிய வழிமுறை' : 'Payout Destination'}
                    </label>
                    <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      {[
                        { id: 'UPI', label: 'UPI VPA', icon: Smartphone },
                        { id: 'BANK', label: 'Bank IMPS', icon: Building2 },
                        { id: 'EV_CARD', label: 'EV Card', icon: Zap }
                      ].map((ch) => {
                        const Icon = ch.icon;
                        const isSel = withdrawChannel === ch.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => setWithdrawChannel(ch.id)}
                            style={{
                              padding: '8px 4px',
                              borderRadius: 8,
                              border: isSel ? '1.5px solid #166534' : '1px solid #cbd5e1',
                              background: isSel ? '#f0fdf4' : '#ffffff',
                              color: isSel ? '#166534' : '#475569',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'pointer'
                            }}
                          >
                            <Icon size={16} />
                            <span>{ch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amount with Quick Presets */}
                  <div className="mb-3 text-start">
                    <label className="form-label small fw-bold text-muted">
                      {lang === 'ta' ? 'மாற்ற வேண்டிய தொகை (₹)' : 'Withdrawal Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      min={100}
                      max={walletBal}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="form-control form-control-lg font-mono fw-bold"
                      placeholder="Enter amount"
                      required
                    />

                    {/* Quick Presets */}
                    <div className="d-flex gap-2 mt-2 flex-wrap">
                      {[500, 1000, 2000, walletBal].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setWithdrawAmount(String(amt))}
                          style={{
                            padding: '3px 10px',
                            borderRadius: 16,
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          {amt === walletBal ? (lang === 'ta' ? 'முழு இருப்பு' : `All (₹${amt})`) : `₹${amt}`}
                        </button>
                      ))}
                    </div>

                    <div className="small text-muted mt-1.5">
                      Available Balance: <strong className="text-dark">₹{walletBal.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  {/* Details Field */}
                  {withdrawChannel === 'UPI' && (
                    <div className="mb-4 text-start">
                      <label className="form-label small fw-bold text-muted">
                        {lang === 'ta' ? 'இணைக்கப்பட்ட UPI ID' : 'Linked UPI ID / VPA'}
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="form-control font-mono"
                        required
                      />
                    </div>
                  )}

                  {withdrawChannel === 'BANK' && (
                    <div className="mb-4 text-start p-2 rounded bg-light border">
                      <div className="small fw-bold text-dark">Canara Bank Commercial Account</div>
                      <div className="small text-muted font-mono">A/c: •••• •••• •••• 8912 • IFSC: CNRB0001890</div>
                    </div>
                  )}

                  {withdrawChannel === 'EV_CARD' && (
                    <div className="mb-4 text-start p-2 rounded bg-light border">
                      <div className="small fw-bold text-dark">Tata Ace EV Logistics Charging Card</div>
                      <div className="small text-muted font-mono">Card: EV-TN57-AB1234 • Fast DC Wallet</div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    style={{ width: '100%', minHeight: '48px', backgroundColor: '#15803d', borderColor: '#15803d' }}
                  >
                    <CheckCheck size={18} />
                    <span>{lang === 'ta' ? 'பரிமாற்றத்தை உறுதிசெய் ➔' : 'Confirm Instant Withdrawal ➔'}</span>
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

