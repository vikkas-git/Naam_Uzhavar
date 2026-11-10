// What this file does: Reusable card component displaying crop listing details, pricing, farmer info, and action buttons.

import React from 'react';
import { MapPin } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import Card from './Card';

/**
 * Reusable Crop Card Component
 * Strict responsive card: 3-4 on desktop, 2 on tablet, 1 on mobile
 */
export default function CropCard({ crop, _lang, t, onAccept }) {
  return (
    <Card className="buyer-crop-card" padding="none">
      {/* Crop Image with grade badge */}
      <div className="buyer-crop-img-wrap">
        <img
          src={crop?.image || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'}
          alt={crop?.name || 'Crop'}
          className="buyer-crop-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80';
          }}
        />
        {crop?.grade && (
          <Badge
            grade={crop.grade}
            className={`buyer-crop-grade-tag ${crop.grade === 'Grade A' ? 'grade-a' : crop.grade === 'Grade B' ? 'grade-b' : 'grade-c'}`}
          />
        )}
      </div>

      {/* Card Content */}
      <div className="buyer-crop-card-body">
        {/* Title & Hub Row */}
        <div className="buyer-crop-title-group">
          <h3 className="buyer-crop-name">{crop?.name}</h3>
          <span className="buyer-crop-tamil-name">{crop?.tamilName}</span>
        </div>

        {/* Price with strong visual hierarchy */}
        <div className="buyer-crop-price-box">
          <span className="buyer-price-currency">₹</span>
          <span className="buyer-price-number">{crop?.pricePerKg ?? 0}</span>
          <span className="buyer-price-unit">{typeof t === 'function' ? t('crops.perKg') : (t?.perKg || '/ kg')}</span>
        </div>

        {/* Quantity & Location details */}
        <div className="buyer-crop-meta-rows">
          <div className="buyer-meta-item">
            <span className="meta-label">
              {typeof t === 'function' ? t('crops.available') : (t?.available || 'Available:')}
            </span>
            <span className="meta-value font-semibold">
              {crop?.availableKg ?? 0} kg
            </span>
          </div>
          <div className="buyer-meta-item">
            <span className="meta-label">
              {typeof t === 'function' ? (t('crops.location') || t('crops.hub')) : (t?.location || t?.hub || 'Location:')}
            </span>
            <span className="meta-value hub-name location-name">
              <MapPin size={13} className="location-pin-icon" />
              <span>{crop?.location || crop?.hubName || 'Dindigul Central'}</span>
            </span>
          </div>
        </div>

        {/* Action Button: Accept */}
        <div className="buyer-crop-card-actions">
          <Button
            type="button"
            variant="primary"
            className="buyer-btn-accept"
            onClick={onAccept}
          >
            {typeof t === 'function' ? t('crops.btnAccept') : (t?.btnAccept || 'Accept')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
