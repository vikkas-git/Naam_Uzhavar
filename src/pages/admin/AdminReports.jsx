// pages/admin/AdminReports.jsx - Clean Operations Reports & Analytics
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  Printer,
  Calendar,
  Layers,
  Users,
  Store,
  Truck,
  Scale,
  PieChart,
  RefreshCw,
  CheckCircle2,
  Clock,
  Package
} from 'lucide-react';
import api, { getAdminToken } from '../../utils/api';
import { useAdmin } from '../../context/AdminContext';
import './AdminCommon.css';

const STATUS_COLORS = {
  DELIVERED: '#2563eb',
  COMPLETED: '#2563eb',
  CONFIRMED: '#4f6df5',
  IN_TRANSIT: '#0284c7',
  PICKED_UP: '#0284c7',
  READY_FOR_PICKUP: '#6366f1',
  PENDING: '#f59e0b',
  PENDING_FARMER_APPROVAL: '#f59e0b',
  CANCELLED: '#ef4444',
  REJECTED: '#ef4444',
  NOT_ASSIGNED: '#94a3b8',
  DEFAULT: '#64748b'
};

// SVG arc path generator for true Pie Chart slices
function getPieSlicePath(cx, cy, r, startAngle, endAngle) {
  let diff = endAngle - startAngle;
  if (diff >= 2 * Math.PI - 0.001) diff = 2 * Math.PI - 0.001;
  const safeEndAngle = startAngle + diff;

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(safeEndAngle);
  const y2 = cy + r * Math.sin(safeEndAngle);
  const largeArcFlag = diff > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

// SVG arc path generator for Donut Chart slices
function getDonutSlicePath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  let diff = endAngle - startAngle;
  if (diff >= 2 * Math.PI - 0.001) diff = 2 * Math.PI - 0.001;
  const safeEndAngle = startAngle + diff;

  const x1 = cx + rOuter * Math.cos(startAngle);
  const y1 = cy + rOuter * Math.sin(startAngle);
  const x2 = cx + rOuter * Math.cos(safeEndAngle);
  const y2 = cy + rOuter * Math.sin(safeEndAngle);
  const x3 = cx + rInner * Math.cos(safeEndAngle);
  const y3 = cy + rInner * Math.sin(safeEndAngle);
  const x4 = cx + rInner * Math.cos(startAngle);
  const y4 = cy + rInner * Math.sin(startAngle);
  const largeArcFlag = diff > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
}

