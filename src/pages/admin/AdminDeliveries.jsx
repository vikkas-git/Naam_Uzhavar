// pages/admin/AdminDeliveries.jsx - Centralized Delivery Logistics & EV Fleet Dispatch Management
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Truck,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import api from '../../utils/api';
import { useAdmin } from '../../context/AdminContext';
import './AdminCommon.css';

export default function AdminDeliveries() {
  const { showToast } = useAdmin();
  const [deliveries, setDeliveries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  // Detail Drawer state
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Status intervention state
  const [editStatusModal, setEditStatusModal] = useState(null); // { order, newStatus }

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (status !== 'all') params.append('status', status);
      params.append('page', page);
      params.append('limit', 10);

      const res = await api.get(`/admin/deliveries?${params.toString()}`);
      if (res && res.success) {
        setDeliveries(res.deliveries || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.warn('Failed to load deliveries:', err.message);
      showToast('error', 'Unable to retrieve delivery consignments');
    } finally {
      setLoading(false);
    }
  }, [search, status, page, showToast]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const openDeliveryDetails = async (id) => {
    setSelectedOrderId(id);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/deliveries/${id}`);
      if (res && res.success) {
        setDeliveryDetails(res);
      }
    } catch (err) {
      console.warn('Failed to load delivery details:', err.message);
      showToast('error', 'Unable to retrieve consignment details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (orderId, newMilestone) => {
    try {
      const res = await api.patch(`/admin/deliveries/${orderId}/status`, {
        deliveryStatus: newMilestone,
        note: `Manual milestone update executed by Central Operations Administrator`
      });
      if (res && res.success) {
        showToast('success', res.message || `Consignment milestone updated to ${newMilestone}`);
        setEditStatusModal(null);
        loadDeliveries();
        if (deliveryDetails && deliveryDetails.order?.orderId === orderId) {
          setDeliveryDetails((prev) => ({
            ...prev,
            order: { ...prev.order, deliveryStatus: newMilestone }
          }));
        }
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update delivery status');
    }
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
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
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-card">
        {/* Header */}
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <h3>Delivery Logistics Management</h3>
            <p>Track consignments, assigned drivers, and delivery milestones</p>
          </div>
          <button
            type="button"
            className="admin-btn outline sm"
            onClick={loadDeliveries}
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
              placeholder="Search by order ID, crop, buyer, driver, bay..."
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
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Delivery Milestones</option>
              <option value="NOT_ASSIGNED">Not Assigned</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit (Live)</option>
              <option value="DELIVERED">Delivered (Completed)</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Produce / Cargo</th>
                <th>Buyer Destination</th>
                <th>Assigned Driver</th>
                <th>Vehicle</th>
                <th>Milestone Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && deliveries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    Loading delivery logistics ledger...
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No delivery consignments match the selected criteria.
                  </td>
                </tr>
              ) : (
                deliveries.map((del) => {
                  const ordId = del.orderId || del.id || del._id;
                  const c = del.cropDetails || {};
                  const d = del.driver || {};

                  return (
                    <tr key={ordId}>
                      <td>
                        <span className="font-mono fw-bold text-dark">{ordId}</span>
                      </td>
                      <td>
                        <div>
                          <div className="fw-bold text-dark">{c.name || del.cropName || 'Produce'}</div>
                          <div className="text-muted small">
                            {del.quantityKg || 0} Kg • ₹{(del.totalPrice || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold text-dark">{del.buyerName || del.buyerDetails?.businessName || 'Commercial Buyer'}</div>
                          <div className="text-muted" style={{ fontSize: '11px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {del.deliveryAddress}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="fw-semibold text-dark">{d.name || 'Unassigned'}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{d.phone || '+91 94432 11098'}</div>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div className="d-flex align-items-center gap-1">
                            <Truck size={12} className="text-muted" />
                            <span className="font-mono text-dark fw-semibold">{d.vehicle || 'Tata Ace EV Cargo'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-pill ${getStatusBadgeClass(del.deliveryStatus)}`}>
                          {del.deliveryStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="d-inline-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="admin-btn outline sm"
                            onClick={() => openDeliveryDetails(ordId)}
                            title="View Consignment Details"
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
            Showing <strong>{deliveries.length}</strong> of <strong>{totalCount}</strong> consignments
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
      {selectedOrderId && (
        <div className="admin-drawer-backdrop" onClick={() => setSelectedOrderId(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <h3>Consignment #{selectedOrderId} Details</h3>
              <button
                type="button"
                className="admin-btn outline sm"
                onClick={() => setSelectedOrderId(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-drawer-body">
              {loadingDetails || !deliveryDetails ? (
                <div className="text-center py-5 text-muted">Retrieving delivery details...</div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className="p-3 mb-4 rounded-3 d-flex align-items-center justify-content-between" style={{ background: '#eff2fe', border: '1px solid #c7d2fe' }}>
                    <div>
                      <div className="small text-muted fw-bold">DELIVERY STATUS</div>
                      <div className="fs-5 fw-bold text-success">{deliveryDetails.order?.deliveryStatus}</div>
                    </div>
                    <span className={`admin-pill ${getStatusBadgeClass(deliveryDetails.order?.deliveryStatus)}`}>
                      {deliveryDetails.order?.deliveryStatus}
                    </span>
                  </div>

                  {/* Consignment Specs */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-title">Produce & Order Information</div>
                    <div className="admin-detail-grid">
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Produce</span>
                        <span className="admin-detail-val">{deliveryDetails.order?.cropDetails?.name || deliveryDetails.order?.cropName}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Weight</span>
                        <span className="admin-detail-val">{deliveryDetails.order?.quantityKg} Kg</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Total Value</span>
                        <span className="admin-detail-val text-success font-mono">
                          ₹{(deliveryDetails.order?.totalPrice || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Origin Hub</span>
                        <span className="admin-detail-val">{deliveryDetails.order?.cropDetails?.hub || 'Pollachi Hub'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Driver & Vehicle */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-title">Driver & Vehicle Assignment</div>
                    <div className="admin-detail-grid">
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Assigned Driver</span>
                        <span className="admin-detail-val">{deliveryDetails.order?.driver?.name || 'Kumar M.'}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Driver Contact</span>
                        <span className="admin-detail-val font-mono">{deliveryDetails.order?.driver?.phone || '+91 94432 11098'}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Vehicle</span>
                        <span className="admin-detail-val">{deliveryDetails.order?.driver?.vehicle || 'Tata Ace EV Cargo'}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Delivery PIN</span>
                        <span className="admin-detail-val font-mono text-primary fw-bold">
                          {deliveryDetails.order?.driver?.deliveryPin || '4892'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Route Nodes */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-title">Corridor Route Origin & Destination</div>
                    <div className="d-flex flex-column gap-3">
                      <div className="p-2 border rounded-2">
                        <div className="small text-muted fw-bold">ORIGIN (FARM GATE):</div>
                        <div className="fw-semibold text-dark">{deliveryDetails.order?.farmerName || 'Ramesh Kumar'}</div>
                        <div className="small text-muted">SF No. 142/2, Kinathukadavu Main Road, Pollachi Taluk</div>
                      </div>

                      <div className="p-2 border rounded-2">
                        <div className="small text-muted fw-bold">DESTINATION (RECEIVING BAY):</div>
                        <div className="fw-semibold text-dark">{deliveryDetails.order?.buyerName || 'Commercial Buyer'}</div>
                        <div className="small text-muted">{deliveryDetails.order?.deliveryAddress}</div>
                      </div>
                    </div>
                  </div>

                  {/* Milestone History */}
                  {deliveryDetails.order?.statusHistory?.length > 0 && (
                    <div className="admin-detail-section">
                      <div className="admin-detail-title">Consignment Status Timeline</div>
                      <div className="d-flex flex-column gap-2">
                        {deliveryDetails.order.statusHistory.map((step, idx) => (
                          <div key={idx} className="small p-2 bg-light rounded-2">
                            <div className="d-flex justify-content-between">
                              <span className="fw-bold text-dark">{step.status}</span>
                              <span className="text-muted" style={{ fontSize: '11px' }}>
                                {new Date(step.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{step.note}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="admin-drawer-footer">
              {deliveryDetails && (
                <button
                  type="button"
                  className="admin-btn outline sm"
                  onClick={() => setEditStatusModal(deliveryDetails.order)}
                >
                  <span>Adjust Milestone Status</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MILESTONE ADJUSTMENT MODAL */}
      {editStatusModal && (
        <div className="admin-dialog-backdrop">
          <div className="admin-dialog" style={{ maxWidth: '420px' }}>
            <div className="admin-dialog-header">
              <h4>Adjust Delivery Milestone</h4>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setEditStatusModal(null)}
                aria-label="Close dialog"
              >
                <X size={14} />
              </button>
            </div>
            <div className="admin-dialog-body">
              <p className="text-muted small mb-3">
                Change live milestone status for order #{editStatusModal.orderId || editStatusModal.id || editStatusModal._id}:
              </p>
              <div className="d-flex flex-column gap-2">
                {['NOT_ASSIGNED', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`admin-btn ${editStatusModal.deliveryStatus === st ? 'primary' : 'outline'} sm`}
                    onClick={() => handleUpdateStatus(editStatusModal.orderId || editStatusModal.id || editStatusModal._id, st)}
                  >
                    <span>Set as {st}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="admin-dialog-footer">
              <button
                type="button"
                className="admin-btn outline sm"
                onClick={() => setEditStatusModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

