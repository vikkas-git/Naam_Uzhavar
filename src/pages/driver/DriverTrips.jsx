// What this file does: Driver Trip Manifest & Dispatch Schedule.
// Shows all assigned, active, and completed dispatches with 2-point visual route nodes and direct navigation actions.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from 'lucide-react';
import { useDriver } from '../../context/DriverContext';
import { ROUTES } from '../../routes';
import SectionHeader from '../../components/SectionHeader';
import Button from '../../components/Button';
import { TripSkeleton } from '../../components/Skeleton';
import { formatOrderStatus } from '../../utils/helpers';
import './DriverDashboard.css';

export default function DriverTrips() {
  const navigate = useNavigate();
  const { trips, activeTrip, selectActiveTrip, assignedHub, isDataLoading, lang } = useDriver();

  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'COMPLETED'

  if (isDataLoading && (!trips || trips.length === 0)) {
    return (
      <div className="buyer-view-container animate-fade-in">
        <TripSkeleton />
      </div>
    );
  }

  const filteredTrips = trips.filter((t) => {
    if (filter === 'ACTIVE') return t.status !== 'DELIVERED';
    if (filter === 'COMPLETED') return t.status === 'DELIVERED';
    return true;
  });

  const activeCount = trips.filter((t) => t.status !== 'DELIVERED').length;
  const completedCount = trips.filter((t) => t.status === 'DELIVERED').length;

  const handleOpenTrip = (tripId) => {
    selectActiveTrip(tripId);
    navigate(ROUTES.DRIVER_DASHBOARD);
  };

  return (
    <div className="buyer-view-container animate-fade-in">
      <SectionHeader
        className="buyer-view-header"
        title={
          <span>
            {lang === 'ta' ? 'என் பயணங்கள் & விநியோகங்கள்' : 'My Deliveries & Trips'}
          </span>
        }
        subtitle={
          lang === 'ta'
            ? `${assignedHub} • அனைத்து விநியோக பயண விவரங்கள்`
            : `${assignedHub} • All scheduled and completed delivery trips`
        }
        action={
          <div className="d-flex align-items-center gap-2">
            <Button
              type="button"
              variant={filter === 'ALL' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('ALL')}
            >
              <span>{lang === 'ta' ? 'அனைத்தும்' : 'All'} ({trips.length})</span>
            </Button>
            <Button
              type="button"
              variant={filter === 'ACTIVE' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('ACTIVE')}
            >
              <span>{lang === 'ta' ? 'செயலில்' : 'Active'} ({activeCount})</span>
            </Button>
            <Button
              type="button"
              variant={filter === 'COMPLETED' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('COMPLETED')}
            >
              <span>{lang === 'ta' ? 'முடிந்தது' : 'Delivered'} ({completedCount})</span>
            </Button>
          </div>
        }
      />

      {/* Trips Cards Grid */}
      <div className="driver-trips-grid">
        {filteredTrips.map((trip) => {
          const isCurrentActive = activeTrip && activeTrip.tripId === trip.tripId && trip.status !== 'DELIVERED';
          return (
            <div
              key={trip.tripId}
              className={`driver-trip-card ${isCurrentActive ? 'is-active' : ''}`}
            >
              <div className="driver-trip-card-top">
                <div className="d-flex align-items-center gap-3">
                  <span className="font-mono fw-bold" style={{ color: '#b45309', fontSize: '1rem' }}>
                    #{trip.tripId}
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                    Order #{trip.orderId}
                  </span>
                  {trip.priority === 'HIGH' && (
                    <span className="badge bg-danger-subtle text-danger fw-bold" style={{ fontSize: '0.72rem' }}>
                      HIGH PRIORITY
                    </span>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span
                    className="badge"
                    style={{
                      background:
                        trip.status === 'DELIVERED'
                          ? '#dcfce7'
                          : trip.status === 'IN_TRANSIT'
                          ? '#dbeafe'
                          : '#fef3c7',
                      color:
                        trip.status === 'DELIVERED'
                          ? '#15803d'
                          : trip.status === 'IN_TRANSIT'
                          ? '#1d4ed8'
                          : '#92400e',
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: '0.78rem'
                    }}
                  >
                    ● {formatOrderStatus(trip.status)}
                  </span>
                </div>
              </div>

              {/* Crop & Weight Info */}
              <div className="d-flex align-items-center gap-3 mb-3">
                <img
                  src={trip.cropImage}
                  alt={trip.cropName}
                  style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid #cbd5e1' }}
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&auto=format&fit=crop&q=80';
                  }}
                />
                <div>
                  <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem' }}>
                    {trip.cropName}
                  </h4>
                  <div className="d-flex align-items-center gap-2 text-muted small">
                    <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '0.74rem' }}>
                      📦 {trip.cratesCount || 8} Crates
                    </span>
                    <span>•</span>
                    <span className="fw-semibold text-dark">{trip.quantityKg} Kg Gross</span>
                    <span>•</span>
                    <span>Produce Value: ₹{trip.totalProduceValue?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* 2-Point Route Visualizer */}
              <div className="driver-trip-route-visual">
                <div className="driver-route-nodes-col">
                  <span className="driver-route-node-dot pickup" />
                  <span className="driver-route-connector-line" />
                  <span className="driver-route-node-dot dropoff" />
                </div>

                <div className="driver-route-texts-col">
                  {/* Origin */}
                  <div>
                    <div className="text-success text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                      🌾 {lang === 'ta' ? 'பண்ணை ஏற்றுமிடம் (Pickup)' : 'Farm Gate Origin'}
                    </div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                      {trip.pickup?.farmName}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                      {trip.pickup?.address}
                    </div>
                  </div>

                  {/* Destination */}
                  <div>
                    <div className="text-uppercase fw-bold" style={{ color: '#b45309', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                      🏢 {lang === 'ta' ? 'வாங்குபவர் இறக்குமிடம் (Drop-off)' : 'Buyer Receiving Dock'}
                    </div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                      {trip.dropoff?.buyerName}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                      {trip.dropoff?.address}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Haulage Pay & Action */}
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3 border-top">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">
                    {lang === 'ta' ? 'பயணக் கூலி:' : 'Trip Pay:'}
                  </span>
                  <span className="font-mono fw-bold text-success" style={{ fontSize: '1.15rem' }}>
                    ₹{trip.haulageEarnings?.totalEarnings || 744}
                  </span>
                  <span className="badge bg-success-subtle text-success small">
                    {trip.status === 'DELIVERED' ? '✓ Paid to Wallet' : 'Escrow Protected'}
                  </span>
                </div>

                <Button
                  type="button"
                  variant={isCurrentActive ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleOpenTrip(trip.tripId)}
                  style={isCurrentActive ? { backgroundColor: '#b45309', borderColor: '#b45309' } : undefined}
                >
                  <Navigation size={14} />
                  <span>
                    {isCurrentActive
                      ? (lang === 'ta' ? 'நேரலை வழிசெலுத்தல் ➔' : 'Open Navigation Cockpit ➔')
                      : (lang === 'ta' ? 'பயண விவரம் ➔' : 'View Trip Details ➔')}
                  </span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

