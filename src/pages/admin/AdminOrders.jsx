// pages/admin/AdminOrders.jsx - Centralized Commercial Order & Escrow Management
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  X,
  Truck,
  Download,
  Printer,
  Lock,
  Unlock,
  Edit3,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import api from '../../utils/api';
import { useAdmin } from '../../context/AdminContext';
import './AdminCommon.css';

export default function AdminOrders() {
  const { showToast } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    confirmedOrders: 0,
    pendingApproval: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    escrowLocked: 0,
    releasedToFarmer: 0,
    totalKg: 0
  });

  // Detail Drawer state
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Status intervention modal state
  const [interventionModal, setInterventionModal] = useState(null); // { order, newOrderStatus, newPaymentStatus, newDeliveryStatus, note }

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (orderStatus !== 'all') params.append('orderStatus', orderStatus);
      if (paymentStatus !== 'all') params.append('paymentStatus', paymentStatus);
      params.append('page', page);
      params.append('limit', 10);

      const res = await api.get(`/admin/orders?${params.toString()}`);
      if (res && res.success) {
        setOrders(res.orders || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err) {
      console.warn('Failed to load orders:', err.message);
      showToast('error', 'Unable to retrieve commercial orders');
    } finally {
      setLoading(false);
    }
  }, [search, orderStatus, paymentStatus, page, showToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openOrderDetails = async (id) => {
    setSelectedOrderId(id);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/orders/${id}`);
      if (res && res.success) {
        setOrderDetails(res);
      }
    } catch (err) {
      console.warn('Failed to load order details:', err.message);
      showToast('error', 'Unable to retrieve order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleInterventionSave = async () => {
    if (!interventionModal) return;
    try {
      const { order, newOrderStatus, newPaymentStatus, newDeliveryStatus, note } = interventionModal;
      const res = await api.patch(`/admin/orders/${order.orderId}/status`, {
        orderStatus: newOrderStatus,
        paymentStatus: newPaymentStatus,
        deliveryStatus: newDeliveryStatus,
        note: note || 'Administrative status update by Central Operations Administrator'
      });

      if (res && res.success) {
        showToast('success', res.message || `Order #${order.orderId} updated successfully`);
        setInterventionModal(null);
        loadOrders();
        if (selectedOrderId === order.orderId) {
          openOrderDetails(order.orderId);
        }
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      showToast('error', err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleReleaseEscrow = async (order) => {
    if (!window.confirm(`Are you sure you want to release escrow of ₹${(order.totalPrice || 0).toLocaleString('en-IN')} to farmer ${order.farmerName || 'Farmer'}?`)) {
      return;
    }
    try {
      const res = await api.patch(`/admin/orders/${order.orderId}/status`, {
        paymentStatus: 'RELEASED_TO_FARMER',
        note: 'Admin manual release: Escrow disbursed to farmer payout wallet'
      });
      if (res && res.success) {
        showToast('success', `Escrow released to farmer for Order #${order.orderId}!`);
        loadOrders();
        if (selectedOrderId === order.orderId) {
          openOrderDetails(order.orderId);
        }
      }
    } catch (err) {
      console.error('Failed to release escrow:', err);
      showToast('error', 'Failed to release escrow funds');
    }
  };

  const handleExportCSV = async () => {
    try {
      showToast('info', 'Preparing orders ledger CSV export...');
      const baseUrl = api.defaults?.baseURL || 'http://localhost:5000/api';
      const token = localStorage.getItem('admin_token');
      const exportUrl = `${baseUrl}/admin/reports/export?module=orders`;

      const response = await fetch(exportUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export request failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `naam_uzhavar_orders_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast('success', 'Orders ledger report exported successfully!');
    } catch (err) {
      console.error('CSV export failed:', err);
      showToast('error', 'Failed to generate CSV export file');
    }
  };

  const getOrderStatusBadgeClass = (s) => {
    switch (s) {
      case 'CONFIRMED':
        return 'active';
      case 'PENDING_FARMER_APPROVAL':
        return 'pending';
      case 'CANCELLED':
      case 'REJECTED':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  const getPaymentStatusBadgeClass = (p) => {
    switch (p) {
      case 'RELEASED_TO_FARMER':
        return 'active';
      case 'ESCROW_LOCKED':
        return 'escrow';
      case 'PAID':
        return 'intransit';
      case 'PENDING':
        return 'pending';
      default:
        return 'pending';
    }
  };

  const getDeliveryStatusBadgeClass = (d) => {
    switch (d) {
      case 'DELIVERED':
        return 'delivered';
      case 'IN_TRANSIT':
      case 'PICKED_UP':
        return 'intransit';
      case 'READY_FOR_PICKUP':
        return 'active';
      case 'NOT_ASSIGNED':
      case 'PENDING':
        return 'pending';
      default:
        return 'pending';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="admin-card-title-group">
          <h2 className="fs-5 fw-bold text-dark m-0">Commercial Orders</h2>
          <p className="text-muted small m-0">Order approvals, payment escrow releases, and delivery fulfillment</p>
        </div>

        <button
          type="button"
          className="admin-btn primary sm"
          onClick={handleExportCSV}
          title="Export CSV"
        >
          <Download size={13} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Essential KPI Metrics Grid */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Orders */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-card p-3 h-100 d-flex flex-column justify-content-between">
            <span className="text-muted small fw-semibold">Total Orders</span>
            <div className="my-1">
              <h3 className="fs-3 fw-bold text-dark m-0">{metrics.totalOrders}</h3>
            </div>
            <span className="text-muted small d-flex align-items-center gap-1">
              <CheckCircle2 size={12} className="text-success" />
              <span>{metrics.confirmedOrders} confirmed orders</span>
            </span>
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-card p-3 h-100 d-flex flex-column justify-content-between">
            <span className="text-muted small fw-semibold">Pending Approval</span>
            <div className="my-1">
              <h3 className="fs-3 fw-bold m-0" style={{ color: '#d97706' }}>{metrics.pendingApproval}</h3>
            </div>
            <span className="text-muted small d-flex align-items-center gap-1">
              <Clock size={12} className="text-warning" />
              <span>Awaiting farmer response</span>
            </span>
          </div>
        </div>

        {/* Card 3: Escrow Locked */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-card p-3 h-100 d-flex flex-column justify-content-between">
            <span className="text-muted small fw-semibold">Escrow Locked</span>
            <div className="my-1">
              <h3 className="fs-3 fw-bold m-0" style={{ color: '#7c3aed' }}>
                ₹{(metrics.escrowLocked || 0).toLocaleString('en-IN')}
              </h3>
            </div>
            <span className="text-muted small d-flex align-items-center gap-1">
              <Lock size={12} className="text-purple" style={{ color: '#7c3aed' }} />
              <span>Funds held securely in escrow</span>
            </span>
          </div>
        </div>

        {/* Card 4: Released to Farmers */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-card p-3 h-100 d-flex flex-column justify-content-between">
            <span className="text-muted small fw-semibold">Released to Farmers</span>
            <div className="my-1">
              <h3 className="fs-3 fw-bold text-success m-0">
                ₹{(metrics.releasedToFarmer || 0).toLocaleString('en-IN')}
              </h3>
            </div>
            <span className="text-muted small d-flex align-items-center gap-1">
              <CheckCircle2 size={12} className="text-success" />
              <span>Disbursed for delivered produce</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card">
        {/* Filter Controls Bar */}
        <div className="admin-controls-bar">
          <div className="admin-search-wrap">
            <Search size={15} />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by Order ID, Buyer, Farmer, Crop, Bay..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="admin-filter-group">
            {/* Order Status Select */}
            <select
              className="admin-select"
              value={orderStatus}
              onChange={(e) => {
                setOrderStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Order Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING_FARMER_APPROVAL">Pending Approval</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Payment Status Select */}
            <select
              className="admin-select"
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Payment Statuses</option>
              <option value="ESCROW_LOCKED">Escrow Locked</option>
              <option value="RELEASED_TO_FARMER">Released to Farmer</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
            </select>

            <button
              type="button"
              className="admin-btn outline sm"
              onClick={loadOrders}
              title="Refresh Orders"
            >
              <RefreshCw size={12} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Orders Data Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Farmer</th>
                <th>Vegetable</th>
                <th>Volume & Total</th>
                <th>Order Status</th>
                <th>Escrow / Payment</th>
                <th>Delivery</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <RefreshCw size={24} className="spin mb-2" />
                    <div>Loading commercial order ledger...</div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <AlertCircle size={24} className="mb-2 text-warning" />
                    <div>No commercial orders found matching the filter criteria.</div>
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const ordId = ord.orderId || ord._id;
                  const crop = ord.cropDetails || {};
                  return (
                    <tr key={ord._id || ord.orderId}>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <Package size={13} className="text-primary" />
                          <span className="font-mono fw-bold text-dark">{ord.orderId}</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          {new Date(ord.createdAt || Date.now()).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold text-dark">
                            {ord.buyerName || ord.buyer?.businessName || ord.buyerDetails?.businessName || 'Commercial Buyer'}
                          </div>
                          <div className="text-muted" style={{ fontSize: '11px', maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ord.deliveryAddress || 'Receiving Bay'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold text-dark">{ord.farmerName || crop.farmerName || 'Farmer'}</div>
                          <div className="text-muted font-mono" style={{ fontSize: '11px' }}>
                            {ord.farmerId || 'FMR-TN'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold text-dark">{crop.name || ord.cropName || 'Vegetables'}</div>
                          <span className="admin-pill-badge lime" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {crop.grade || 'Grade A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="font-mono fw-bold text-dark fs-6">
                            ₹{(ord.totalPrice || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-muted font-mono" style={{ fontSize: '11px' }}>
                            {(ord.quantityKg || 0).toLocaleString('en-IN')} Kg
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-pill ${getOrderStatusBadgeClass(ord.orderStatus)}`}>
                          {ord.orderStatus === 'PENDING_FARMER_APPROVAL' ? 'PENDING APPROVAL' : ord.orderStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-pill ${getPaymentStatusBadgeClass(ord.paymentStatus)}`}>
                          {ord.paymentStatus === 'RELEASED_TO_FARMER' ? 'RELEASED' : ord.paymentStatus?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-pill ${getDeliveryStatusBadgeClass(ord.deliveryStatus)}`}>
                          {ord.deliveryStatus?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="d-inline-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="admin-btn outline sm"
                            onClick={() => openOrderDetails(ordId)}
                            title="Inspect Order Details"
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
                          </button>
                          <button
                            type="button"
                            className="admin-btn outline sm text-primary"
                            onClick={() =>
                              setInterventionModal({
                                order: ord,
                                newOrderStatus: ord.orderStatus,
                                newPaymentStatus: ord.paymentStatus,
                                newDeliveryStatus: ord.deliveryStatus,
                                note: ''
                              })
                            }
                            title="Intervene / Override Status"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="admin-pagination-bar">
          <span>
            Showing <strong>{orders.length}</strong> of <strong>{totalCount}</strong> commercial orders
          </span>
          <div className="admin-pagination-actions">
            <button
              type="button"
              className="admin-pagination-btn"
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span className="px-2 fw-semibold">Page {page} of {totalPages}</span>
            <button
              type="button"
              className="admin-pagination-btn"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL INSPECTION DRAWER */}
      {selectedOrderId && (
        <div className="admin-drawer-backdrop" onClick={() => setSelectedOrderId(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <h3>Order Ledger #{selectedOrderId}</h3>
              <button
                type="button"
                className="admin-drawer-close"
                onClick={() => setSelectedOrderId(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-drawer-body">
              {loadingDetails || !orderDetails ? (
                <div className="text-center py-5 text-muted">
                  <RefreshCw size={24} className="spin mb-2" />
                  <div>Loading ledger details...</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {/* Financial Escrow Action Card */}
                  <div className="p-3 rounded-3 bg-light border">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-muted small fw-semibold">Commercial Valuation & Escrow</span>
                      <span className={`admin-pill ${getPaymentStatusBadgeClass(orderDetails.order?.paymentStatus)}`}>
                        {orderDetails.order?.paymentStatus?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="fs-3 fw-bold text-dark font-mono mb-2">
                      ₹{(orderDetails.order?.totalPrice || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="d-flex align-items-center justify-content-between small text-muted border-top pt-2">
                      <span>Payment Method: {orderDetails.order?.paymentMethod || 'UPI Escrow'}</span>
                      {orderDetails.order?.paymentStatus === 'ESCROW_LOCKED' && (
                        <button
                          type="button"
                          className="admin-btn primary sm"
                          onClick={() => handleReleaseEscrow(orderDetails.order)}
                        >
                          <Unlock size={12} />
                          <span>Release Escrow to Farmer</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Produce Details */}
                  <div className="admin-card mb-0">
                    <div className="admin-card-header pb-2">
                      <div className="admin-card-title-group">
                        <h4 className="fs-6 fw-bold m-0 text-dark">Vegetable Produce Specs</h4>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="row g-2 small">
                        <div className="col-6">
                          <span className="text-muted d-block">Produce Name</span>
                          <span className="fw-bold text-dark">
                            {orderDetails.order?.cropDetails?.name || orderDetails.order?.cropName}
                          </span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Quality Grade</span>
                          <span className="admin-pill-badge lime">
                            {orderDetails.order?.cropDetails?.grade || 'Grade A'}
                          </span>
                        </div>
                        <div className="col-6 mt-2">
                          <span className="text-muted d-block">Order Quantity</span>
                          <span className="fw-bold text-dark font-mono">
                            {orderDetails.order?.quantityKg} Kg
                          </span>
                        </div>
                        <div className="col-6 mt-2">
                          <span className="text-muted d-block">Agreed Rate</span>
                          <span className="text-dark font-mono">
                            ₹{Math.round((orderDetails.order?.totalPrice || 0) / (orderDetails.order?.quantityKg || 1))} / Kg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Farmer & Hub Card */}
                  <div className="admin-card mb-0">
                    <div className="admin-card-header pb-2">
                      <div className="admin-card-title-group">
                        <h4 className="fs-6 fw-bold m-0 text-dark">Producer Farm & Origin Hub</h4>
                      </div>
                    </div>
                    <div className="p-3 small">
                      <div className="row g-2">
                        <div className="col-6">
                          <span className="text-muted d-block">Farmer Producer</span>
                          <span className="fw-bold text-dark">{orderDetails.order?.farmerName || 'Ramesh Kumar'}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Farmer System ID</span>
                          <span className="font-mono text-dark">{orderDetails.order?.farmerId || 'FMR-TN-2026-01'}</span>
                        </div>
                        <div className="col-12 mt-2">
                          <span className="text-muted d-block">Origin Collection Hub</span>
                          <span className="text-dark">
                            {orderDetails.order?.cropDetails?.hub || 'Central Agro Aggregation Hub'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buyer & Drop-off Location */}
                  <div className="admin-card mb-0">
                    <div className="admin-card-header pb-2">
                      <div className="admin-card-title-group">
                        <h4 className="fs-6 fw-bold m-0 text-dark">Commercial Buyer & Destination</h4>
                      </div>
                    </div>
                    <div className="p-3 small">
                      <div className="mb-2">
                        <span className="text-muted d-block">Buyer Organization</span>
                        <span className="fw-bold text-dark">
                          {orderDetails.order?.buyerName || orderDetails.order?.buyer?.businessName || 'Commercial Buyer'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="text-muted d-block">Delivery Address / Bay</span>
                        <span className="text-dark">{orderDetails.order?.deliveryAddress}</span>
                      </div>
                      {orderDetails.order?.preferredDeliveryDate && (
                        <div>
                          <span className="text-muted d-block">Requested Delivery Date</span>
                          <span className="font-mono text-dark">{orderDetails.order.preferredDeliveryDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Driver & EV Fleet Telemetry */}
                  <div className="admin-card mb-0">
                    <div className="admin-card-header pb-2">
                      <div className="admin-card-title-group">
                        <h4 className="fs-6 fw-bold m-0 text-dark">Assigned EV Fleet Logistics</h4>
                      </div>
                    </div>
                    <div className="p-3 small">
                      <div className="row g-2">
                        <div className="col-6">
                          <span className="text-muted d-block">Assigned Driver</span>
                          <span className="fw-bold text-dark">{orderDetails.order?.driver?.name || 'Unassigned'}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Driver Contact</span>
                          <span className="font-mono text-dark">{orderDetails.order?.driver?.phone || 'N/A'}</span>
                        </div>
                        <div className="col-12 mt-2">
                          <span className="text-muted d-block">EV Cargo Vehicle</span>
                          <div className="d-flex align-items-center gap-1 text-dark">
                            <Truck size={13} className="text-muted" />
                            <span className="font-mono">{orderDetails.order?.driver?.vehicle || 'Tata Ace EV Cargo'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Audit Notes */}
                  {orderDetails.order?.adminNote && (
                    <div className="p-2 bg-info-subtle text-info-emphasis rounded border border-info-subtle small">
                      <span className="fw-bold d-block" style={{ fontSize: '11px' }}>Operations Admin Audit Note</span>
                      <span>{orderDetails.order.adminNote}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="admin-drawer-footer">
              <button
                type="button"
                className="admin-btn outline sm w-100 justify-content-center"
                onClick={() => setSelectedOrderId(null)}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS INTERVENTION MODAL */}
      {interventionModal && (
        <div className="admin-dialog-backdrop" onClick={() => setInterventionModal(null)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="admin-dialog-header">
              <h4>Admin Intervention: Order #{interventionModal.order.orderId}</h4>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setInterventionModal(null)}
                aria-label="Close dialog"
              >
                <X size={14} />
              </button>
            </div>

            <div className="admin-dialog-body">
              <p className="text-muted small mb-3">
                Central Operations administrative override for order approval, payment escrow release, or delivery status.
              </p>

              <div className="mb-3">
                <label className="admin-field-label">Order Approval Status</label>
                <select
                  className="admin-select w-100"
                  value={interventionModal.newOrderStatus}
                  onChange={(e) =>
                    setInterventionModal((prev) => ({ ...prev, newOrderStatus: e.target.value }))
                  }
                >
                  <option value="CONFIRMED">CONFIRMED (Approved)</option>
                  <option value="PENDING_FARMER_APPROVAL">PENDING_FARMER_APPROVAL</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="admin-field-label">Payment / Escrow Status</label>
                <select
                  className="admin-select w-100"
                  value={interventionModal.newPaymentStatus}
                  onChange={(e) =>
                    setInterventionModal((prev) => ({ ...prev, newPaymentStatus: e.target.value }))
                  }
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ESCROW_LOCKED">ESCROW_LOCKED (Funds Held)</option>
                  <option value="PAID">PAID</option>
                  <option value="RELEASED_TO_FARMER">RELEASED_TO_FARMER (Payout Settled)</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="admin-field-label">Delivery Logistics Milestone</label>
                <select
                  className="admin-select w-100"
                  value={interventionModal.newDeliveryStatus}
                  onChange={(e) =>
                    setInterventionModal((prev) => ({ ...prev, newDeliveryStatus: e.target.value }))
                  }
                >
                  <option value="NOT_ASSIGNED">NOT_ASSIGNED</option>
                  <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                  <option value="PICKED_UP">PICKED_UP</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>

              <div className="mb-0">
                <label className="admin-field-label">Intervention Audit Reason / Note</label>
                <textarea
                  className="admin-form-input"
                  style={{ height: '70px', padding: '8px 12px' }}
                  rows={2}
                  placeholder="e.g., Manual escrow disbursement confirmed after physical delivery audit"
                  value={interventionModal.note}
                  onChange={(e) =>
                    setInterventionModal((prev) => ({ ...prev, note: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="admin-dialog-footer">
              <button
                type="button"
                className="admin-btn outline sm"
                onClick={() => setInterventionModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn primary sm"
                onClick={handleInterventionSave}
              >
                Save Intervention
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

