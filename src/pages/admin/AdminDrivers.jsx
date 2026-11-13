// pages/admin/AdminDrivers.jsx - Clean Driver Logistics Management
import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Zap,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Clock,
  Navigation
} from 'lucide-react';
import api from '../../utils/api';
import { useAdmin } from '../../context/AdminContext';
import './AdminCommon.css';

export default function AdminDrivers() {
  const { showToast } = useAdmin();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dutyStatus, setDutyStatus] = useState('all');
  const [hub, setHub] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Drawer & modal state
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { driver, nextStatus }

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10'
      });
      if (search.trim()) params.append('search', search.trim());
      if (dutyStatus !== 'all') params.append('dutyStatus', dutyStatus);
      if (hub !== 'all') params.append('assignedHub', hub);

      const res = await api.get(`/admin/drivers?${params.toString()}`);
      if (res && res.success) {
        setDrivers(res.drivers || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.totalCount || 0);
      }
    } catch (err) {
      console.warn('Failed to load drivers:', err.message);
      showToast('error', 'Unable to retrieve drivers list');
    } finally {
      setLoading(false);
    }
  }, [page, search, dutyStatus, hub, showToast]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const handleOpenDetails = async (driverId) => {
    setSelectedDriverId(driverId);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/drivers/${driverId}`);
      if (res && res.success) {
        setDriverDetails(res);
      }
    } catch (err) {
      console.warn('Failed to load driver details:', err.message);
      showToast('error', 'Unable to retrieve driver profile');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleDutyStatus = async (driver, nextStatus) => {
    try {
      const res = await api.patch(`/admin/drivers/${driver.driverId || driver._id}/status`, {
        dutyStatus: nextStatus
      });
      if (res && res.success) {
        showToast('success', res.message || `Driver duty status set to ${nextStatus}`);
        setConfirmModal(null);
        loadDrivers();
        if (driverDetails && (driverDetails.driver?.driverId === driver.driverId || driverDetails.driver?._id === driver._id)) {
          setDriverDetails((prev) => ({
            ...prev,
            driver: { ...prev.driver, dutyStatus: nextStatus }
          }));
        }
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update duty status');
    }
  };

  const getDutyBadgeClass = (status) => {
    switch (status) {
      case 'ON_DUTY':
        return 'active';
      case 'ON_TRIP':
        return 'intransit';
      case 'OFF_DUTY':
      default:
        return 'pending';
    }
  };

  const getDutyLabel = (status) => {
    switch (status) {
      case 'ON_DUTY':
        return 'On Duty (Available)';
      case 'ON_TRIP':
        return 'In Transit';
      case 'OFF_DUTY':
      default:
        return 'Off Duty';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'DR';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Important counts only
  const onDutyCount = drivers.filter((d) => d.dutyStatus === 'ON_DUTY').length;
  const onTripCount = drivers.filter((d) => d.dutyStatus === 'ON_TRIP').length;
  const offDutyCount = drivers.filter((d) => d.dutyStatus === 'OFF_DUTY').length;

  return (
    <div className="animate-fade-in">
      {/* 4 Essential Metrics Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">Total Drivers</span>
            <div className="admin-kpi-icon-wrap blue">
              <Truck size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{totalCount || drivers.length}</div>
          <div className="admin-kpi-footer">
            <span>Registered drivers</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">On Duty (Available)</span>
            <div className="admin-kpi-icon-wrap green">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{onDutyCount}</div>
          <div className="admin-kpi-footer">
            <span className="badge-trend success">Ready</span>
            <span>Available for dispatch</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">In Transit</span>
            <div className="admin-kpi-icon-wrap purple">
              <Navigation size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{onTripCount}</div>
          <div className="admin-kpi-footer">
            <span>Currently delivering orders</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">Off Duty</span>
            <div className="admin-kpi-icon-wrap neutral">
              <Clock size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{offDutyCount}</div>
          <div className="admin-kpi-footer">
            <span>Inactive or resting</span>
          </div>
        </div>
      </div>

      {/* Main Drivers Card */}
      <div className="admin-card">
        {/* Header */}
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <h3>Driver Management</h3>
            <p>Manage drivers, assigned vehicles, operating hubs, and duty status</p>
          </div>
          <button
            type="button"
            className="admin-btn outline sm"
            onClick={loadDrivers}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="admin-controls-bar">
          <div className="admin-search-wrap">
            <Search size={15} />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by driver ID, name, phone, plate, hub..."
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
              value={dutyStatus}
              onChange={(e) => {
                setDutyStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Duty Statuses</option>
              <option value="ON_DUTY">On Duty (Available)</option>
              <option value="ON_TRIP">In Transit</option>
              <option value="OFF_DUTY">Off Duty</option>
            </select>

            <select
              className="admin-select"
              value={hub}
              onChange={(e) => {
                setHub(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Regional Hubs</option>
              <option value="Dindigul">Dindigul Hub</option>
              <option value="Coimbatore">Coimbatore Hub</option>
              <option value="Salem">Salem Hub</option>
              <option value="Madurai">Madurai Hub</option>
            </select>
          </div>
        </div>

        {/* Essential Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ minWidth: '110px' }}>Driver ID</th>
                <th style={{ minWidth: '180px' }}>Driver Name</th>
                <th style={{ minWidth: '180px' }}>Contact</th>
                <th style={{ minWidth: '180px' }}>Vehicle</th>
                <th style={{ minWidth: '140px' }}>Assigned Hub</th>
                <th style={{ minWidth: '120px' }}>Duty Status</th>
                <th style={{ textAlign: 'right', minWidth: '130px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && drivers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px' }}>
                    <div className="d-flex align-items-center justify-content-center gap-2 text-muted">
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Loading drivers...</span>
                    </div>
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                    No drivers match the specified filters.
                  </td>
                </tr>
              ) : (
                drivers.map((drv) => (
                  <tr key={drv.driverId || drv._id}>
                    {/* Driver ID */}
                    <td>
                      <span className="fw-bold font-monospace text-dark" style={{ fontSize: '12.5px' }}>
                        {drv.driverId || drv.id}
                      </span>
                    </td>

                    {/* Driver Name & Initials */}
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: '#181e2b',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '11.5px',
                            flexShrink: 0
                          }}
                        >
                          {getInitials(drv.name)}
                        </div>
                        <span className="fw-bold text-dark">{drv.name}</span>
                      </div>
                    </td>

                    {/* Contact (Phone & Email) */}
                    <td>
                      <div className="small">
                        <div className="fw-semibold text-dark">{drv.phone}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>{drv.email}</div>
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td>
                      <div>
                        <div className="fw-bold text-dark font-monospace" style={{ fontSize: '12.5px' }}>
                          {drv.vehicle?.vehicleNumber || 'TN 57 AB 1234'}
                        </div>
                        <div className="text-muted small" style={{ fontSize: '11px' }}>
                          {drv.vehicle?.model || 'Tata Ace EV Cargo'}
                        </div>
                      </div>
                    </td>

                    {/* Hub */}
                    <td>
                      <span className="fw-semibold text-dark" style={{ fontSize: '12.5px' }}>
                        {drv.assignedHub || 'Regional Hub'}
                      </span>
                    </td>

                    {/* Duty Status */}
                    <td>
                      <span className={`admin-pill ${getDutyBadgeClass(drv.dutyStatus)}`}>
                        {drv.dutyStatus === 'ON_DUTY' ? '● On Duty' : drv.dutyStatus === 'ON_TRIP' ? '● In Transit' : '○ Off Duty'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          type="button"
                          className="admin-btn outline sm"
                          onClick={() => handleOpenDetails(drv.driverId || drv._id)}
                          title="View Driver Details"
                        >
                          <Eye size={12} />
                          <span>Details</span>
                        </button>

                        <button
                          type="button"
                          className="admin-btn outline sm"
                          style={{ padding: '6px 10px' }}
                          onClick={() =>
                            setConfirmModal({
                              driver: drv,
                              nextStatus: drv.dutyStatus === 'OFF_DUTY' ? 'ON_DUTY' : 'OFF_DUTY'
                            })
                          }
                          title={drv.dutyStatus === 'OFF_DUTY' ? 'Set On Duty' : 'Set Off Duty'}
                        >
                          <Zap size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="admin-pagination-bar">
          <div>
            Showing <span className="text-dark fw-bold">{drivers.length}</span> of{' '}
            <span className="text-dark fw-bold">{totalCount}</span> drivers
          </div>

          <div className="admin-pagination-actions">
            <button
              type="button"
              className="admin-pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Previous
            </button>
            <span style={{ fontSize: '12px', fontWeight: '700', padding: '0 4px' }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="admin-pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight size={13} style={{ display: 'inline', marginLeft: '4px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Driver Details Drawer (Important Info Only) */}
      {selectedDriverId && (
        <div className="admin-drawer-backdrop" onClick={() => setSelectedDriverId(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <div>
                <h3>Driver Details</h3>
                <p className="text-muted small m-0 font-monospace">
                  {driverDetails?.driver?.driverId || selectedDriverId}
                </p>
              </div>
              <button
                type="button"
                className="admin-micro-circle-btn"
                onClick={() => setSelectedDriverId(null)}
              >
                <X size={15} />
              </button>
            </div>

            <div className="admin-drawer-body">
              {loadingDetails ? (
                <div className="d-flex align-items-center justify-content-center p-5 text-muted gap-2">
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Loading driver details...</span>
                </div>
              ) : driverDetails?.driver ? (
                (() => {
                  const d = driverDetails.driver;
                  const v = d.vehicle || {};
                  const l = d.license || {};
                  const m = d.metrics || {};
                  const trips = driverDetails.trips || [];

                  return (
                    <>
                      {/* Driver Overview Card */}
                      <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-4">
                        <div
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            background: '#181e2b',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '18px',
                            flexShrink: 0
                          }}
                        >
                          {getInitials(d.name)}
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <h4 className="m-0 fw-bold text-dark fs-6 text-truncate">{d.name}</h4>
                          <div className="d-flex align-items-center gap-2 mt-1">
                            <span className={`admin-pill ${getDutyBadgeClass(d.dutyStatus)}`}>
                              {getDutyLabel(d.dutyStatus)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 1: Contact & Hub */}
                      <div className="admin-detail-section">
                        <div className="admin-detail-title">Driver Information</div>
                        <div className="admin-detail-grid">
                          <div className="admin-detail-item">
                            <span className="admin-detail-label">Phone</span>
                            <span className="admin-detail-val">{d.phone || '-'}</span>
                          </div>
                          <div className="admin-detail-item">
                            <span className="admin-detail-label">Email</span>
                            <span className="admin-detail-val" style={{ wordBreak: 'break-all' }}>
                              {d.email || '-'}
                            </span>
                          </div>
                          <div className="admin-detail-item">
                            <span className="admin-detail-label">Assigned Hub</span>
                            <span className="admin-detail-val">{d.assignedHub || 'Regional Hub'}</span>
                          </div>
                          <div className="admin-detail-item">
                            <span className="admin-detail-label">Commercial License</span>
                            <span className="admin-detail-val font-monospace">{l.licenseNumber || 'TN-57-2020-008912'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Vehicle Information */}
                      <div className="admin-detail-section">
                        <div className="admin-detail-title">Vehicle Information</div>
                        <div className="admin-detail-grid">
                          <div className="admin-detail-item">
                            <span className="admin-detail-label">Vehicle Model</span>
                            <span className="admin-detail-val">{v.model || 'Tata Ace EV Cargo'}</span>
                          </div>
                          <div className="admin-detail-item">
                            <span className="admin-detail-label">License Plate</span>
                            <span className="admin-detail-val font-monospace">{v.vehicleNumber || 'TN 57 AB 1234'}</span>
                          </div>
                          <div className="admin-detail-item">
                            <span className="admin-detail-label">Total Deliveries</span>
                            <span className="admin-detail-val">{m.totalDispatches || 0} completed</span>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Recent Trips / Deliveries */}
                      {trips.length > 0 && (
                        <div className="admin-detail-section">
                          <div className="admin-detail-title">Recent Trips</div>
                          <div className="d-flex flex-column gap-2 mt-2">
                            {trips.map((t, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-2 border bg-white small"
                              >
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="fw-bold font-monospace text-dark">{t.tripId || t.orderId}</span>
                                  <span className="badge bg-light text-dark">{t.status || 'DELIVERED'}</span>
                                </div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                  {t.cropName && <span>{t.cropName} · </span>}
                                  {t.pickup} → {t.dropoff}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                <div className="text-center p-4 text-muted">Driver profile data could not be parsed.</div>
              )}
            </div>

            <div className="admin-drawer-footer">
              <button
                type="button"
                className="admin-btn outline"
                onClick={() => setSelectedDriverId(null)}
              >
                Close
              </button>
              {driverDetails?.driver && (
                <button
                  type="button"
                  className="admin-btn primary"
                  onClick={() =>
                    setConfirmModal({
                      driver: driverDetails.driver,
                      nextStatus: driverDetails.driver.dutyStatus === 'OFF_DUTY' ? 'ON_DUTY' : 'OFF_DUTY'
                    })
                  }
                >
                  <Zap size={14} />
                  <span>
                    {driverDetails.driver.dutyStatus === 'OFF_DUTY'
                      ? 'Set Driver ON DUTY'
                      : 'Set Driver OFF DUTY'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="admin-dialog-backdrop" onClick={() => setConfirmModal(null)}>
          <div
            className="admin-dialog"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <div className="d-flex align-items-center gap-2">
                <Zap size={16} className="text-primary" />
                <h4 className="m-0 fs-6 fw-bold text-dark">Update Driver Status</h4>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setConfirmModal(null)}
                aria-label="Close dialog"
              >
                <X size={14} />
              </button>
            </div>

            <div className="admin-dialog-body">
              <p className="text-dark small m-0">
                Change status for <strong>{confirmModal.driver.name}</strong> to{' '}
                <span className="fw-bold text-primary">{confirmModal.nextStatus}</span>?
              </p>
            </div>

            <div className="admin-dialog-footer">
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
                onClick={() => handleToggleDutyStatus(confirmModal.driver, confirmModal.nextStatus)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
