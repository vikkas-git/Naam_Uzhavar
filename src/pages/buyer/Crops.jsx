// What this file does: Buyer produce marketplace page with produce dropdown filters (Tomato, Onion, Potato with Grade A, B, C), search, sorting, and crop listings.

import React, { useState, useEffect, useRef } from 'react';
import {
  Scale,
  Search,
  X,
  ChevronDown,
  Sprout,
  RotateCcw
} from 'lucide-react';
import './Crops.css';
import SectionHeader from '../../components/SectionHeader';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';
import { useBuyer } from '../../context/BuyerContext';
import CropCard from '../../components/CropCard';
import Skeleton from '../../components/Skeleton';

const PRODUCE_DROPDOWNS = [
  {
    id: 'tomato',
    labelKey: 'crops.filterTomato',
    label: 'Tomato',
    grades: [
      { id: 'tomato', labelKey: 'crops.filterAllGrades', label: 'All Grades' },
      { id: 'tomato_grade_a', labelKey: 'crops.filterGradeA', label: 'Grade A', badgeClass: 'grade-a' },
      { id: 'tomato_grade_b', labelKey: 'crops.filterGradeB', label: 'Grade B', badgeClass: 'grade-b' },
      { id: 'tomato_grade_c', labelKey: 'crops.filterGradeC', label: 'Grade C', badgeClass: 'grade-c' }
    ]
  },
  {
    id: 'onion',
    labelKey: 'crops.filterOnion',
    label: 'Onion',
    grades: [
      { id: 'onion', labelKey: 'crops.filterAllGrades', label: 'All Grades' },
      { id: 'onion_grade_a', labelKey: 'crops.filterGradeA', label: 'Grade A', badgeClass: 'grade-a' },
      { id: 'onion_grade_b', labelKey: 'crops.filterGradeB', label: 'Grade B', badgeClass: 'grade-b' },
      { id: 'onion_grade_c', labelKey: 'crops.filterGradeC', label: 'Grade C', badgeClass: 'grade-c' }
    ]
  },
  {
    id: 'potato',
    labelKey: 'crops.filterPotato',
    label: 'Potato',
    grades: [
      { id: 'potato', labelKey: 'crops.filterAllGrades', label: 'All Grades' },
      { id: 'potato_grade_a', labelKey: 'crops.filterGradeA', label: 'Grade A', badgeClass: 'grade-a' },
      { id: 'potato_grade_b', labelKey: 'crops.filterGradeB', label: 'Grade B', badgeClass: 'grade-b' },
      { id: 'potato_grade_c', labelKey: 'crops.filterGradeC', label: 'Grade C', badgeClass: 'grade-c' }
    ]
  },
  {
    id: 'carrot',
    labelKey: 'crops.filterCarrot',
    label: 'Carrot',
    grades: [
      { id: 'carrot', labelKey: 'crops.filterAllGrades', label: 'All Grades' },
      { id: 'carrot_grade_a', labelKey: 'crops.filterGradeA', label: 'Grade A', badgeClass: 'grade-a' },
      { id: 'carrot_grade_b', labelKey: 'crops.filterGradeB', label: 'Grade B', badgeClass: 'grade-b' },
      { id: 'carrot_grade_c', labelKey: 'crops.filterGradeC', label: 'Grade C', badgeClass: 'grade-c' }
    ]
  }
];

