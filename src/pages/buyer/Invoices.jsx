// What this file does: Simple, clean invoices management page for commercial buyers. Keeps only important details: Invoice #, Date, Order Ref, Produce, Quantity, Rate, Total Amount, Farmer/Hub, and Status.

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Receipt,
  Search,
  Printer,
  X,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  FileText,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import './Invoices.css';
import { useBuyer } from '../../context/BuyerContext';
import { ROUTES } from '../../routes';
import EmptyState from '../../components/EmptyState';
import DemoPaymentModal from '../../components/common/DemoPaymentModal';
import { TableSkeleton } from '../../components/Skeleton';
import api from '../../utils/api';

// Seed historical delivered invoices for accounting records
const ARCHIVED_INVOICES = [
  {
    id: 'INV-2026-00088',
    orderId: 'NU-2026-00088',
    invoiceDate: '15 Oct 2026',
    cropName: 'Sirumalai Hill Bananas',
    tamilCropName: 'சிறுமலை வாழை',
    grade: 'Grade A',
    quantityKg: 300,
    unitPrice: 38,
    totalAmount: 11400,
    status: 'paid',
    hub: 'Sirumalai, Dindigul',
    farmer: {
      name: 'N. Balakrishnan',
      phone: '+91 94438 90123',
      location: 'Sirumalai Hills, Dindigul'
    }
  },
  {
    id: 'INV-2026-00075',
    orderId: 'NU-2026-00075',
    invoiceDate: '12 Oct 2026',
    cropName: 'Green Capsicum',
    tamilCropName: 'குடைமிளகாய்',
    grade: 'Grade A',
    quantityKg: 120,
    unitPrice: 52,
    totalAmount: 6240,
    status: 'paid',
    hub: 'Vedasandur, Dindigul',
    farmer: {
      name: 'V. Senthil',
      phone: '+91 97890 12345',
      location: 'Vedasandur, Dindigul'
    }
  }
];

