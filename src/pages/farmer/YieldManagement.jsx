// What this file does: Farmer Yield / Crop Management with 'Add Produce' multi-step form and 'My Active Listings' management.
// Enforces mandatory non-deletion rule, status toggle confirmation, and instant marketplace synchronization.

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wheat,
  Plus,
  ListFilter,
  Search,
  Eye,
  Trash2,
  Calendar,
  ChevronDown,
  X,
  RotateCcw
} from 'lucide-react';
import { useFarmer } from '../../context/FarmerContext';
import { ensureStapleCrops, resolveCropFallbackImage } from '../../services/cropService';
import CropForm from '../../components/farmer/CropForm';
import CropDetailsModal from '../../components/farmer/CropDetailsModal';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import SectionHeader from '../../components/SectionHeader';
import { TableSkeleton } from '../../components/Skeleton';
import './YieldManagement.css';

export default function YieldManagement() {
  const {
    isDataLoading,
    crops,
    profile,
    handleCreateCrop,
    handleToggleCropStatus,
    handleRemoveCrop,
    selectedCropDetails,
    setSelectedCropDetails,
    statusConfirmCrop,
    setStatusConfirmCrop,
    lang
  } = useFarmer();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'add' ? 'add' : 'listings';
  const setActiveTab = (tab) => {
    setSearchParams(tab === 'add' ? { tab: 'add' } : {}, { replace: true });
  };
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'pending' | 'paused' | 'sold_out'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Distinct non-repeating crop listings
  const uniqueCrops = useMemo(() => ensureStapleCrops(crops || []), [crops]);

  // Filtered & Sorted listings
  const filteredCrops = useMemo(() => {
    let result = [...uniqueCrops];

    // Status filter
    if (filterStatus === 'active') {
      result = result.filter((c) => (c.status === 'active' || !c.status) && c.status !== 'removed');
    } else if (filterStatus === 'sold_out') {
      result = result.filter((c) => c.status === 'sold_out');
    } else if (filterStatus === 'removed') {
      result = result.filter((c) => c.status === 'removed');
    } else {
      // 'all' shows all active and sold out produce, excluding removed
      result = result.filter((c) => c.status !== 'removed');
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((c) => String(c.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }

    // Keyword search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.tamilName && c.tamilName.toLowerCase().includes(q)) ||
          (c.variety && c.variety.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortBy === 'price_high') {
      result.sort((a, b) => (b.pricePerKg || 0) - (a.pricePerKg || 0));
    } else if (sortBy === 'price_low') {
      result.sort((a, b) => (a.pricePerKg || 0) - (b.pricePerKg || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return result;
  }, [uniqueCrops, filterStatus, categoryFilter, searchQuery, sortBy]);

  const handleFormSuccess = async (payload) => {
    const success = await handleCreateCrop(payload);
    if (success) {
      setActiveTab('listings');
    }
    return success;
  };

  return (
    <div className="buyer-view-container animate-fade-in">
      {/* 0. VIEW HEADER WITH PRIMARY TABS */}
      <SectionHeader
        className="buyer-view-header"
        title={lang === 'ta' ? 'விளைச்சல் / பயிர் மேலாண்மை' : 'Yield & Crop Management'}
        subtitle={
          lang === 'ta'
            ? 'உங்கள் பண்ணை விளைச்சலை பட்டியலிட்டு, வணிக வாங்குபவர்களுக்கு நேரடியாக வழங்கவும்.'
            : 'Direct harvest consignment listings, live buyer availability, and inventory controls.'
        }
        action={
          <Button
            type="button"
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setActiveTab('add')}
          >
            <span>{lang === 'ta' ? 'புதிய விளைச்சல் சேர்க்க' : 'Add Produce'}</span>
          </Button>
        }
      />

      {/* ====================================================================
          TAB 1: ADD PRODUCE (Three-Section Multi-Step Form)
          ==================================================================== */}
      {activeTab === 'add' ? (
        <CropForm
          defaultFarmLocation={profile?.farmDetails}
          onSubmitSuccess={handleFormSuccess}
          onCancel={() => setActiveTab('listings')}
          lang={lang}
        />
      ) : (
        /* ====================================================================
            TAB 2: MY ACTIVE LISTINGS
            ==================================================================== */
        <div className="farmer-listings-block">
          {/* Controls: Filter Chips, Search, Category Filter, Sort */}
          <div className="farmer-listings-controls">
            <div className="farmer-filter-chips">
              <button
                type="button"
                className={`farmer-filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                <span>{lang === 'ta' ? 'அனைத்தும்' : 'All'}</span>
                <span className="farmer-chip-count">({(uniqueCrops || []).filter((c) => c.status !== 'removed').length})</span>
              </button>
              <button
                type="button"
                className={`farmer-filter-chip ${filterStatus === 'active' ? 'active' : ''}`}
                onClick={() => setFilterStatus('active')}
              >
                <span>{lang === 'ta' ? 'செயலில் உள்ளவை' : 'Active'}</span>
                <span className="farmer-chip-count">({(uniqueCrops || []).filter((c) => (c.status === 'active' || !c.status) && c.status !== 'removed').length})</span>
              </button>
              <button
                type="button"
                className={`farmer-filter-chip ${filterStatus === 'sold_out' ? 'active' : ''}`}
                onClick={() => setFilterStatus('sold_out')}
              >
                <span>{lang === 'ta' ? 'விற்றுத் தீர்ந்தவை' : 'Sold Out'}</span>
                <span className="farmer-chip-count">({(uniqueCrops || []).filter((c) => c.status === 'sold_out').length})</span>
              </button>
              <button
                type="button"
                className={`farmer-filter-chip ${filterStatus === 'removed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('removed')}
              >
                <span>{lang === 'ta' ? 'அகற்றப்பட்டவை' : 'Removed'}</span>
                <span className="farmer-chip-count">({(uniqueCrops || []).filter((c) => c.status === 'removed').length})</span>
              </button>
            </div>

            <div className="farmer-search-sort-wrap">
              <div className="farmer-search-box">
                <Search size={15} className="farmer-search-icon" />
                <input
                  type="text"
                  className="farmer-search-input"
                  placeholder={lang === 'ta' ? 'பயிர் தேடுக...' : 'Search crop...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="farmer-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="farmer-select-group">
                <div className="buyer-select-wrapper">
                  <select
                    className="buyer-select-input"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label={lang === 'ta' ? 'வகை வடிகட்டி' : 'Category filter'}
                  >
                    <option value="all">{lang === 'ta' ? 'அனைத்து வகை' : 'All Categories'}</option>
                    <option value="vegetables">{lang === 'ta' ? 'காய்கறிகள்' : 'Vegetables'}</option>
                    <option value="fruits">{lang === 'ta' ? 'பழங்கள்' : 'Fruits'}</option>
                    <option value="tubers">{lang === 'ta' ? 'கிழங்கு வகைகள்' : 'Tubers & Roots'}</option>
                    <option value="greens">{lang === 'ta' ? 'கீரை வகைகள்' : 'Greens & Herbs'}</option>
                    <option value="grains">{lang === 'ta' ? 'தானியங்கள்' : 'Grains & Millets'}</option>
                    <option value="pulses">{lang === 'ta' ? 'பருப்பு & மசாலா' : 'Pulses & Spices'}</option>
                  </select>
                  <ChevronDown size={14} className="buyer-select-arrow" />
                </div>

                <div className="buyer-select-wrapper">
                  <select
                    className="buyer-select-input"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label={lang === 'ta' ? 'வரிசைப்படுத்து' : 'Sort by'}
                  >
                    <option value="newest">{lang === 'ta' ? 'புதியவை' : 'Newest'}</option>
                    <option value="oldest">{lang === 'ta' ? 'பழையவை' : 'Oldest'}</option>
                    <option value="price_high">{lang === 'ta' ? 'அதிக விலை' : 'Price: High'}</option>
                    <option value="price_low">{lang === 'ta' ? 'குறைந்த விலை' : 'Price: Low'}</option>
                  </select>
                  <ChevronDown size={14} className="buyer-select-arrow" />
                </div>
              </div>
            </div>
          </div>

          {/* Table or Skeleton or EmptyState */}
          {isDataLoading && (!crops || crops.length === 0) ? (
            <div className="mt-3">
              <TableSkeleton rows={4} columns={7} hasFilterBar={false} />
            </div>
          ) : filteredCrops.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={<Wheat size={32} />}
                title={lang === 'ta' ? 'பொருத்தமான பயிர்கள் ஏதும் காணப்படவில்லை' : 'No crop listings found'}
                description={
                  lang === 'ta'
                    ? 'தேடல் சொல் அல்லது வடிகட்டிகளை மாற்றி மீண்டும் முயற்சிக்கவும்.'
                    : 'Try resetting your category or search filter to see all active farm produce.'
                }
                action={
                  <Button
                    type="button"
                    variant="secondary"
                    leftIcon={<RotateCcw size={15} />}
                    onClick={() => {
                      setFilterStatus('all');
                      setCategoryFilter('all');
                      setSearchQuery('');
                    }}
                  >
                    <span>{lang === 'ta' ? 'வடிகட்டிகளை மீட்டமை' : 'Reset Filters'}</span>
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= 992px) */}
              <div className="farmer-table-responsive mt-3">
                <table className="farmer-table">
                  <thead>
                    <tr>
                      <th style={{ width: '28%' }}>{lang === 'ta' ? 'விளைச்சல் பயிர்' : 'Produce Crop'}</th>
                      <th style={{ width: '16%' }}>{lang === 'ta' ? 'தரம்' : 'Grade'}</th>
                      <th style={{ width: '13%' }}>{lang === 'ta' ? 'கிடைக்கும் அளவு' : 'Available Qty'}</th>
                      <th style={{ width: '13%' }}>{lang === 'ta' ? 'எதிர்பார்க்கும் விலை' : 'Expected Price'}</th>
                      <th style={{ width: '11%' }}>{lang === 'ta' ? 'ஏற்றுமதி தேதி' : 'Pickup Date'}</th>
                      <th style={{ width: '10%' }}>{lang === 'ta' ? 'நிலை' : 'Status'}</th>
                      <th style={{ width: '9%', textAlign: 'right' }}>{lang === 'ta' ? 'நடவடிக்கை' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCrops.map((crop) => (
                      <tr key={crop.id || crop._id}>
                        <td>
                          <div className="farmer-table-crop-cell">
                            <img
                              src={crop.image || (crop.images && crop.images[0]) || resolveCropFallbackImage(crop.name)}
                              alt={crop.name}
                              className="farmer-table-crop-img"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = resolveCropFallbackImage(crop.name);
                              }}
                            />
                            <div className="farmer-table-crop-text">
                              <span className="farmer-table-crop-name">{crop.name}</span>
                              {crop.tamilName && (
                                <span className="farmer-table-crop-tamil">{crop.tamilName}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`farmer-grade-badge ${(crop.grade || 'Grade A').toLowerCase().replace(/\s+/g, '-')}`}>
                            {crop.grade || 'Grade A'}
                          </span>
                        </td>
                        <td>
                          <span className="farmer-table-num">
                            {crop.availableKg || crop.quantityKg} <span className="farmer-table-unit">{crop.unit || 'Kg'}</span>
                          </span>
                        </td>
                        <td>
                          <span className="farmer-table-price">
                            ₹{crop.pricePerKg} <span className="farmer-table-unit">/ {crop.unit || 'Kg'}</span>
                          </span>
                        </td>
                        <td>
                          <span className="farmer-table-date">
                            <Calendar size={13} className="text-muted" />
                            <span>{crop.pickupDate || 'Today'}</span>
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              crop.status === 'active' || !crop.status
                                ? 'success'
                                : crop.status === 'paused'
                                ? 'pending'
                                : crop.status === 'sold_out'
                                ? 'neutral'
                                : 'danger'
                            }`}
                          >
                            {crop.status === 'active' || !crop.status
                              ? (lang === 'ta' ? 'நேரலை' : 'ACTIVE')
                              : crop.status === 'sold_out'
                              ? (lang === 'ta' ? 'விற்றுத்தீர்ந்தது' : 'SOLD OUT')
                              : crop.status === 'paused'
                              ? (lang === 'ta' ? 'நிறுத்தப்பட்டது' : 'PAUSED')
                              : (lang === 'ta' ? 'அகற்றப்பட்டது' : 'REMOVED')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="farmer-table-actions">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              leftIcon={<Eye size={13} />}
                              onClick={() => setSelectedCropDetails(crop)}
                              title={lang === 'ta' ? 'முழு விவரம்' : 'View Details'}
                            >
                              <span>{lang === 'ta' ? 'காண்க' : 'View'}</span>
                            </Button>

                            {crop.status !== 'removed' && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="farmer-btn-remove"
                                leftIcon={<Trash2 size={14} />}
                                onClick={() => setStatusConfirmCrop(crop)}
                                title={lang === 'ta' ? 'பட்டியலை நீக்கு' : 'Remove Listing'}
                              >
                                <span>{lang === 'ta' ? 'நீக்கு' : 'Remove'}</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Structured Cards (< 992px) */}
              <div className="farmer-mobile-cards-grid mt-3">
                {filteredCrops.map((crop) => (
                  <Card key={crop.id || crop._id} className="farmer-mobile-crop-card" padding="none">
                    <div className="farmer-mobile-card-inner">
                      {/* Top Row: Thumbnail Image + Title + Status Pill */}
                      <div className="mobile-card-top-row">
                        <img
                          src={crop.image || (crop.images && crop.images[0]) || resolveCropFallbackImage(crop.name)}
                          alt={crop.name}
                          className="crop-thumb-img"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = resolveCropFallbackImage(crop.name);
                          }}
                        />
                        <div className="mobile-card-title-group">
                          <div className="d-flex align-items-center justify-content-between gap-2">
                            <span className="crop-cell-name">{crop.name}</span>
                            <span
                              className={`status-pill ${
                                crop.status === 'active' || !crop.status
                                  ? 'success'
                                  : crop.status === 'paused'
                                  ? 'pending'
                                  : crop.status === 'sold_out'
                                  ? 'neutral'
                                  : 'danger'
                              }`}
                            >
                              {crop.status === 'active' || !crop.status
                                ? 'ACTIVE'
                                : crop.status === 'sold_out'
                                ? 'SOLD OUT'
                                : crop.status?.toUpperCase()}
                            </span>
                          </div>
                          {crop.tamilName && <span className="crop-cell-tamil">{crop.tamilName}</span>}
                          <div className="farmer-mobile-spec-line">
                            <span className={`farmer-grade-badge ${(crop.grade || 'Grade A').toLowerCase().replace(/\s+/g, '-')}`}>
                              {crop.grade || 'Grade A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2x2 Metric Grid */}
                      <div className="mobile-card-body-grid">
                        <div className="mobile-metric-item">
                          <span className="mobile-metric-label">{lang === 'ta' ? 'கிடைக்கும் அளவு' : 'Available Stock'}</span>
                          <span className="mobile-metric-val">{crop.availableKg || crop.quantityKg} {crop.unit || 'Kg'}</span>
                        </div>
                        <div className="mobile-metric-item">
                          <span className="mobile-metric-label">{lang === 'ta' ? 'எதிர்பார்க்கும் விலை' : 'Expected Price'}</span>
                          <span className="mobile-metric-val price">₹{crop.pricePerKg} / {crop.unit || 'Kg'}</span>
                        </div>
                        <div className="mobile-metric-item">
                          <span className="mobile-metric-label">{lang === 'ta' ? 'ஏற்றுமதி தேதி' : 'Pickup Date'}</span>
                          <span className="mobile-metric-val date">
                            <Calendar size={12} className="text-muted" />
                            <span>{crop.pickupDate || 'Today'}</span>
                          </span>
                        </div>
                        <div className="mobile-metric-item">
                          <span className="mobile-metric-label">{lang === 'ta' ? 'விசாரணைகள்' : 'Buyer Enquiries'}</span>
                          <span className="mobile-metric-val enquiries">{crop.enquiryCount || 0}</span>
                        </div>
                      </div>

                      {/* Bottom Actions Row */}
                      <div className="mobile-card-action-row">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => setSelectedCropDetails(crop)}
                        >
                          <span>{lang === 'ta' ? 'விவரம்' : 'Details'}</span>
                        </Button>

                        {crop.status !== 'removed' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="farmer-btn-remove"
                            leftIcon={<Trash2 size={14} />}
                            onClick={() => setStatusConfirmCrop(crop)}
                          >
                            <span>{lang === 'ta' ? 'நீக்கு' : 'Remove'}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ====================================================================
          MODAL 1: CROP DETAILS MODAL
          ==================================================================== */}
      <CropDetailsModal
        crop={selectedCropDetails}
        onClose={() => setSelectedCropDetails(null)}
        onToggleStatus={handleToggleCropStatus}
        lang={lang}
      />

      {/* ====================================================================
          MODAL 2: REMOVE CROP LISTING CONFIRMATION MODAL
          ==================================================================== */}
      {statusConfirmCrop && (
        <Modal
          isOpen={Boolean(statusConfirmCrop)}
          onClose={() => setStatusConfirmCrop(null)}
          size="sm"
          hideHeader
          centered
        >
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14
              }}
            >
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px', color: '#1f2933' }}>
              {lang === 'ta' ? 'பயிர் பட்டியலை நீக்கவா?' : 'Are you sure you want to remove this crop listing?'}
            </h3>

            <p style={{ fontSize: '0.86rem', color: '#4b5563', lineHeight: 1.5, marginBottom: 20 }}>
              {lang === 'ta'
                ? `"${statusConfirmCrop.name}" சந்தை பட்டியலிலிருந்து அகற்றப்படும். ஏற்கனவே உள்ள அல்லது வரலாற்று ஆர்டர்கள் பாதிக்கப்படாது.`
                : `"${statusConfirmCrop.name}" will be marked as inactive and removed from the active Buyer Marketplace. Past orders and historical enquiries remain unaffected.`}
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Button type="button" variant="secondary" onClick={() => setStatusConfirmCrop(null)}>
                <span>{lang === 'ta' ? 'ரத்து செய்' : 'Cancel'}</span>
              </Button>
              <Button
                type="button"
                variant="danger"
                leftIcon={<Trash2 size={15} />}
                onClick={() => handleRemoveCrop(statusConfirmCrop.id || statusConfirmCrop._id)}
              >
                <span>{lang === 'ta' ? 'ஆம், நீக்கு' : 'Confirm Remove'}</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

