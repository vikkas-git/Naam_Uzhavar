// What this file does: Farmer Buyer Requests view showing all purchase enquiries, offering quantity checks and one-click order conversions.
// Synchronizes order lifecycle directly with the Buyer Module without duplicate database records.

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  X,
  Filter,
  Check,
  XCircle,
  Eye,
  Calendar,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Building2,
  Clock,
  Phone
} from 'lucide-react';
import { useFarmer } from '../../context/FarmerContext';
import { deduplicateRequests } from '../../services/requestService';
import RequestDetailsModal from '../../components/farmer/RequestDetailsModal';
import RejectRequestModal from '../../components/farmer/RejectRequestModal';
import OrderDetailsDrawer from '../../components/farmer/OrderDetailsDrawer';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import SectionHeader from '../../components/SectionHeader';
import { TableSkeleton } from '../../components/Skeleton';
import { formatDisplayOrderId } from '../../utils/orderId';
import { formatOrderStatus } from '../../utils/helpers';
import './Requests.css';

export default function Requests() {
  const {
    isDataLoading,
    requests,
    orders,
    crops,
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

  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'accepted' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let result = deduplicateRequests(requests || []);

    // Status filter
    if (statusFilter === 'pending') {
      result = result.filter((r) => r.status === 'PENDING');
    } else if (statusFilter === 'accepted') {
      result = result.filter((r) => r.status === 'ACCEPTED' || r.status === 'CONVERTED_TO_ORDER');
    } else if (statusFilter === 'rejected') {
      result = result.filter((r) => r.status === 'REJECTED');
    }

    // Keyword search: buyer name, crop name, request ID
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.requestId?.toLowerCase().includes(q) ||
          r.buyerDetails?.businessName?.toLowerCase().includes(q) ||
          r.cropDetails?.name?.toLowerCase().includes(q) ||
          (r.cropName && r.cropName.toLowerCase().includes(q))
      );
    }

    return result;
  }, [requests, statusFilter, searchQuery]);

  return (
    <div className="buyer-view-container animate-fade-in">
      {/* 0. HEADER */}
      <SectionHeader
        className="buyer-view-header"
        title={lang === 'ta' ? 'வாங்குபவர் கொள்முதல் கோரிக்கைகள்' : 'Buyer Purchase Requests'}
        subtitle={
          lang === 'ta'
            ? 'வணிக வாங்குபவர்களிடமிருந்து பெறப்பட்ட மொத்த கொள்முதல் விசாரணைகள் & தேவைகள்.'
            : 'Direct procurement requests from hotels, supermarkets, and wholesale produce partners.'
        }
        action={
          <div className="buyer-total-stock-badge">
            <ShoppingBag size={15} />
            <span>
              {lang === 'ta' ? 'நிலுவை கோரிக்கைகள்: ' : 'Pending Requests: '}
              {(requests || []).filter((r) => r.status === 'PENDING').length}
            </span>
          </div>
        }
      />

      {/* 1. CONTROLS: FILTER PILLS & SEARCH */}
      <div className="farmer-requests-controls">
        <div className="farmer-filter-chips">
          <button
            type="button"
            className={`farmer-filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>{lang === 'ta' ? 'அனைத்தும்' : 'All Requests'}</span>
            <span className="farmer-chip-count">{(requests || []).length}</span>
          </button>
          <button
            type="button"
            className={`farmer-filter-chip ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            <span>{lang === 'ta' ? 'புதியவை' : 'Pending / New'}</span>
            <span className="farmer-chip-count">
              {(requests || []).filter((r) => r.status === 'PENDING').length}
            </span>
          </button>
          <button
            type="button"
            className={`farmer-filter-chip ${statusFilter === 'accepted' ? 'active' : ''}`}
            onClick={() => setStatusFilter('accepted')}
          >
            <span>{lang === 'ta' ? 'ஏற்றுக்கொள்ளப்பட்டவை' : 'Accepted / Orders'}</span>
            <span className="farmer-chip-count">
              {(requests || []).filter((r) => r.status === 'ACCEPTED' || r.status === 'CONVERTED_TO_ORDER').length}
            </span>
          </button>
          <button
            type="button"
            className={`farmer-filter-chip ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            <span>{lang === 'ta' ? 'நிராகரிக்கப்பட்டவை' : 'Rejected'}</span>
            <span className="farmer-chip-count">
              {(requests || []).filter((r) => r.status === 'REJECTED').length}
            </span>
          </button>
        </div>

        <div className="farmer-search-box">
          <Search size={15} className="farmer-search-icon" />
          <input
            type="text"
            className="farmer-search-input"
            placeholder={lang === 'ta' ? 'வாங்குபவர், பயிர் அல்லது எண்...' : 'Search buyer, crop, or ID...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="farmer-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 2. REQUEST CARDS GRID */}
      {isDataLoading && (!requests || requests.length === 0) ? (
        <TableSkeleton rows={4} columns={6} hasFilterBar={false} />
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-5 bg-white border rounded-3 text-muted">
          <ShoppingBag size={40} className="text-muted mb-2 opacity-50" />
          <p className="mb-0 fw-semibold">
            {lang === 'ta' ? 'பொருத்தமான கோரிக்கைகள் ஏதும் இல்லை' : 'No buyer requests found matching this filter.'}
          </p>
        </div>
      ) : (
        <div className="farmer-requests-grid">
          {filteredRequests.map((req) => {
            const isPending = req.status === 'PENDING';
            const isAccepted = req.status === 'ACCEPTED' || req.status === 'CONVERTED_TO_ORDER';
            const isRejected = req.status === 'REJECTED';
            const b = req.buyerDetails || {};
            const c = req.cropDetails || {};

            return (
              <div key={req.id || req._id || req.requestId} className="farmer-request-card">
                {/* Header: Buyer Avatar, Name, Status */}
                <div className="request-card-header">
                  <div className="request-buyer-strip">
                    <img
                      src={b.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80'}
                      alt={b.businessName}
                      className="request-buyer-avatar"
                    />
                    <div className="request-buyer-info">
                      <span className="request-buyer-name">{b.businessName}</span>
                      <span className="request-buyer-type">{b.contactPerson || b.buyerType}</span>
                    </div>
                  </div>

                  <span className={`status-pill ${isPending ? 'pending' : isAccepted ? 'success' : 'danger'}`}>
                    {formatOrderStatus(req.status)}
                  </span>
                </div>

                {/* Term Box: Crop details, Qty, Offered Price, Total Value */}
                <div className="request-produce-term-box">
                  <div className="term-row">
                    <span className="term-label">{lang === 'ta' ? 'கோரிய பயிர்:' : 'Crop:'}</span>
                    <span className="term-val">{c.name || req.cropName}</span>
                  </div>
                  <div className="term-row">
                    <span className="term-label">{lang === 'ta' ? 'தேவையான அளவு:' : 'Quantity:'}</span>
                    <span className="term-val font-mono">{req.quantity} {req.unit || 'Kg'}</span>
                  </div>
                  <div className="term-row">
                    <span className="term-label">{lang === 'ta' ? 'வழங்கும் விலை:' : 'Offered Price:'}</span>
                    <span className="term-val price font-mono">₹{req.offeredPrice} / {req.unit || 'Kg'}</span>
                  </div>
                  <div className="term-row" style={{ paddingTop: 4, borderTop: '1px dashed var(--farmer-neutral-200)' }}>
                    <span className="term-label fw-bold">{lang === 'ta' ? 'மொத்த மதிப்பு:' : 'Est. Total:'}</span>
                    <span className="term-val font-mono fw-bold text-success">
                      ₹{(req.totalEstimatedValue || req.offeredPrice * req.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Location & Preferred Delivery Date */}
                <div className="d-flex flex-column gap-1" style={{ fontSize: '0.78rem', color: 'var(--farmer-neutral-700)' }}>
                  <div className="d-flex align-items-center gap-1.5">
                    <MapPin size={13} className="text-muted" />
                    <span>{req.deliveryLocation || b.location}</span>
                  </div>
                  <div className="d-flex align-items-center gap-1.5">
                    <Calendar size={13} className="text-muted" />
                    <span>{lang === 'ta' ? 'விநியோக தேதி:' : 'Delivery:'} {req.preferredDeliveryDate || 'Flexible'}</span>
                  </div>
                </div>

                {/* Footer with Actions */}
                <div className="request-card-footer">
                  <div className="request-meta-row">
                    <span className="request-meta-id font-mono">#{req.requestId}</span>
                    {req.orderId && (
                      <span className="request-meta-order font-mono">
                        Order #{formatDisplayOrderId(req.orderId)}
                      </span>
                    )}
                  </div>

                  <div className="request-card-actions">
                    <button
                      type="button"
                      className="buyer-btn-outline small full-width"
                      onClick={() => {
                        if (req.orderId) {
                          const ord = (orders || []).find((o) => o.orderId === req.orderId);
                          setSelectedOrderDetails(ord || req);
                          setOrderDrawerOpen(true);
                          return;
                        }
                        setSelectedRequestDetails(req);
                      }}
                      title={lang === 'ta' ? 'விவரங்களை காண்க' : 'View Details'}
                    >
                      <Eye size={14} />
                      <span>
                        {req.orderId
                          ? (lang === 'ta' ? 'ஆர்டர் விவரம் காண்க' : 'View Order Details')
                          : (lang === 'ta' ? 'முழு விவரம்' : 'View Details')}
                      </span>
                    </button>

                    {isPending && (
                      <div className="request-card-action-btns">
                        <button
                          type="button"
                          className="buyer-btn-primary small"
                          onClick={() => handleAcceptRequest(req)}
                          title={lang === 'ta' ? 'ஏற்றுக்கொள்' : 'Accept Request'}
                        >
                          <Check size={14} />
                          <span>{lang === 'ta' ? 'ஏற்றுக்கொள்' : 'Accept'}</span>
                        </button>
                        <button
                          type="button"
                          className="buyer-btn-danger small"
                          onClick={() => setRejectRequestModal(req)}
                          title={lang === 'ta' ? 'நிராகரி' : 'Reject Request'}
                        >
                          <XCircle size={14} />
                          <span>{lang === 'ta' ? 'நிராகரி' : 'Reject'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. MODALS */}
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