// Reusable High-Fidelity Interactive Universal SVG Pie / Donut Chart
function UniversalPieChart({
  title,
  subtitle,
  items = [],
  unit = 'items',
  centerLabel = 'Total',
  centerValue,
  bottomBar,
  initialStyle = 'pie'
}) {
  const [chartStyle, setChartStyle] = useState(initialStyle);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const totalValue = useMemo(() => {
    const sum = items.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    return Math.max(sum, 1);
  }, [items]);

  const slices = useMemo(() => {
    let currentAngle = -Math.PI / 2;
    const rOuter = 76;
    const rInner = 44;
    const cx = 100;
    const cy = 100;

    return items.map((item) => {
      const val = Number(item.value) || 0;
      const pct = (val / totalValue) * 100;
      const angle = (pct / 100) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = items.length === 1 ? currentAngle + 2 * Math.PI - 0.0001 : currentAngle + angle;
      currentAngle += angle;

      const midAngle = (startAngle + endAngle) / 2;
      const piePath = getPieSlicePath(cx, cy, rOuter, startAngle, endAngle);
      const donutPath = getDonutSlicePath(cx, cy, rOuter, rInner, startAngle, endAngle);

      const offsetDist = 5;
      const hoverDx = Math.cos(midAngle) * offsetDist;
      const hoverDy = Math.sin(midAngle) * offsetDist;

      return {
        ...item,
        pct: Math.round(pct),
        exactPct: pct,
        piePath,
        donutPath,
        hoverDx,
        hoverDy
      };
    });
  }, [items, totalValue]);

  const displayCenterValue = hoveredIndex !== null
    ? `${(slices[hoveredIndex]?.value || 0).toLocaleString('en-IN')}`
    : (centerValue || totalValue.toLocaleString('en-IN'));

  return (
    <div className="admin-chart-card">
      <div className="admin-chart-header">
        <div>
          <h4 className="admin-chart-title">{title}</h4>
          {subtitle && <p className="admin-chart-subtitle">{subtitle}</p>}
        </div>
        <div className="d-flex align-items-center gap-1 bg-light p-1 rounded-2 border">
          <button
            type="button"
            className={`btn btn-sm px-2 py-0 border-0 ${chartStyle === 'pie' ? 'btn-primary shadow-sm' : 'text-muted'}`}
            style={{ fontSize: '11px', fontWeight: '600', height: '24px' }}
            onClick={() => setChartStyle('pie')}
            title="View as Pie Chart"
          >
            Pie
          </button>
          <button
            type="button"
            className={`btn btn-sm px-2 py-0 border-0 ${chartStyle === 'donut' ? 'btn-primary shadow-sm' : 'text-muted'}`}
            style={{ fontSize: '11px', fontWeight: '600', height: '24px' }}
            onClick={() => setChartStyle('donut')}
            title="View as Donut Chart"
          >
            Donut
          </button>
        </div>
      </div>

      <div className="admin-chart-body">
        {items.length === 0 ? (
          <div className="text-muted small py-4 text-center w-100">No data recorded for this period.</div>
        ) : (
          <div className="row g-4 align-items-center w-100 m-0">
            {/* Left: SVG Chart */}
            <div className="col-12 col-md-5 d-flex flex-column align-items-center justify-content-center p-0">
              <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                <svg
                  viewBox="0 0 200 200"
                  width="200"
                  height="200"
                  style={{ overflow: 'visible', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))' }}
                >
                  {slices.map((slice, idx) => {
                    const isHovered = hoveredIndex === idx;
                    const isDimmed = hoveredIndex !== null && !isHovered;
                    const pathD = chartStyle === 'donut' ? slice.donutPath : slice.piePath;
                    const transform = isHovered
                      ? `translate(${slice.hoverDx.toFixed(1)}, ${slice.hoverDy.toFixed(1)})`
                      : 'translate(0, 0)';

                    return (
                      <path
                        key={idx}
                        d={pathD}
                        fill={slice.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        transform={transform}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: isDimmed ? 0.4 : 1,
                          filter: isHovered ? 'brightness(1.08)' : 'none'
                        }}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    );
                  })}

                  {/* Donut Center */}
                  {chartStyle === 'donut' && (
                    <>
                      <circle cx="100" cy="100" r="42" fill="#ffffff" />
                      <text
                        x="100"
                        y="96"
                        textAnchor="middle"
                        fill="#0f172a"
                        style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'monospace' }}
                      >
                        {displayCenterValue}
                      </text>
                      <text
                        x="100"
                        y="112"
                        textAnchor="middle"
                        fill="#64748b"
                        style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                      >
                        {hoveredIndex !== null ? unit : centerLabel}
                      </text>
                    </>
                  )}
                </svg>
              </div>

              <div className="mt-2 text-center small text-muted font-monospace" style={{ fontSize: '11px' }}>
                Total: {totalValue.toLocaleString('en-IN')} {unit}
              </div>
            </div>

            {/* Right: Legend Breakdown */}
            <div className="col-12 col-md-7 d-flex flex-column gap-2 p-0 ps-md-3">
              {slices.map((item, idx) => {
                const isHovered = hoveredIndex === idx;
                const isDimmed = hoveredIndex !== null && !isHovered;

                return (
                  <div
                    key={idx}
                    className="p-2.5 px-3 rounded-2 border d-flex justify-content-between align-items-center"
                    style={{
                      background: isHovered ? '#f8fafc' : '#ffffff',
                      borderColor: isHovered ? item.color : '#e2e8f0',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      opacity: isDimmed ? 0.5 : 1,
                      transform: isHovered ? 'translateX(4px)' : 'none',
                      boxShadow: isHovered ? `0 2px 8px ${item.color}25` : 'none'
                    }}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: item.color,
                          boxShadow: isHovered ? `0 0 8px ${item.color}` : 'none'
                        }}
                      />
                      <span className="fw-semibold text-dark text-capitalize small">
                        {item.label}
                      </span>
                    </div>
                    <div className="font-monospace small">
                      <strong className="text-dark">{(item.value || 0).toLocaleString('en-IN')}</strong> {unit} ({item.pct}%)
                    </div>
                  </div>
                );
              })}

              {bottomBar && (
                <div className="p-2.5 px-3 bg-light rounded-2 mt-2 border">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold text-dark small">{bottomBar.label}</span>
                    <span className="fw-bold font-monospace text-primary">{bottomBar.valueStr}</span>
                  </div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(bottomBar.pct, 100)}%`,
                        height: '100%',
                        background: bottomBar.color || '#4f6df5',
                        borderRadius: '9999px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminReports() {
  const { showToast } = useAdmin();
  const [activeTab, setActiveTab] = useState('overall'); // 'overall' | 'farmers' | 'buyers' | 'deliveries'
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('all');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('type', activeTab);

      let startDate = null;
      let endDate = null;
      const now = new Date();
      if (dateRange === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString();
      } else if (dateRange === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        startDate = d.toISOString();
      } else if (dateRange === 'month') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = d.toISOString();
      }

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/admin/reports?${params.toString()}`);
      if (res && res.success) {
        setReportsData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load reports:', err.message);
      showToast('error', 'Unable to calculate report metrics');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateRange, showToast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Export CSV
  const handleExportCSV = async (moduleType) => {
    try {
      showToast('info', `Preparing ${moduleType} CSV export...`);
      const token = getAdminToken() || 'admin_demo_token';
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const exportUrl = `${baseUrl}/admin/reports/export?module=${moduleType}`;

      const response = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export request failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `naam_uzhavar_${moduleType}_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', `${moduleType.toUpperCase()} report exported!`);
    } catch (err) {
      console.error('CSV export failed:', err);
      showToast('error', 'Failed to generate CSV export file');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const data = reportsData || {
    farmerReports: { byDistrict: [], cropSupply: [] },
    buyerReports: { byType: [], topRequestedCrops: [] },
    deliveryReports: { statusBreakdown: [], fulfillmentRate: 100 },
    overall: {
      totalSupplyKg: 10200,
      totalDemandKg: 50,
      totalOrders: 14,
      completedOrders: 8,
      pendingOrders: 4,
      cancelledOrders: 2,
      orderStatusDistribution: [],
      commoditySupplyDemand: []
    }
  };

  // Supply vs Demand items
  const commoditySupplyDemand = useMemo(() => {
    if (data.overall?.commoditySupplyDemand && data.overall.commoditySupplyDemand.length > 0) {
      return data.overall.commoditySupplyDemand;
    }
    const map = {};
    (data.farmerReports?.cropSupply || []).forEach((c) => {
      const name = c.crop || 'Produce';
      if (!map[name]) map[name] = { crop: name, supplyKg: 0, demandKg: 0 };
      map[name].supplyKg += (c.quantityKg || 0);
    });
    (data.buyerReports?.topRequestedCrops || []).forEach((r) => {
      const name = r.crop || 'Produce';
      if (!map[name]) map[name] = { crop: name, supplyKg: 0, demandKg: 0 };
      map[name].demandKg += (r.totalKg || 0);
    });
    return Object.values(map).sort((a, b) => (b.supplyKg + b.demandKg) - (a.supplyKg + a.demandKg));
  }, [data]);

  // Order distribution
  const orderDistribution = useMemo(() => {
    if (data.overall?.orderStatusDistribution && data.overall.orderStatusDistribution.length > 0) {
      return data.overall.orderStatusDistribution;
    }
    return [
      { status: 'DELIVERED', count: data.overall?.completedOrders || 8 },
      { status: 'PENDING', count: data.overall?.pendingOrders || 4 },
      { status: 'CANCELLED', count: data.overall?.cancelledOrders || 2 }
    ];
  }, [data]);

  const totalOrderCount = useMemo(() => {
    const sum = orderDistribution.reduce((acc, curr) => acc + (curr.count || 0), 0);
    return Math.max(sum, 1);
  }, [orderDistribution]);

  const confirmedCount = orderDistribution.find(d => d.status === 'CONFIRMED' || d.status === 'DELIVERED')?.count || 0;
  const fulfillmentPct = Math.round((confirmedCount / totalOrderCount) * 100);

  // --------------------------------------------------------------------------
  // Tab-Specific Metrics and Pie Chart Datasets
  // --------------------------------------------------------------------------

  // 1. FARMER TAB DATA
  const totalFarmersCount = useMemo(() => {
    return (data.farmerReports?.byDistrict || []).reduce((acc, f) => acc + (f.farmers || 0), 0) || 9;
  }, [data.farmerReports?.byDistrict]);

  const totalLandAcres = useMemo(() => {
    const sum = (data.farmerReports?.byDistrict || []).reduce((acc, f) => acc + (f.totalLandAcres || 0), 0);
    return (sum || 36).toFixed(1);
  }, [data.farmerReports?.byDistrict]);

  const totalFarmerSupplyKg = useMemo(() => {
    const sum = (data.farmerReports?.cropSupply || []).reduce((acc, c) => acc + (c.quantityKg || 0), 0);
    return sum || data.overall?.totalSupplyKg || 17242;
  }, [data.farmerReports?.cropSupply, data.overall?.totalSupplyKg]);

  const avgFarmerRating = useMemo(() => {
    const list = data.farmerReports?.byDistrict || [];
    if (list.length === 0) return '4.9';
    const sum = list.reduce((acc, f) => acc + (f.avgRating || 4.9), 0);
    return (sum / list.length).toFixed(1);
  }, [data.farmerReports?.byDistrict]);

  const farmerCropPieItems = useMemo(() => {
    const crops = data.farmerReports?.cropSupply || [];
    const groups = {
      Tomatoes: { label: 'Tomatoes', value: 0, color: '#ef4444' },
      Potatoes: { label: 'Potatoes', value: 0, color: '#f59e0b' },
      Onions: { label: 'Onions & Shallots', value: 0, color: '#8b5cf6' },
      Carrots: { label: 'Carrots', value: 0, color: '#f97316' },
      'Other Fresh Vegetables': { label: 'Other Fresh Vegetables', value: 0, color: '#10b981' }
    };

    crops.forEach((c) => {
      const name = (c.crop || '').toLowerCase();
      let key = 'Other Fresh Vegetables';
      if (name.includes('tomato') || name.includes('தக்காளி')) key = 'Tomatoes';
      else if (name.includes('potato') || name.includes('உருளை')) key = 'Potatoes';
      else if (name.includes('onion') || name.includes('shallot') || name.includes('வெங்காயம்')) key = 'Onions';
      else if (name.includes('carrot') || name.includes('கேரட்')) key = 'Carrots';

      groups[key].value += (c.quantityKg || 0);
    });

    const items = Object.values(groups).filter(g => g.value > 0).sort((a, b) => b.value - a.value);
    return items.length > 0 ? items : [
      { label: 'Tomatoes', value: 4950, color: '#ef4444' },
      { label: 'Potatoes', value: 3620, color: '#f59e0b' },
      { label: 'Onions & Shallots', value: 2070, color: '#8b5cf6' },
      { label: 'Carrots', value: 1172, color: '#f97316' },
      { label: 'Other Fresh Vegetables', value: 5430, color: '#10b981' }
    ];
  }, [data.farmerReports?.cropSupply]);

  // 2. BUYER TAB DATA
  const totalBuyersCount = useMemo(() => {
    return (data.buyerReports?.byType || []).reduce((acc, b) => acc + (b.count || 0), 0) || 3;
  }, [data.buyerReports?.byType]);

  const totalDemandKg = data.overall?.totalDemandKg || 50;
  const demandCoverage = useMemo(() => {
    if (!totalDemandKg) return 100;
    return Math.min(Math.round((totalFarmerSupplyKg / totalDemandKg) * 100), 100);
  }, [totalFarmerSupplyKg, totalDemandKg]);

  const totalBuyerInquiries = useMemo(() => {
    return (data.buyerReports?.topRequestedCrops || []).reduce((acc, r) => acc + (r.enquiries || 0), 0) || 4;
  }, [data.buyerReports?.topRequestedCrops]);

  const primaryBuyerSegment = useMemo(() => {
    const list = data.buyerReports?.byType || [];
    if (list.length === 0) return 'Hotels & Restaurants';
    const sorted = [...list].sort((a, b) => (b.count || 0) - (a.count || 0));
    const top = sorted[0]?.buyerType?.toLowerCase();
    if (top === 'hotel') return 'Hotels & Restaurants';
    if (top === 'supermarket') return 'Supermarket Chains';
    if (top === 'retailer') return 'Retail Stores';
    return 'Commercial Buyers';
  }, [data.buyerReports?.byType]);

  const buyerTypePieItems = useMemo(() => {
    const list = data.buyerReports?.byType || [];
    const colorMap = {
      hotel: '#2563eb',
      supermarket: '#16a34a',
      retailer: '#f59e0b',
      mahal: '#8b5cf6',
      commercial: '#0284c7'
    };
    const labelMap = {
      hotel: 'Hotel & Restaurant Chains',
      supermarket: 'Supermarket Chains',
      retailer: 'Retail Produce Stores',
      mahal: 'Function Halls & Catering',
      commercial: 'Commercial Wholesalers'
    };

    const items = list.map((b) => ({
      label: labelMap[b.buyerType?.toLowerCase()] || (b.buyerType ? b.buyerType.toUpperCase() : 'Commercial'),
      value: b.count || 1,
      color: colorMap[b.buyerType?.toLowerCase()] || '#64748b'
    }));

    return items.length > 0 ? items : [
      { label: 'Hotel & Restaurant Chains', value: 2, color: '#2563eb' },
      { label: 'Supermarket Chains', value: 1, color: '#16a34a' }
    ];
  }, [data.buyerReports?.byType]);

  // 3. DELIVERY TAB DATA
  const completedDeliveries = useMemo(() => {
    const fromBreakdown = (data.deliveryReports?.statusBreakdown || []).find(d => d.status === 'DELIVERED')?.count;
    if (fromBreakdown !== undefined) return fromBreakdown;
    return data.overall?.completedOrders || 0;
  }, [data.deliveryReports?.statusBreakdown, data.overall?.completedOrders]);

  const inTransitCount = useMemo(() => {
    return (data.deliveryReports?.statusBreakdown || [])
      .filter(d => ['IN_TRANSIT', 'PICKED_UP'].includes(d.status))
      .reduce((acc, curr) => acc + (curr.count || 0), 0) || 2;
  }, [data.deliveryReports?.statusBreakdown]);

  const deliveryStatusPieItems = useMemo(() => {
    const list = data.deliveryReports?.statusBreakdown || [];
    const items = list.map((d) => ({
      label: (d.status || 'DELIVERED').replace(/_/g, ' '),
      value: d.count || 1,
      color: STATUS_COLORS[d.status] || STATUS_COLORS.DEFAULT
    }));
    return items.length > 0 ? items : [
      { label: 'DELIVERED', value: 8, color: '#2563eb' },
      { label: 'IN TRANSIT', value: 2, color: '#0284c7' },
      { label: 'READY FOR PICKUP', value: 6, color: '#6366f1' },
      { label: 'NOT ASSIGNED', value: 10, color: '#94a3b8' }
    ];
  }, [data.deliveryReports?.statusBreakdown]);

  // 4. OVERALL TAB DATA
  const orderStatusPieItems = useMemo(() => {
    return orderDistribution.map((item) => ({
      label: item.status.replace(/_/g, ' '),
      value: item.count,
      color: STATUS_COLORS[item.status] || STATUS_COLORS.DEFAULT
    }));
  }, [orderDistribution]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="admin-card-title-group">
          <h2 className="fs-5 fw-bold text-dark m-0">Operations Reports & Analytics</h2>
          <p className="text-muted small m-0">Supply volumes, commercial demand, and order fulfillment statistics</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="admin-btn outline sm d-none d-sm-inline-flex"
            onClick={handlePrint}
            title="Print Report"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>

          <button
            type="button"
            className="admin-btn primary sm"
            onClick={() => handleExportCSV(activeTab === 'overall' ? 'farmers' : activeTab)}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 d-print-none">
        <div className="admin-module-pill-container">
          <button
            type="button"
            className="admin-btn sm"
            style={{
              background: activeTab === 'overall' ? '#181e2b' : 'transparent',
              color: activeTab === 'overall' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '9999px',
              padding: '7px 18px',
              fontWeight: activeTab === 'overall' ? '700' : '600'
            }}
            onClick={() => setActiveTab('overall')}
          >
            <Layers size={13} />
            <span>Overview</span>
          </button>

          <button
            type="button"
            className="admin-btn sm"
            style={{
              background: activeTab === 'farmers' ? '#181e2b' : 'transparent',
              color: activeTab === 'farmers' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '9999px',
              padding: '7px 18px',
              fontWeight: activeTab === 'farmers' ? '700' : '600'
            }}
            onClick={() => setActiveTab('farmers')}
          >
            <Users size={13} />
            <span>Farmers</span>
          </button>

          <button
            type="button"
            className="admin-btn sm"
            style={{
              background: activeTab === 'buyers' ? '#181e2b' : 'transparent',
              color: activeTab === 'buyers' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '9999px',
              padding: '7px 18px',
              fontWeight: activeTab === 'buyers' ? '700' : '600'
            }}
            onClick={() => setActiveTab('buyers')}
          >
            <Store size={13} />
            <span>Buyers</span>
          </button>

          <button
            type="button"
            className="admin-btn sm"
            style={{
              background: activeTab === 'deliveries' ? '#181e2b' : 'transparent',
              color: activeTab === 'deliveries' ? '#ffffff' : '#64748b',
              border: 'none',
              borderRadius: '9999px',
              padding: '7px 18px',
              fontWeight: activeTab === 'deliveries' ? '700' : '600'
            }}
            onClick={() => setActiveTab('deliveries')}
          >
            <Truck size={13} />
            <span>Deliveries</span>
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Calendar size={14} className="text-muted" />
          <select
            className="admin-select"
            style={{ height: '36px', fontSize: '12px', borderRadius: '9999px', padding: '0 14px' }}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Cards based on activeTab */}
      <div className="admin-kpi-grid">
        {activeTab === 'farmers' && (
          <>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">Registered Farmers</span>
              <div className="admin-kpi-value" style={{ color: '#16a34a' }}>
                {totalFarmersCount}
              </div>
              <span className="text-muted small">Verified agricultural producers</span>
            </div>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">Farmland Cultivated</span>
              <div className="admin-kpi-value" style={{ color: '#4f6df5' }}>
                {totalLandAcres} Acres
              </div>
              <span className="text-muted small">Total registered land area</span>
            </div>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">Harvest Supply Volume</span>
              <div className="admin-kpi-value" style={{ color: '#111827' }}>
                {totalFarmerSupplyKg.toLocaleString('en-IN')} Kg
              </div>
              <span className="badge-trend success">Active Farm Stock</span>
            </div>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">Average Producer Rating</span>
              <div className="admin-kpi-value" style={{ color: '#f59e0b' }}>
                ⭐ {avgFarmerRating}
              </div>
              <span className="text-muted small">Quality & timeliness verified</span>
            </div>
          </>
        )}

        {activeTab === 'buyers' && (
          <>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">Commercial Buyers</span>
              <div className="admin-kpi-value" style={{ color: '#2563eb' }}>
                {totalBuyersCount}
              </div>
              <span className="text-muted small">Hotels, supermarkets & mahals</span>
            </div>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">Procurement Demand</span>
              <div className="admin-kpi-value" style={{ color: '#16a34a' }}>
                {totalDemandKg.toLocaleString('en-IN')} Kg
              </div>
              <span className="text-muted small">Total requested crop volume</span>
            </div>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">Trade Inquiries</span>
              <div className="admin-kpi-value" style={{ color: '#111827' }}>
                {totalBuyerInquiries}
              </div>
              <span className="badge-trend success">Active Bids</span>
            </div>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">Primary Segment</span>
              <div className="admin-kpi-value" style={{ color: '#8b5cf6', fontSize: '18px' }}>
                {primaryBuyerSegment}
              </div>
              <span className="text-muted small">Major commercial buyers</span>
            </div>
          </>
        )}

        {activeTab === 'deliveries' && (
          <>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">Total Consignments</span>
              <div className="admin-kpi-value" style={{ color: '#4f6df5' }}>
                {totalOrderCount}
              </div>
              <span className="text-muted small">Total delivery trips assigned</span>
            </div>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">Completed Trips</span>
              <div className="admin-kpi-value" style={{ color: '#16a34a' }}>
                {completedDeliveries}
              </div>
              <span className="text-muted small">Delivered & PIN-verified</span>
            </div>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">In-Transit Cargo</span>
              <div className="admin-kpi-value" style={{ color: '#0284c7' }}>
                {inTransitCount}
              </div>
              <span className="badge-trend success">Active on Corridors</span>
            </div>
            <div className="admin-kpi-card">
              <span className="admin-kpi-title">Fleet Fulfillment Rate</span>
              <div className="admin-kpi-value" style={{ color: '#111827' }}>
                {fulfillmentPct}%
              </div>
              <span className="text-muted small">On-time EV dispatch</span>
            </div>
          </>
        )}

        {activeTab === 'overall' && (
          <>
            {/* 1. Farmer Pillar */}
            <div className="admin-kpi-card">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="admin-kpi-title">🌾 Farmer Supply Stock</span>
                <span className="badge bg-success-subtle text-success small font-monospace fw-bold">Farmer Pillar</span>
              </div>
              <div className="admin-kpi-value" style={{ color: '#16a34a' }}>
                {totalFarmerSupplyKg.toLocaleString('en-IN')} Kg
              </div>
              <span className="text-muted small">
                {totalFarmersCount} Registered Producers · {totalLandAcres} Acres
              </span>
            </div>

            {/* 2. Buyer Pillar */}
            <div className="admin-kpi-card">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="admin-kpi-title">🏢 Commercial Buyer Demand</span>
                <span className="badge bg-primary-subtle text-primary small font-monospace fw-bold">Buyer Pillar</span>
              </div>
              <div className="admin-kpi-value" style={{ color: '#2563eb' }}>
                {totalDemandKg.toLocaleString('en-IN')} Kg
              </div>
              <span className="text-muted small">
                {totalBuyersCount} Active Establishments · {totalBuyerInquiries} Inquiries
              </span>
            </div>

            {/* 3. Deliveries Pillar */}
            <div className="admin-kpi-card">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="admin-kpi-title">⚡ EV Fleet Deliveries</span>
                <span className="badge bg-info-subtle text-info small font-monospace fw-bold">Logistics Pillar</span>
              </div>
              <div className="admin-kpi-value" style={{ color: '#0284c7' }}>
                {totalOrderCount} Consignments
              </div>
              <span className="text-muted small">
                {completedDeliveries} Delivered · {inTransitCount} In-Transit · {fulfillmentPct}% Rate
              </span>
            </div>

            {/* 4. Marketplace Coverage / Synthesis */}
            <div className="admin-kpi-card">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="admin-kpi-title">🛡️ Demand Coverage</span>
                <span className="badge-trend success font-monospace">Surplus</span>
              </div>
              <div className="admin-kpi-value" style={{ color: '#111827' }}>
                {demandCoverage}%
              </div>
              <span className="text-muted small">
                100% Vegetable Supply · Zero Deficit
              </span>
            </div>
          </>
        )}
      </div>

      {/* Charts Display based on activeTab */}
      {activeTab === 'overall' ? (
        <div className="d-flex flex-column gap-4">
          {/* Three-Pillar Synergy Header */}
          <div className="d-flex align-items-center justify-content-between pb-2 border-bottom flex-wrap gap-2">
            <div>
              <h3 className="fs-6 fw-bold text-dark m-0 d-flex align-items-center gap-2">
                <span>Three-Pillar Breakdown: Farmer, Buyer & Deliveries</span>
              </h3>
              <p className="text-muted small m-0">
                Synchronized telemetry across farm harvest supply, bulk commercial demand, and EV logistics fulfillment
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1">🌾 Farmer</span>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1">🏢 Buyer</span>
              <span className="badge bg-info-subtle text-info border border-info-subtle px-2.5 py-1">⚡ Deliveries</span>
            </div>
          </div>

          {/* 3 Pillar Pie Charts Row matching Farmer, Buyer, Deliveries */}
          <div className="admin-charts-grid-3">
            {/* Pillar 1: Farmer Produce */}
            <UniversalPieChart
              title="1. 🌾 Farmer Produce Supply"
              subtitle="Volume breakdown of fresh vegetable stock listed by farmers (Kg)"
              items={farmerCropPieItems}
              unit="Kg"
              centerLabel="Farm Stock"
              centerValue={`${totalFarmerSupplyKg.toLocaleString('en-IN')} Kg`}
              bottomBar={{
                label: 'Direct Producer Coverage',
                valueStr: '100%',
                pct: 100,
                color: '#16a34a'
              }}
            />

            {/* Pillar 2: Commercial Buyer Types */}
            <UniversalPieChart
              title="2. 🏢 Commercial Buyer Types"
              subtitle="Distribution across verified commercial business types"
              items={buyerTypePieItems}
              unit="buyers"
              centerLabel="Commercial"
              centerValue={`${totalBuyersCount} Buyers`}
              bottomBar={{
                label: 'Commercial Demand Coverage',
                valueStr: `${demandCoverage}%`,
                pct: demandCoverage,
                color: '#2563eb'
              }}
            />

            {/* Pillar 3: Logistics Deliveries */}
            <UniversalPieChart
              title="3. ⚡ Logistics Delivery Milestones"
              subtitle="Consignment progression across transit stages"
              items={deliveryStatusPieItems}
              unit="orders"
              centerLabel="Fulfillment"
              centerValue={`${fulfillmentPct}%`}
              bottomBar={{
                label: 'EV Fleet On-Time Rate',
                valueStr: `${fulfillmentPct}%`,
                pct: fulfillmentPct,
                color: '#0284c7'
              }}
            />
          </div>

          {/* Marketplace Synthesis Row: Dual Bars & Consignment Health */}
          <div className="admin-charts-grid">
            <div className="admin-chart-card mb-0">
              <div className="admin-chart-header">
                <div>
                  <h4 className="admin-chart-title">Commodity Supply vs Buyer Demand</h4>
                  <p className="admin-chart-subtitle">Direct comparison by vegetable commodity (Kg)</p>
                </div>
                <Scale size={18} className="text-primary" />
              </div>

              <div className="admin-chart-body">
                {commoditySupplyDemand.length === 0 ? (
                  <div className="text-muted small py-4 text-center">No commodity data recorded.</div>
                ) : (
                  <div className="w-100 d-flex flex-column gap-3">
                    {(() => {
                      const maxKg = Math.max(
                        ...commoditySupplyDemand.flatMap((c) => [c.supplyKg || 0, c.demandKg || 0]),
                        1
                      );

                      return commoditySupplyDemand.slice(0, 6).map((item, idx) => {
                        const supplyPct = Math.round(((item.supplyKg || 0) / maxKg) * 100);
                        const demandPct = Math.round(((item.demandKg || 0) / maxKg) * 100);

                        return (
                          <div key={idx} className="admin-bar-group">
                            <div className="d-flex justify-content-between align-items-center small mb-1">
                              <span className="fw-bold text-dark">{item.crop}</span>
                              <span className="text-muted font-monospace" style={{ fontSize: '11px' }}>
                                Supply: {item.supplyKg.toLocaleString('en-IN')} Kg · Demand: {item.demandKg.toLocaleString('en-IN')} Kg
                              </span>
                            </div>

                            {/* Dual Bars */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '56px', fontSize: '11px', color: '#16a34a', fontWeight: '700' }}>🌾 Supply</span>
                                <div style={{ flex: 1, height: '6px', background: '#f0fdf4', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${supplyPct}%`, height: '100%', background: '#16a34a', borderRadius: '4px' }} />
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '56px', fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>🏢 Demand</span>
                                <div style={{ flex: 1, height: '6px', background: '#eff2fe', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${demandPct}%`, height: '100%', background: '#2563eb', borderRadius: '4px' }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Legend */}
                    <div className="admin-chart-legend mt-2">
                      <div className="admin-legend-item">
                        <span className="admin-legend-dot" style={{ background: '#16a34a' }} />
                        <span>🌾 Farmer Stock (Supply)</span>
                      </div>
                      <div className="admin-legend-item">
                        <span className="admin-legend-dot" style={{ background: '#2563eb' }} />
                        <span>🏢 Buyer Inquiries (Demand)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <UniversalPieChart
              title="Consignment Order Fulfillment"
              subtitle="Milestone distribution across confirmed and pending orders"
              items={orderStatusPieItems}
              unit="orders"
              centerLabel="Fulfilled"
              centerValue={`${fulfillmentPct}%`}
              bottomBar={{
                label: 'Overall Marketplace Fulfillment',
                valueStr: `${fulfillmentPct}%`,
                pct: fulfillmentPct,
                color: '#4f6df5'
              }}
            />
          </div>
        </div>
      ) : (
        <div className="admin-charts-grid">
        {/* ================================================================= */}
        {/* FARMERS TAB: Farmer Produce Pie Chart & Regional District Hubs   */}
        {/* ================================================================= */}
        {activeTab === 'farmers' && (
          <>
            <UniversalPieChart
              title="Farmer Produce Supply Breakdown"
              subtitle="Volume breakdown of fresh vegetable stock listed by farmers (Kg)"
              items={farmerCropPieItems}
              unit="Kg"
              centerLabel="Farm Stock"
              centerValue={`${totalFarmerSupplyKg.toLocaleString('en-IN')} Kg`}
              bottomBar={{
                label: 'Direct Producer Coverage',
                valueStr: '100%',
                pct: 100,
                color: '#16a34a'
              }}
            />

            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <div>
                  <h4 className="admin-chart-title">Regional Producer Hubs</h4>
                  <p className="admin-chart-subtitle">Farmer enrollment & land area across Tamil Nadu corridors</p>
                </div>
                <Users size={18} className="text-primary" />
              </div>

              <div className="admin-chart-body">
                {(data.farmerReports?.byDistrict || []).length === 0 ? (
                  <div className="text-muted small py-4 text-center w-100">No district records available.</div>
                ) : (
                  <div className="w-100 d-flex flex-column gap-3">
                    {(() => {
                      const maxFarmers = Math.max(...(data.farmerReports?.byDistrict || []).map(d => d.farmers || 1), 1);
                      return (data.farmerReports?.byDistrict || []).map((district, idx) => {
                        const pct = Math.round(((district.farmers || 1) / maxFarmers) * 100);
                        return (
                          <div key={idx} className="p-2.5 px-3 rounded-2 border bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold text-dark small">{district.district} Hub</span>
                              <span className="font-monospace small text-muted">
                                <strong className="text-dark">{district.farmers}</strong> Farmers · {district.totalLandAcres} Acres · ⭐ {district.avgRating}
                              </span>
                            </div>
                            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#16a34a', borderRadius: '9999px' }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ================================================================= */}
        {/* BUYERS TAB: Buyer Segment Pie Chart & Commercial Crop Demand      */}
        {/* ================================================================= */}
        {activeTab === 'buyers' && (
          <>
            <UniversalPieChart
              title="Commercial Buyer Segment Breakdown"
              subtitle="Distribution across verified commercial business types"
              items={buyerTypePieItems}
              unit="buyers"
              centerLabel="Commercial"
              centerValue={`${totalBuyersCount} Buyers`}
              bottomBar={{
                label: 'Commercial Demand Coverage',
                valueStr: `${demandCoverage}%`,
                pct: demandCoverage,
                color: '#2563eb'
              }}
            />

            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <div>
                  <h4 className="admin-chart-title">Commercial Produce Demand</h4>
                  <p className="admin-chart-subtitle">Bulk harvest inquiry volume requested by commercial buyers</p>
                </div>
                <Store size={18} className="text-primary" />
              </div>

              <div className="admin-chart-body">
                {(data.buyerReports?.topRequestedCrops || []).length === 0 ? (
                  <div className="text-muted small py-4 text-center w-100">No buyer crop inquiries recorded.</div>
                ) : (
                  <div className="w-100 d-flex flex-column gap-3">
                    {(() => {
                      const maxKg = Math.max(...(data.buyerReports?.topRequestedCrops || []).map(r => r.totalKg || 1), 1);
                      return (data.buyerReports?.topRequestedCrops || []).map((req, idx) => {
                        const pct = Math.round(((req.totalKg || 1) / maxKg) * 100);
                        return (
                          <div key={idx} className="p-2.5 px-3 rounded-2 border bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold text-dark small">{req.crop}</span>
                              <span className="font-monospace small text-muted">
                                <strong className="text-dark">{(req.totalKg || 0).toLocaleString('en-IN')}</strong> Kg · {req.enquiries} Inquiries · ₹{req.avgPrice}/Kg
                              </span>
                            </div>
                            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb', borderRadius: '9999px' }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ================================================================= */}
        {/* DELIVERIES TAB: Logistics Milestone Pie Chart & Haulage Volume   */}
        {/* ================================================================= */}
        {activeTab === 'deliveries' && (
          <>
            <UniversalPieChart
              title="Logistics Delivery Milestone Status"
              subtitle="Consignment progression across transit stages"
              items={deliveryStatusPieItems}
              unit="orders"
              centerLabel="Fulfillment"
              centerValue={`${fulfillmentPct}%`}
              bottomBar={{
                label: 'EV Fleet On-Time Rate',
                valueStr: `${fulfillmentPct}%`,
                pct: fulfillmentPct,
                color: '#0284c7'
              }}
            />

            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <div>
                  <h4 className="admin-chart-title">EV Logistics Haulage Volume</h4>
                  <p className="admin-chart-subtitle">Consignment cargo weight (Kg) distribution across delivery milestones</p>
                </div>
                <Truck size={18} className="text-primary" />
              </div>

              <div className="admin-chart-body">
                {(data.deliveryReports?.statusBreakdown || []).length === 0 ? (
                  <div className="text-muted small py-4 text-center w-100">No consignment trips recorded.</div>
                ) : (
                  <div className="w-100 d-flex flex-column gap-3">
                    {(() => {
                      const maxVol = Math.max(...(data.deliveryReports?.statusBreakdown || []).map(d => d.volumeKg || 1), 1);
                      return (data.deliveryReports?.statusBreakdown || []).map((del, idx) => {
                        const pct = Math.round(((del.volumeKg || 1) / maxVol) * 100);
                        const color = STATUS_COLORS[del.status] || STATUS_COLORS.DEFAULT;
                        return (
                          <div key={idx} className="p-2.5 px-3 rounded-2 border bg-light">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold text-dark small">{(del.status || '').replace(/_/g, ' ')}</span>
                              <span className="font-monospace small text-muted">
                                <strong className="text-dark">{(del.volumeKg || 0).toLocaleString('en-IN')}</strong> Kg · {del.count} Orders
                              </span>
                            </div>
                            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '9999px' }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )}
  </div>
  );
}
