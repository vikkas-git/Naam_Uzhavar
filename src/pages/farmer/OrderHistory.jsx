// What this file does: Complete historical consignment ledger for the authenticated farmer.
// Stores and displays past orders persistently with sorting, status filtering, and slide-over order drawer.

import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Calendar
} from 'lucide-react';
import { useFarmer } from '../../context/FarmerContext';
import { formatDisplayOrderId } from '../../utils/orderId';
import { formatOrderStatus, formatOrderDate } from '../../utils/helpers';
import OrderDetailsDrawer from '../../components/farmer/OrderDetailsDrawer';
import FarmerPayoutModal from '../../components/farmer/FarmerPayoutModal';
import SectionHeader from '../../components/SectionHeader';
import { TableSkeleton } from '../../components/Skeleton';
import api from '../../utils/api';
import './OrderHistory.css';

export default function OrderHistory() {
  const {
    isDataLoading,
    orders,
    setOrders,
    profile,
    selectedOrderDetails,
    setSelectedOrderDetails,
    orderDrawerOpen,
    setOrderDrawerOpen,
    lang
  } = useFarmer();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [claimPayoutOrder, setClaimPayoutOrder] = useState(null);
  const itemsPerPage = 8;

  const handlePayoutSuccess = (payoutData) => {
    const targetId = payoutData.orderId;

    if (setOrders) {
      setOrders((prev) => {
        const updated = (prev || []).map((o) => {
          if (o.orderId === targetId || o.id === targetId || o._id === targetId) {
            return {
              ...o,
              paymentStatus: 'RELEASED_TO_FARMER',
              utrNumber: payoutData.utrNumber,
              payoutClaimedAt: payoutData.claimedAt,
              payoutMethod: payoutData.method
            };
          }
          return o;
        });
        try {
          localStorage.setItem('farmer_orders_history', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('farmer-data-updated'));
        } catch {}
        return updated;
      });
    }

    // Keep drawer selected order synchronized if open
    if (setSelectedOrderDetails) {
      setSelectedOrderDetails((prev) => {
        if (!prev) return null;
        if (prev.orderId === targetId || prev.id === targetId || prev._id === targetId) {
          return {
            ...prev,
            paymentStatus: 'RELEASED_TO_FARMER',
            utrNumber: payoutData.utrNumber,
            payoutClaimedAt: payoutData.claimedAt,
            payoutMethod: payoutData.method
          };
        }
        return prev;
      });
    }

    // Asynchronously synchronize with backend API
    try {
      api.post(`/farmer/orders/${targetId}/claim-payout`, {
        utrNumber: payoutData.utrNumber,
        method: payoutData.method
      }).catch((err) => {
        console.warn('Backend claim-payout sync notice (state preserved locally):', err?.message);
      });
    } catch {}

    // NOTE: Do NOT call setClaimPayoutOrder(null) here.
    // The user will dismiss the modal via onClose when they finish viewing the success receipt.
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = [...(orders || [])];

    // Filter by category
    if (activeFilter === 'active') {
      result = result.filter((o) => o.orderStatus === 'CONFIRMED' && o.deliveryStatus !== 'DELIVERED');
    } else if (activeFilter === 'completed') {
      result = result.filter((o) => o.deliveryStatus === 'DELIVERED');
    } else if (activeFilter === 'cancelled') {
      result = result.filter((o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'REJECTED');
    }

    // Search query: Order ID, Buyer Name, Crop Name
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          (o.buyerName && o.buyerName.toLowerCase().includes(q)) ||
          (o.buyerDetails?.businessName && o.buyerDetails.businessName.toLowerCase().includes(q)) ||
          (o.cropDetails?.name && o.cropDetails.name.toLowerCase().includes(q)) ||
          (o.cropName && o.cropName.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [orders, activeFilter, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const handleOpenOrder = (ord) => {
    setSelectedOrderDetails(ord);
    setOrderDrawerOpen(true);
  };

  return (
    <div className="buyer-view-container animate-fade-in">
      {/* 0. HEADER */}
      <SectionHeader
        className="buyer-view-header"
        title={lang === 'ta' ? 'விவசாயி ஆர்டர் வரலாறு' : 'Farmer Order History'}
        subtitle={
          lang === 'ta'
            ? 'உங்கள் அனைத்து கடந்தகால மற்றும் நடப்பு வணிக ஆர்டர்களின் முழுமையான பதிவுப் பட்டியல்.'
            : 'Permanent transactional ledger of all historical harvest shipments, driver dispatches, and payments.'
        }
        action={
          <div className="buyer-total-stock-badge">
            <History size={15} />
            <span>
              {lang === 'ta' ? 'மொத்த ஆர்டர்கள்: ' : 'Total Orders: '}
              {(orders || []).length}
            </span>
          </div>
        }
      />

      {/* 1. CONTROLS: FILTER PILLS, SEARCH, SORT */}
      <div className="farmer-orders-controls">
        <div className="buyer-order-tab-pills">
          <button
            type="button"
            className={`buyer-tab-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveFilter('all');
              setCurrentPage(1);
            }}
          >
            {lang === 'ta' ? 'அனைத்து ஆர்டர்கள்' : 'All Orders'} ({(orders || []).length})
          </button>
          <button
            type="button"
            className={`buyer-tab-pill ${activeFilter === 'active' ? 'active' : ''}`}
            onClick={() => {
              setActiveFilter('active');
              setCurrentPage(1);
            }}
          >
            {lang === 'ta' ? 'நடப்பு ஆர்டர்கள்' : 'Active Orders'} (
            {(orders || []).filter((o) => o.orderStatus === 'CONFIRMED' && o.deliveryStatus !== 'DELIVERED').length})
          </button>
          <button
            type="button"
            className={`buyer-tab-pill ${activeFilter === 'completed' ? 'active' : ''}`}
            onClick={() => {
              setActiveFilter('completed');
              setCurrentPage(1);
            }}
          >
            {lang === 'ta' ? 'நிறைவடைந்தவை' : 'Completed'} (
            {(orders || []).filter((o) => o.deliveryStatus === 'DELIVERED').length})
          </button>
          <button
            type="button"
            className={`buyer-tab-pill ${activeFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => {
              setActiveFilter('cancelled');
              setCurrentPage(1);
            }}
          >
            {lang === 'ta' ? 'ரத்து செய்யப்பட்டவை' : 'Cancelled'} (
            {(orders || []).filter((o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'REJECTED').length})
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="input-group" style={{ maxWidth: 260 }}>
            <span className="input-group-text bg-white border-end-0">
              <Search size={14} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder={lang === 'ta' ? 'ஆர்டர் எண், வாங்குபவர்...' : 'Order ID, buyer, crop...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 130 }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">{lang === 'ta' ? 'புதியவை' : 'Newest'}</option>
            <option value="oldest">{lang === 'ta' ? 'பழையவை' : 'Oldest'}</option>
          </select>
        </div>
      </div>

      {/* 2. RESPONSIVE TABLE & CARDS */}
      {isDataLoading && (!orders || orders.length === 0) ? (
        <TableSkeleton rows={4} columns={8} hasFilterBar={false} />
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-5 bg-white border rounded-3 text-muted">
          <History size={40} className="text-muted mb-2 opacity-50" />
          <p className="mb-0 fw-semibold">
            {lang === 'ta' ? 'ஆர்டர்கள் ஏதும் காணப்படவில்லை' : 'No order history records found matching this criteria.'}
          </p>
        </div>
      ) : (
        <div>
          {/* Desktop Table View */}
          <div className="farmer-table-responsive" style={{ borderRadius: totalPages > 1 ? '12px 12px 0 0' : '12px' }}>
            <table className="farmer-table">
              <thead>
                <tr>
                  <th>{lang === 'ta' ? 'ஆர்டர் எண்' : 'Order ID'}</th>
                  <th>{lang === 'ta' ? 'வாங்குபவர் பெயர்' : 'Buyer Name'}</th>
                  <th>{lang === 'ta' ? 'பயிர் விவரம்' : 'Crop'}</th>
                  <th>{lang === 'ta' ? 'அளவு' : 'Quantity'}</th>
                  <th>{lang === 'ta' ? 'கிலோ விலை' : 'Unit Price'}</th>
                  <th>{lang === 'ta' ? 'மொத்த மதிப்பு' : 'Total Value'}</th>
                  <th>{lang === 'ta' ? 'விநியோக தேதி' : 'Date'}</th>
                  <th>{lang === 'ta' ? 'ஆர்டர் நிலை' : 'Order Status'}</th>
                  <th>{lang === 'ta' ? 'பணம் நிலை' : 'Payment'}</th>
                  <th style={{ textAlign: 'right' }}>{lang === 'ta' ? 'நடவடிக்கை' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((ord) => {
                  const isDelivered = ord.deliveryStatus === 'DELIVERED' || ord.orderStatus === 'DELIVERED';
                  const isCancelled = ord.orderStatus === 'CANCELLED' || ord.orderStatus === 'REJECTED';
                  const isNotAssigned = ord.deliveryStatus === 'NOT_ASSIGNED';
                  const isPaid = ord.paymentStatus === 'RELEASED_TO_FARMER' || ord.paymentStatus === 'PAID';
                  const canClaimPayout = isDelivered && !isPaid;
                  const c = ord.cropDetails || {};

                  return (
                    <tr key={ord.id || ord._id || ord.orderId}>
                      <td>
                        <span className="farmer-order-id">{formatDisplayOrderId(ord.orderId)}</span>
                      </td>
                      <td>
                        <div className="farmer-buyer-cell" title={ord.buyerName || ord.buyerDetails?.businessName || 'Commercial Buyer'}>
                          {ord.buyerName || ord.buyerDetails?.businessName || 'Commercial Buyer'}
                        </div>
                      </td>
                      <td>
                        <div className="farmer-crop-cell" title={c.name || ord.cropName}>
                          {c.name || ord.cropName}
                        </div>
                      </td>
                      <td>
                        <span className="font-mono fw-bold" style={{ whiteSpace: 'nowrap' }}>
                          {ord.quantityKg ?? ord.quantity ?? 0} {ord.unit || 'Kg'}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono" style={{ whiteSpace: 'nowrap' }}>
                          ₹{ord.pricePerUnit || c.pricePerKg || ord.offeredPrice || 0}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono fw-bold text-success" style={{ whiteSpace: 'nowrap' }}>
                          ₹{(ord.totalPrice ?? ord.totalEstimatedValue ?? ((ord.quantityKg ?? ord.quantity ?? 0) * (ord.pricePerUnit || c.pricePerKg || ord.offeredPrice || 0))).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <span className="small text-muted font-mono" style={{ whiteSpace: 'nowrap' }}>
                          {formatOrderDate(ord.pickupDate || ord.preferredDeliveryDate, ord.createdAt)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${isDelivered ? 'success' : (isCancelled || isNotAssigned) ? 'danger' : 'info'}`} style={{ whiteSpace: 'nowrap' }}>
                          {formatOrderStatus(ord.deliveryStatus || ord.orderStatus)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${isPaid ? 'success' : 'pending'}`} style={{ whiteSpace: 'nowrap' }}>
                          {isPaid ? (lang === 'ta' ? 'செலுத்தப்பட்டது' : 'Paid') : (lang === 'ta' ? 'நிலுவையில்' : 'Pending')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          {canClaimPayout && (
                            <button
                              type="button"
                              className="farmer-claim-btn"
                              onClick={() => setClaimPayoutOrder(ord)}
                              title={lang === 'ta' ? 'வங்கிக்கு மாற்று' : 'Claim Payout'}
                            >
                              <Landmark size={12} />
                              <span>{lang === 'ta' ? 'பணம் பெறு' : 'Claim Payout'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="farmer-view-btn"
                            onClick={() => handleOpenOrder(ord)}
                            title={lang === 'ta' ? 'விவரம்' : 'View'}
                          >
                            <Eye size={13} />
                            <span>{lang === 'ta' ? 'விவரம்' : 'View'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="farmer-mobile-cards-grid mt-3">
            {paginatedOrders.map((ord) => {
              const isDelivered = ord.deliveryStatus === 'DELIVERED' || ord.orderStatus === 'DELIVERED';
              const isCancelled = ord.orderStatus === 'CANCELLED' || ord.orderStatus === 'REJECTED';
              const isNotAssigned = ord.deliveryStatus === 'NOT_ASSIGNED';
              const isPaid = ord.paymentStatus === 'RELEASED_TO_FARMER' || ord.paymentStatus === 'PAID';
              const canClaimPayout = isDelivered && !isPaid;
              const c = ord.cropDetails || {};

              return (
                <div key={ord.id || ord._id || ord.orderId} className="farmer-mobile-crop-card">
                  {/* Card Header: Order ID + Status */}
                  <div className="farmer-mobile-card-header">
                    <span className="farmer-order-id fs-6">{formatDisplayOrderId(ord.orderId)}</span>
                    <span className={`status-pill ${isDelivered ? 'success' : (isCancelled || isNotAssigned) ? 'danger' : 'info'}`}>
                      {formatOrderStatus(ord.deliveryStatus || ord.orderStatus)}
                    </span>
                  </div>

                  {/* Buyer Business Name */}
                  <div className="farmer-mobile-buyer-name">
                    {ord.buyerName || ord.buyerDetails?.businessName || 'Commercial Buyer'}
                  </div>

                  {/* Clean 2x2 Metric Inset Grid */}
                  <div className="mobile-card-body-grid">
                    <div className="mobile-metric-item">
                      <span className="mobile-metric-label">{lang === 'ta' ? 'பயிர்' : 'Produce'}</span>
                      <span className="mobile-metric-val" title={c.name || ord.cropName}>
                        {c.name || ord.cropName}
                      </span>
                    </div>

                    <div className="mobile-metric-item right-col">
                      <span className="mobile-metric-label">{lang === 'ta' ? 'அளவு' : 'Quantity'}</span>
                      <span className="mobile-metric-val">
                        {ord.quantityKg ?? ord.quantity ?? 0} {ord.unit || 'Kg'}
                      </span>
                    </div>

                    <div className="mobile-metric-item">
                      <span className="mobile-metric-label">{lang === 'ta' ? 'மொத்த தொகை' : 'Total Price'}</span>
                      <span className="mobile-metric-val price">
                        ₹{(ord.totalPrice ?? ord.totalEstimatedValue ?? ((ord.quantityKg ?? ord.quantity ?? 0) * (ord.pricePerUnit || c.pricePerKg || ord.offeredPrice || 0))).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="mobile-metric-item right-col">
                      <span className="mobile-metric-label">{lang === 'ta' ? 'பணம் நிலை' : 'Payment'}</span>
                      <div>
                        <span className={`status-pill ${isPaid ? 'success' : 'pending'}`}>
                          {isPaid ? (lang === 'ta' ? 'செலுத்தப்பட்டது' : 'Paid') : (lang === 'ta' ? 'நிலுவையில்' : 'Pending')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Date + Actions */}
                  <div className="farmer-mobile-card-footer">
                    <div className="farmer-mobile-date">
                      <Calendar size={13} className="text-muted" />
                      <span className="font-mono">{formatOrderDate(ord.pickupDate || ord.preferredDeliveryDate, ord.createdAt)}</span>
                    </div>

                    <div className="farmer-mobile-actions">
                      {canClaimPayout && (
                        <button
                          type="button"
                          className="farmer-claim-btn"
                          onClick={() => setClaimPayoutOrder(ord)}
                          title={lang === 'ta' ? 'வங்கிக்கு மாற்று' : 'Claim Payout'}
                        >
                          <Landmark size={12} />
                          <span>{lang === 'ta' ? 'பணம் பெறு' : 'Claim Payout'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="farmer-view-btn"
                        onClick={() => handleOpenOrder(ord)}
                        title={lang === 'ta' ? 'முழு விவரம்' : 'View Details'}
                      >
                        <Eye size={13} />
                        <span>{lang === 'ta' ? 'முழு விவரம்' : 'View Details'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="farmer-pagination-row">
              <span className="text-muted small">
                {lang === 'ta' ? 'பக்கம்' : 'Page'} {currentPage} / {totalPages} ({filteredOrders.length} {lang === 'ta' ? 'ஆர்டர்கள்' : 'Orders'})
              </span>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="buyer-btn-outline small"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                  <span>{lang === 'ta' ? 'முந்தைய' : 'Prev'}</span>
                </button>
                <button
                  type="button"
                  className="buyer-btn-outline small"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span>{lang === 'ta' ? 'அடுத்தது' : 'Next'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. ORDER DETAILS DRAWER */}
      <OrderDetailsDrawer
        order={selectedOrderDetails}
        isOpen={orderDrawerOpen}
        onClose={() => setOrderDrawerOpen(false)}
        onClaimPayout={(orderToClaim) => {
          setOrderDrawerOpen(false);
          setClaimPayoutOrder(orderToClaim);
        }}
        lang={lang}
      />

      {/* 4. FARMER DIRECT ESCROW PAYOUT MODAL */}
      <FarmerPayoutModal
        isOpen={!!claimPayoutOrder}
        onClose={() => setClaimPayoutOrder(null)}
        order={claimPayoutOrder}
        profile={profile}
        lang={lang}
        onPayoutSuccess={handlePayoutSuccess}
      />
    </div>
  );
}

