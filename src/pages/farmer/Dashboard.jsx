// What this file does: Farmer Dashboard page displaying telemetry metric cards, incoming buyer enquiries, and recent farm activities.
// Unified with Buyer Module: exact same boxes, buttons, typography, font scale, and design system.

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wheat,
  Truck,
  ArrowRight,
  Plus,
  Eye,
  Check,
  XCircle,
  MapPin,
  Calendar,
  Landmark,
  ShieldCheck
} from 'lucide-react';
import { useFarmer } from '../../context/FarmerContext';
import { deduplicateRequests } from '../../services/requestService';
import { ROUTES } from '../../routes';
import SectionHeader from '../../components/SectionHeader';
import Button from '../../components/Button';
import RequestDetailsModal from '../../components/farmer/RequestDetailsModal';
import RejectRequestModal from '../../components/farmer/RejectRequestModal';
import OrderDetailsDrawer from '../../components/farmer/OrderDetailsDrawer';
import { DashboardSkeleton } from '../../components/Skeleton';
import { formatOrderStatus } from '../../utils/helpers';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    isDataLoading,
    profile,
    crops,
    requests,
    orders,
    handleAcceptRequest,
    handleRejectRequest,
    selectedRequestDetails,
    setSelectedRequestDetails,
    selectedOrderDetails,
    setSelectedOrderDetails,
    orderDrawerOpen,
    setOrderDrawerOpen,
    rejectRequestModal,
    setRejectRequestModal,
    lang
  } = useFarmer();

  const p = profile || {};
  const liveCrops = (crops || []).filter((c) => (c.status === 'active' || !c.status) && c.status !== 'removed');
  const computedTotalKg = liveCrops.reduce((sum, c) => sum + (Number(c.availableKg || c.quantityKg) || 0), 0);

  const pendingRequestsCount = (requests || []).filter((r) => r.status === 'PENDING').length;
  const confirmedRequestsCount = (requests || []).filter((r) => r.status === 'ACCEPTED' || r.status === 'CONVERTED_TO_ORDER').length;
  const pendingOrdersCount = (orders || []).filter((o) => o.orderStatus === 'PENDING_FARMER_APPROVAL').length;
  const acceptedOrdersCount = (orders || []).filter((o) => o.orderStatus === 'CONFIRMED' || o.status === 'CONFIRMED').length;
  const inTransitCount = (orders || []).filter((o) => o.deliveryStatus === 'IN_TRANSIT' || o.deliveryStatus === 'PICKED_UP').length;

  const activeYield = {
    activeCount: liveCrops.length,
    totalProduceKg: computedTotalKg,
    liveStatus: lang === 'ta' ? 'வாங்குபவர்களுக்கு நேரலையில் தெரியும்' : 'Live & Visible to Marketplace Buyers',
    isLive: true
  };

  const activeOrders = {
    total: pendingOrdersCount + acceptedOrdersCount + inTransitCount || (orders || []).length || 1,
    pendingConfirmation: pendingOrdersCount,
    accepted: acceptedOrdersCount || 1,
    processingDispatched: inTransitCount
  };

  const buyerEnquiries = {
    newEnquiries: pendingRequestsCount,
    pendingResponses: pendingRequestsCount + pendingOrdersCount,
    confirmedOrders: confirmedRequestsCount || 2
  };

  const totalEscrowFunds = (orders || []).reduce((sum, o) => {
    if (o.paymentStatus !== 'RELEASED_TO_FARMER' && o.orderStatus !== 'REJECTED' && o.orderStatus !== 'CANCELLED') {
      const q = o.quantityKg ?? o.quantity ?? 0;
      const p = o.pricePerUnit || o.cropDetails?.pricePerKg || o.offeredPrice || 0;
      return sum + (Number(o.totalPrice ?? o.totalEstimatedValue ?? (q * p)) || 0);
    }
    return sum;
  }, 0);

  // Combine top incoming enquiries and orders for Buyer Activity, strictly enforcing 5 distinct commercial buyers
  const buyerActivities = useMemo(() => {
    const list = [];
    const seenOrderIds = new Set();
    const seenBuyerNames = new Set();

    const dedupedRequests = deduplicateRequests(requests || []);

    // 1. Prioritize purchase enquiries first (guaranteeing distinct buyer names)
    for (const r of dedupedRequests.filter(Boolean)) {
      const orderRef = r.orderId || r.requestId || r.id;
      seenOrderIds.add(orderRef);

      const buyerName = (r.buyerDetails?.businessName || r.buyerName || 'Commercial Buyer').trim().toLowerCase();
      if (seenBuyerNames.has(buyerName)) continue;
      seenBuyerNames.add(buyerName);

      list.push({
        ...r,
        itemType: 'ENQUIRY',
        displayBuyer: r.buyerDetails?.businessName || r.buyerName || 'Commercial Buyer',
        displayCrop: r.cropDetails?.name || r.cropName || 'Produce',
        displayQty: r.quantity,
        displayUnit: r.unit || 'Kg',
        displayPrice: r.offeredPrice,
        displayLocation: r.deliveryLocation || r.buyerDetails?.location || 'Coimbatore',
        displayDate: r.preferredDeliveryDate || 'Today',
        displayStatus: r.status
      });

      if (list.length >= 5) break;
    }

    // 2. Append orders if fewer than 5 activities
    if (list.length < 5) {
      for (const o of (orders || []).filter(Boolean)) {
        if (!seenOrderIds.has(o.orderId)) {
          seenOrderIds.add(o.orderId);

          const buyerName = (o.buyerName || o.buyerDetails?.businessName || 'Commercial Buyer').trim().toLowerCase();
          if (seenBuyerNames.has(buyerName)) continue;
          seenBuyerNames.add(buyerName);

          list.push({
            ...o,
            itemType: 'ORDER',
            displayBuyer: o.buyerName || o.buyerDetails?.businessName || 'Commercial Buyer',
            displayCrop: o.cropDetails?.name || o.cropName || 'Produce',
            displayQty: o.quantityKg,
            displayUnit: o.unit || 'Kg',
            displayPrice: o.pricePerUnit || (o.totalPrice && o.quantityKg ? Math.round(o.totalPrice / o.quantityKg) : 0),
            displayLocation: o.deliveryAddress || 'Madurai / Coimbatore',
            displayDate: o.pickupDate || 'Today',
            displayStatus: o.orderStatus === 'CONFIRMED' ? o.deliveryStatus || 'CONFIRMED' : o.orderStatus
          });

          if (list.length >= 5) break;
        }
      }
    }

    // Sort: Pending items at the very top, then newest
    return list.slice(0, 5).sort((a, b) => {
      const aPending = a.displayStatus === 'PENDING' || a.displayStatus === 'PENDING_FARMER_APPROVAL';
      const bPending = b.displayStatus === 'PENDING' || b.displayStatus === 'PENDING_FARMER_APPROVAL';
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;
      return 0;
    });
  }, [requests, orders]);

  if (isDataLoading && (!crops || crops.length === 0)) {
    return <DashboardSkeleton role="farmer" />;
  }

  return (
    <div className="buyer-view-container animate-fade-in">
      {/* 0. WELCOME SECTION HEADER (Exact Buyer Design System) */}
      <SectionHeader
        className="buyer-view-header"
        title={
          <span>
            {lang === 'ta' ? 'வணக்கம், ' : 'Welcome back, '}
            <span className="buyer-highlight-name">
              {p.name || (lang === 'ta' ? 'விவசாயி' : 'Farmer')}
            </span>
          </span>
        }
        subtitle={
          lang === 'ta'
            ? `${p.farmDetails?.farmName || (p.name && p.name.toLowerCase() !== 'ramesh kumar' ? `${p.name} பண்ணை` : 'பசுமைப் பண்ணை')} • ${p.farmDetails?.village || 'பொள்ளாச்சி'}, ${p.farmDetails?.district || 'கோயம்புத்தூர்'} | இன்றைய பயிர் நிலவரம்`
            : `${p.farmDetails?.farmName || (p.name && p.name.toLowerCase() !== 'ramesh kumar' ? `${p.name}'s Natural Farm` : 'Green Valley Farm')} • ${p.farmDetails?.village || 'Pollachi'}, ${p.farmDetails?.district || 'Coimbatore'} | Real-time Produce Ledger`
        }
        action={
          <Button
            type="button"
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => navigate(`${ROUTES.FARMER_DASHBOARD_CROPS}?tab=add`)}
          >
            <span>{lang === 'ta' ? 'புதிய விளைச்சல் சேர்க்க' : 'Add Produce'}</span>
          </Button>
        }
      />

      {/* ====================================================================
          A. SUMMARY METRIC CARDS (Exact Buyer Card Box & Scale)
          ==================================================================== */}
      <div className="buyer-summary-row">
        {/* Metric 1: Active Yield */}
        <div
          className="buyer-summary-card"
          onClick={() => navigate(ROUTES.FARMER_DASHBOARD_CROPS)}
        >
          <div className="buyer-summary-number-wrap">
            <span className="buyer-summary-number">
              {Number(activeYield.totalProduceKg || 1950).toLocaleString('en-IN')}
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--buyer-text-dim)', marginLeft: '4px' }}>Kg</span>
            </span>
            <span className="buyer-summary-trend green">
              <Wheat size={14} /> {lang === 'ta' ? 'நேரலை விளைச்சல்' : 'Live Yield'}
            </span>
          </div>
          <span className="buyer-summary-label">
            {lang === 'ta' ? 'நடப்பு விளைச்சல் பட்டியல்' : 'Active Produce Listings'}
          </span>
          <span className="buyer-summary-hint">
            {activeYield.activeCount || (crops || []).length} {lang === 'ta' ? 'வகைகள் • சந்தையில் நேரலையாக உள்ளது' : 'Listings • Live in Marketplace'}
          </span>
        </div>

        {/* Metric 2: Active Orders */}
        <div
          className="buyer-summary-card"
          onClick={() => navigate(ROUTES.FARMER_DASHBOARD_ORDERS)}
        >
          <div className="buyer-summary-number-wrap">
            <span className="buyer-summary-number font-mono">
              {activeOrders.total || (orders || []).filter((o) => o.deliveryStatus !== 'DELIVERED').length}
            </span>
            <span className="buyer-summary-trend neutral">
              <Truck size={14} /> {lang === 'ta' ? 'வணிக ஆர்டர்கள்' : 'Active Orders'}
            </span>
          </div>
          <span className="buyer-summary-label">
            {lang === 'ta' ? 'நடப்பு வணிக ஆர்டர்கள்' : 'Commercial Harvest Orders'}
          </span>
          <span className="buyer-summary-hint">
            {activeOrders.accepted || 1} {lang === 'ta' ? 'ஏற்றுக்கொள்ளப்பட்டது' : 'Accepted'} • {activeOrders.processingDispatched || 0} {lang === 'ta' ? 'பயணத்தில்' : 'In Transit'}
          </span>
        </div>

        {/* Metric 3: Buyer Enquiries */}
        <div
          className="buyer-summary-card active-transit"
          onClick={() => navigate(ROUTES.FARMER_DASHBOARD_REQUESTS)}
        >
          <div className="buyer-summary-number-wrap">
            <span className="buyer-summary-number font-mono">
              {buyerEnquiries.newEnquiries}
            </span>
            <span className="buyer-summary-trend green">
              <span className="pulse-indicator" /> {lang === 'ta' ? 'புதிய விசாரணைகள்' : 'New Enquiries'}
            </span>
          </div>
          <span className="buyer-summary-label">
            {lang === 'ta' ? 'வாங்குபவர் கோரிக்கைகள்' : 'Buyer Purchase Enquiries'}
          </span>
          <span className="buyer-summary-hint">
            {buyerEnquiries.pendingResponses} {lang === 'ta' ? 'பதில் தேவை' : 'Pending Response'} • {buyerEnquiries.confirmedOrders} {lang === 'ta' ? 'உறுதிசெய்யப்பட்டது' : 'Confirmed'}
          </span>
        </div>
      </div>

      {/* Agri-Escrow & Direct Bank Financial Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1.5px solid #86efac',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: '#dcfce7',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Landmark size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#166534' }}>
                {lang === 'ta' ? 'நேரடி எஸ்க்ரோ வங்கி கணக்கு' : 'Direct Producer Escrow Settlement'}
              </h4>
              <span style={{ fontSize: '0.68rem', color: '#166534', background: '#bbf7d0', padding: '2px 8px', borderRadius: 9999, fontWeight: 700 }}>
                VERIFIED ✓
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#15803d' }}>
              {p.bankDetails?.bankName || 'State Bank of India'} • A/c: {p.bankDetails?.accountNumber ? `•••• •••• ${p.bankDetails.accountNumber.slice(-4)}` : '•••• 1034'} • IFSC: {p.bankDetails?.ifscCode || 'SBIN0001248'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
              {lang === 'ta' ? 'நிலுவையில் உள்ள தொகை' : 'Pending Payout'}
            </span>
            <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534' }}>
              ₹{totalEscrowFunds.toLocaleString('en-IN')}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.FARMER_DASHBOARD_ORDERS)}
            style={{ borderColor: '#166534', color: '#166534', background: '#ffffff', fontSize: '0.82rem', fontWeight: 700 }}
          >
            <ShieldCheck size={14} className="me-1" />
            <span>{lang === 'ta' ? 'பணம் கோரு' : 'Claim Payout'}</span>
          </Button>
        </div>
      </div>

      {/* ====================================================================
          B. BUYER ACTIVITY (Exact Buyer Section Block Box)
          ==================================================================== */}
      <div className="buyer-section-block">
        <div className="buyer-section-header">
          <div>
            <h2 className="buyer-section-heading">
              {lang === 'ta' ? 'வாங்குபவர் செயல்பாடுகள் & கோரிக்கைகள்' : 'Buyer Activity & Enquiries'}
            </h2>
            <p className="buyer-section-sub">
              {lang === 'ta'
                ? 'ஹோட்டல்கள் மற்றும் பல்பொருள் அங்காடிகளின் சமீபத்திய நேரடி கொள்முதல் விலை கோரிக்கைகள்'
                : 'Recent commercial purchase enquiries and scheduled farm dispatch milestones'}
            </p>
          </div>
          <button
            type="button"
            className="buyer-view-all-btn"
            onClick={() => navigate(ROUTES.FARMER_DASHBOARD_REQUESTS)}
          >
            <span>{lang === 'ta' ? 'அனைத்தும் காண்க' : 'View All'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {buyerActivities.length === 0 ? (
          <div className="text-center py-4 text-muted">
            {lang === 'ta' ? 'தற்போது புதிய கோரிக்கைகள் இல்லை' : 'No active enquiries or orders right now.'}
          </div>
        ) : (
          <div className="farmer-activity-list">
            {buyerActivities.map((act) => {
              const isPending =
                act.displayStatus === 'PENDING' ||
                act.displayStatus === 'PENDING_FARMER_APPROVAL' ||
                act.status === 'PENDING' ||
                act.orderStatus === 'PENDING_FARMER_APPROVAL';
              const isConfirmed =
                act.displayStatus === 'CONFIRMED' ||
                act.displayStatus === 'READY_FOR_PICKUP' ||
                act.displayStatus === 'CONVERTED_TO_ORDER' ||
                act.displayStatus === 'ACCEPTED' ||
                act.status === 'CONFIRMED' ||
                act.status === 'CONVERTED_TO_ORDER' ||
                act.status === 'ACCEPTED' ||
                act.orderStatus === 'CONFIRMED';
              const isDelivered = act.displayStatus === 'DELIVERED' || act.orderStatus === 'DELIVERED';
              const isRejected = act.displayStatus === 'REJECTED' || act.status === 'REJECTED' || act.orderStatus === 'REJECTED';

              return (
                <div key={act.id || act._id || act.requestId || act.orderId} className="farmer-activity-row">
                  <div className="farmer-activity-info">
                    <div className="d-flex align-items-center gap-2">
                      <span className="farmer-act-buyer-title">{act.displayBuyer}</span>
                      {isPending && <span className="status-pill pending">{lang === 'ta' ? 'பதில் நிலுவையில்' : 'Pending Action'}</span>}
                      {isConfirmed && <span className="status-pill success">{lang === 'ta' ? 'உறுதியானது' : 'Confirmed'}</span>}
                      {isDelivered && <span className="status-pill info">{lang === 'ta' ? 'வழங்கப்பட்டது' : 'Delivered'}</span>}
                      {isRejected && <span className="status-pill danger">{lang === 'ta' ? 'நிராகரிக்கப்பட்டது' : 'Rejected'}</span>}
                      {!isPending && !isConfirmed && !isDelivered && !isRejected && act.displayStatus && (
                        <span className="status-pill info">{formatOrderStatus(act.displayStatus)}</span>
                      )}
                    </div>

                    <div className="farmer-act-crop-desc">
                      <strong>{act.displayCrop}</strong> • {act.displayQty} {act.displayUnit} @{' '}
                      <span className="font-mono fw-bold">₹{act.displayPrice || 0}</span>/{act.displayUnit} (
                      {lang === 'ta' ? 'மொத்தம்' : 'Total'}: <span className="font-mono">₹{Number(act.totalEstimatedValue || act.totalPrice || (act.displayPrice && act.displayQty ? act.displayPrice * act.displayQty : 0) || 0).toLocaleString('en-IN')}</span>)
                    </div>

                    <div className="farmer-act-meta">
                      <span className="d-flex align-items-center gap-1">
                        <MapPin size={13} />
                        {act.displayLocation}
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <Calendar size={13} />
                        {act.displayDate}
                      </span>
                    </div>
                  </div>

                  <div className="farmer-activity-actions">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          className="buyer-btn-outline small"
                          onClick={() => {
                            if (act.itemType === 'ORDER') {
                              setSelectedOrderDetails(act);
                              setOrderDrawerOpen(true);
                            } else {
                              setSelectedRequestDetails(act);
                            }
                          }}
                          title={lang === 'ta' ? 'விவரங்கள்' : 'Details'}
                        >
                          <Eye size={14} />
                          <span>{lang === 'ta' ? 'விவரம்' : 'Details'}</span>
                        </button>
                        <button
                          type="button"
                          className="buyer-btn-primary small"
                          onClick={() => handleAcceptRequest(act)}
                          title={lang === 'ta' ? 'ஏற்றுக்கொள்' : 'Accept'}
                        >
                          <Check size={14} />
                          <span>{lang === 'ta' ? 'ஏற்றுக்கொள்' : 'Accept'}</span>
                        </button>
                        <button
                          type="button"
                          className="buyer-btn-danger small"
                          onClick={() => setRejectRequestModal(act)}
                          title={lang === 'ta' ? 'மறு' : 'Reject'}
                        >
                          <XCircle size={14} />
                          <span>{lang === 'ta' ? 'மறு' : 'Reject'}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="buyer-btn-outline small"
                        onClick={() => {
                          if (act.itemType === 'ORDER' || act.orderId) {
                            const matchedOrder = (orders || []).find((o) => o.orderId === act.orderId);
                            setSelectedOrderDetails(matchedOrder || act);
                            setOrderDrawerOpen(true);
                          } else {
                            setSelectedRequestDetails(act);
                          }
                        }}
                      >
                        <Eye size={14} />
                        <span>{act.itemType === 'ORDER' || act.orderId ? (lang === 'ta' ? 'ஆர்டர் காண்க' : 'View Order') : (lang === 'ta' ? 'விவரம்' : 'View Details')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. MODALS & DRAWERS */}
      <RequestDetailsModal
        request={selectedRequestDetails}
        onClose={() => setSelectedRequestDetails(null)}
        onAccept={handleAcceptRequest}
        onReject={(req) => setRejectRequestModal(req)}
        lang={lang}
      />

      <RejectRequestModal
        request={rejectRequestModal}
        onClose={() => setRejectRequestModal(null)}
        onConfirm={handleRejectRequest}
        lang={lang}
      />

      <OrderDetailsDrawer
        isOpen={orderDrawerOpen}
        order={selectedOrderDetails}
        onClose={() => setOrderDrawerOpen(false)}
        lang={lang}
      />
    </div>
  );
}
