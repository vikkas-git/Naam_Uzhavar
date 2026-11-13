// pages/admin/AdminFarmers.jsx - Centralized Farmer Management & Produce Inspection
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Eye,
  Wheat,
  ShieldCheck,
  X,
  RefreshCw,
  UserX,
  UserCheck
} from 'lucide-react';
import api from '../../utils/api';
import { useAdmin } from '../../context/AdminContext';
import './AdminCommon.css';

export default function AdminFarmers() {
  const { showToast } = useAdmin();
  const [farmers, setFarmers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('all');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  // Detail Drawer state
  const [selectedFarmerId, setSelectedFarmerId] = useState(null);
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Status Action Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState(null); // { farmer, action: 'toggle_status' | 'toggle_verify' }

  const loadFarmers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (district !== 'all') params.append('district', district);
      if (status !== 'all') params.append('status', status);
      params.append('page', page);
      params.append('limit', 10);

      const res = await api.get(`/admin/farmers?${params.toString()}`);
      if (res && res.success) {
        setFarmers(res.farmers || []);
        setTotalCount(res.totalCount || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.warn('Failed to load farmers list:', err.message);
      showToast('error', 'Failed to retrieve farmers directory');
    } finally {
      setLoading(false);
    }
  }, [search, district, status, page, showToast]);

  useEffect(() => {
    loadFarmers();
  }, [loadFarmers]);

  // Load individual farmer profile with listed crops
  const openFarmerDetails = async (id) => {
    setSelectedFarmerId(id);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/farmers/${id}`);
      if (res && res.success) {
        setFarmerDetails(res);
      }
    } catch (err) {
      console.warn('Failed to load farmer details:', err.message);
      showToast('error', 'Unable to retrieve farmer profile');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Toggle farmer account status (active vs suspended)
  const handleToggleStatus = async (farmer) => {
    const nextStatus = farmer.status === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await api.patch(`/admin/farmers/${farmer.farmerId || farmer.id || farmer._id}/status`, {
        status: nextStatus
      });
      if (res && res.success) {
        showToast('success', res.message || `Farmer status updated to ${nextStatus}`);
        setConfirmModal(null);
        loadFarmers();
        if (farmerDetails && farmerDetails.farmer?.farmerId === farmer.farmerId) {
          setFarmerDetails((prev) => ({
            ...prev,
            farmer: { ...prev.farmer, status: nextStatus }
          }));
        }
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to update account status');
    }
  };

  // Toggle farmer verification status
  const handleToggleVerification = async (farmer) => {
    const nextVerify = !farmer.isVerified;
    try {
      const res = await api.patch(`/admin/farmers/${farmer.farmerId || farmer.id || farmer._id}/status`, {
        isVerified: nextVerify
      });
      if (res && res.success) {
        showToast('success', nextVerify ? 'Farmer marked as VERIFIED' : 'Farmer verification REVOKED');
        setConfirmModal(null);
        loadFarmers();
        if (farmerDetails && farmerDetails.farmer?.farmerId === farmer.farmerId) {
          setFarmerDetails((prev) => ({
            ...prev,
            farmer: { ...prev.farmer, isVerified: nextVerify }
          }));
        }
      }
    } catch (err) {
      console.error('Update farmer verification error:', err);
      showToast('error', 'Failed to update verification status');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-card">
        {/* Header */}
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <h3>Farmer Management</h3>
            <p>Manage registered farmers, crop listings, land details, and verification status</p>
          </div>
          <button
            type="button"
            className="admin-btn outline sm"
            onClick={loadFarmers}
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
              placeholder="Search by name, ID, phone, village..."
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
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Districts</option>
              <option value="Coimbatore">Coimbatore</option>
              <option value="Erode">Erode</option>
              <option value="Dindigul">Dindigul</option>
              <option value="Madurai">Madurai</option>
              <option value="Tiruppur">Tiruppur</option>
            </select>

            <select
              className="admin-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Account Status</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended Accounts</option>
              <option value="verified">Verified Producers Only</option>
              <option value="unverified">Pending Land Verification</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Farmer ID</th>
                <th>Producer Name</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Crops Listed</th>
                <th>Verification</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && farmers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    Loading farmers directory...
                  </td>
                </tr>
              ) : farmers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    No farmer records matched the search filters.
                  </td>
                </tr>
              ) : (
                farmers.map((farmer) => {
                  const fId = farmer.farmerId || farmer.id || farmer._id;
                  const fDetails = farmer.farmDetails || {};
                  const isSuspended = farmer.status === 'suspended';

                  return (
                    <tr key={fId}>
                      <td>
                        <span className="font-mono fw-bold text-dark">{fId}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={farmer.avatar || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=100&auto=format&fit=crop&q=80'}
                            alt=""
                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div className="fw-bold text-dark">{farmer.name}</div>
                            <div className="text-muted" style={{ fontSize: '11px' }}>{fDetails.farmName || 'Agricultural Farm'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="small text-muted">
                          <div>{farmer.phone}</div>
                          <div style={{ fontSize: '11px' }}>{farmer.email}</div>
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          <div>{fDetails.village || 'Pollachi'}, {fDetails.district || 'Coimbatore'}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{fDetails.landArea || 4.5} {fDetails.landAreaUnit || 'Acres'}</div>
                        </div>
                      </td>
                      <td>
                        <span className="fw-bold font-mono text-success">
                          {farmer.cropCount || 0} Crops ({farmer.totalListedKg || 0} Kg)
                        </span>
                      </td>
                      <td>
                        <span className={`admin-pill ${farmer.isVerified ? 'verified' : 'pending'}`}>
                          {farmer.isVerified ? 'VERIFIED' : 'PENDING'}
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
                            onClick={() => openFarmerDetails(fId)}
                            title="Inspect Profile & Crops"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            className="admin-btn outline sm"
                            style={{ color: isSuspended ? '#4f6df5' : '#dc2626' }}
                            onClick={() => setConfirmModal({ farmer, action: 'toggle_status' })}
                            title={isSuspended ? 'Reactivate Farmer Account' : 'Suspend Account'}
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
            Showing <strong>{farmers.length}</strong> of <strong>{totalCount}</strong> farmers
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
      {selectedFarmerId && (
        <div className="admin-drawer-backdrop" onClick={() => setSelectedFarmerId(null)}>
          <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-header">
              <h3>Farmer Profile & Hub Listings</h3>
              <button
                type="button"
                className="admin-btn outline sm"
                onClick={() => setSelectedFarmerId(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-drawer-body">
              {loadingDetails || !farmerDetails ? (
                <div className="text-center py-5 text-muted">Retrieving profile data...</div>
              ) : (
                <>
                  {/* Farmer Identity */}
                  <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3">
                    <img
                      src={farmerDetails.farmer.avatar || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=150&auto=format&fit=crop&q=80'}
                      alt=""
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h4 className="m-0 fw-bold text-dark">{farmerDetails.farmer.name}</h4>
                      <div className="font-mono text-muted small">{farmerDetails.farmer.farmerId}</div>
                      <div className="d-flex gap-2 mt-1">
                        <span className={`admin-pill ${farmerDetails.farmer.isVerified ? 'verified' : 'pending'}`}>
                          {farmerDetails.farmer.isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                        <span className={`admin-pill ${farmerDetails.farmer.status === 'suspended' ? 'suspended' : 'active'}`}>
                          {farmerDetails.farmer.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Land & Agricultural Parcel */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-title">Farm & Land Records (Patta Verification)</div>
                    <div className="admin-detail-grid">
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Farm / Holding Name</span>
                        <span className="admin-detail-val">{farmerDetails.farmer.farmDetails?.farmName || 'Green Valley Farm'}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Total Land Holding</span>
                        <span className="admin-detail-val">
                          {farmerDetails.farmer.farmDetails?.landArea || 4.5} {farmerDetails.farmer.farmDetails?.landAreaUnit || 'Acres'}
                        </span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Village / Taluk</span>
                        <span className="admin-detail-val">
                          {farmerDetails.farmer.farmDetails?.village || 'Pollachi'}, {farmerDetails.farmer.farmDetails?.taluk || 'Pollachi Taluk'}
                        </span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">District & State</span>
                        <span className="admin-detail-val">
                          {farmerDetails.farmer.farmDetails?.district || 'Coimbatore'}, Tamil Nadu
                        </span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">GPS Coordinates</span>
                        <span className="admin-detail-val font-mono">{farmerDetails.farmer.farmDetails?.gpsCoordinates || '10.6588° N, 77.0094° E'}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Total Completed Harvests</span>
                        <span className="admin-detail-val">{farmerDetails.farmer.totalHarvests || 54} Dispatches</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Direct Bank Details */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-title">Verified Bank Escrow Settlement</div>
                    <div className="admin-detail-grid">
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Account Holder</span>
                        <span className="admin-detail-val">{farmerDetails.farmer.bankDetails?.accountHolderName || farmerDetails.farmer.name}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Bank Name</span>
                        <span className="admin-detail-val">{farmerDetails.farmer.bankDetails?.bankName || 'State Bank of India'}</span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Account Number</span>
                        <span className="admin-detail-val font-mono">
                          {farmerDetails.farmer.bankDetails?.accountNumber ? `••••••••${farmerDetails.farmer.bankDetails.accountNumber.slice(-4)}` : '••••••••1034'}
                        </span>
                      </div>
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">IFSC Code</span>
                        <span className="admin-detail-val font-mono">{farmerDetails.farmer.bankDetails?.ifscCode || 'SBIN0001248'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Crops Posted by this Farmer */}
                  <div className="admin-detail-section">
                    <div className="admin-detail-title">
                      Active Produce Listings ({farmerDetails.crops?.length || 0})
                    </div>
                    {farmerDetails.crops?.length === 0 ? (
                      <div className="text-muted small">No crops listed currently by this producer.</div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {farmerDetails.crops.map((crop) => (
                          <div
                            key={crop._id}
                            className="p-2 border rounded-2 d-flex align-items-center justify-content-between"
                          >
                            <div className="d-flex align-items-center gap-2">
                              <Wheat size={16} className="text-success" />
                              <div>
                                <div className="fw-bold small text-dark">
                                  {crop.name} {crop.nameTa ? `(${crop.nameTa})` : ''}
                                </div>
                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                  {crop.variety} • {crop.grade} • {crop.hub}
                                </div>
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold font-mono text-success small">₹{crop.pricePerKg} / Kg</div>
                              <div className="text-muted small">{crop.quantityKg} Kg Available</div>
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
              {farmerDetails && (
                <>
                  <button
                    type="button"
                    className="admin-btn outline sm"
                    onClick={() => handleToggleVerification(farmerDetails.farmer)}
                  >
                    <ShieldCheck size={14} />
                    <span>{farmerDetails.farmer.isVerified ? 'Revoke Verification' : 'Verify Land & Account'}</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn primary sm"
                    onClick={() => handleToggleStatus(farmerDetails.farmer)}
                    style={{
                      background: farmerDetails.farmer.status === 'suspended' ? '#4f6df5' : '#dc2626',
                      borderColor: 'transparent'
                    }}
                  >
                    <span>{farmerDetails.farmer.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmModal && (
        <div className="admin-dialog-backdrop">
          <div className="admin-dialog" style={{ maxWidth: '420px' }}>
            <div className="admin-dialog-header">
              <h4>
                {confirmModal.action === 'toggle_status'
                  ? confirmModal.farmer.status === 'suspended' ? 'Activate Account?' : 'Suspend Account?'
                  : 'Toggle Verification?'}
              </h4>
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
              <p className="text-muted small m-0">
                {confirmModal.action === 'toggle_status'
                  ? `Are you sure you want to change the status of ${confirmModal.farmer.name} (#${confirmModal.farmer.farmerId || confirmModal.farmer._id})?`
                  : `Update land patta verification state for ${confirmModal.farmer.name}?`}
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
                onClick={() => {
                  if (confirmModal.action === 'toggle_status') handleToggleStatus(confirmModal.farmer);
                  else handleToggleVerification(confirmModal.farmer);
                }}
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

