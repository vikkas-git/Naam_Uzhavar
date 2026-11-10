// What this file does: High-End Shimmer Skeleton System for all Buyer & Farmer module pages.
// Eliminates layout shift (CLS) and delivers instantaneous perceived performance across transitions.

import React from 'react';
import { useLocation } from 'react-router-dom';
import './Skeleton.css';

/**
 * 1. Primitive Skeleton Atom
 * Flexible building block preserving exact props API.
 */
export default function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
  style = {},
  circle = false,
  ...rest
}) {
  const isCircular = circle || variant === 'circular' || variant === 'avatar';
  const isCard = variant === 'card';

  const defaultHeight = isCard ? (height || 260) : (height || (isCircular ? 48 : 20));
  const defaultWidth = isCircular ? (width || 48) : width;

  const inlineStyles = {
    ...(defaultWidth ? { width: defaultWidth } : { width: '100%' }),
    height: defaultHeight,
    ...style,
  };

  const itemClass = [
    'nu-skeleton-item',
    isCircular ? 'nu-skeleton-circle' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (count > 1) {
    return (
      <div className="d-flex flex-column gap-2 w-100" aria-busy="true" aria-live="polite">
        {Array.from({ length: count }).map((_, idx) => (
          <span
            key={idx}
            className={itemClass}
            style={inlineStyles}
            aria-hidden="true"
            {...rest}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      className={itemClass}
      style={inlineStyles}
      aria-hidden="true"
      aria-busy="true"
      {...rest}
    />
  );
}

/**
 * 2. Section Header Skeleton
 */
export function HeaderSkeleton({ hasAction = true }) {
  return (
    <div className="nu-skeleton-header-wrap nu-skeleton-fade-in" aria-hidden="true">
      <div className="nu-skeleton-header-titles">
        <Skeleton width="45%" height={30} style={{ borderRadius: 6 }} />
        <Skeleton width="75%" height={16} style={{ borderRadius: 4 }} />
      </div>
      {hasAction && (
        <Skeleton width={140} height={40} style={{ borderRadius: 8 }} />
      )}
    </div>
  );
}

/**
 * 3. Metric Summary Cards Skeleton (3 or 4 cards row)
 */
export function MetricCardsSkeleton({ count = 3 }) {
  return (
    <div className="nu-skeleton-metrics-row nu-skeleton-fade-in" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="nu-skeleton-card-shell nu-skeleton-metric-card">
          <div className="nu-skeleton-metric-top">
            <Skeleton width="45%" height={32} style={{ borderRadius: 6 }} />
            <Skeleton width={75} height={22} style={{ borderRadius: 9999 }} />
          </div>
          <Skeleton width="60%" height={15} style={{ borderRadius: 4 }} />
          <Skeleton width="85%" height={13} style={{ borderRadius: 4, marginTop: 4 }} />
        </div>
      ))}
    </div>
  );
}

/**
 * 4. Filter & Search Controls Bar Skeleton
 */
export function FilterBarSkeleton() {
  return (
    <div className="nu-skeleton-card-shell nu-skeleton-filter-bar nu-skeleton-fade-in" aria-hidden="true">
      <div className="nu-skeleton-filter-chips">
        <Skeleton width={70} height={34} style={{ borderRadius: 9999 }} />
        <Skeleton width={85} height={34} style={{ borderRadius: 9999 }} />
        <Skeleton width={90} height={34} style={{ borderRadius: 9999 }} />
        <Skeleton width={80} height={34} style={{ borderRadius: 9999 }} />
      </div>
      <div className="nu-skeleton-filter-actions">
        <Skeleton width={200} height={36} style={{ borderRadius: 8 }} />
        <Skeleton width={130} height={36} style={{ borderRadius: 8 }} />
        <Skeleton width={110} height={36} style={{ borderRadius: 8 }} />
      </div>
    </div>
  );
}

/**
 * 5. Universal Table Skeleton (Yield Management, Orders, Requests, Invoices)
 */
export function TableSkeleton({ rows = 5, columns = 6, hasFilterBar = true }) {
  return (
    <div className="nu-skeleton-fade-in" aria-hidden="true" style={{ width: '100%' }}>
      {hasFilterBar && <FilterBarSkeleton />}
      <div className="nu-skeleton-table-shell">
        {/* Table Header */}
        <div
          className="nu-skeleton-table-header"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, cIdx) => (
            <Skeleton key={cIdx} width="70%" height={14} style={{ borderRadius: 4 }} />
          ))}
        </div>
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="nu-skeleton-table-row"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {/* Col 1: Produce/Entity with thumbnail icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Skeleton width={40} height={40} style={{ borderRadius: 8, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                <Skeleton width="85%" height={14} style={{ borderRadius: 4 }} />
                <Skeleton width="55%" height={11} style={{ borderRadius: 4 }} />
              </div>
            </div>
            {/* Remaining Columns */}
            {Array.from({ length: columns - 2 }).map((_, cIdx) => (
              <Skeleton key={cIdx} width="65%" height={14} style={{ borderRadius: 4 }} />
            ))}
            {/* Last Column: Action Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Skeleton width={60} height={28} style={{ borderRadius: 6 }} />
              <Skeleton width={28} height={28} style={{ borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 6. Marketplace Crop Grid Skeleton (Buyer Crops / Produce Catalog)
 */
export function CropGridSkeleton({ count = 6 }) {
  return (
    <div className="nu-skeleton-fade-in" aria-hidden="true" style={{ width: '100%' }}>
      <FilterBarSkeleton />
      <div className="nu-skeleton-crop-grid">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="nu-skeleton-card-shell nu-skeleton-crop-card">
            <Skeleton height={180} className="nu-skeleton-crop-image" />
            <div className="nu-skeleton-crop-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width="55%" height={18} style={{ borderRadius: 4 }} />
                <Skeleton width={70} height={22} style={{ borderRadius: 9999 }} />
              </div>
              <Skeleton width="40%" height={13} style={{ borderRadius: 4 }} />
              <div style={{ borderTop: '1px solid rgba(227, 227, 221, 0.6)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '45%' }}>
                  <Skeleton width="90%" height={18} style={{ borderRadius: 4 }} />
                  <Skeleton width="60%" height={11} style={{ borderRadius: 4 }} />
                </div>
                <Skeleton width={90} height={34} style={{ borderRadius: 8 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 7. Live Order Tracking Skeleton (Buyer Track Page)
 */
export function TrackingSkeleton() {
  return (
    <div className="nu-skeleton-fade-in" aria-hidden="true" style={{ width: '100%' }}>
      <HeaderSkeleton hasAction={false} />
      <div className="nu-skeleton-card-shell" style={{ marginBottom: 24 }}>
        <div className="nu-skeleton-timeline-steps">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
              <Skeleton width={36} height={36} circle />
              <Skeleton width="60%" height={12} style={{ borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="nu-skeleton-track-grid">
        <div className="nu-skeleton-card-shell" style={{ height: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton width="40%" height={18} style={{ borderRadius: 4 }} />
          <Skeleton height={230} style={{ borderRadius: 8 }} />
        </div>
        <div className="nu-skeleton-card-shell" style={{ height: 320, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Skeleton width="50%" height={18} style={{ borderRadius: 4 }} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '8px 0' }}>
            <Skeleton width={52} height={52} circle />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <Skeleton width="70%" height={16} style={{ borderRadius: 4 }} />
              <Skeleton width="40%" height={12} style={{ borderRadius: 4 }} />
            </div>
          </div>
          <Skeleton width="100%" height={14} style={{ borderRadius: 4 }} />
          <Skeleton width="90%" height={14} style={{ borderRadius: 4 }} />
          <Skeleton width="80%" height={14} style={{ borderRadius: 4 }} />
          <Skeleton width="100%" height={38} style={{ borderRadius: 8, marginTop: 'auto' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * 8. Profile & Settings Skeleton (Farmer & Buyer Profile Pages)
 */
export function ProfileSkeleton() {
  return (
    <div className="nu-skeleton-fade-in" aria-hidden="true" style={{ width: '100%' }}>
      <HeaderSkeleton hasAction={false} />
      <div className="nu-skeleton-profile-grid">
        {/* Left Side: Avatar & Identity Card */}
        <div className="nu-skeleton-card-shell nu-skeleton-profile-sidebar">
          <Skeleton width={100} height={100} circle />
          <Skeleton width="70%" height={20} style={{ borderRadius: 6 }} />
          <Skeleton width="50%" height={14} style={{ borderRadius: 4 }} />
          <Skeleton width={110} height={24} style={{ borderRadius: 9999 }} />
          <div style={{ width: '100%', borderTop: '1px solid rgba(227, 227, 221, 0.6)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton width="85%" height={14} style={{ borderRadius: 4 }} />
            <Skeleton width="75%" height={14} style={{ borderRadius: 4 }} />
            <Skeleton width="80%" height={14} style={{ borderRadius: 4 }} />
          </div>
        </div>
        {/* Right Side: Form / Details Cards */}
        <div className="nu-skeleton-profile-main">
          <div className="nu-skeleton-card-shell" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton width="35%" height={18} style={{ borderRadius: 4 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Skeleton height={42} style={{ borderRadius: 8 }} />
              <Skeleton height={42} style={{ borderRadius: 8 }} />
              <Skeleton height={42} style={{ borderRadius: 8 }} />
              <Skeleton height={42} style={{ borderRadius: 8 }} />
            </div>
          </div>
          <div className="nu-skeleton-card-shell" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton width="40%" height={18} style={{ borderRadius: 4 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Skeleton height={42} style={{ borderRadius: 8 }} />
              <Skeleton height={42} style={{ borderRadius: 8 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 9. Dashboard Overview Skeleton (Farmer & Buyer Dashboard Landing)
 */
export function DashboardSkeleton({ role: _role = 'farmer' }) {
  return (
    <div className="nu-skeleton-fade-in" aria-hidden="true" style={{ width: '100%' }}>
      <HeaderSkeleton hasAction={true} />
      <MetricCardsSkeleton count={3} />
      {/* Activity / Spotlight Block */}
      <div className="nu-skeleton-card-shell" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="30%" height={18} style={{ borderRadius: 4 }} />
          <Skeleton width={80} height={14} style={{ borderRadius: 4 }} />
        </div>
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              backgroundColor: 'rgba(31, 41, 51, 0.02)',
              borderRadius: 8,
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <Skeleton width={38} height={38} style={{ borderRadius: 8, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: '70%' }}>
                <Skeleton width="60%" height={15} style={{ borderRadius: 4 }} />
                <Skeleton width="40%" height={12} style={{ borderRadius: 4 }} />
              </div>
            </div>
            <Skeleton width={80} height={26} style={{ borderRadius: 9999 }} />
            <Skeleton width={70} height={30} style={{ borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 10. Driver Trips Skeleton
 */
export function TripSkeleton({ count = 3 }) {
  return (
    <div className="nu-skeleton-fade-in" aria-hidden="true" style={{ width: '100%' }}>
      <HeaderSkeleton hasAction={true} />
      <FilterBarSkeleton />
      <div className="d-flex flex-column gap-3">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="nu-skeleton-card-shell" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Skeleton width={44} height={44} style={{ borderRadius: 8 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton width={140} height={16} style={{ borderRadius: 4 }} />
                  <Skeleton width={90} height={12} style={{ borderRadius: 4 }} />
                </div>
              </div>
              <Skeleton width={90} height={28} style={{ borderRadius: 9999 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
              <Skeleton height={20} style={{ borderRadius: 4 }} />
              <Skeleton height={20} style={{ borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 11. Driver Earnings Skeleton
 */
export function EarningsSkeleton() {
  return (
    <div className="nu-skeleton-fade-in" aria-hidden="true" style={{ width: '100%' }}>
      <HeaderSkeleton hasAction={true} />
      <MetricCardsSkeleton count={3} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="nu-skeleton-card-shell" style={{ height: 260 }}>
          <Skeleton width="50%" height={18} style={{ borderRadius: 4, marginBottom: 16 }} />
          <Skeleton width="80%" height={36} style={{ borderRadius: 6, marginBottom: 14 }} />
          <Skeleton width="100%" height={44} style={{ borderRadius: 8 }} />
        </div>
        <div className="nu-skeleton-card-shell" style={{ height: 260 }}>
          <Skeleton width="40%" height={18} style={{ borderRadius: 4, marginBottom: 16 }} />
          <Skeleton width="100%" height={160} style={{ borderRadius: 8 }} />
        </div>
      </div>
      <TableSkeleton rows={4} columns={5} hasFilterBar={false} />
    </div>
  );
}

/**
 * 12. Generic Card & Order Skeletons
 */
export function CardSkeleton({ height = 200, count = 1 }) {
  return (
    <div className="nu-skeleton-fade-in d-flex flex-column gap-3 w-100" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="nu-skeleton-card-shell" style={{ height }}>
          <Skeleton width="40%" height={20} style={{ borderRadius: 6, marginBottom: 12 }} />
          <Skeleton width="90%" height={14} style={{ borderRadius: 4, marginBottom: 8 }} />
          <Skeleton width="75%" height={14} style={{ borderRadius: 4, marginBottom: 16 }} />
          <Skeleton width="100%" height={Math.max(60, height - 110)} style={{ borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

export const OrderSkeleton = TableSkeleton;

/**
 * 13. Intelligent Universal Route Skeleton (ModulePageSkeleton)
 * Automatically detects the active page from window.location or pathname
 * and displays the perfect matching layout skeleton.
 */
export function ModulePageSkeleton({ mode }) {
  const location = useLocation();
  const path = (location?.pathname || '').toLowerCase();

  // If explicit mode provided, use it
  if (mode === 'dashboard') return <DashboardSkeleton />;
  if (mode === 'table') return <TableSkeleton rows={5} columns={6} />;
  if (mode === 'grid') return <CropGridSkeleton count={6} />;
  if (mode === 'track') return <TrackingSkeleton />;
  if (mode === 'profile') return <ProfileSkeleton />;
  if (mode === 'trip' || mode === 'trips') return <TripSkeleton />;
  if (mode === 'earnings') return <EarningsSkeleton />;
  if (mode === 'order' || mode === 'orders') return <TableSkeleton rows={5} columns={6} />;

  // Auto-detect based on route path
  if (path.includes('/crops') || path.includes('/marketplace')) {
    // If buyer marketplace -> grid, if farmer yield -> table
    if (path.includes('/buyer')) return <CropGridSkeleton count={6} />;
    return <TableSkeleton rows={5} columns={7} />;
  }

  if (path.includes('/orders') || path.includes('/invoices') || path.includes('/history')) {
    return <TableSkeleton rows={5} columns={6} />;
  }

  if (path.includes('/requests')) {
    return <TableSkeleton rows={5} columns={6} />;
  }

  if (path.includes('/track')) {
    return <TrackingSkeleton />;
  }

  if (path.includes('/profile')) {
    return <ProfileSkeleton />;
  }

  if (path.includes('/trips')) {
    return <TripSkeleton />;
  }

  if (path.includes('/earnings')) {
    return <EarningsSkeleton />;
  }

  // Default: Dashboard / Overview Skeleton
  return <DashboardSkeleton />;
}