export default function Invoices() {
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');

  const { orders, setOrders, profile, isDataLoading, lang } = useBuyer();
  const p = profile || {};

  const [searchQuery, setSearchQuery] = useState(urlOrderId || '');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'paid' | 'pending'
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(urlOrderId || null);
  const [prevUrlOrderId, setPrevUrlOrderId] = useState(urlOrderId);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paidInvoiceIds, setPaidInvoiceIds] = useState(() => {
    try {
      const saved = localStorage.getItem('buyer_paid_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const printTimerRef = useRef(null);

  // Synchronize state during render when URL query changes (React-recommended pattern, no cascading effect)
  if (urlOrderId !== prevUrlOrderId) {
    setPrevUrlOrderId(urlOrderId);
    setSelectedInvoiceId(urlOrderId);
  }

  // Handle invoice payment via demo gateway
  const handleInvoicePaymentSuccess = (paymentResult) => {
    if (!payingInvoice) return;
    const invId = payingInvoice.id;
    const ordId = payingInvoice.orderId;

    const nextPaidIds = [...paidInvoiceIds, invId, ordId];
    setPaidInvoiceIds(nextPaidIds);
    try {
      localStorage.setItem('buyer_paid_invoices', JSON.stringify(nextPaidIds));
    } catch {}

    // Update orders list in context and localStorage
    if (setOrders) {
      setOrders((prev) => {
        const updated = (prev || []).map((o) => {
          if (o.orderId === ordId || o.id === ordId) {
            return {
              ...o,
              paymentStatus: 'PAID',
              status: 'delivered',
              deliveryStatus: 'DELIVERED',
              paymentMethod: paymentResult.methodTitle || paymentResult.method,
              transactionRef: paymentResult.transactionRef,
              utrNumber: paymentResult.utrNumber
            };
          }
          return o;
        });
        try {
          localStorage.setItem('buyer_orders', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('buyer-data-updated'));
        } catch {}
        return updated;
      });
    }

    // Persist to backend if this is a live order (skip synthetic archival invoices)
    if (ordId && !ordId.startsWith('NU-2026-00088') && !ordId.startsWith('NU-2026-00075')) {
      try {
        api.post(`/orders/${ordId}/pay`, {
          paymentMethod: paymentResult.methodTitle || paymentResult.method,
          transactionRef: paymentResult.transactionRef,
          utrNumber: paymentResult.utrNumber
        }).catch((err) => {
          console.warn('Backend order payment notice (persisted locally):', err?.message);
        });
      } catch {}
    }

    // NOTE: Do NOT call setPayingInvoice(null) here.
    // Modal stays in 'SUCCESS' state until buyer clicks 'Continue to Dashboard' or 'X'.
  };

  // Cleanup print timer on unmount
  useEffect(() => {
    return () => {
      if (printTimerRef.current) {
        clearTimeout(printTimerRef.current);
      }
    };
  }, []);

  // Unified list of invoices from orders + archival records
  const allInvoices = useMemo(() => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const liveInvoices = safeOrders.map((order, idx) => {
      const rawOrderId = String(order?.orderId || '');
      const cleanNum = rawOrderId.replace(/[^0-9]/g, '') || `${100 + idx}`;
      const invId = `INV-2026-${cleanNum.slice(-5).padStart(5, '0')}`;
      const isPaid =
        order?.status === 'delivered' ||
        order?.paymentStatus === 'PAID' ||
        paidInvoiceIds.includes(invId) ||
        paidInvoiceIds.includes(rawOrderId);
      const qty = Number(order?.quantityKg) || 0;
      const unitPrice = Number(order?.unitPrice) || 0;
      const totalAmount = Number(order?.totalPrice) || qty * unitPrice;

      return {
        id: invId,
        orderId: order?.orderId || `NU-2026-${cleanNum}`,
        invoiceDate: order?.orderTime || 'Today',
        cropName: order?.cropName || 'Farm Produce',
        tamilCropName: order?.tamilCropName || '',
        grade: order?.grade || 'Grade A',
        quantityKg: qty,
        unitPrice: unitPrice,
        totalAmount: totalAmount,
        status: isPaid ? 'paid' : 'pending',
        hub: order?.hub || order?.location || 'Dindigul Central',
        farmer: {
          name: order?.farmer?.name || 'Local Producer',
          phone: order?.farmer?.phone || '+91 98400 00000',
          location: order?.farmer?.location || 'Tamil Nadu'
        }
      };
    });

    const mappedArchived = ARCHIVED_INVOICES.map((arch) => ({
      ...arch,
      status: paidInvoiceIds.includes(arch.id) ? 'paid' : arch.status
    }));

    return [...liveInvoices, ...mappedArchived];
  }, [orders, paidInvoiceIds]);

  // Derive active selected invoice for modal preview
  const selectedInvoice = useMemo(() => {
    if (!selectedInvoiceId) return null;
    if (isDataLoading && (!orders || orders.length === 0)) {
    return (
      <div className="buyer-view-container buyer-invoices-view animate-fade-in">
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
      allInvoices.find(
        (inv) => inv.orderId === selectedInvoiceId || inv.id === selectedInvoiceId
      ) || null
    );
  }, [selectedInvoiceId, allInvoices]);

  // Aggregate stats (Total, Paid, Pending and counts computed in a single pass)
  const stats = useMemo(() => {
    let totalBilled = 0;
    let paidBilled = 0;
    let pendingBilled = 0;
    let paidCount = 0;
    let pendingCount = 0;

    allInvoices.forEach((inv) => {
      const amt = Number(inv.totalAmount) || 0;
      totalBilled += amt;
      if (inv.status === 'paid') {
        paidBilled += amt;
        paidCount += 1;
      } else {
        pendingBilled += amt;
        pendingCount += 1;
      }
    });

    return { totalBilled, paidBilled, pendingBilled, paidCount, pendingCount };
  }, [allInvoices]);

  // Filtered invoices with null-safe lowercasing
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      if (activeTab === 'paid' && inv.status !== 'paid') return false;
      if (activeTab === 'pending' && inv.status !== 'pending') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (inv.id && inv.id.toLowerCase().includes(q)) ||
        (inv.orderId && inv.orderId.toLowerCase().includes(q)) ||
        (inv.cropName && inv.cropName.toLowerCase().includes(q)) ||
        (inv.tamilCropName && inv.tamilCropName.toLowerCase().includes(q)) ||
        (inv.farmer?.name && inv.farmer.name.toLowerCase().includes(q)) ||
        (inv.hub && inv.hub.toLowerCase().includes(q))
      );
    });
  }, [allInvoices, activeTab, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  const handleQuickPrint = (inv) => {
    setSelectedInvoiceId(inv.id);
    if (printTimerRef.current) clearTimeout(printTimerRef.current);
    printTimerRef.current = setTimeout(() => {
      window.print();
    }, 250);
  };

  if (isDataLoading && (!orders || orders.length === 0)) {
    return (
      <div className="buyer-view-container buyer-invoices-view animate-fade-in">
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="buyer-view-container buyer-invoices-view animate-fade-in">
      {/* 1. Header Section */}
      <div className="buyer-view-header">
        <div>
          <h1 className="buyer-view-title">{lang === 'ta' ? 'விலைப்பட்டியல்கள்' : 'Invoices'}</h1>
          <p className="buyer-view-subtitle">
            {lang === 'ta'
              ? 'விளைபொருள் கொள்முதல் பில்கள் மற்றும் ரசீதுகள்.'
              : 'Direct farm produce procurement invoices and receipts.'}
          </p>
        </div>
      </div>

      {/* 2. Simple 3-Metric Summary Bar */}
      <div className="simple-invoices-stats-bar">
        <div className="simple-stat-box">
          <span className="simple-stat-lbl">{lang === 'ta' ? 'மொத்த தொகை' : 'Total Billed'}</span>
          <span className="simple-stat-num">₹{stats.totalBilled.toLocaleString('en-IN')}</span>
        </div>
        <div className="simple-stat-divider" />
        <div className="simple-stat-box">
          <span className="simple-stat-lbl">{lang === 'ta' ? 'செலுத்தப்பட்டது' : 'Paid'}</span>
          <span className="simple-stat-num text-success">₹{stats.paidBilled.toLocaleString('en-IN')}</span>
        </div>
        <div className="simple-stat-divider" />
        <div className="simple-stat-box">
          <span className="simple-stat-lbl">{lang === 'ta' ? 'நிலுவை' : 'Pending'}</span>
          <span className="simple-stat-num text-amber">₹{stats.pendingBilled.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* 3. Search & Tabs Filter Bar */}
      <div className="simple-invoices-filter-row">
        <div className="simple-invoices-search-box">
          <Search size={16} className="simple-invoices-search-icon" />
          <input
            type="text"
            className="simple-invoices-search-input"
            placeholder={
              lang === 'ta'
                ? 'பில் எண், ஆர்டர் எண் அல்லது பயிர் பெயர் தேடவும்...'
                : 'Search by invoice #, order ID, or crop name...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="simple-search-clear-btn"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="simple-invoices-tabs">
          <button
            type="button"
            className={`simple-inv-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {lang === 'ta' ? `அனைத்தும் (${allInvoices.length})` : `All (${allInvoices.length})`}
          </button>
          <button
            type="button"
            className={`simple-inv-tab ${activeTab === 'paid' ? 'active' : ''}`}
            onClick={() => setActiveTab('paid')}
          >
            {lang === 'ta'
              ? `செலுத்தப்பட்டவை (${stats.paidCount})`
              : `Paid (${stats.paidCount})`}
          </button>
          <button
            type="button"
            className={`simple-inv-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            {lang === 'ta'
              ? `நிலுவை (${stats.pendingCount})`
              : `Pending (${stats.pendingCount})`}
          </button>
        </div>
      </div>

      {/* 4. Simple Clean Invoices List */}
      <div className="simple-invoices-list">
        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={<Receipt size={36} className="text-muted" />}
            title={lang === 'ta' ? 'பில்கள் எதுவும் கிடைக்கவில்லை' : 'No invoices found'}
            description={
              searchQuery
                ? (lang === 'ta'
                    ? `"${searchQuery}" என்ற தேடலுக்கு முடிவுகள் எதுவும் இல்லை.`
                    : `No results found matching "${searchQuery}".`)
                : (lang === 'ta'
                    ? 'தேர்ந்தெடுக்கப்பட்ட பிரிவில் பில்கள் எதுவும் இல்லை.'
                    : 'No invoices available in this category.')
            }
            actionText={searchQuery ? (lang === 'ta' ? 'தேடலை அழிக்கவும்' : 'Clear search') : null}
            onAction={searchQuery ? () => setSearchQuery('') : null}
          />
        ) : (
          filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className={`simple-invoice-item ${inv.orderId === urlOrderId ? 'highlighted' : ''}`}
            >
              <div className="simple-item-main">
                <div className="simple-item-meta">
                  <span className="simple-item-num">{inv.id}</span>
                  <Link
                    to={ROUTES.BUYER_DASHBOARD_ORDERS}
                    className="simple-item-order-ref"
                    title="View order"
                  >
                    Order: {inv.orderId}
                  </Link>
                  <span className="simple-item-date">
                    <Calendar size={13} /> {inv.invoiceDate}
                  </span>
                </div>

                <div className="simple-item-produce-row">
                  <div className="simple-item-crop">
                    <span className="simple-crop-name">{inv.cropName}</span>
                    <span className="simple-crop-grade">{inv.grade}</span>
                  </div>
                  <span className="simple-item-hub">
                    <MapPin size={13} /> {inv.farmer.name} • {inv.hub}
                  </span>
                </div>
              </div>

              <div className="simple-item-details">
                <div className="simple-item-qty">
                  <span className="simple-qty-val">{inv.quantityKg} kg</span>
                  <span className="simple-rate-val">₹{inv.unitPrice} / kg</span>
                </div>

                <div className="simple-item-total">
                  <span className="simple-total-amount">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                  <span className={`simple-status-tag ${inv.status}`}>
                    {inv.status === 'paid' ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>{lang === 'ta' ? 'செலுத்தப்பட்டது' : 'Paid'}</span>
                      </>
                    ) : (
                      <>
                        <Clock size={12} />
                        <span>{lang === 'ta' ? 'நிலுவை' : 'Pending'}</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="simple-item-actions">
                  {inv.status !== 'paid' && (
                    <button
                      type="button"
                      className="buyer-btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => setPayingInvoice(inv)}
                    >
                      <CreditCard size={13} />
                      <span>{lang === 'ta' ? 'பணம் செலுத்து' : 'Pay Now'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="simple-btn-view"
                    onClick={() => setSelectedInvoiceId(inv.id)}
                  >
                    <FileText size={14} />
                    <span>{lang === 'ta' ? 'பில் காண்க' : 'View Invoice'}</span>
                  </button>
                  <button
                    type="button"
                    className="simple-btn-print"
                    onClick={() => handleQuickPrint(inv)}
                    title="Print"
                  >
                    <Printer size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ====================================================================
          5. SIMPLE INVOICE PREVIEW MODAL (ONLY IMPORTANT DETAILS)
          ==================================================================== */}
      {selectedInvoice && (
        <div
          className="buyer-invoice-modal-overlay"
          onClick={() => setSelectedInvoiceId(null)}
        >
          <div
            className="buyer-invoice-modal-content simple"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="simple-modal-header">
              <div className="simple-modal-title">
                <Receipt size={18} className="text-success" />
                <span>{lang === 'ta' ? 'விலைப்பட்டியல்' : 'Invoice'} #{selectedInvoice.id}</span>
              </div>
              <div className="simple-modal-actions">
                <button
                  type="button"
                  className="simple-print-action-btn"
                  onClick={handlePrint}
                >
                  <Printer size={14} />
                  <span>{lang === 'ta' ? 'அச்சிடுக' : 'Print'}</span>
                </button>
                <button
                  type="button"
                  className="buyer-invoice-modal-close-btn"
                  onClick={() => setSelectedInvoiceId(null)}
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
                      <span className="simple-sheet-sub">
                        {lang === 'ta' ? 'விவசாயிகள் • வாங்குவோர் • ஓட்டுநர்கள்' : 'Farmers • Buyers • Drivers'}
                      </span>
                    </div>
                  </div>
                  <span className={`simple-sheet-status ${selectedInvoice.status}`}>
                    {selectedInvoice.status === 'paid'
                      ? (lang === 'ta' ? '✓ செலுத்தப்பட்டது' : '✓ Paid')
                      : (lang === 'ta' ? '• நிலுவை' : '• Pending')}
                  </span>
                </div>

                <div className="simple-sheet-divider" />

                {/* Key Information Row: Invoice #, Date, Order Ref */}
                <div className="simple-sheet-meta-grid">
                  <div className="simple-sheet-meta-item">
                    <span className="smeta-lbl">{lang === 'ta' ? 'பில் எண்' : 'Invoice No'}</span>
                    <strong className="smeta-val mono">{selectedInvoice.id}</strong>
                  </div>
                  <div className="simple-sheet-meta-item">
                    <span className="smeta-lbl">{lang === 'ta' ? 'தேதி' : 'Date'}</span>
                    <strong className="smeta-val">{selectedInvoice.invoiceDate}</strong>
                  </div>
                  <div className="simple-sheet-meta-item">
                    <span className="smeta-lbl">{lang === 'ta' ? 'ஆர்டர் எண்' : 'Order ID'}</span>
                    <strong className="smeta-val mono">{selectedInvoice.orderId}</strong>
                  </div>
                </div>

                {/* Buyer & Farmer Info */}
                <div className="simple-sheet-parties">
                  <div className="simple-party-card">
                    <span className="party-title">{lang === 'ta' ? 'வாங்குபவர்' : 'Billed To'}</span>
                    <strong className="party-name">
                      {p.shopName || p.businessName || p.fullName || p.name || 'Commercial Buyer'}
                    </strong>
                    <span className="party-sub">
                      {p.contactPerson || p.fullName || p.name || 'Commercial Partner'} • {p.phone || '—'}
                    </span>
                    {p.gstin && (
                      <span className="party-sub font-mono">
                        GSTIN: {p.gstin}
                      </span>
                    )}
                  </div>

                  <div className="simple-party-card">
                    <span className="party-title">{lang === 'ta' ? 'விவசாயி & இடம்' : 'Farmer & Location'}</span>
                    <strong className="party-name">
                      🌾 {selectedInvoice.farmer?.name || 'Local Producer'}
                    </strong>
                    <span className="party-sub">
                      {selectedInvoice.hub || 'Dindigul Central'} • {selectedInvoice.farmer?.location || 'Dindigul'}
                    </span>
                  </div>
                </div>

                {/* Clean Item Table */}
                <div className="simple-table-wrapper">
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>{lang === 'ta' ? 'விளைபொருள்' : 'Produce Item'}</th>
                        <th className="text-center">{lang === 'ta' ? 'தரம்' : 'Grade'}</th>
                        <th className="text-right">{lang === 'ta' ? 'அளவு' : 'Quantity'}</th>
                        <th className="text-right">{lang === 'ta' ? 'விலை / கிலோ' : 'Rate / kg'}</th>
                        <th className="text-right">{lang === 'ta' ? 'மொத்தம்' : 'Amount'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>{selectedInvoice.cropName}</strong>
                          {selectedInvoice.tamilCropName && (
                            <span className="simple-tamil-text"> ({selectedInvoice.tamilCropName})</span>
                          )}
                        </td>
                        <td className="text-center">
                          <span className="simple-grade-pill">{selectedInvoice.grade}</span>
                        </td>
                        <td className="text-right">{selectedInvoice.quantityKg} kg</td>
                        <td className="text-right">₹{selectedInvoice.unitPrice}</td>
                        <td className="text-right font-bold">
                          ₹{(Number(selectedInvoice.totalAmount) || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Grand Total Row */}
                <div className="simple-grand-total-row">
                  <span className="gtotal-lbl">{lang === 'ta' ? 'மொத்த தொகை' : 'Total Amount'}:</span>
                  <span className="gtotal-val">₹{(Number(selectedInvoice.totalAmount) || 0).toLocaleString('en-IN')}</span>
                </div>

                {/* Pay Invoice Action if Pending */}
                {selectedInvoice.status !== 'paid' && (
                  <div style={{ marginTop: '16px', padding: '12px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={18} color="#166534" />
                      <span style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                        {lang === 'ta' ? 'பாதுகாப்பான இடைத்தரகர் இல்லா எஸ்க்ரோ நுழைவாயில்' : 'Protected by Naam Uzhavar Agri-Escrow'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="buyer-btn-primary"
                      style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem' }}
                      onClick={() => setPayingInvoice(selectedInvoice)}
                    >
                      <CreditCard size={14} />
                      <span>{lang === 'ta' ? 'இப்போதே பணம் செலுத்து' : `Pay ₹${(Number(selectedInvoice.totalAmount) || 0).toLocaleString('en-IN')} Now`}</span>
                    </button>
                  </div>
                )}

                {/* Minimal Footer Note */}
                <div className="simple-sheet-footer">
                  <span>
                    {lang === 'ta'
                      ? '✓ நேரடி விவசாய கொள்முதல் • இடைத்தரகர் இல்லை'
                      : '✓ Direct Farmer Procurement • Zero Middleman Brokerage'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Payment Gateway Modal */}
      {payingInvoice && (
        <DemoPaymentModal
          isOpen={!!payingInvoice}
          onClose={() => setPayingInvoice(null)}
          amount={Number(payingInvoice.totalAmount) || 0}
          orderId={payingInvoice.orderId || payingInvoice.id}
          cropName={payingInvoice.cropName}
          quantityKg={payingInvoice.quantityKg}
          lang={lang}
          onPaymentSuccess={handleInvoicePaymentSuccess}
        />
      )}
    </div>
  );
}
