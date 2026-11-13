// pages/admin/AdminRequests.jsx - Centralized Purchase Requests & Commercial Inquiries Management
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  X,
  Download,
  Sprout,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Check,
  XCircle
} from 'lucide-react';
import api from '../../utils/api';
import { useAdmin } from '../../context/AdminContext';
import './AdminCommon.css';

export default function AdminRequests() {
  const { showToast } = useAdmin();
  const [requests, setRequests] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalReqId, setRejectModalReqId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    converted: 0,
    rejected: 0,
    totalInquiredKg: 0,
    totalInquiredValue: 0
  });

  // Detail Drawer state
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (status !== 'all') params.append('status', status);
      params.append('page', page);
      params.append('limit', 10);

      const res = await api.get(`/admin/requests?${params.toString()}`);
      if (res && res.success) {
        setRequests(res.requests || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err) {
      console.warn('Failed to load purchase requests:', err.message);
      showToast('error', 'Unable to retrieve purchase requests');
    } finally {
      setLoading(false);
    }
  }, [search, status, page, showToast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const openRequestDetails = async (id) => {
    setSelectedRequestId(id);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/requests/${id}`);
      if (res && res.success) {
        setRequestDetails(res.request);
      }
    } catch (err) {
      console.warn('Failed to load request details:', err.message);
      showToast('error', 'Unable to retrieve purchase request details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleApprove = async (id) => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/requests/${id}/accept`);
      if (res && res.success) {
        showToast('success', res.message || `Request #${id} approved and converted to order!`);
        if (requestDetails && (requestDetails.requestId === id || requestDetails._id === id)) {
          setRequestDetails((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'CONVERTED_TO_ORDER',
                  orderId: res.order?.orderId || res.request?.orderId
                }
              : null
          );
        }
        loadRequests();
      }
    } catch (err) {
      console.error('Failed to approve request:', err);
      showToast('error', err.response?.data?.message || 'Failed to approve purchase request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    if (e) e.preventDefault();
    if (!rejectModalReqId) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/requests/${rejectModalReqId}/reject`, {
        reason: rejectReason.trim() || 'Declined by platform administrator'
      });
      if (res && res.success) {
        showToast('success', `Request #${rejectModalReqId} has been rejected.`);
        if (requestDetails && (requestDetails.requestId === rejectModalReqId || requestDetails._id === rejectModalReqId)) {
          setRequestDetails((prev) =>
            prev ? { ...prev, status: 'REJECTED', rejectionReason: rejectReason } : null
          );
        }
        setRejectModalReqId(null);
        setRejectReason('');
        loadRequests();
      }
    } catch (err) {
      console.error('Failed to reject request:', err);
      showToast('error', err.response?.data?.message || 'Failed to reject purchase request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      showToast('info', 'Preparing purchase requests CSV export...');
      const baseUrl = api.defaults?.baseURL || 'http://localhost:5000/api';
      const token = localStorage.getItem('admin_token');
      const exportUrl = `${baseUrl}/admin/reports/export?module=requests`;

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
      a.download = `naam_uzhavar_purchase_requests_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showToast('success', 'Purchase requests report exported successfully!');
    } catch (err) {
      console.error('CSV export failed:', err);
      showToast('error', 'Failed to generate CSV export file');
    }
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case 'ACCEPTED':
      case 'CONVERTED_TO_ORDER':
        return 'active';
      case 'PENDING':
        return 'pending';
      case 'REJECTED':
      case 'EXPIRED':
        return 'rejected';
      default:
        return 'pending';
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Recent';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="admin-card-title-group">
          <h2 className="fs-5 fw-bold text-dark m-0">Purchase Requests</h2>
          <p className="text-muted small m-0">Buyer vegetable purchase requests and order conversions</p>
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

      {/* Essential KPI Cards */}
      <div className="admin-kpi-grid">
        {/* Card 1: Total Requests */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">Total Requests</span>
            <div className="admin-kpi-icon-wrap blue">
              <ShoppingCart size={17} />
            </div>
          </div>
          <div className="admin-kpi-value">{metrics.total}</div>
          <div className="admin-kpi-footer">
            <span className="badge-trend neutral">{metrics.pending} Pending</span>
            <span>Commercial purchase inquiries</span>
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">Pending Approval</span>
            <div className="admin-kpi-icon-wrap ochre">
              <Clock size={17} />
            </div>
          </div>
          <div className="admin-kpi-value">{metrics.pending}</div>
          <div className="admin-kpi-footer">
            <span className="badge-trend warning">Awaiting Action</span>
            <span>Platform response pending</span>
          </div>
        </div>

        {/* Card 3: Converted Orders */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">Converted Orders</span>
            <div className="admin-kpi-icon-wrap green">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="admin-kpi-value">{metrics.converted}</div>
          <div className="admin-kpi-footer">
            <span className="badge-trend success">Converted</span>
            <span>Fulfilled to confirmed orders</span>
          </div>
        </div>

        {/* Card 4: Total Value */}
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">Total Inquired Value</span>
            <div className="admin-kpi-icon-wrap purple">
              <Sprout size={17} />
            </div>
          </div>
          <div className="admin-kpi-value">₹{(metrics.totalInquiredValue || 0).toLocaleString('en-IN')}</div>
          <div className="admin-kpi-footer">
            <span className="badge-trend neutral">{(metrics.totalInquiredKg || 0).toLocaleString('en-IN')} Kg</span>
            <span>Aggregate volume</span>
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
              placeholder="Search by Request ID, Buyer, Farmer, Crop, Location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="admin-filter-group">
            <div className="admin-segmented-control">
              {['all', 'PENDING', 'ACCEPTED', 'CONVERTED_TO_ORDER', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`admin-segment-btn ${status === st ? 'active' : ''}`}
                  onClick={() => {
                    setStatus(st);
                    setPage(1);
                  }}
                >
                  {st === 'all'
                    ? 'All'
                    : st === 'CONVERTED_TO_ORDER'
                    ? 'Converted'
                    : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="admin-btn outline sm"
              onClick={loadRequests}
              title="Refresh requests"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Buyer</th>
                <th>Farmer</th>
                <th>Vegetable</th>
                <th>Quantity & Rate</th>
                <th>Total Value</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <RefreshCw size={24} className="animate-spin mb-2 d-inline-block" />
                    <div>Loading purchase requests...</div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <AlertCircle size={24} className="mb-2 text-warning d-inline-block" />
                    <div>No purchase requests found matching the filter criteria.</div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const reqId = req.requestId || req._id;
                  const crop = req.cropDetails || {};
                  const buyer = req.buyerDetails || {};
                  const isPending = req.status === 'PENDING';

                  return (
                    <tr key={req._id || req.requestId}>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <ShoppingCart size={13} className="text-primary flex-shrink-0" />
                          <span className="font-monospace fw-bold text-dark">{reqId}</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          {formatDate(req.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold text-dark d-flex align-items-center gap-1">
                            <span>{buyer.businessName || req.buyerName || 'Commercial Buyer'}</span>
                            {buyer.verified && (
                              <ShieldCheck size={12} className="text-success flex-shrink-0" title="Verified Buyer" />
                            )}
                          </div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            {buyer.location || req.deliveryLocation || 'Tamil Nadu'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold text-dark">{req.farmerName || 'Farmer'}</div>
                          <div className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                            {req.farmerId || 'FMR-TN'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold text-dark">{crop.name || 'Vegetables'}</div>
                          <span className="admin-pill-badge lime" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {crop.grade || 'Grade A'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="font-monospace fw-bold text-dark">
                            {(req.quantity || 0).toLocaleString('en-IN')} {req.unit || 'Kg'}
                          </div>
                          <div className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                            @ ₹{req.offeredPrice || 0}/Kg
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-monospace fw-bold text-dark fs-6">
                          ₹{(req.totalEstimatedValue || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-pill ${getStatusBadgeClass(req.status)}`}>
                          {req.status === 'CONVERTED_TO_ORDER' ? 'ORDER CREATED' : req.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="d-flex align-items-center justify-content-end gap-1">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="admin-btn sm"
                                style={{
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  border: '1px solid #bbf7d0',
                                  padding: '4px 8px'
                                }}
                                onClick={() => handleApprove(reqId)}
                                disabled={actionLoading}
                                title="Approve & Convert to Order"
                              >
                                <Check size={12} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                className="admin-btn sm"
                                style={{
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  border: '1px solid #fecaca',
                                  padding: '4px 8px'
                                }}
                                onClick={() => {
                                  setRejectModalReqId(reqId);
                                  setRejectReason('');
                                }}
                                disabled={actionLoading}
                                title="Reject Request"
                              >
                                <X size={12} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="admin-btn outline sm"
                            onClick={() => openRequestDetails(reqId)}
                            title="View Request Details"
                          >
                            <Eye size={12} />
                            <span>Details</span>
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
            Showing <strong>{requests.length}</strong> of <strong>{totalCount}</strong> purchase requests
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

      {/* DETAIL DRAWER */}
      {selectedRequestId && (
        <div className="admin-drawer-backdrop" onClick={() => setSelectedRequestId(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <h3>Purchase Request #{selectedRequestId}</h3>
              <button
                type="button"
                className="admin-drawer-close"
                onClick={() => setSelectedRequestId(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-drawer-body">
              {loadingDetails || !requestDetails ? (
                <div className="text-center py-5 text-muted">
                  <RefreshCw size={24} className="animate-spin mb-2 d-inline-block" />
                  <div>Loading inquiry details...</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {/* Status Banner */}
                  <div className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <span className="text-muted small d-block">Negotiation Status</span>
                      <span className={`admin-pill ${getStatusBadgeClass(requestDetails.status)} mt-1 d-inline-block`}>
                        {requestDetails.status}
                      </span>
                    </div>
                    {requestDetails.orderId && (
                      <Link
                        to={`/admin/orders?search=${requestDetails.orderId}`}
                        className="admin-btn primary sm text-decoration-none"
                      >
                        <span>View Order #{requestDetails.orderId}</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>

                  {/* Commercial Specifications */}
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
                          <span className="fw-bold text-dark">{requestDetails.cropDetails?.name || 'Fresh Produce'}</span>
                          {requestDetails.cropDetails?.nameTa && (
                            <div className="text-muted font-tamil">{requestDetails.cropDetails.nameTa}</div>
                          )}
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Quality Grade</span>
                          <span className="admin-pill-badge lime">{requestDetails.cropDetails?.grade || 'Grade A'}</span>
                        </div>
                        <div className="col-6 mt-2">
                          <span className="text-muted d-block">Requested Volume</span>
                          <span className="fw-bold text-dark font-monospace">
                            {requestDetails.quantity} {requestDetails.unit || 'Kg'}
                          </span>
                        </div>
                        <div className="col-6 mt-2">
                          <span className="text-muted d-block">Offered Farmgate Rate</span>
                          <span className="fw-bold text-primary font-monospace">
                            ₹{requestDetails.offeredPrice} / Kg
                          </span>
                        </div>
                        <div className="col-12 mt-2 pt-2 border-top">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-semibold text-muted">Total Proposed Valuation:</span>
                            <span className="fs-5 fw-bold text-success font-monospace">
                              ₹{(requestDetails.totalEstimatedValue || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buyer Organization Card */}
                  <div className="admin-card mb-0">
                    <div className="admin-card-header pb-2">
                      <div className="admin-card-title-group">
                        <h4 className="fs-6 fw-bold m-0 text-dark">Commercial Buyer Credentials</h4>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="row g-2 small">
                        <div className="col-6">
                          <span className="text-muted d-block">Business Entity</span>
                          <span className="fw-bold text-dark">{requestDetails.buyerDetails?.businessName || 'Commercial Buyer'}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Entity Type</span>
                          <span className="text-capitalize text-dark">{requestDetails.buyerDetails?.buyerType || 'Hotel / Wholesaler'}</span>
                        </div>
                        <div className="col-6 mt-2">
                          <span className="text-muted d-block">Contact Phone</span>
                          <span className="text-dark font-monospace">{requestDetails.buyerDetails?.phone || '+91 98401 23456'}</span>
                        </div>
                        <div className="col-6 mt-2">
                          <span className="text-muted d-block">Official Email</span>
                          <span className="text-dark">{requestDetails.buyerDetails?.email || 'procurement@buyer.com'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Target Producer Farmer */}
                  <div className="admin-card mb-0">
                    <div className="admin-card-header pb-2">
                      <div className="admin-card-title-group">
                        <h4 className="fs-6 fw-bold m-0 text-dark">Target Farmer Producer</h4>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="row g-2 small">
                        <div className="col-6">
                          <span className="text-muted d-block">Farmer Name</span>
                          <span className="fw-bold text-dark">{requestDetails.farmerName || 'Ramesh Kumar'}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Farmer System ID</span>
                          <span className="font-monospace text-dark">{requestDetails.farmerId || 'FMR-TN-2026-01'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Location & Notes */}
                  <div className="admin-card mb-0">
                    <div className="admin-card-header pb-2">
                      <div className="admin-card-title-group">
                        <h4 className="fs-6 fw-bold m-0 text-dark">Fulfillment & Drop-off</h4>
                      </div>
                    </div>
                    <div className="p-3 small">
                      <div className="mb-2">
                        <span className="text-muted d-block">Receiving Dock / Delivery Bay</span>
                        <span className="text-dark fw-semibold">{requestDetails.deliveryLocation || 'Commercial Hub, Coimbatore'}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-muted d-block">Preferred Delivery Date</span>
                        <span className="text-dark font-monospace">
                          {requestDetails.preferredDeliveryDate || 'Immediate Dispatch'}
                        </span>
                      </div>
                      {requestDetails.notes && (
                        <div className="p-2 bg-light rounded mt-2 border">
                          <span className="text-muted d-block" style={{ fontSize: '11px' }}>Procurement Note</span>
                          <span className="text-dark">{requestDetails.notes}</span>
                        </div>
                      )}
                      {requestDetails.rejectionReason && (
                        <div className="p-2 bg-danger-subtle text-danger rounded mt-2 border border-danger-subtle">
                          <span className="fw-bold d-block" style={{ fontSize: '11px' }}>Rejection Reason</span>
                          <span>{requestDetails.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-drawer-footer d-flex align-items-center gap-2">
              {requestDetails && requestDetails.status === 'PENDING' ? (
                <>
                  <button
                    type="button"
                    className="admin-btn primary sm flex-grow-1 justify-content-center"
                    onClick={() => handleApprove(requestDetails.requestId || requestDetails._id)}
                    disabled={actionLoading}
                  >
                    <Check size={13} />
                    <span>Approve & Convert</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn sm"
                    style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                    onClick={() => {
                      setRejectModalReqId(requestDetails.requestId || requestDetails._id);
                      setRejectReason('');
                    }}
                    disabled={actionLoading}
                  >
                    <XCircle size={13} />
                    <span>Reject</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn outline sm"
                    onClick={() => setSelectedRequestId(null)}
                  >
                    Close
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="admin-btn outline sm w-100 justify-content-center"
                  onClick={() => setSelectedRequestId(null)}
                >
                  Close Drawer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {rejectModalReqId && (
        <div className="admin-modal-backdrop" onClick={() => setRejectModalReqId(null)}>
          <div className="admin-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="fs-6 fw-bold text-dark m-0">Reject Purchase Request</h3>
              <button
                type="button"
                className="admin-drawer-close"
                onClick={() => setRejectModalReqId(null)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleReject}>
              <div className="admin-modal-body p-3">
                <p className="text-muted small mb-3">
                  Please provide a reason for declining purchase request <strong>#{rejectModalReqId}</strong>.
                  This note will be recorded for audit and communicated to the buyer.
                </p>
                <div className="mb-2">
                  <label className="form-label small fw-semibold text-dark">
                    Rejection Reason
                  </label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="3"
                    placeholder="e.g., Requested volume exceeds current farm harvest capacity or logistic constraint..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="admin-modal-footer p-3 border-top d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  className="admin-btn outline sm"
                  onClick={() => setRejectModalReqId(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn sm"
                  style={{ background: '#dc2626', color: '#fff', border: '1px solid #b91c1c' }}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <XCircle size={12} />
                  )}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
