// pages/admin/AdminRequests.jsx - Centralized Purchase Requests & Commercial Inquiries Management
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  User,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
  Download,
  Printer,
  TrendingUp,
  MapPin,
  DollarSign,
  Sprout
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
      <div className="row g-3 mb-4">
        {/* Card 1: Total Requests */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-card p-3 h-100 d-flex flex-column justify-content-between">
            <span className="text-muted small fw-semibold">Total Requests</span>
            <div className="my-1">
              <h3 className="fs-3 fw-bold text-dark m-0">{metrics.total}</h3>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1">
              <Clock size={12} className="text-muted" />
              <span>{metrics.pending} pending approval</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Approval */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-card p-3 h-100 d-flex flex-column justify-content-between">
            <span className="text-muted small fw-semibold">Pending Approval</span>
            <div className="my-1">
              <h3 className="fs-3 fw-bold m-0" style={{ color: '#d97706' }}>{metrics.pending}</h3>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1">
              <Clock size={12} className="text-warning" />
              <span>Awaiting farmer response</span>
            </div>
          </div>
        </div>

        {/* Card 3: Converted Orders */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-card p-3 h-100 d-flex flex-column justify-content-between">
            <span className="text-muted small fw-semibold">Converted Orders</span>
            <div className="my-1">
              <h3 className="fs-3 fw-bold m-0" style={{ color: '#16a34a' }}>{metrics.converted}</h3>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1">
              <CheckCircle2 size={12} className="text-success" />
              <span>Converted to confirmed orders</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Value */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="admin-card p-3 h-100 d-flex flex-column justify-content-between">
            <span className="text-muted small fw-semibold">Total Value</span>
            <div className="my-1">
              <h3 className="fs-3 fw-bold text-dark m-0">
                ₹{(metrics.totalInquiredValue || 0).toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="small text-muted d-flex align-items-center gap-1">
              <Sprout size={12} className="text-success" />
              <span>{(metrics.totalInquiredKg || 0).toLocaleString('en-IN')} Kg vegetables</span>
            </div>
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
              placeholder="Search by Request ID, Buyer, Farmer, Crop, Bay..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="admin-filter-group">
            <div className="admin-module-pill-container" style={{ padding: '3px' }}>
              {['all', 'PENDING', 'ACCEPTED', 'CONVERTED_TO_ORDER', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className="admin-btn sm"
                  style={{
                    background: status === st ? '#181e2b' : 'transparent',
                    color: status === st ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: status === st ? '700' : '600'
                  }}
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
              <RefreshCw size={12} className={loading ? 'spin' : ''} />
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
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <RefreshCw size={24} className="spin mb-2" />
                    <div>Loading purchase requests...</div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <AlertCircle size={24} className="mb-2 text-warning" />
                    <div>No purchase requests found matching the filter criteria.</div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const reqId = req.requestId || req._id;
                  const crop = req.cropDetails || {};
                  const buyer = req.buyerDetails || {};
                  return (
                    <tr key={req._id || req.requestId}>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <ShoppingCart size={13} className="text-primary" />
                          <span className="font-mono fw-bold text-dark">{req.requestId}</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          {new Date(req.createdAt || Date.now()).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold text-dark d-flex align-items-center gap-1">
                            <span>{buyer.businessName || 'Commercial Buyer'}</span>
                            {buyer.verified && (
                              <ShieldCheck size={12} className="text-success" title="Verified Buyer" />
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
                          <div className="text-muted font-mono" style={{ fontSize: '11px' }}>
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
                          <div className="font-mono fw-bold text-dark">
                            {(req.quantity || 0).toLocaleString('en-IN')} {req.unit || 'Kg'}
                          </div>
                          <div className="text-muted font-mono" style={{ fontSize: '11px' }}>
                            @ ₹{req.offeredPrice || 0}/Kg
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono fw-bold text-dark fs-6">
                          ₹{(req.totalEstimatedValue || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-pill ${getStatusBadgeClass(req.status)}`}>
                          {req.status === 'CONVERTED_TO_ORDER' ? 'ORDER CREATED' : req.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="admin-btn outline sm"
                          onClick={() => openRequestDetails(reqId)}
                          title="View Request Details"
                        >
                          <Eye size={12} />
                          <span>Details</span>
                        </button>
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
                  <RefreshCw size={24} className="spin mb-2" />
                  <div>Loading inquiry details...</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {/* Status Banner */}
                  <div className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
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
                          <span className="fw-bold text-dark">{requestDetails.cropDetails?.name}</span>
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
                          <span className="fw-bold text-dark font-mono">
                            {requestDetails.quantity} {requestDetails.unit || 'Kg'}
                          </span>
                        </div>
                        <div className="col-6 mt-2">
                          <span className="text-muted d-block">Offered Farmgate Rate</span>
                          <span className="fw-bold text-primary font-mono">
                            ₹{requestDetails.offeredPrice} / Kg
                          </span>
                        </div>
                        <div className="col-12 mt-2 pt-2 border-top">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-semibold text-muted">Total Proposed Valuation:</span>
                            <span className="fs-5 fw-bold text-success font-mono">
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
                          <span className="fw-bold text-dark">{requestDetails.buyerDetails?.businessName}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Entity Type</span>
                          <span className="text-capitalize text-dark">{requestDetails.buyerDetails?.buyerType}</span>
                        </div>
                        <div className="col-6 mt-2">
                          <span className="text-muted d-block">Contact Phone</span>
                          <span className="text-dark font-mono">{requestDetails.buyerDetails?.phone}</span>
                        </div>
                        <div className="col-6 mt-2">
                          <span className="text-muted d-block">Official Email</span>
                          <span className="text-dark">{requestDetails.buyerDetails?.email}</span>
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
                          <span className="fw-bold text-dark">{requestDetails.farmerName}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Farmer System ID</span>
                          <span className="font-mono text-dark">{requestDetails.farmerId}</span>
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
                        <span className="text-dark fw-semibold">{requestDetails.deliveryLocation}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-muted d-block">Preferred Delivery Date</span>
                        <span className="text-dark font-mono">
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

            <div className="admin-drawer-footer">
              <button
                type="button"
                className="admin-btn outline sm w-100 justify-content-center"
                onClick={() => setSelectedRequestId(null)}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

