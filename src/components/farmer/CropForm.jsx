// What this file does: Beginner-friendly 2-step Produce Listing Form tailored from the Farmer's perspective.
// Replaced complex 4-step wizard with 2 intuitive steps:
// Step 1: Select Produce & Photo (1-tap popular Tamil Nadu crop presets + photo)
// Step 2: Quantity, Price & Farm Dispatch (Live income valuation + verified profile farm address auto-fill)
// Eliminates repetitive address re-typing, decimal GPS inputs, and redundant review screens.

import React, { useState, useRef, useMemo } from 'react';
import {
  Wheat,
  Camera,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MapPin,
  IndianRupee,
  Sparkles,
  Check,
  ShieldCheck,
  Plus
} from 'lucide-react';
import Button from '../Button';
import Card from '../Card';

// Staple commercial produce presets for Tamil Nadu agricultural hubs (Strictly 4 crops)
const POPULAR_CROPS = [
  {
    name: 'Country Tomato',
    nameTa: 'நாட்டு தக்காளி',
    category: 'vegetables',
    variety: 'Hybrid Table Grade',
    defaultPrice: 28,
    unit: 'Kg',
    icon: '🍅'
  },
  {
    name: 'Dindigul Red Onion',
    nameTa: 'சின்ன வெங்காயம்',
    category: 'vegetables',
    variety: 'Small Shallot (Chinna Vengayam)',
    defaultPrice: 55,
    unit: 'Kg',
    icon: '🧅'
  },
  {
    name: 'Batlagundu Potato',
    nameTa: 'உருளைக்கிழங்கு',
    category: 'tubers',
    variety: 'Kufri Jyoti Table',
    defaultPrice: 32,
    unit: 'Kg',
    icon: '🥔'
  },
  {
    name: 'Ooty Sweet Carrot',
    nameTa: 'ஊட்டி மலை கேரட்',
    category: 'vegetables',
    variety: 'Kuroda Table Sweet',
    defaultPrice: 42,
    unit: 'Kg',
    icon: '🥕'
  }
];

const CATEGORIES = [
  { value: 'vegetables', labelEn: 'Vegetables (காய்கறிகள்)', labelTa: 'காய்கறிகள்' },
  { value: 'fruits', labelEn: 'Fruits (பழங்கள்)', labelTa: 'பழங்கள்' },
  { value: 'tubers', labelEn: 'Tubers & Roots (கிழங்கு வகைகள்)', labelTa: 'கிழங்கு வகைகள்' },
  { value: 'greens', labelEn: 'Greens & Herbs (கீரை வகைகள்)', labelTa: 'கீரை வகைகள்' },
  { value: 'grains', labelEn: 'Grains & Millets (தானியங்கள்)', labelTa: 'தானியங்கள்' },
  { value: 'pulses', labelEn: 'Pulses & Spices (பருப்பு & மசாலா)', labelTa: 'பருப்பு & மசாலா' }
];

const UNITS = [
  { value: 'Kg', labelEn: 'Kilogram (Kg)', labelTa: 'கிலோ (Kg)' },
  { value: 'Quintal', labelEn: 'Quintal (100 Kg)', labelTa: 'குவின்டால் (100 Kg)' },
  { value: 'Ton', labelEn: 'Ton (1,000 Kg)', labelTa: 'டன் (1,000 Kg)' }
];

const getDateOffset = (days) => {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString().split('T')[0];
};