export default function Crops() {
  const {
    isDataLoading,
    crops,
    filteredCrops,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    setDeclinedCropIds,
    t,
    lang,
    handleOpenAccept
  } = useBuyer();

  const [openDropdown, setOpenDropdown] = useState(null);
  const filterToolbarRef = useRef(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterToolbarRef.current && !filterToolbarRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Compute current display label for a produce chip
  const getDropdownLabel = (produce) => {
    const baseLabel = typeof t === 'function' && t(produce.labelKey) !== produce.labelKey
      ? t(produce.labelKey)
      : produce.label;

    if (!selectedCategory || !selectedCategory.startsWith(produce.id)) {
      return baseLabel;
    }

    if (selectedCategory === `${produce.id}_grade_a`) {
      const gLabel = typeof t === 'function' && t('crops.filterGradeA') !== 'crops.filterGradeA'
        ? t('crops.filterGradeA')
        : 'Grade A';
      return `${baseLabel} • ${gLabel}`;
    }
    if (selectedCategory === `${produce.id}_grade_b`) {
      const gLabel = typeof t === 'function' && t('crops.filterGradeB') !== 'crops.filterGradeB'
        ? t('crops.filterGradeB')
        : 'Grade B';
      return `${baseLabel} • ${gLabel}`;
    }
    if (selectedCategory === `${produce.id}_grade_c`) {
      const gLabel = typeof t === 'function' && t('crops.filterGradeC') !== 'crops.filterGradeC'
        ? t('crops.filterGradeC')
        : 'Grade C';
      return `${baseLabel} • ${gLabel}`;
    }

    return baseLabel;
  };

  return (
    <div className="buyer-view-container animate-fade-in">
      <SectionHeader
        className="buyer-view-header"
        title={t('crops.title')}
        subtitle={t('crops.subtitle')}
        action={
          <div className="buyer-total-stock-badge">
            <Scale size={15} />
            <span>
              {t('crops.totalStock', {
                n: (filteredCrops || []).reduce((acc, c) => acc + (Number(c?.availableKg) || 0), 0)
              })}
            </span>
          </div>
        }
      />

      {/* Crops Search Bar */}
      <div style={{ marginBottom: 16 }}>
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={18} />}
          rightIcon={searchQuery ? <X size={15} /> : undefined}
          onRightIconClick={searchQuery ? () => setSearchQuery('') : undefined}
        />
      </div>

      {/* Filters & Sorting Bar */}
      <div className="buyer-filter-toolbar" ref={filterToolbarRef}>
        {/* Category & Produce Dropdown Filter Chips */}
        <div className="buyer-filter-chips">
          {/* 'All' Filter Chip */}
          <button
            type="button"
            className={`buyer-chip ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory('all');
              setOpenDropdown(null);
            }}
          >
            {typeof t === 'function' && t('crops.filterAll') !== 'crops.filterAll'
              ? t('crops.filterAll')
              : 'All'}
          </button>

          {/* Produce Dropdowns: Tomato, Onion, Potato */}
          {PRODUCE_DROPDOWNS.map((produce) => {
            const isCropActive = selectedCategory && selectedCategory.startsWith(produce.id);
            const isOpen = openDropdown === produce.id;

            return (
              <div key={produce.id} className="buyer-filter-dropdown-wrap">
                <button
                  type="button"
                  id={`filter-dropdown-${produce.id}`}
                  className={`buyer-chip-dropdown-btn ${isCropActive ? 'active' : ''} ${isOpen ? 'is-open' : ''}`}
                  onClick={() => setOpenDropdown(isOpen ? null : produce.id)}
                  aria-haspopup="listbox"
                  aria-expanded={isOpen}
                >
                  <span>{getDropdownLabel(produce)}</span>
                  <ChevronDown size={14} className="buyer-chip-dropdown-caret" />
                </button>

                {isOpen && (
                  <div className="buyer-filter-menu" role="listbox" aria-label={`${produce.label} Grades`}>
                    {produce.grades.map((gradeOpt) => {
                      const isOptionActive = selectedCategory === gradeOpt.id;
                      const optLabel = typeof t === 'function' && t(gradeOpt.labelKey) !== gradeOpt.labelKey
                        ? t(gradeOpt.labelKey)
                        : gradeOpt.label;

                      return (
                        <button
                          key={gradeOpt.id}
                          type="button"
                          className={`buyer-filter-menu-item ${isOptionActive ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedCategory(gradeOpt.id);
                            setOpenDropdown(null);
                          }}
                        >
                          <span>{optLabel}</span>
                          {gradeOpt.badgeClass && (
                            <span className={`buyer-filter-grade-badge ${gradeOpt.badgeClass}`}>
                              {gradeOpt.label}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sort By Dropdown */}
        <div className="buyer-sort-wrap">
          <label htmlFor="crop-sort-select" className="buyer-sort-label">
            {t('crops.sortBy')}
          </label>
          <div className="buyer-select-wrapper">
            <select
              id="crop-sort-select"
              className="buyer-select-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">{t('crops.sortRecent')}</option>
              <option value="price_low">{t('crops.sortPriceLow')}</option>
              <option value="price_high">{t('crops.sortPriceHigh')}</option>
              <option value="qty_high">{t('crops.sortQtyHigh')}</option>
            </select>
            <ChevronDown size={14} className="buyer-select-arrow" />
          </div>
        </div>
      </div>

      {/* Crops Grid (Desktop 3-4, Tablet 2, Mobile 1) */}
      {isDataLoading && (!crops || crops.length === 0) ? (
        <div className="buyer-crop-grid nu-skeleton-fade-in" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, idx) => (
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
      ) : filteredCrops && filteredCrops.length > 0 ? (
        <div className="buyer-crop-grid">
          {filteredCrops.map((crop) => (
            <CropCard
              key={crop.id}
              crop={crop}
              lang={lang}
              t={t}
              onAccept={() => handleOpenAccept(crop)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Sprout size={32} />}
          title={t('crops.emptyTitle')}
          description={t('crops.emptyDesc')}
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setDeclinedCropIds([]);
              }}
              leftIcon={<RotateCcw size={15} />}
            >
              <span>{t('crops.resetFilters')}</span>
            </Button>
          }
        />
      )}
    </div>
  );
}
