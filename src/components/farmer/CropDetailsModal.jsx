// What this file does: Detailed view modal for a Farmer's produce listing.
// Displays agricultural attributes, quality grading, location, and buyer marketplace visibility.

import React from 'react';
import {
  X,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import Badge from '../Badge';
import { resolveCropFallbackImage } from '../../services/cropService';

export default function CropDetailsModal({ crop, onClose, lang }) {
  if (!crop) return null;

  return (
    <Modal isOpen={Boolean(crop)} onClose={onClose} size="lg" hideHeader centered>
      <div style={{ padding: '24px 20px 20px', position: 'relative' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'transparent',
            border: 'none',
            color: 'var(--buyer-text-dim, #667085)',
            cursor: 'pointer'
          }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <img
            src={crop.image || (crop.images && crop.images[0]) || resolveCropFallbackImage(crop.name)}
            alt={crop.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = resolveCropFallbackImage(crop.name);
            }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 'var(--buyer-radius-lg, 12px)',
              objectFit: 'cover',
              border: '1px solid var(--buyer-border-light, #e3e3dd)'
            }}
          />
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span className={`status-pill ${crop.status === 'active' || !crop.status ? 'success' : crop.status === 'removed' ? 'danger' : 'info'}`}>
                {crop.status?.toUpperCase() || 'ACTIVE'}
              </span>
              <Badge variant="brand" icon={<Sparkles size={12} />}>
                {crop.grade || 'Grade A'}
              </Badge>
            </div>
            <h3 style={{ margin: '0 0 2px', fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--buyer-font)' }}>
              {crop.name}
            </h3>
            {crop.tamilName && (
              <span style={{ fontSize: '0.85rem', color: 'var(--buyer-primary, #2F6B3A)', fontWeight: 600 }}>
                {crop.tamilName}
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            backgroundColor: 'var(--buyer-bg-card, #f8fafc)',
            padding: 16,
            borderRadius: 'var(--buyer-radius-lg, 12px)',
            border: '1px solid var(--buyer-border-light, #e3e3dd)',
            marginBottom: 20
          }}
        >
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'வகை / வகைப்பாடு' : 'Category / Variety'}
            </span>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
              {crop.category?.toUpperCase()} • {crop.variety || 'Standard'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'விவசாய முறை' : 'Farming Method'}
            </span>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--buyer-primary, #2F6B3A)' }}>
              🌱 {crop.farmingMethod || 'Natural'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'கிடைக்கும் அளவு' : 'Available Stock'}
            </span>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'JetBrains Mono, monospace' }}>
              {crop.availableKg || crop.quantityKg} {crop.unit || 'Kg'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'எதிர்பார்க்கும் விலை' : 'Expected Wholesale Price'}
            </span>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--buyer-text-main, #1f2933)', fontFamily: 'JetBrains Mono, monospace' }}>
              ₹{crop.pricePerKg} / {crop.unit || 'Kg'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'தயாராகும் தேதி' : 'Available Pickup Date'}
            </span>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} className="text-muted" />
              {crop.pickupDate || 'Available Now'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--buyer-text-dim, #667085)', fontWeight: 600 }}>
              {lang === 'ta' ? 'விசாரணைகள் எண்ணிக்கை' : 'Buyer Enquiries'}
            </span>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
              {crop.enquiryCount || 0} {lang === 'ta' ? 'விசாரணைகள்' : 'Enquiries'}
            </div>
          </div>
        </div>

        {/* Farm Location Info */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--buyer-text-main, #1f2933)', textTransform: 'uppercase', marginBottom: 6 }}>
            {lang === 'ta' ? 'பண்ணை இருப்பிடம் & தொடர்பு' : 'Farm Location & Hub Corridor'}
          </h4>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--buyer-text-dim, #667085)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={15} className="text-success" />
            {crop.farmLocation?.address || 'SF No. 142/2, Kinathukadavu Main Road'}, {crop.farmLocation?.village || 'Pollachi'}, {crop.farmLocation?.district || 'Coimbatore'} - {crop.farmLocation?.pincode || '642001'}
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--buyer-border-light, #e3e3dd)', paddingTop: 14 }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            <span>{lang === 'ta' ? 'மூடு' : 'Close'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
