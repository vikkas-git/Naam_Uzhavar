// pages/admin/AdminBuyers.jsx - Centralized Commercial Buyer Management
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Store,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Building,
  RefreshCw,
  X,
  UserCheck,
  UserX,
  ShoppingCart,
  FileText
} from 'lucide-react';
import api from '../../utils/api';
import { useAdmin } from '../../context/AdminContext';
import './AdminCommon.css';

export default function AdminBuyers() {
  const { showToast } = useAdmin();
  const [buyers, setBuyers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [buyerType, setBuyerType] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  // Detail Drawer state
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);
  const [buyerDetails, setBuyerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Status Action Confirmation Modal
  const [confirmModal, setConfirmModal] = useState(null);

  const loadBuyers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (buyerType !== 'all') params.append('buyerType', buyerType);
      if (status !== 'all') params.append('status', status);
      params.append('page', page);
      params.append('limit', 10);

      const res = await api.get(`/admin/buyers?${params.toString()}`);
      if (res && res.success) {
        setBuyers(res.buyers || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.warn('Failed to load buyers directory:', err.message);
      showToast('error', 'Unable to retrieve buyers list');
    } finally {
      setLoading(false);
    }
  }, [search, buyerType, status, page, showToast]);

  useEffect(() => {
    loadBuyers();
  }, [loadBuyers]);

  // Load individual buyer profile with linked purchase requests and historical orders
  const openBuyerDetails = async (id) => {
    setSelectedBuyerId(id);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/buyers/${id}`);
      if (res && res.success) {
        setBuyerDetails(res);
      }
    } catch (err) {
      console.warn('Failed to load buyer details:', err.message);
      showToast('error', 'Unable to retrieve buyer profile');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Toggle buyer account status
  const handleToggleStatus = async (buyer) => {
    const nextStatus = buyer.status === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await api.patch(`/admin/buyers/${buyer.id || buyer._id}/status`, {
        status: nextStatus
      });
      if (res && res.success) {
        showToast('success', res.message || `Buyer status updated to ${nextStatus}`);
        setConfirmModal(null);
        loadBuyers();
        if (buyerDetails && (buyerDetails.buyer?._id === buyer._id || buyerDetails.buyer?.businessName === buyer.businessName)) {
          setBuyerDetails((prev) => ({
            ...prev,
            buyer: { ...prev.buyer, status: nextStatus }
          }));
        }
      }
    } catch (err) {
      showToast('error', 'Failed to update buyer status');
    }
  };

  const buyerTypeLabels = {
    hotel: 'Hotel / Banquet',
    supermarket: 'Supermarket Chain',
    restaurant: 'Restaurant / Kitchen',
    wholesale: 'Wholesale Distributor',
    small_shop: 'Retail Produce Shop'
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-card">
        {/* Header */}
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <h3>Commercial Buyer Management</h3>
            <p>Manage commercial buyers, procurement enquiries, and account status</p>
          </div>
          <button
            type="button"
            className="admin-btn outline sm"
            onClick={loadBuyers}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="admin-controls-bar">
          <div className="admin-search-wrap">
            <Search size={15} />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by business name, contact, phone, location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="admin-filter-group">
            <select
              className="admin-select"
              value={buyerType}
              onChange={(e) => {
                setBuyerType(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Buyer Types</option>
              <option value="hotel">Hotels & Banquets</option>
              <option value="supermarket">Supermarket Chains</option>
              <option value="restaurant">Restaurants & Catering</option>
              <option value="wholesale">Wholesale Produce Distributors</option>
            </select>

            <select
              className="admin-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended Accounts</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Procurement Lead</th>
                <th>Buyer Sector</th>
                <th>Delivery Address</th>
                <th>Orders Placed</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && buyers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    Loading commercial buyers...
                  </td>
                </tr>
              ) : buyers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No buyer accounts found matching the search criteria.
                  </td>
                </tr>
              ) : (
                buyers.map((buyer) => {
                  const bId = buyer.id || buyer._id;
                  const isSuspended = buyer.status === 'suspended';

                  return (
                    <tr key={bId}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={buyer.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&auto=format&fit=crop&q=80'}
                            alt=""
                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-bold text-dark">{buyer.businessName}</div>
                            <div className="text-muted font-mono" style={{ fontSize: '11px' }}>
                              GSTIN: {buyer.gstin || 'Unregistered'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold text-dark">{buyer.contactPerson || 'Procurement Lead'}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{buyer.phone}</div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-pill active" style={{ background: '#e8eff6', color: '#2b5c8a', borderColor: '#c5d5e5' }}>
                          {buyerTypeLabels[buyer.buyerType?.toLowerCase()] || buyer.buyerType || 'Commercial'}
                        </span>
                      </td>
                      <td>
                        <div className="small text-muted" style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {buyer.address}
                        </div>
                      </td>
                      <td>
                        <span className="fw-bold font-mono text-dark">
                          {buyer.orderCount || 0} Orders
                        </span>
                      </td>
                      <td>
                        <span className={`admin-pill ${isSuspended ? 'suspended' : 'active'}`}>
                          {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="d-inline-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="admin-btn outline sm"
                            onClick={() => openBuyerDetails(bId)}
                            title="Inspect Buyer Requests & Orders"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            className="admin-btn outline sm"
                            style={{ color: isSuspended ? '#4f6df5' : '#dc2626' }}
                            onClick={() => setConfirmModal({ buyer, action: 'toggle_status' })}
                            title={isSuspended ? 'Reactivate Buyer Account' : 'Suspend Buyer Account'}
                          >
                            {isSuspended ? <UserCheck size={12} /> : <UserX size={12} />}
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
            Showing <strong>{buyers.length}</strong> of <strong>{totalCount}</strong> buyers
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
      {selectedBuyerId && (
        <div className="admin-drawer-backdrop" onClick={() => setSelectedBuyerId(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <h3>Commercial Buyer Profile & Procurement</h3>
              <button
                type="button"
                className="admin-btn outline sm"
                onClick={() => setSelectedBuyerId(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-drawer-body">
              {loadingDetails || !buyerDetails ? (
                <div className="text-center py-5 text-muted">Retrieving buyer procurement records...</div>
              ) : (
                <>
                  {/* Buyer Profile Box */}
                  <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3">
                    <img
                      src={buyerDetails.buyer.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80'}
                      alt=""
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h4 className="m-0 fw-bold text-dark">{buyerDetails.buyer.businessName}</h4>
                      <div className="text-muted small">{buyerDetails.buyer.contactPerson}</div>
                      <div className="d-flex gap-2 mt-1">
                        <span className="admin-pill active" style={{ background: '#e8eff6', color: '#2b5c8a', borderColor: '#c5d5e5' }}>
                          {buyerTypeLabels[buyerDetails.buyer.buyerType?.toLowerCase()] || buyerDetails.buyer.buyerType}
                        </span>
                        <span className={`admin-pill ${buyerDetails.buyer.status === 'suspended' ? 'suspended' : 'active'}`}>
                          {buyerDetails.buyer.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Legal Section */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-title">Business & Legal Credentials</div>
                    <div className="admin-detail-grid">
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Official Phone</span>
                        <span className="admin-detail-val">{buyerDetails.buyer.phone}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Email Address</span>
                        <span className="admin-detail-val">{buyerDetails.buyer.email}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">GSTIN Identification</span>
                        <span className="admin-detail-val font-mono">{buyerDetails.buyer.gstin || '33AAAAA0000A1Z5'}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Total Procurement Value</span>
                        <span className="admin-detail-val text-success font-mono">
                          ₹{(buyerDetails.metrics?.totalSpent || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="admin-detail-item" style={{ gridColumn: 'span 2' }}>
                        <span className="admin-detail-label">Commercial Delivery Dock</span>
                        <span className="admin-detail-val">{buyerDetails.buyer.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Requests Section */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-title">
                      Recent Purchase Enquiries ({buyerDetails.requests?.length || 0})
                    </div>
                    {buyerDetails.requests?.length === 0 ? (
                      <div className="text-muted small">No active purchase requests on record.</div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {buyerDetails.requests.map((req) => (
                          <div key={req._id || req.requestId} className="p-2 border rounded-2 d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-bold small text-dark">{req.cropDetails?.name || 'Produce'}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>
                                To: {req.farmerName || 'Farmer'} • {req.quantity} {req.unit || 'Kg'}
                              </div>
                            </div>
                            <div className="text-end">
                              <span className={`admin-pill ${req.status === 'ACCEPTED' ? 'active' : 'pending'}`}>
                                {req.status}
                              </span>
                              <div className="small font-mono fw-bold text-dark mt-1">₹{req.offeredPrice}/Kg</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Historical Orders Section */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-title">
                      Commercial Orders ({buyerDetails.orders?.length || 0})
                    </div>
                    {buyerDetails.orders?.length === 0 ? (
                      <div className="text-muted small">No confirmed dispatches recorded.</div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {buyerDetails.orders.map((ord) => (
                          <div key={ord._id || ord.orderId} className="p-2 border rounded-2 d-flex justify-content-between align-items-center">
                            <div>
                              <div className="font-mono fw-bold text-dark small">{ord.orderId}</div>
                              <div className="text-muted" style={{ fontSize: '11px' }}>
                                {ord.cropDetails?.name || ord.cropName} • {ord.quantityKg} Kg
                              </div>
                            </div>
                            <div className="text-end">
                              <span className={`admin-pill ${ord.deliveryStatus === 'DELIVERED' ? 'delivered' : 'intransit'}`}>
                                {ord.deliveryStatus}
                              </span>
                              <div className="small font-mono fw-bold text-success mt-1">₹{ord.totalPrice?.toLocaleString('en-IN')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="admin-drawer-footer">
              {buyerDetails && (
                <button
                  type="button"
                  className="admin-btn primary sm"
                  onClick={() => handleToggleStatus(buyerDetails.buyer)}
                  style={{
                    background: buyerDetails.buyer.status === 'suspended' ? '#4f6df5' : '#dc2626',
                    borderColor: 'transparent'
                  }}
                >
                  <span>{buyerDetails.buyer.status === 'suspended' ? 'Activate Buyer Account' : 'Suspend Buyer Account'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="admin-drawer-backdrop" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-card p-4 m-3" style={{ maxWidth: '420px', width: '100%' }}>
            <h4 className="fw-bold text-dark mb-2">
              {confirmModal.buyer.status === 'suspended' ? 'Reactivate Buyer Account?' : 'Suspend Buyer Account?'}
            </h4>
            <p className="text-muted small mb-4">
              Are you sure you want to change the status of <strong>{confirmModal.buyer.businessName}</strong>? Suspended buyers cannot place new purchase enquiries.
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="admin-btn outline sm"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn primary sm"
                onClick={() => handleToggleStatus(confirmModal.buyer)}
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

