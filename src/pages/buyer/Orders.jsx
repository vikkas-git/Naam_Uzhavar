// What this file does: Buyer orders management page tracking active, completed, and pending delivery orders.

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  Navigation,
  Receipt,
  PackageX,
  XCircle,
  AlertCircle,
  Printer,
  X
} from 'lucide-react';
import './Orders.css';
import './Invoices.css';
import { ROUTES } from '../../routes';
import { useBuyer } from '../../context/BuyerContext';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import { TableSkeleton } from '../../components/Skeleton';
import { formatOrderStatus, formatOrderDate } from '../../utils/helpers';

export default function Orders() {
  const navigate = useNavigate();
  const {
    isDataLoading,
    orders,
    profile,
    activeOrderFilter,
    setActiveOrderFilter,
    setSelectedTrackingOrderId,
    handleOpenOrderWorkflowForOrder,
    t
  } = useBuyer();

  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  const orderList = useMemo(() => orders || [], [orders]);

  const counts = useMemo(() => {
    const isCompleted = (o) => o?.deliveryStatus === 'DELIVERED' || o?.status === 'delivered';
    const active = orderList.filter((o) => !isCompleted(o)).length;
    const completed = orderList.filter((o) => isCompleted(o)).length;
    return { active, completed, all: orderList.length };
  }, [orderList]);

  const filteredOrders = useMemo(() => {
    return orderList.filter((order) => {
      if (!order) return false;
      const isCompleted = order.deliveryStatus === 'DELIVERED' || order.status === 'delivered';
      if (activeOrderFilter === 'active') return !isCompleted;
      if (activeOrderFilter === 'completed') return isCompleted;
      return true;
    });
  }, [orderList, activeOrderFilter]);

  return (
    <div className="buyer-view-container animate-fade-in">
      <div className="buyer-view-header">
        <div>
          <h1 className="buyer-view-title">{t('orders.title')}</h1>
          <p className="buyer-view-subtitle">{t('orders.subtitle')}</p>
        </div>
        <div className="buyer-order-tab-pills">
          <button
            type="button"
            className={`buyer-tab-pill ${activeOrderFilter === 'active' ? 'active' : ''}`}
            onClick={() => setActiveOrderFilter('active')}
          >
            {t('orders.tabActive', { n: counts.active })}
          </button>
          <button
            type="button"
            className={`buyer-tab-pill ${activeOrderFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveOrderFilter('completed')}
          >
            {t('orders.tabCompleted', { n: counts.completed })}
          </button>
          <button
            type="button"
            className={`buyer-tab-pill ${activeOrderFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveOrderFilter('all')}
          >
            {t('orders.tabAll', { n: counts.all })}
          </button>
        </div>
      </div>

      {/* Order Cards List */}
      <div className="buyer-order-list">
        {isDataLoading && (!orders || orders.length === 0) ? (
          <TableSkeleton rows={4} columns={6} hasFilterBar={false} />
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const isDelivered = order.deliveryStatus === 'DELIVERED' || order.status === 'delivered';
            const isPendingApproval = order.orderStatus === 'PENDING_FARMER_APPROVAL';
            const isRejected = order.orderStatus === 'REJECTED';
            const isConfirmedNoDelivery = order.orderStatus === 'CONFIRMED' && (!order.deliveryStatus || order.deliveryStatus === 'NOT_ASSIGNED');
            const canTrack = Boolean(order.deliveryStatus && order.deliveryStatus !== 'NOT_ASSIGNED' && !isRejected && !isPendingApproval);

            return (
              <div key={order.orderId} className="buyer-order-card">
                <div className="buyer-order-card-top">
                  <div className="buyer-order-id-group">
                    <span className="buyer-order-id">{order.orderId}</span>
                    <span className="buyer-order-time">{order.orderTime}</span>
                  </div>

                  {/* Dynamic Status Badge */}
                  <div className={`buyer-order-status-badge ${order.deliveryStatus || order.orderStatus || order.status}`}>
                    {isPendingApproval && (
                      <>
                        <Clock size={13} style={{ color: '#d97706' }} />
                        <span style={{ color: '#b45309' }}>Pending Farmer Approval</span>
                      </>
                    )}
                    {isRejected && (
                      <>
                        <XCircle size={13} style={{ color: '#dc2626' }} />
                        <span style={{ color: '#b91c1c' }}>Rejected by Farmer</span>
                      </>
                    )}
                    {isConfirmedNoDelivery && (
                      <>
                        <AlertCircle size={13} style={{ color: '#2563eb' }} />
                        <span style={{ color: '#1d4ed8' }}>Confirmed • Delivery Pending</span>
                      </>
                    )}
                    {!isPendingApproval && !isRejected && !isConfirmedNoDelivery && (
                      <>
                        {order.deliveryStatus === 'READY_FOR_PICKUP' && (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Ready for Pickup</span>
                          </>
                        )}
                        {(order.deliveryStatus === 'PICKED_UP' || order.status === 'preparing') && (
                          <>
                            <Truck size={13} />
                            <span>Picked Up from Hub</span>
                          </>
                        )}
                        {(order.deliveryStatus === 'IN_TRANSIT' || order.status === 'in_transit') && (
                          <>
                            <span className="status-live-beacon" />
                            <span>In Transit</span>
                          </>
                        )}
                        {isDelivered && (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Delivered</span>
                          </>
                        )}
                        {!isDelivered && order.deliveryStatus && order.deliveryStatus !== 'READY_FOR_PICKUP' && order.deliveryStatus !== 'PICKED_UP' && order.deliveryStatus !== 'IN_TRANSIT' && order.status !== 'in_transit' && order.status !== 'preparing' && (
                          <>
                            <Truck size={13} />
                            <span>{formatOrderStatus(order.deliveryStatus)}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="buyer-order-card-body">
                  <div className="buyer-order-produce-info">
                    <h3 className="buyer-order-produce-title">
                      {order.cropName}{' '}
                      {order.grade && <span className="buyer-badge-tag">{order.grade}</span>}
                    </h3>
                    <p className="buyer-order-produce-hub">
                      <MapPin size={13} /> {order.location || order.hub || 'Dindigul Central'} • Farmer: {order.farmer?.name || 'Local Farmer'}
                    </p>
                  </div>

                  <div className="buyer-order-metrics">
                    <div className="buyer-metric-item">
                      <span className="metric-label">{t('orders.quantity')}</span>
                      <span className="metric-val">{order.quantityKg ?? 0} kg</span>
                    </div>
                    <div className="buyer-metric-item">
                      <span className="metric-label">{t('orders.rate')}</span>
                      <span className="metric-val">₹{order.unitPrice ?? 0} / kg</span>
                    </div>
                    <div className="buyer-metric-item total">
                      <span className="metric-label">{t('orders.total')}</span>
                      <span className="metric-val total">
                        ₹{Number(order.totalPrice || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="buyer-order-card-footer">
                  <div className="buyer-driver-mini">
                    <Truck size={14} />
                    <span>
                      {t('orders.driver')}{' '}
                      <strong>{order.driver?.name || 'Assigning EV Driver...'}</strong>{' '}
                      {order.driver?.vehicleNumber ? `(${order.driver.vehicleNumber})` : ''}
                    </span>
                  </div>

                  <div className="buyer-order-actions">
                    {/* Invoice view is always available without page redirection */}
                    <button
                      type="button"
                      className="buyer-btn-outline small"
                      onClick={() => setSelectedInvoiceOrder(order)}
                      title="View Farm Tax Invoice"
                    >
                      <Receipt size={14} />
                      <span>{t('orders.viewInvoice') || 'Invoice'}</span>
                    </button>

                    {/* Step 3: Pending farmer approval demo button */}
                    {isPendingApproval && (
                      <button
                        type="button"
                        className="buyer-btn-primary small"
                        style={{ background: '#d97706' }}
                        onClick={() => handleOpenOrderWorkflowForOrder(order)}
                        title="Simulate Farmer Approval for Demo"
                      >
                        <Clock size={14} />
                        <span>Demo Approval</span>
                      </button>
                    )}

                    {/* Step 4: Confirmed awaiting delivery arrangement demo button */}
                    {isConfirmedNoDelivery && (
                      <button
                        type="button"
                        className="buyer-btn-primary small"
                        style={{ background: '#2563eb' }}
                        onClick={() => handleOpenOrderWorkflowForOrder(order)}
                        title="Arrange EV Delivery for Demo"
                      >
                        <Truck size={14} />
                        <span>Arrange Delivery</span>
                      </button>
                    )}

                    {/* Step 5: Active delivery tracking */}
                    {canTrack && (
                      <button
                        type="button"
                        className="buyer-btn-primary small"
                        onClick={() => {
                          setSelectedTrackingOrderId(order.orderId);
                          navigate(ROUTES.BUYER_DASHBOARD_TRACK);
                        }}
                      >
                        <Navigation size={14} />
                        <span>{t('orders.trackDelivery')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={<PackageX size={36} />}
            title={
              activeOrderFilter === 'active'
                ? 'No active shipments'
                : activeOrderFilter === 'completed'
                ? 'No completed orders yet'
                : 'No orders found'
            }
            description={
              activeOrderFilter === 'active'
                ? 'When you accept farm produce lots from the marketplace, your active shipments will appear here.'
                : 'Your delivered orders and farm tax receipts will be archived here once completed.'
            }
            action={
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate(ROUTES.BUYER_DASHBOARD_CROPS)}
              >
                <span>Browse Fresh Produce</span>
              </Button>
            }
          />
        )}
      </div>

      {/* View Invoice Modal Overlay (Opens on page without redirection) */}
      {selectedInvoiceOrder && (
        <div
          className="buyer-invoice-modal-overlay"
          onClick={() => setSelectedInvoiceOrder(null)}
        >
          <div
            className="buyer-invoice-modal-content simple"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="simple-modal-header">
              <div className="simple-modal-title">
                <Receipt size={18} className="text-success" />
                <span>Invoice #{selectedInvoiceOrder.orderId}</span>
              </div>
              <div className="simple-modal-actions">
                <button
                  type="button"
                  className="simple-print-action-btn"
                  onClick={() => window.print()}
                  title="Print Invoice"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  className="buyer-invoice-modal-close-btn"
                  onClick={() => setSelectedInvoiceOrder(null)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Clean Printable Invoice Document */}
            <div className="buyer-invoice-paper-wrapper">
              <div className="simple-invoice-sheet">
                {/* Header: Logo, Company & Status */}
                <div className="simple-sheet-top">
                  <div className="simple-sheet-brand">
                    <img src="/logo.jpg" alt="Naam Uzhavar" className="simple-sheet-logo" />
                    <div>
                      <h2 className="simple-sheet-title">Naam Uzhavar</h2>
                      <span className="simple-sheet-sub">Farmers • Buyers • Drivers</span>
                    </div>
                  </div>
                  <span className={`simple-sheet-status ${(selectedInvoiceOrder.deliveryStatus === 'DELIVERED' || selectedInvoiceOrder.paymentStatus === 'PAID') ? 'paid' : 'pending'}`}>
                    {(selectedInvoiceOrder.deliveryStatus === 'DELIVERED' || selectedInvoiceOrder.paymentStatus === 'PAID') ? '✓ Paid' : '• Pending'}
                  </span>
                </div>

                <div className="simple-sheet-divider" />

                {/* Key Information Row: Invoice #, Date, Order Ref */}
                <div className="simple-sheet-meta-grid">
                  <div className="simple-sheet-meta-item">
                    <span className="smeta-lbl">Invoice No</span>
                    <strong className="smeta-val mono">INV-{selectedInvoiceOrder.orderId?.replace(/^NU-2026-|^ORD-/, '') || selectedInvoiceOrder.orderId}</strong>
                  </div>
                  <div className="simple-sheet-meta-item">
                    <span className="smeta-lbl">Date</span>
                    <strong className="smeta-val">
                      {formatOrderDate(selectedInvoiceOrder.orderTime || selectedInvoiceOrder.pickupDate || selectedInvoiceOrder.preferredDeliveryDate, selectedInvoiceOrder.createdAt)}
                    </strong>
                  </div>
                  <div className="simple-sheet-meta-item">
                    <span className="smeta-lbl">Order ID</span>
                    <strong className="smeta-val mono">{selectedInvoiceOrder.orderId}</strong>
                  </div>
                </div>

                {/* Buyer & Farmer Info */}
                <div className="simple-sheet-parties">
                  <div className="simple-party-card">
                    <span className="party-title">Billed To</span>
                    <strong className="party-name">
                      {profile?.shopName || profile?.businessName || profile?.fullName || profile?.name || 'Commercial Buyer'}
                    </strong>
                    <span className="party-sub">
                      {profile?.contactPerson || profile?.fullName || profile?.name || 'Commercial Partner'} • {profile?.phone || 'N/A'}
                    </span>
                    {profile?.gstin && (
                      <span className="party-sub font-mono">
                        GSTIN: {profile.gstin}
                      </span>
                    )}
                  </div>

                  <div className="simple-party-card">
                    <span className="party-title">Farmer & Location</span>
                    <strong className="party-name">
                      🌾 {selectedInvoiceOrder.farmer?.name || 'Local Producer'}
                    </strong>
                    <span className="party-sub">
                      {selectedInvoiceOrder.hub || selectedInvoiceOrder.location || 'Dindigul Central'} • {selectedInvoiceOrder.farmer?.location || 'Tamil Nadu'}
                    </span>
                  </div>
                </div>

                {/* Clean Item Table */}
                <div className="simple-table-wrapper">
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>Produce Item</th>
                        <th className="text-center">Grade</th>
                        <th className="text-right">Quantity</th>
                        <th className="text-right">Rate / kg</th>
                        <th className="text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>{selectedInvoiceOrder.cropName}</strong>
                          {selectedInvoiceOrder.tamilCropName && (
                            <span className="simple-tamil-text"> ({selectedInvoiceOrder.tamilCropName})</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className="simple-grade-pill">{selectedInvoiceOrder.grade || 'Grade A'}</span>
                        </td>
                        <td className="text-right">{selectedInvoiceOrder.quantityKg ?? 0} kg</td>
                        <td className="text-right">₹{selectedInvoiceOrder.unitPrice ?? 0}</td>
                        <td className="text-right font-bold">
                          ₹{Number(selectedInvoiceOrder.totalPrice || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Grand Total Row */}
                <div className="simple-grand-total-row">
                  <span className="gtotal-lbl">Total Amount:</span>
                  <span className="gtotal-val">₹{Number(selectedInvoiceOrder.totalPrice || 0).toLocaleString('en-IN')}</span>
                </div>

                {/* Minimal Footer Note */}
                <div className="simple-sheet-footer">
                  <span>✓ Direct Farmer Procurement • Zero Middleman Brokerage</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
