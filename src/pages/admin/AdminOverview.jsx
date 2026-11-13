// pages/admin/AdminOverview.jsx - Clean, Beginner-Friendly Admin Dashboard
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  Store,
  Truck,
  Package,
  ChevronRight,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Clock,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import api from '../../utils/api';
import './AdminCommon.css';

export default function AdminOverview() {
  const { overviewMetrics, fetchOverview, isLoading } = useAdmin();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Load recent deliveries/orders
  useEffect(() => {
    let isMounted = true;
    const fetchRecent = async () => {
      setLoadingOrders(true);
      try {
        const res = await api.get('/admin/deliveries?limit=5');
        if (isMounted && res && res.success) {
          setRecentOrders(res.deliveries || []);
        }
      } catch (err) {
        console.warn('Notice loading recent deliveries:', err.message);
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    };
    fetchRecent();
    return () => {
      isMounted = false;
    };
  }, []);

  const m = overviewMetrics?.metrics || {
    totalFarmers: 0,
    totalBuyers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeDeliveries: 0,
    completedDeliveries: 0
  };

  const handleRefresh = async () => {
    fetchOverview();
    try {
      setLoadingOrders(true);
      const res = await api.get('/admin/deliveries?limit=5');
      if (res && res.success) {
        setRecentOrders(res.deliveries || []);
      }
    } catch {} finally {
      setLoadingOrders(false);
    }
  };

  const hasPendingItems = (m.pendingOrders || 0) > 0 || (m.activeDeliveries || 0) > 0;

  return (
    <div className="animate-fade-in d-flex flex-column gap-4">
      {/* 1. Friendly Welcome Bar */}
      <div className="admin-card p-3 p-sm-4 mb-0">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h2 className="fs-5 fw-bold text-dark m-0">Welcome to your Admin Dashboard</h2>
            <p className="text-muted small m-0 mt-1">
              Here is a simple summary of your platform operations and customer activity today.
            </p>
          </div>
          <button
            type="button"
            className="admin-btn outline sm"
            onClick={handleRefresh}
            disabled={isLoading || loadingOrders}
            title="Refresh Dashboard Data"
          >
            <RefreshCw size={13} className={(isLoading || loadingOrders) ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* 2. Four Core Metrics (Clear, Simple, Human-Friendly) */}
      <div className="admin-kpi-grid">
        {/* Metric 1: Farmers */}
        <Link to="/admin/farmers" className="admin-kpi-card text-decoration-none">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">Farmers</span>
            <div className="admin-kpi-icon-wrap green">
              <Sprout size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{m.totalFarmers}</div>
          <div className="admin-kpi-footer">
            <span className="badge-trend success">Registered</span>
            <span>View all farmers →</span>
          </div>
        </Link>

        {/* Metric 2: Buyers */}
        <Link to="/admin/buyers" className="admin-kpi-card text-decoration-none">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">Buyers</span>
            <div className="admin-kpi-icon-wrap blue">
              <Store size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{m.totalBuyers}</div>
          <div className="admin-kpi-footer">
            <span className="badge-trend success">Active</span>
            <span>View all buyers →</span>
          </div>
        </Link>

        {/* Metric 3: Orders */}
        <Link to="/admin/orders" className="admin-kpi-card text-decoration-none">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">Total Orders</span>
            <div className="admin-kpi-icon-wrap purple">
              <Package size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{m.totalOrders}</div>
          <div className="admin-kpi-footer">
            <span className="badge-trend" style={{ background: '#fef3c7', color: '#b45309' }}>
              {m.pendingOrders} Pending
            </span>
            <span>Manage orders →</span>
          </div>
        </Link>

        {/* Metric 4: Deliveries */}
        <Link to="/admin/deliveries" className="admin-kpi-card text-decoration-none">
          <div className="admin-kpi-header">
            <span className="admin-kpi-title">Active Deliveries</span>
            <div className="admin-kpi-icon-wrap blue">
              <Truck size={18} />
            </div>
          </div>
          <div className="admin-kpi-value">{m.activeDeliveries}</div>
          <div className="admin-kpi-footer">
            <span className="badge-trend success">{m.completedDeliveries} Delivered</span>
            <span>Track fleet →</span>
          </div>
        </Link>
      </div>

      {/* 3. Items Requiring Attention (Immediate Clarity for Beginner Admins) */}
      <div className="admin-card mb-0">
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <h3>Needs Your Attention</h3>
            <p>Important tasks that require your review or action</p>
          </div>
        </div>

        <div className="p-3 p-sm-4">
          {hasPendingItems ? (
            <div className="row g-3">
              {/* Alert: Pending Orders */}
              {(m.pendingOrders || 0) > 0 && (
                <div className="col-12 col-md-6">
                  <div className="p-3 rounded-2 border d-flex align-items-center justify-content-between gap-3" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', flexShrink: 0 }}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <div className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>
                          {m.pendingOrders} Orders need your review
                        </div>
                        <div className="text-muted small">
                          Orders placed by buyers are waiting for confirmation.
                        </div>
                      </div>
                    </div>
                    <Link to="/admin/orders" className="admin-btn sm outline text-decoration-none flex-shrink-0">
                      <span>Review</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}

              {/* Alert: Active Deliveries */}
              {(m.activeDeliveries || 0) > 0 && (
                <div className="col-12 col-md-6">
                  <div className="p-3 rounded-2 border d-flex align-items-center justify-content-between gap-3" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', flexShrink: 0 }}>
                        <Truck size={18} />
                      </div>
                      <div>
                        <div className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>
                          {m.activeDeliveries} Shipments on the road
                        </div>
                        <div className="text-muted small">
                          Drivers are currently delivering produce to buyers.
                        </div>
                      </div>
                    </div>
                    <Link to="/admin/deliveries" className="admin-btn sm outline text-decoration-none flex-shrink-0">
                      <span>Track</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2 p-3 bg-light rounded-2 text-muted small">
              <CheckCircle2 size={16} className="text-success" />
              <span>All operations are running smoothly. No pending alerts right now.</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Recent Orders Table */}
      <div className="admin-card mb-0">
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <h3>Recent Orders</h3>
            <p>Latest customer purchases and delivery status</p>
          </div>
          <Link to="/admin/orders" className="admin-btn outline sm text-decoration-none">
            <span>View All Orders</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Produce & Quantity</th>
                <th>Delivery Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    <RefreshCw size={16} className="animate-spin d-inline me-2" />
                    Loading recent orders...
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord) => {
                  const oId = ord.orderId || ord.id || ord._id;
                  const status = ord.deliveryStatus || 'PENDING';
                  return (
                    <tr key={oId}>
                      <td>
                        <span className="fw-bold font-monospace text-dark" style={{ fontSize: '12.5px' }}>
                          {oId}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{ord.buyerName || 'Commercial Buyer'}</div>
                      </td>
                      <td>
                        <div className="small">
                          <span className="fw-bold text-dark">{ord.cropName || 'Farm Produce'}</span>
                          <span className="text-muted ms-1">({ord.quantityKg || 0} Kg)</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`admin-pill ${
                            status === 'DELIVERED'
                              ? 'delivered'
                              : status === 'IN_TRANSIT'
                              ? 'intransit'
                              : 'pending'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to="/admin/orders" className="admin-btn outline sm text-decoration-none">
                          <span>View</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Four Easy Quick Actions (Direct access for common admin tasks) */}
      <div className="admin-card mb-0">
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <h3>Quick Actions</h3>
            <p>Direct shortcuts for common daily tasks</p>
          </div>
        </div>

        <div className="p-3 p-sm-4">
          <div className="row g-3">
            {/* Action 1: Farmers */}
            <div className="col-12 col-sm-6 col-xl-3">
              <Link to="/admin/farmers" className="p-3 rounded-2 border d-flex flex-column justify-content-between h-100 text-decoration-none bg-light" style={{ transition: 'all 0.15s ease' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                    <Sprout size={16} />
                  </div>
                  <span className="fw-bold text-dark small">Farmers</span>
                </div>
                <p className="text-muted small m-0 mb-3" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  View farmer profiles, listed crops, and approve land documents.
                </p>
                <span className="text-primary fw-semibold small d-flex align-items-center gap-1">
                  <span>Open Farmers</span>
                  <ArrowRight size={12} />
                </span>
              </Link>
            </div>

            {/* Action 2: Buyers */}
            <div className="col-12 col-sm-6 col-xl-3">
              <Link to="/admin/buyers" className="p-3 rounded-2 border d-flex flex-column justify-content-between h-100 text-decoration-none bg-light" style={{ transition: 'all 0.15s ease' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <Store size={16} />
                  </div>
                  <span className="fw-bold text-dark small">Buyers</span>
                </div>
                <p className="text-muted small m-0 mb-3" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  Browse buyer accounts, purchase histories, and contact info.
                </p>
                <span className="text-primary fw-semibold small d-flex align-items-center gap-1">
                  <span>Open Buyers</span>
                  <ArrowRight size={12} />
                </span>
              </Link>
            </div>

            {/* Action 3: Fleet */}
            <div className="col-12 col-sm-6 col-xl-3">
              <Link to="/admin/drivers" className="p-3 rounded-2 border d-flex flex-column justify-content-between h-100 text-decoration-none bg-light" style={{ transition: 'all 0.15s ease' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                    <Truck size={16} />
                  </div>
                  <span className="fw-bold text-dark small">Driver Fleet</span>
                </div>
                <p className="text-muted small m-0 mb-3" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  Monitor active delivery drivers, vehicles, and on-duty statuses.
                </p>
                <span className="text-primary fw-semibold small d-flex align-items-center gap-1">
                  <span>Open Fleet</span>
                  <ArrowRight size={12} />
                </span>
              </Link>
            </div>

            {/* Action 4: Reports */}
            <div className="col-12 col-sm-6 col-xl-3">
              <Link to="/admin/reports" className="p-3 rounded-2 border d-flex flex-column justify-content-between h-100 text-decoration-none bg-light" style={{ transition: 'all 0.15s ease' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                    <BarChart3 size={16} />
                  </div>
                  <span className="fw-bold text-dark small">Reports</span>
                </div>
                <p className="text-muted small m-0 mb-3" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                  View sales performance, supply vs demand, and download CSVs.
                </p>
                <span className="text-primary fw-semibold small d-flex align-items-center gap-1">
                  <span>Open Reports</span>
                  <ArrowRight size={12} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
