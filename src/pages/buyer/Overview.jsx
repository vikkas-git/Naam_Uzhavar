// What this file does: Buyer dashboard overview page showing KPI metrics, recent orders, and daily featured produce.

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Clock,
  ArrowRight,
  Calendar
} from 'lucide-react';
import './Overview.css';
import { ROUTES } from '../../routes';
import SectionHeader from '../../components/SectionHeader';
import Skeleton from '../../components/Skeleton';
import { useBuyer, deduplicateBuyerCrops } from '../../context/BuyerContext';
import CropCard from '../../components/CropCard';
import { DashboardSkeleton } from '../../components/Skeleton';
import FarmerApprovalStatusBar from '../../components/FarmerApprovalStatusBar';

export default function Overview() {
  const navigate = useNavigate();
  const {
    isDataLoading,
    profile,
    crops,
    orders,
    declinedCropIds,
    setSelectedTrackingOrderId,
    t,
    lang,
    handleOpenAccept
  } = useBuyer();

  // Dynamically calculate active in-transit / active orders
  const activeTransitOrders = useMemo(() => {
    return (orders || []).filter(
      (o) => {
        if (o?.orderStatus === 'REJECTED' || o?.orderStatus === 'PENDING_FARMER_APPROVAL') return false;
        const s = o?.deliveryStatus || o?.status;
        return s === 'READY_FOR_PICKUP' || s === 'PICKED_UP' || s === 'IN_TRANSIT' || s === 'in_transit' || s === 'confirmed' || s === 'preparing';
      }
    );
  }, [orders]);

  const inTransitCount = activeTransitOrders.length;
  const activeSpotlightOrder = activeTransitOrders[0] || (orders || [])[0];

  // Overview Fresh Arrivals: Showcase fresh lots (excluding declined ones), independent of marketplace search
  const freshArrivals = useMemo(() => {
    return deduplicateBuyerCrops(crops || [])
      .filter((crop) => crop && !declinedCropIds?.includes(crop.id))
      .slice(0, 3);
  }, [crops, declinedCropIds]);

  const handleTrackSpotlightOrder = () => {
    if (setSelectedTrackingOrderId && activeSpotlightOrder?.orderId) {
      setSelectedTrackingOrderId(activeSpotlightOrder.orderId);
    }
    navigate(ROUTES.BUYER_DASHBOARD_TRACK);
  };

  if (isDataLoading && (!orders || orders.length === 0)) {
    return <DashboardSkeleton role="buyer" />;
  }

  return (
    <div className="buyer-view-container animate-fade-in">
      <SectionHeader
        className="buyer-view-header"
        title={
          <span>
            {t('goodMorning')}{' '}
            <span className="buyer-highlight-name">
              {profile?.shopName || profile?.contactPerson || profile?.name || 'Buyer'}
            </span>
          </span>
        }
        subtitle={t('hubTagline')}
        action={
          <div className="buyer-header-date-tag">
            <Calendar size={15} />
            <span>{t('activeHubsTag')}</span>
          </div>
        }
      />

      {/* Summary Metric Cards (Crops Today, Active Orders, In Transit) */}
      <div className="buyer-summary-row">
        <div
          className="buyer-summary-card"
          onClick={() => navigate(ROUTES.BUYER_DASHBOARD_CROPS)}
        >
          <div className="buyer-summary-number-wrap">
            <span className="buyer-summary-number">{(crops || []).length}</span>
            <span className="buyer-summary-trend">
              <Sprout size={14} /> {t('overview.fresh')}
            </span>
          </div>
          <span className="buyer-summary-label">{t('overview.statCrops')}</span>
          <span className="buyer-summary-hint">{t('overview.cropsHint')}</span>
        </div>

        <div
          className="buyer-summary-card"
          onClick={() => navigate(ROUTES.BUYER_DASHBOARD_ORDERS)}
        >
          <div className="buyer-summary-number-wrap">
            <span className="buyer-summary-number">{(orders || []).length}</span>
            <span className="buyer-summary-trend neutral">
              <Clock size={14} /> {t('overview.active')}
            </span>
          </div>
          <span className="buyer-summary-label">{t('overview.statOrders')}</span>
          <span className="buyer-summary-hint">{t('overview.ordersHint')}</span>
        </div>

        <div
          className="buyer-summary-card active-transit"
          onClick={handleTrackSpotlightOrder}
        >
          <div className="buyer-summary-number-wrap">
            <span className="buyer-summary-number">{inTransitCount}</span>
            <span className="buyer-summary-trend green">
              <span className="pulse-indicator" /> {t('overview.onRoute')}
            </span>
          </div>
          <span className="buyer-summary-label">{t('overview.statTransit')}</span>
          <span className="buyer-summary-hint">{t('overview.transitHint')}</span>
        </div>
      </div>

      {/* Farmer Approval Status Bar & Assigned Driver Pickup Info */}
      <FarmerApprovalStatusBar />

      {/* Quick Fresh Arrivals Section */}
      <div className="buyer-section-block">
        <div className="buyer-section-header">
          <div>
            <h2 className="buyer-section-heading">
              {t('overview.freshArrivalsTitle')}
            </h2>
            <p className="buyer-section-sub">
              {t('overview.freshArrivalsSub')}
            </p>
          </div>
          <button
            type="button"
            className="buyer-link-btn"
            onClick={() => navigate(ROUTES.BUYER_DASHBOARD_CROPS)}
          >
            <span>{t('overview.viewAllCrops')}</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* 3 Featured Cards */}
        <div className="buyer-crop-grid featured-row">
          {freshArrivals && freshArrivals.length > 0 ? (
            freshArrivals.map((crop) => (
              <CropCard
                key={crop.id}
                crop={crop}
                lang={lang}
                t={t}
                onAccept={() => handleOpenAccept(crop)}
              />
            ))
          ) : (
            <>
              <Skeleton variant="card" height={260} />
              <Skeleton variant="card" height={260} />
              <Skeleton variant="card" height={260} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