export default function CropForm({ defaultFarmLocation, onSubmitSuccess, onCancel, lang }) {
  // Step 1: Crop & Photo | Step 2: Quantity, Price & Farm Confirmation
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCustomAddress, setShowCustomAddress] = useState(false);
  const fileInputRef = useRef(null);

  // Form State initialized with sensible farmer defaults (No default image - farmer must upload)
  const [formData, setFormData] = useState(() => ({
    // Produce Details
    name: 'Country Tomato',
    nameTa: 'நாட்டு தக்காளி',
    category: 'vegetables',
    variety: 'Hybrid Table Grade',
    grade: 'Grade A',
    farmingMethod: 'Natural (இயற்கை விவசாயம்)',
    image: '',
    images: [],
    // Quantity & Pricing
    quantity: '500',
    unit: 'Kg',
    expectedPrice: '28',
    // Dispatch & Auto-filled Farm Details
    pickupDate: getDateOffset(1),
    farmAddress: defaultFarmLocation?.landAddress || 'SF No. 142/2, Kinathukadavu Main Road',
    village: defaultFarmLocation?.village || 'Pollachi',
    taluk: defaultFarmLocation?.taluk || 'Pollachi Taluk',
    district: defaultFarmLocation?.district || 'Coimbatore',
    pincode: defaultFarmLocation?.pincode || '642001',
    gps: defaultFarmLocation?.gpsCoordinates || '10.6588° N, 77.0094° E'
  }));

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // 1-Click Crop Preset Selector (Preserves real photo if already uploaded, never forces default stock photo)
  const handleSelectPreset = (crop) => {
    setFormData((prev) => ({
      ...prev,
      name: crop.name,
      nameTa: crop.nameTa,
      category: crop.category,
      variety: crop.variety,
      expectedPrice: String(crop.defaultPrice),
      unit: crop.unit
    }));
    setErrors((prev) => ({ ...prev, name: null }));
  };

  // Simple Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({
        ...prev,
        photo: lang === 'ta' ? 'சரியான படக் கோப்பைத் தேர்ந்தெடுக்கவும்.' : 'Please upload a valid image file.'
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        photo: lang === 'ta' ? 'கோப்பின் அளவு 5MB-க்கு குறைவாக இருக்க வேண்டும்.' : 'Image size must be less than 5MB.'
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target.result;
      setFormData((prev) => ({
        ...prev,
        image: dataUri,
        images: [dataUri]
      }));
      setErrors((prev) => ({ ...prev, photo: null }));
    };
    reader.readAsDataURL(file);
  };

  // Calculated Total Expected Income
  const estimatedTotalValue = useMemo(() => {
    const qty = Number(formData.quantity) || 0;
    const price = Number(formData.expectedPrice) || 0;
    let multiplier = 1;
    if (formData.unit === 'Ton') multiplier = 1000;
    else if (formData.unit === 'Quintal') multiplier = 100;
    return Math.round(qty * price * multiplier);
  }, [formData.quantity, formData.expectedPrice, formData.unit]);

  // Validation Logic
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = lang === 'ta' ? 'பயிர் பெயரை உள்ளிடவும்' : 'Produce Name is required';
      }
      if (!formData.image) {
        newErrors.photo = lang === 'ta' ? 'விளைச்சல் புகைப்படத்தை சேர்க்கவும் *' : 'Produce photo is required *';
      }
    } else if (step === 2) {
      const qty = Number(formData.quantity);
      if (!qty || qty <= 0) {
        newErrors.quantity = lang === 'ta' ? 'சரியான அளவை உள்ளிடவும் (> 0)' : 'Please enter available harvest quantity';
      }
      const price = Number(formData.expectedPrice);
      if (!price || price <= 0) {
        newErrors.expectedPrice = lang === 'ta' ? 'சரியான விலையை உள்ளிடவும் (> 0)' : 'Please enter expected wholesale price';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(1)) {
      setCurrentStep(2);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Quick Quantity Helper (+50, +100, +500)
  const handleQuickAddQty = (amount) => {
    const current = Number(formData.quantity) || 0;
    handleChange('quantity', String(Math.max(0, current + amount)));
  };

  // Quick Price Helper (+/- 2, +/- 5)
  const handleQuickNudgePrice = (delta) => {
    const current = Number(formData.expectedPrice) || 0;
    handleChange('expectedPrice', String(Math.max(1, current + delta)));
  };

  // Submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    if (!validateStep(1) || !validateStep(2)) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        nameTa: formData.nameTa.trim() || formData.name.trim(),
        category: formData.category,
        variety: formData.variety.trim() || 'Commercial Grade',
        grade: formData.grade || 'Grade A',
        farmingMethod: formData.farmingMethod,
        quantityKg: Number(formData.quantity),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        pricePerKg: Number(formData.expectedPrice),
        expectedPrice: Number(formData.expectedPrice),
        priceUnit: `per ${formData.unit}`,
        pickupDate: formData.pickupDate,
        images: formData.images,
        image: formData.image,
        farmAddress: formData.farmAddress,
        village: formData.village,
        taluk: formData.taluk,
        district: formData.district,
        pincode: formData.pincode,
        gps: formData.gps
      };

      const success = await onSubmitSuccess(payload);
      if (success) {
        setCurrentStep(1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatted verified address string
  const formattedFarmAddress = [
    defaultFarmLocation?.farmName,
    formData.farmAddress,
    formData.village,
    formData.district,
    formData.pincode ? `Pin: ${formData.pincode}` : ''
  ].filter(Boolean).join(', ');

  return (
    <div className="farmer-crop-form-container">
      {/* 2-Step Friendly Step Bar */}
      <div className="farmer-step-indicator" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <div className={`step-node ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-circle">
            {currentStep > 1 ? <Check size={15} /> : '1'}
          </div>
          <span className="step-label">
            {lang === 'ta' ? '1. பயிர் & புகைப்படம்' : '1. Select Produce'}
          </span>
        </div>

        <div className={`step-connector ${currentStep >= 2 ? 'active' : ''}`} />

        <div className={`step-node ${currentStep === 2 ? 'active' : ''}`}>
          <div className="step-circle">2</div>
          <span className="step-label">
            {lang === 'ta' ? '2. அளவு & விலை' : '2. Quantity & Price'}
          </span>
        </div>
      </div>

      <Card padding="lg" className="farmer-form-card" style={{ maxWidth: 740, margin: '0 auto', width: '100%' }}>
        {/* ==================================================================
            STEP 1: PRODUCE SELECTION & PHOTO
            ================================================================== */}
        {currentStep === 1 && (
          <div className="form-section-block animate-fade-in">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div>
                <h3 className="form-section-title">
                  <Wheat size={20} className="text-success" />
                  <span>{lang === 'ta' ? 'எந்த விளைச்சலை விற்க விரும்புகிறீர்கள்?' : 'What produce are you harvesting?'}</span>
                </h3>
              </div>
            </div>

            {/* 1-Tap Crop Preset Cards */}
            <div>
              <span className="form-label fw-bold small text-muted text-uppercase" style={{ fontSize: '0.74rem' }}>
                {lang === 'ta' ? 'பிரபலமான பயிர்கள் (1-தட்டலில் தேர்வு):' : 'Popular Crops (1-Tap Quick Select):'}
              </span>
              <div className="farmer-crop-presets-grid mt-1">
                {POPULAR_CROPS.map((crop) => {
                  const isSelected = formData.name.toLowerCase() === crop.name.toLowerCase();
                  return (
                    <button
                      key={crop.name}
                      type="button"
                      className={`farmer-preset-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectPreset(crop)}
                    >
                      <span className="farmer-preset-emoji">{crop.icon}</span>
                      <div className="farmer-preset-texts">
                        <span className="farmer-preset-name-ta">
                          {lang === 'ta' ? crop.nameTa : crop.name}
                        </span>
                        <span className="farmer-preset-name-en">
                          ₹{crop.defaultPrice}/{crop.unit}
                        </span>
                      </div>
                      {isSelected && (
                        <Check size={14} className="text-success ms-auto flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Produce Name Input & Category */}
            <div className="row g-3 pt-2">
              <div className="col-12 col-md-7">
                <label className="form-label fw-bold small">
                  {lang === 'ta' ? 'பயிர் பெயர் *' : 'Produce Name *'}
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  placeholder={lang === 'ta' ? 'எ.கா. நாட்டு தக்காளி, சின்ன வெங்காயம்' : 'e.g. Country Tomato, Small Onion'}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="col-12 col-md-5">
                <label className="form-label fw-bold small">
                  {lang === 'ta' ? 'பயிர் வகை' : 'Category'}
                </label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {lang === 'ta' ? c.labelTa : c.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Produce Photo: Mandatory Farmer Photo Upload (No default photo) */}
            <div className="pt-2">
              <label className="form-label fw-bold small">
                {lang === 'ta' ? 'விளைச்சல் புகைப்படம் *' : 'Produce Photo *'}
              </label>

              {!formData.image ? (
                /* Empty State: Large Friendly Tap-to-Upload Box */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    cursor: 'pointer',
                    padding: '24px 20px',
                    border: errors.photo
                      ? '2px dashed #dc2626'
                      : '2px dashed var(--buyer-primary, #2F6B3A)',
                    borderRadius: 12,
                    backgroundColor: errors.photo ? '#fef2f2' : 'var(--buyer-bg-card, #f8fafc)',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  className="farmer-photo-dropzone"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      backgroundColor: 'var(--buyer-accent-subtle, #eaf3ec)',
                      color: 'var(--buyer-primary, #2F6B3A)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px'
                    }}
                  >
                    <Camera size={26} />
                  </div>
                  <strong
                    style={{
                      fontSize: '0.96rem',
                      color: errors.photo ? '#dc2626' : 'var(--buyer-text-main, #1f2933)',
                      display: 'block',
                      marginBottom: 4
                    }}
                  >
                    {lang === 'ta'
                      ? 'விளைச்சல் புகைப்படத்தை சேர்க்க இங்கே தொடவும் *'
                      : 'Tap here to add / capture harvest photo *'}
                  </strong>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--buyer-text-dim, #667085)',
                      margin: 0
                    }}
                  >
                    {lang === 'ta'
                      ? 'கேமரா மூலம் படம் எடுக்கவும் அல்லது கேலரியில் இருந்து தேர்வு செய்யவும் (JPG, PNG - அதிகபட்சம் 5MB)'
                      : 'Take photo using camera or choose from gallery (JPG, PNG - Max 5MB)'}
                  </p>
                </div>
              ) : (
                /* Uploaded State: High-Resolution Farmer Photo Attached */
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '12px 16px',
                    backgroundColor: 'var(--buyer-bg-card, #f8fafc)',
                    borderRadius: 12,
                    border: '1px solid var(--buyer-border-light, #e3e3dd)'
                  }}
                >
                  <img
                    src={formData.image}
                    alt={formData.name}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      objectFit: 'cover',
                      border: '2px solid var(--buyer-primary, #2F6B3A)',
                      flexShrink: 0
                    }}
                  />

                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-1.5 text-success fw-bold small mb-1">
                      <CheckCircle2 size={16} />
                      <span>{lang === 'ta' ? 'விளைச்சல் புகைப்படம் சேர்க்கப்பட்டது' : 'Harvest Photo Attached'}</span>
                    </div>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>
                      {lang === 'ta'
                        ? 'உங்கள் விளைச்சல் புகைப்படம் வெற்றிகரமாக இணைக்கப்பட்டுள்ளது.'
                        : 'Your farm harvest photo has been successfully attached.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="buyer-btn-outline small flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={14} />
                    <span>{lang === 'ta' ? 'படம் மாற்ற' : 'Change Photo'}</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handlePhotoUpload}
              />
              {errors.photo && <div className="text-danger small mt-1">{errors.photo}</div>}
            </div>

            {/* Quality Grade Buttons */}
            <div className="pt-2">
              <label className="form-label fw-bold small">
                {lang === 'ta' ? 'விளைச்சல் தரம்' : 'Quality Grade'}
              </label>
              <div className="d-flex gap-2.5">
                <button
                  type="button"
                  className={`farmer-preset-btn flex-grow-1 ${formData.grade === 'Grade A' ? 'active' : ''}`}
                  onClick={() => handleChange('grade', 'Grade A')}
                >
                  <span className="fs-5">🌟</span>
                  <div>
                    <div className="fw-bold small">{lang === 'ta' ? 'தரம் A (முதல் தரம்)' : 'Grade A (Premium)'}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {lang === 'ta' ? 'ஹோட்டல் & நேரடி சமையலறை' : 'Hotels & Premium Kitchens'}
                    </div>
                  </div>
                  {formData.grade === 'Grade A' && <Check size={15} className="text-success ms-auto" />}
                </button>

                <button
                  type="button"
                  className={`farmer-preset-btn flex-grow-1 ${formData.grade === 'Grade B' ? 'active' : ''}`}
                  onClick={() => handleChange('grade', 'Grade B')}
                >
                  <span className="fs-5">✓</span>
                  <div>
                    <div className="fw-bold small">{lang === 'ta' ? 'தரம் B (சந்தை தரம்)' : 'Grade B (Standard)'}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      {lang === 'ta' ? 'மொத்த சந்தை & சில்லறை விற்பனை' : 'Retail Supermarkets & Wholesale'}
                    </div>
                  </div>
                  {formData.grade === 'Grade B' && <Check size={15} className="text-success ms-auto" />}
                </button>
              </div>
            </div>

            {/* Next Button Row */}
            <div className="farmer-form-btn-row mt-4">
              <Button type="button" variant="ghost" onClick={onCancel}>
                <span>{lang === 'ta' ? 'ரத்து செய்' : 'Cancel'}</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                rightIcon={<ArrowRight size={16} />}
                onClick={handleNext}
              >
                <span>{lang === 'ta' ? 'அடுத்த படி: அளவு & விலை' : 'Next: Quantity & Price'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* ==================================================================
            STEP 2: QUANTITY, PRICING & DISPATCH (Direct Final Step)
            ================================================================== */}
        {currentStep === 2 && (
          <div className="form-section-block animate-fade-in">
            <div>
              <h3 className="form-section-title">
                <IndianRupee size={20} className="text-success" />
                <span>{lang === 'ta' ? 'எவ்வளவு விளைச்சல் & என்ன விலை?' : 'Harvest Volume & Expected Price'}</span>
              </h3>
              <p className="form-section-sub">
                {lang === 'ta'
                  ? 'விற்பனைக்கு உள்ள அளவையும், உங்கள் விலையையும் உள்ளிடவும்.'
                  : 'Enter total quantity and fair farm-gate pricing. Buyers purchase directly.'}
              </p>
            </div>

            {/* Produce Header Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: 'var(--buyer-bg-card, #f8fafc)',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--buyer-border-light, #e3e3dd)'
              }}
            >
              {formData.image ? (
                <img
                  src={formData.image}
                  alt={formData.name}
                  style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1.5px solid var(--buyer-primary, #2F6B3A)' }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: 'var(--buyer-accent-subtle, #eaf3ec)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0
                  }}
                >
                  {POPULAR_CROPS.find((c) => c.name.toLowerCase() === formData.name.toLowerCase())?.icon || '🌾'}
                </div>
              )}
              <div className="flex-grow-1">
                <strong style={{ fontSize: '0.96rem', color: 'var(--buyer-text-main, #1f2933)' }}>{formData.name}</strong>
                <div className="text-muted small" style={{ fontSize: '0.76rem' }}>
                  {formData.grade} • {formData.category}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-success p-0 fw-semibold text-decoration-none"
                style={{ fontSize: '0.8rem' }}
                onClick={handleBack}
              >
                {lang === 'ta' ? 'பயிர் மாற்ற' : 'Change Crop'}
              </button>
            </div>

            <div className="row g-3 pt-1">
              {/* 1. Harvest Quantity */}
              <div className="col-12 col-md-6">
                <label className="form-label fw-bold small">
                  {lang === 'ta' ? 'கிடைக்கும் மொத்த அளவு *' : 'Available Harvest Quantity *'}
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    min="1"
                    className={`form-control font-mono ${errors.quantity ? 'is-invalid' : ''}`}
                    style={{ fontSize: '1.05rem', fontWeight: 700 }}
                    placeholder="500"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                  />
                  <select
                    className="form-select flex-grow-0"
                    style={{ width: 110, fontWeight: 600 }}
                    value={formData.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.value}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.quantity && <div className="text-danger small mt-1">{errors.quantity}</div>}

                {/* Quick Add Taps (+50, +100, +250, +500) */}
                <div className="farmer-quick-chips">
                  <span className="text-muted small me-1" style={{ fontSize: '0.7rem' }}>
                    {lang === 'ta' ? 'விரைவு சேர்க்கை:' : 'Quick Add:'}
                  </span>
                  {[50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="farmer-quick-chip-btn"
                      onClick={() => handleQuickAddQty(amt)}
                    >
                      +{amt} {formData.unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Expected Wholesale Price */}
              <div className="col-12 col-md-6">
                <label className="form-label fw-bold small">
                  {lang === 'ta' ? 'எதிர்பார்க்கும் விலை (ரூபாய்) *' : 'Expected Wholesale Price (₹) *'}
                </label>
                <div className="input-group">
                  <span className="input-group-text font-mono fw-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    className={`form-control font-mono ${errors.expectedPrice ? 'is-invalid' : ''}`}
                    style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--buyer-primary, #2F6B3A)' }}
                    placeholder="28"
                    value={formData.expectedPrice}
                    onChange={(e) => handleChange('expectedPrice', e.target.value)}
                  />
                  <span className="input-group-text small text-muted">
                    / {formData.unit}
                  </span>
                </div>
                {errors.expectedPrice && <div className="text-danger small mt-1">{errors.expectedPrice}</div>}

                {/* Quick Price Nudges */}
                <div className="farmer-quick-chips">
                  <span className="text-muted small me-1" style={{ fontSize: '0.7rem' }}>
                    {lang === 'ta' ? 'விலை சரிசெய்:' : 'Adjust:'}
                  </span>
                  <button type="button" className="farmer-quick-chip-btn" onClick={() => handleQuickNudgePrice(-2)}>
                    -₹2
                  </button>
                  <button type="button" className="farmer-quick-chip-btn" onClick={() => handleQuickNudgePrice(2)}>
                    +₹2
                  </button>
                  <button type="button" className="farmer-quick-chip-btn" onClick={() => handleQuickNudgePrice(5)}>
                    +₹5
                  </button>
                </div>
              </div>
            </div>

            {/* Live Gross Earnings Valuation Banner */}
            <div className="farmer-calculated-valuation-banner mt-2">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-1.5 fw-bold text-success" style={{ fontSize: '0.86rem' }}>
                    <Sparkles size={16} />
                    <span>{lang === 'ta' ? 'மதிப்பிடப்பட்ட மொத்த வருமானம்:' : 'Estimated Gross Harvest Value:'}</span>
                  </div>
                  <span className="text-muted small">
                    {formData.quantity} {formData.unit} × ₹{formData.expectedPrice} / {formData.unit}
                  </span>
                </div>

                <div className="farmer-valuation-big font-mono">
                  ₹{estimatedTotalValue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* 3. Ready Pickup Date */}
            <div className="pt-2">
              <label className="form-label fw-bold small">
                {lang === 'ta' ? 'விளைச்சல் எப்போது எடுத்துச் செல்ல தயார்? *' : 'When is produce ready for pickup? *'}
              </label>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button
                  type="button"
                  className={`farmer-quick-chip-btn ${formData.pickupDate === getDateOffset(0) ? 'active' : ''}`}
                  onClick={() => handleChange('pickupDate', getDateOffset(0))}
                >
                  {lang === 'ta' ? 'இன்று' : 'Today'}
                </button>
                <button
                  type="button"
                  className={`farmer-quick-chip-btn ${formData.pickupDate === getDateOffset(1) ? 'active' : ''}`}
                  onClick={() => handleChange('pickupDate', getDateOffset(1))}
                >
                  {lang === 'ta' ? 'நாளை' : 'Tomorrow'}
                </button>
                <button
                  type="button"
                  className={`farmer-quick-chip-btn ${formData.pickupDate === getDateOffset(3) ? 'active' : ''}`}
                  onClick={() => handleChange('pickupDate', getDateOffset(3))}
                >
                  {lang === 'ta' ? '3 நாட்களில்' : 'In 3 Days'}
                </button>
                <input
                  type="date"
                  className="form-control form-control-sm font-mono ms-auto"
                  style={{ width: 150 }}
                  value={formData.pickupDate}
                  onChange={(e) => handleChange('pickupDate', e.target.value)}
                />
              </div>
            </div>

            {/* 4. Verified Farm Dispatch Address (Auto-filled from Profile) */}
            <div className="pt-2">
              <div className="farmer-address-summary-box">
                <div className="d-flex align-items-start gap-2.5">
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: 'var(--buyer-accent-subtle, #eaf3ec)',
                      color: 'var(--buyer-primary, #2F6B3A)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <MapPin size={17} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-1.5">
                      <strong style={{ fontSize: '0.88rem' }}>
                        {lang === 'ta' ? 'சரக்கு ஏற்றுமதி பண்ணை இடம்' : 'Dispatch Farm Location'}
                      </strong>
                      <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.66rem' }}>
                        <ShieldCheck size={11} className="me-0.5" />
                        {lang === 'ta' ? 'சுயவிவர முகவரி' : 'Profile Farm'}
                      </span>
                    </div>
                    <div className="text-muted small mt-0.5" style={{ fontSize: '0.8rem' }}>
                      {formattedFarmAddress || 'SF No. 142/2, Kinathukadavu Main Road, Pollachi, Coimbatore - 642001'}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => setShowCustomAddress(!showCustomAddress)}
                  >
                    {showCustomAddress
                      ? (lang === 'ta' ? 'மூடு' : 'Done')
                      : (lang === 'ta' ? 'முகவரி திருத்து' : 'Edit')}
                  </button>
                </div>

                {/* Optional Custom Address Form if different plot */}
                {showCustomAddress && (
                  <div className="pt-3 mt-2 border-top border-light-subtle">
                    <label className="form-label small fw-bold mb-1">
                      {lang === 'ta' ? 'மாற்று ஏற்றுமதி முகவரி (தேவைப்பட்டால் மட்டும்):' : 'Custom Pickup Location (If different):'}
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Plot No 4, East Thottam, Pollachi"
                      value={formData.farmAddress}
                      onChange={(e) => handleChange('farmAddress', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Back + Submit & Post Produce */}
            <div className="farmer-form-btn-row mt-4">
              <Button
                type="button"
                variant="secondary"
                leftIcon={<ArrowLeft size={16} />}
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <span>{lang === 'ta' ? 'முந்தைய படி' : 'Previous'}</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                leftIcon={<CheckCircle2 size={16} />}
                onClick={handleSubmit}
                loading={isSubmitting}
                style={{ minWidth: 200, fontWeight: 700 }}
              >
                <span>{lang === 'ta' ? 'விளைச்சலைச் சந்தையில் சேர்க்க' : 'Post Harvest Produce ✓'}</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
