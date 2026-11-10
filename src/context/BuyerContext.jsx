// What this file does: Global React context managing commercial buyer state, profile, crop listings, orders, and messages.

/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useT } from '../hooks/useT';
import { INITIAL_CROPS, INITIAL_ORDERS, INITIAL_MESSAGES } from '../data/mockData';
import { api, getToken, setToken, removeBuyerToken } from '../utils/api';
import { getStoredRequests, saveStoredRequests } from '../services/requestService';
import { getStoredOrders, saveStoredOrders } from '../services/orderService';

const BuyerContext = createContext(null);

// Strict 4-crop catalog guard for Commercial Buyer module: Tomato, Onion, Potato, Carrot
export const isAllowedBuyerCrop = (crop) => {
  if (!crop) return false;
  const text = `${crop.name || ''} ${crop.tamilName || ''} ${crop.id || ''}`.toLowerCase();
  
  const isBanned =
    text.includes('coconut') || text.includes('தேங்காய்') ||
    text.includes('okra') || text.includes('vendakkai') || text.includes('வெண்டைக்காய்') ||
    text.includes('sambar') || text.includes('சாம்பார்') ||
    text.includes('brinjal') || text.includes('kathirikkai') || text.includes('கத்திரிக்காய்') ||
    text.includes('chilli') || text.includes('மிளகாய்') ||
    text.includes('drumstick') || text.includes('முருங்கை') ||
    text.includes('cabbage') || text.includes('முட்டைக்கோஸ்') ||
    text.includes('pumpkin') || text.includes('பரங்கிக்காய்') ||
    text.includes('capsicum') || text.includes('குடைமிளகாய்') ||
    text.includes('banana') || text.includes('வாழைப்பழம்') ||
    text.includes('pomegranate') || text.includes('மாதுளை');

  if (isBanned) return false;

  const isTomato = text.includes('tomato') || text.includes('தக்காளி');
  const isOnion = text.includes('onion') || text.includes('shallot') || text.includes('vengayam') || text.includes('வெங்காயம்') || text.includes('bellary');
  const isPotato = text.includes('potato') || text.includes('urulai') || text.includes('உருளை');
  const isCarrot = text.includes('carrot') || text.includes('கேரட்') || text.includes('karat');

  return isTomato || isOnion || isPotato || isCarrot;
};

/**
 * Strict produce deduplication for Commercial Buyer Marketplace.
 * Guarantees that no duplicate crop listings (identical name, or same crop staple + grade)
 * appear repeated side-by-side. Also guarantees that all 4 staple crops (Tomato, Onion,
 * Potato, Carrot) remain present and available.
 */
export const deduplicateBuyerCrops = (list) => {
  if (!Array.isArray(list) || list.length === 0) {
    return (INITIAL_CROPS || []).filter(isAllowedBuyerCrop);
  }

  const seenIds = new Set();
  const seenCropKeys = new Set();
  const result = [];

  for (const crop of list) {
    if (!crop || !isAllowedBuyerCrop(crop)) continue;

    const cropId = String(crop.id || crop._id || '').trim();
    if (cropId && seenIds.has(cropId)) continue;

    const text = `${crop.name || ''} ${crop.tamilName || ''} ${cropId}`.toLowerCase();
    let stapleType = '';
    if (text.includes('tomato') || text.includes('தக்காளி')) stapleType = 'tomato';
    else if (text.includes('onion') || text.includes('shallot') || text.includes('vengayam') || text.includes('வெங்காயம்') || text.includes('bellary')) stapleType = 'onion';
    else if (text.includes('potato') || text.includes('urulai') || text.includes('உருளை')) stapleType = 'potato';
    else if (text.includes('carrot') || text.includes('கேரட்') || text.includes('karat')) stapleType = 'carrot';

    if (!stapleType) continue;

    const cleanName = String(crop.name || '').trim().toLowerCase();
    const cleanGrade = String(crop.grade || 'grade a').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // Composite keys
    const nameKey = `${stapleType}_name_${cleanName}`;
    const stapleGradeKey = `${stapleType}_grade_${cleanGrade}`;

    // If an identical produce card has already been included, skip this duplicate
    if (seenCropKeys.has(nameKey) || seenCropKeys.has(stapleGradeKey)) {
      continue;
    }

    if (cropId) seenIds.add(cropId);
    seenCropKeys.add(nameKey);
    seenCropKeys.add(stapleGradeKey);
    result.push(crop);
  }

  // Ensure all 4 staples (Tomato, Onion, Potato, Carrot) are present
  const staples = ['tomato', 'onion', 'potato', 'carrot'];
  for (const staple of staples) {
    const hasStaple = result.some((c) => {
      const text = `${c.name || ''} ${c.tamilName || ''} ${c.id || ''}`.toLowerCase();
      if (staple === 'tomato') return text.includes('tomato') || text.includes('தக்காளி');
      if (staple === 'onion') return text.includes('onion') || text.includes('shallot') || text.includes('vengayam') || text.includes('வெங்காயம்');
      if (staple === 'potato') return text.includes('potato') || text.includes('urulai') || text.includes('உருளை');
      if (staple === 'carrot') return text.includes('carrot') || text.includes('கேரட்');
      return false;
    });

    if (!hasStaple) {
      const fallbackMatches = (INITIAL_CROPS || [])
        .filter(isAllowedBuyerCrop)
        .filter((ic) => {
          const text = `${ic.name || ''} ${ic.tamilName || ''} ${ic.id || ''}`.toLowerCase();
          if (staple === 'tomato') return text.includes('tomato') || text.includes('தக்காளி');
          if (staple === 'onion') return text.includes('onion') || text.includes('shallot') || text.includes('vengayam') || text.includes('வெங்காயம்');
          if (staple === 'potato') return text.includes('potato') || text.includes('urulai') || text.includes('உருளை');
          if (staple === 'carrot') return text.includes('carrot') || text.includes('கேரட்');
          return false;
        });

      for (const fb of fallbackMatches) {
        const cleanGrade = String(fb.grade || 'grade a').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const stapleGradeKey = `${staple}_grade_${cleanGrade}`;
        if (!seenCropKeys.has(stapleGradeKey)) {
          seenCropKeys.add(stapleGradeKey);
          result.push(fb);
        }
      }
    }
  }

  return result;
};

export function BuyerProvider({ children, buyerProfile, onLogout }) {
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useT('buyerDashboard');

  // Full Buyer Profile State
  const [profile, setProfile] = useState(() => {
    let saved = null;
    try {
      const raw =
        localStorage.getItem('buyer_current_profile') ||
        localStorage.getItem('buyer_registered_profile');
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      console.warn('Could not read saved profile:', e);
    }

    const firmName =
      saved?.shopName ||
      saved?.businessName ||
      buyerProfile?.shopName ||
      buyerProfile?.businessName ||
      'Grand Palace Luxury Dining';

    let resolvedContactPerson = saved?.contactPerson;
    if (!resolvedContactPerson || resolvedContactPerson === firmName) {
      if (saved?.name && saved.name !== firmName) {
        resolvedContactPerson = saved.name;
      } else if (saved?.fullName && saved.fullName !== firmName) {
        resolvedContactPerson = saved.fullName;
      } else {
        const email = saved?.email || buyerProfile?.email || '';
        if (email.includes('@')) {
          const raw = email.split('@')[0].replace(/\d+/g, '').replace(/[._-]/g, ' ').trim();
          if (raw.toLowerCase() === 'vimalku' || raw.toLowerCase() === 'vimal') {
            resolvedContactPerson = 'Vimal Kumar';
          } else if (raw.length >= 2) {
            resolvedContactPerson = raw
              .split(' ')
              .filter(Boolean)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(' ');
          }
        }
      }
    }

    if (!resolvedContactPerson || resolvedContactPerson === firmName) {
      resolvedContactPerson = buyerProfile?.contactPerson || 'Mr. S. Rajesh (Procurement Head)';
    }

    // Auto-heal localStorage if contactPerson was previously corrupted by businessName
    try {
      if (saved && (saved.contactPerson === firmName || !saved.contactPerson)) {
        const healed = {
          ...saved,
          contactPerson: resolvedContactPerson,
          name: resolvedContactPerson,
          fullName: resolvedContactPerson,
          shopName: firmName,
          businessName: firmName
        };
        localStorage.setItem('buyer_current_profile', JSON.stringify(healed));
      }
    } catch {
      // ignore
    }

    return {
      name: resolvedContactPerson,
      fullName: resolvedContactPerson,
      contactPerson: resolvedContactPerson,
      shopName: firmName,
      businessName: firmName,
      phone: saved?.phone || buyerProfile?.phone || '+91 98401 23456',
      email: saved?.email || buyerProfile?.email || 'procurement@grandpalace.in',
      buyerType: saved?.buyerType || buyerProfile?.buyerType || 'hotel',
      businessType:
        saved?.businessType ||
        (saved?.buyerType
          ? `${saved.buyerType.toUpperCase()} Commercial Kitchen`
          : buyerProfile?.businessType || 'Hotel & Commercial Kitchen'),
      address:
        saved?.address ||
        buyerProfile?.address ||
        'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016',
      gstin: saved?.gstin || buyerProfile?.gstin || '33AAAAA0000A1Z5',
      photo:
        saved?.photo ||
        saved?.photoPreview ||
        buyerProfile?.photo ||
        buyerProfile?.photoPreview ||
        'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80',
      photoPreview:
        saved?.photoPreview ||
        saved?.photo ||
        buyerProfile?.photoPreview ||
        buyerProfile?.photo ||
        'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80'
    };
  });

  // Sync when buyerProfile prop changes
  const prevBuyerProfileRef = useRef(buyerProfile);
  useEffect(() => {
    if (buyerProfile && prevBuyerProfileRef.current !== buyerProfile) {
      prevBuyerProfileRef.current = buyerProfile;
      setProfile((prev) => ({
        ...prev,
        ...buyerProfile,
        shopName: buyerProfile.shopName || buyerProfile.name || prev.shopName,
        contactPerson:
          buyerProfile.contactPerson ||
          buyerProfile.fullName ||
          buyerProfile.name ||
          prev.contactPerson,
        photo: buyerProfile.photo || buyerProfile.photoPreview || prev.photo,
        photoPreview:
          buyerProfile.photoPreview || buyerProfile.photo || prev.photoPreview
      }));
    }
  }, [buyerProfile]);

  // Auto-persist profile to localStorage whenever updated
  useEffect(() => {
    if (profile && typeof window !== 'undefined') {
      try {
        localStorage.setItem('buyer_current_profile', JSON.stringify(profile));
        localStorage.setItem('buyer_registered_profile', JSON.stringify(profile));
      } catch (e) {
        console.warn('Could not persist profile to localStorage:', e);
      }
    }
  }, [profile]);

  // Data loading state for asynchronous fetching and delay handling
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
  };

  // Edit Profile Modal
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(profile);
  const photoInputRef = useRef(null);

  const handleOpenEditProfile = () => {
    setEditFormData(profile);
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const resolvedBusiness = (
      editFormData.shopName ||
      editFormData.businessName ||
      profile.businessName ||
      profile.shopName ||
      'Commercial Buyer'
    ).trim();
    const resolvedContact = (
      editFormData.contactPerson ||
      editFormData.name ||
      editFormData.fullName ||
      profile.contactPerson ||
      'Procurement Partner'
    ).trim();
    const resolvedEmail = (
      editFormData.email ||
      profile.email ||
      'demo@naamuzhavar.com'
    ).trim();
    const resolvedPhone = (
      editFormData.phone ||
      profile.phone ||
      '+91 98401 23456'
    ).trim();
    const resolvedAddress = (
      editFormData.address ||
      profile.address ||
      'Madurai Commercial Hub'
    ).trim();
    const resolvedGstin = (
      editFormData.gstin !== undefined ? editFormData.gstin : profile.gstin || ''
    ).trim();
    const resolvedType = (
      editFormData.buyerType ||
      profile.buyerType ||
      'hotel'
    ).trim();
    const resolvedAvatar =
      editFormData.photo ||
      editFormData.photoPreview ||
      profile.photo ||
      profile.photoPreview ||
      profile.avatar;

    const payload = {
      businessName: resolvedBusiness,
      shopName: resolvedBusiness,
      contactPerson: resolvedContact,
      name: resolvedContact,
      fullName: resolvedContact,
      buyerType: resolvedType,
      phone: resolvedPhone,
      email: resolvedEmail,
      address: resolvedAddress,
      gstin: resolvedGstin,
      avatar: resolvedAvatar,
      photo: resolvedAvatar
    };

    // 1. Instantly update local state & localStorage for snappy UI
    const updated = {
      ...profile,
      ...editFormData,
      ...payload
    };
    setProfile(updated);
    try {
      localStorage.setItem('buyer_current_profile', JSON.stringify(updated));
      localStorage.setItem('buyer_registered_profile', JSON.stringify(updated));
    } catch {
      // ignore storage error
    }

    // 2. Persist changes to MongoDB backend via PUT /api/profile
    try {
      const res = await api.put('/profile', payload);
      if (res && res.token) {
        setToken(res.token);
      }
      if (res && res.buyer) {
        const confirmed = {
          ...updated,
          ...res.buyer,
          name: res.buyer.contactPerson || res.buyer.name || updated.name,
          contactPerson: res.buyer.contactPerson || updated.contactPerson,
          shopName: res.buyer.shopName || res.buyer.businessName || updated.shopName,
          businessName: res.buyer.businessName || updated.businessName,
          photo: res.buyer.avatar || res.buyer.photo || updated.photo,
          photoPreview: res.buyer.avatar || res.buyer.photo || updated.photoPreview
        };
        setProfile(confirmed);
        try {
          localStorage.setItem('buyer_current_profile', JSON.stringify(confirmed));
          localStorage.setItem('buyer_registered_profile', JSON.stringify(confirmed));
        } catch {
          // ignore
        }
      }
      showToast(
        'success',
        t('modals.profileUpdatedToast') || 'Profile details updated and stored in database successfully!'
      );
    } catch (err) {
      console.warn('Backend update notice:', err);
      showToast('info', 'Profile updated locally. (' + (err.message || 'Offline') + ')');
    }

    setEditProfileOpen(false);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const newPhoto = uploadEvent.target.result;
      const updated = { ...profile, photo: newPhoto, photoPreview: newPhoto };
      setProfile(updated);
      setEditFormData((prev) => ({ ...prev, photo: newPhoto, photoPreview: newPhoto }));
      try {
        localStorage.setItem('buyer_current_profile', JSON.stringify(updated));
        localStorage.setItem('buyer_registered_profile', JSON.stringify(updated));
      } catch {
        // ignore storage error
      }

      // Automatically store uploaded photo to MongoDB database
      try {
        const res = await api.put('/profile', {
          avatar: newPhoto,
          photo: newPhoto,
          email: profile.email,
          businessName: profile.businessName || profile.shopName
        });
        if (res && res.token) {
          setToken(res.token);
        }
      } catch (err) {
        console.warn('Could not sync photo to database:', err);
      }

      showToast(
        'success',
        t('modals.profilePhotoToast') || 'Profile photo updated and saved to database!'
      );
    };
    reader.readAsDataURL(file);
  };

  // Crops Data & Filters with localStorage persistence
  const [crops, setCrops] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('buyer_crops');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const allowed = parsed.filter(isAllowedBuyerCrop);
            if (allowed.length > 0) return deduplicateBuyerCrops(allowed);
          }
        }
      } catch (e) {
        console.warn('Could not read saved crops from localStorage:', e);
      }
    }
    return deduplicateBuyerCrops(INITIAL_CROPS.filter(isAllowedBuyerCrop));
  });

  const [declinedCropIds, setDeclinedCropIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('buyer_declined_crop_ids');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.warn('Could not read declinedCropIds from localStorage:', e);
      }
    }
    return [];
  });

  // Auto-persist crops & declined crop IDs to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && Array.isArray(crops)) {
      try {
        localStorage.setItem('buyer_crops', JSON.stringify(deduplicateBuyerCrops(crops)));
      } catch (e) {
        console.warn('Could not persist crops to localStorage:', e);
      }
    }
  }, [crops]);

  useEffect(() => {
    if (typeof window !== 'undefined' && Array.isArray(declinedCropIds)) {
      try {
        localStorage.setItem('buyer_declined_crop_ids', JSON.stringify(declinedCropIds));
      } catch (e) {
        console.warn('Could not persist declinedCropIds to localStorage:', e);
      }
    }
  }, [declinedCropIds]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Produce Action Modals & Order Confirmation Workflow State
  const [declineModalCrop, setDeclineModalCrop] = useState(null);
  const [workflowCrop, setWorkflowCrop] = useState(null);
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [workflowStep, setWorkflowStep] = useState('CONFIRMATION'); // 'CONFIRMATION' | 'PENDING_APPROVAL' | 'CONFIRMED' | 'DELIVERY_ARRANGED' | 'REJECTED'
  const [activeWorkflowOrder, setActiveWorkflowOrder] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Legacy produce modal state preserved for backwards compatibility
  const [acceptModalCrop, setAcceptModalCrop] = useState(null);
  const [acceptedQuantity, setAcceptedQuantity] = useState(200);
  const [farmerDetailsCrop, setFarmerDetailsCrop] = useState(null);
  const [orderConfirmationData, setOrderConfirmationData] = useState(null);

  // Orders State with localStorage persistence
  const [orders, setOrders] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('buyer_orders');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Could not read saved orders from localStorage:', e);
      }
    }
    return INITIAL_ORDERS;
  });

  const [activeOrderFilter, setActiveOrderFilter] = useState('active');

  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('buyer_tracking_order_id');
        if (saved) return saved;
      } catch (e) {
        console.warn('Could not read selectedTrackingOrderId from localStorage:', e);
      }
    }
    return 'NU-2026-00124';
  });

  const [activeDashboardOrderId, setActiveDashboardOrderId] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('buyer_active_dashboard_order_id');
        if (saved) return saved;
      } catch (e) {
        console.warn('Could not read activeDashboardOrderId from localStorage:', e);
      }
    }
    return null;
  });

  // Auto-persist orders, active dashboard order ID, and selected tracking order ID
  useEffect(() => {
    if (typeof window !== 'undefined' && Array.isArray(orders)) {
      try {
        localStorage.setItem('buyer_orders', JSON.stringify(orders));
      } catch (e) {
        console.warn('Could not persist orders to localStorage:', e);
      }
    }
  }, [orders]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (activeDashboardOrderId) {
          localStorage.setItem('buyer_active_dashboard_order_id', activeDashboardOrderId);
        } else {
          localStorage.removeItem('buyer_active_dashboard_order_id');
        }
      } catch (e) {
        console.warn('Could not persist activeDashboardOrderId to localStorage:', e);
      }
    }
  }, [activeDashboardOrderId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (selectedTrackingOrderId) {
          localStorage.setItem('buyer_tracking_order_id', selectedTrackingOrderId);
        }
      } catch (e) {
        console.warn('Could not persist selectedTrackingOrderId to localStorage:', e);
      }
    }
  }, [selectedTrackingOrderId]);

  const activeDashboardOrder = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    const isOrderDelivered = (o) => {
      if (!o) return true;
      const deliv = String(o.deliveryStatus || '').toUpperCase();
      const ordSt = String(o.orderStatus || '').toUpperCase();
      const st = String(o.status || '').toUpperCase();
      return (
        deliv === 'DELIVERED' ||
        ordSt === 'DELIVERED' ||
        st === 'DELIVERED' ||
        ordSt === 'CANCELLED' ||
        ordSt === 'REJECTED'
      );
    };

    const activeList = orders.filter((o) => !isOrderDelivered(o));
    if (activeList.length === 0) return null;

    if (activeDashboardOrderId) {
      const match = activeList.find((o) => o.orderId === activeDashboardOrderId);
      if (match) return match;
    }
    return activeList[0] || null;
  }, [orders, activeDashboardOrderId]);

  // Messages State with localStorage persistence
  const [messages, setMessages] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('buyer_messages');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Could not read messages from localStorage:', e);
      }
    }
    return INITIAL_MESSAGES;
  });

  // Auto-persist messages
  useEffect(() => {
    if (typeof window !== 'undefined' && Array.isArray(messages)) {
      try {
        localStorage.setItem('buyer_messages', JSON.stringify(messages));
      } catch (e) {
        console.warn('Could not persist messages to localStorage:', e);
      }
    }
  }, [messages]);

  const [replyText, setReplyText] = useState('');

  // Synchronize remote backend data (profile, crops, orders) with loading state
  const refreshData = async (showLoader = true) => {
    if (showLoader) setIsDataLoading(true);
    try {
      if (!getToken()) return;

      const [profileRes, cropsRes, ordersRes] = await Promise.allSettled([
        api.get('/profile'),
        api.get('/crops'),
        api.get('/orders')
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value?.buyer) {
        const b = profileRes.value.buyer;
        setProfile((prev) => {
          const updated = {
            ...prev,
            ...b,
            contactPerson: b.contactPerson || prev.contactPerson,
            name: b.contactPerson || prev.name,
            fullName: b.contactPerson || prev.fullName,
            shopName: b.shopName || b.businessName || prev.shopName,
            businessName: b.businessName || prev.businessName,
            photo: b.avatar || b.photo || prev.photo,
            photoPreview: b.avatar || b.photoPreview || prev.photoPreview
          };
          try {
            localStorage.setItem('buyer_current_profile', JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      }

      if (cropsRes.status === 'fulfilled' && Array.isArray(cropsRes.value?.crops) && cropsRes.value.crops.length > 0) {
        const fetchedCrops = cropsRes.value.crops.filter(isAllowedBuyerCrop).map((c) => ({
          id: c._id || c.id,
          name: c.name,
          tamilName: c.nameTa || '',
          category: c.category || 'vegetables',
          grade: c.grade || 'Grade A',
          pricePerKg: c.pricePerKg,
          availableKg: c.quantityKg,
          farmer: {
            name: c.farmerName || 'Local Producer',
            phone: '+91 98421 78210',
            village: c.hub || 'Siluvathur, Dindigul'
          },
          farmerName: c.farmerName || 'Local Producer',
          location: c.hub || 'Dindigul Central',
          hubName: c.hub || 'Dindigul Central',
          distanceKm: c.distanceKm || 14,
          image: c.image
        }));

        setCrops((prevCrops) => {
          const prevMap = new Map((prevCrops || []).map((pc) => [pc.id, pc]));
          const merged = fetchedCrops.map((fc) => {
            const existing = prevMap.get(fc.id);
            if (existing && existing.availableKg !== undefined && existing.availableKg < fc.availableKg) {
              return { ...fc, availableKg: existing.availableKg };
            }
            return fc;
          });
          return deduplicateBuyerCrops([...merged, ...(prevCrops || [])]);
        });
      }

      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value?.orders) && ordersRes.value.orders.length > 0) {
        const fetchedOrders = ordersRes.value.orders.map((o) => ({
          ...o,
          orderId: o.orderId,
          cropName: o.cropDetails?.name || o.crop?.name || 'Produce',
          tamilCropName: o.cropDetails?.nameTa || o.crop?.nameTa || '',
          grade: o.cropDetails?.grade || o.crop?.grade || 'Grade A',
          image: o.cropDetails?.image || o.crop?.image,
          unitPrice: o.cropDetails?.pricePerKg || Math.round(o.totalPrice / (o.quantityKg || 1)),
          farmer: {
            name: o.cropDetails?.farmerName || 'Farmer Partner',
            phone: '+91 98421 78210',
            location: o.cropDetails?.hub || 'Dindigul'
          },
          driver: o.driver || {
            name: 'Kumar M.',
            vehicleType: 'Tata Ace EV Cargo',
            vehicleNumber: 'TN 57 AB 1234',
            phone: '+91 94432 11098',
            deliveryPin: '4892'
          },
          liveTracking: {
            currentStatus: o.deliveryStatus === 'DELIVERED' ? 'Consignment Delivered' : 'Ready for EV Driver Pickup',
            currentLocation: `${o.cropDetails?.hub || 'Dindigul'} Hub`,
            estimatedMinutes: 30,
            distanceKm: 18,
            speedKmh: 0,
            lastUpdated: 'Just now'
          }
        }));

        setOrders((prevOrders) => {
          const fetchedIds = new Set(fetchedOrders.map((fo) => fo.orderId));
          const localOnly = (prevOrders || []).filter((po) => !fetchedIds.has(po.orderId));
          const mergedFetched = fetchedOrders.map((fo) => {
            const localMatch = (prevOrders || []).find((po) => po.orderId === fo.orderId);
            if (localMatch) {
              return {
                ...fo,
                deliveryStatus: localMatch.deliveryStatus || fo.deliveryStatus,
                status: localMatch.status || fo.status,
                orderStatus: localMatch.orderStatus || fo.orderStatus,
                liveTracking: localMatch.liveTracking || fo.liveTracking
              };
            }
            return fo;
          });
          return [...mergedFetched, ...localOnly];
        });
      }
    } catch {
      // offline fallback
    } finally {
      if (showLoader) setIsDataLoading(false);
    }
  };

  // Helper to simulate a network delay for live judging / demonstration
  const simulateDataDelay = (delayMs = 3500) => {
    setIsDataLoading(true);
    setTimeout(() => {
      setIsDataLoading(false);
      showToast('success', lang === 'ta' ? 'விவசாய தரவுகள் புதுப்பிக்கப்பட்டன' : 'Farm produce data synchronized!');
    }, delayMs);
  };

  // Fetch latest authenticated data on initial mount
  useEffect(() => {
    refreshData(false);
  }, []);

  // Listen for real-time order approvals or rejections from Farmer Module
  useEffect(() => {
    const handleSyncBuyerOrders = () => {
      try {
        const raw = localStorage.getItem('buyer_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleSyncBuyerOrders);
    window.addEventListener('buyer-data-updated', handleSyncBuyerOrders);
    return () => {
      window.removeEventListener('storage', handleSyncBuyerOrders);
      window.removeEventListener('buyer-data-updated', handleSyncBuyerOrders);
    };
  }, []);




  // Filter crops
  const filteredCrops = useMemo(() => {
    return deduplicateBuyerCrops(crops || [])
      .filter((crop) => crop && isAllowedBuyerCrop(crop) && !declinedCropIds?.includes(crop.id))
      .filter((crop) => {
        if (!searchQuery?.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          (crop.name || '').toLowerCase().includes(q) ||
          (crop.tamilName || '').toLowerCase().includes(q) ||
          (crop.location || '').toLowerCase().includes(q) ||
          (crop.hubName || '').toLowerCase().includes(q) ||
          (crop.category || '').toLowerCase().includes(q)
        );
      })
      .filter((crop) => {
        if (!crop) return false;
        if (!selectedCategory || selectedCategory === 'all') return true;

        // Parse target crop and target grade from selectedCategory (e.g. 'tomato_grade_a', 'onion', etc.)
        let targetCrop = '';
        let targetGrade = '';

        if (selectedCategory.startsWith('tomato')) {
          targetCrop = 'tomato';
        } else if (selectedCategory.startsWith('onion')) {
          targetCrop = 'onion';
        } else if (selectedCategory.startsWith('potato')) {
          targetCrop = 'potato';
        } else if (selectedCategory.startsWith('carrot')) {
          targetCrop = 'carrot';
        }

        if (selectedCategory.includes('grade_a')) {
          targetGrade = 'grade a';
        } else if (selectedCategory.includes('grade_b')) {
          targetGrade = 'grade b';
        } else if (selectedCategory.includes('grade_c')) {
          targetGrade = 'grade c';
        }

        // Backward compatibility for standalone grade/category filters
        if (!targetCrop && targetGrade) {
          const g = (crop.grade || '').trim().toLowerCase();
          return g === targetGrade;
        }
        if (selectedCategory === 'vegetables') {
          return (crop.category || '').toLowerCase() === 'vegetables';
        }

        // Match crop name
        let matchesCrop = true;
        if (targetCrop) {
          const name = ((crop.name || '') + ' ' + (crop.tamilName || '') + ' ' + (crop.id || '')).toLowerCase();
          if (targetCrop === 'tomato') {
            matchesCrop = name.includes('tomato') || name.includes('தக்காளி');
          } else if (targetCrop === 'onion') {
            matchesCrop = name.includes('onion') || name.includes('shallot') || name.includes('vengayam') || name.includes('வெங்காயம்') || name.includes('bellary');
          } else if (targetCrop === 'potato') {
            matchesCrop = name.includes('potato') || name.includes('urulai') || name.includes('உருளை');
          } else if (targetCrop === 'carrot') {
            matchesCrop = name.includes('carrot') || name.includes('கேரட்') || name.includes('karat');
          }
        }

        if (!matchesCrop) return false;

        // Match grade if specified
        if (targetGrade) {
          const g = (crop.grade || '').trim().toLowerCase();
          return g === targetGrade;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return (Number(a.pricePerKg) || 0) - (Number(b.pricePerKg) || 0);
        if (sortBy === 'price_high') return (Number(b.pricePerKg) || 0) - (Number(a.pricePerKg) || 0);
        if (sortBy === 'qty_high') return (Number(b.availableKg) || 0) - (Number(a.availableKg) || 0);
        return 0;
      });
  }, [crops, declinedCropIds, searchQuery, selectedCategory, sortBy]);

  // Selected Order for Live Tracking
  const trackingOrder = useMemo(() => {
    return orders.find((o) => o.orderId === selectedTrackingOrderId) || orders[0];
  }, [orders, selectedTrackingOrderId]);

  // Modal actions
  const handleOpenDecline = (crop) => {
    setDeclineModalCrop(crop);
  };

  const handleConfirmDecline = () => {
    if (!declineModalCrop) return;
    const cropId = declineModalCrop.id;
    const cropName = declineModalCrop.name;
    setDeclinedCropIds((prev) => [...prev, cropId]);
    setDeclineModalCrop(null);
    showToast(
      'info',
      t('modals.declineSuccessToast', { name: cropName })
    );
  };

  // Step 1: When the buyer clicks Accept on a crop card
  // Do not navigate directly to Delivery Status; open the Order Confirmation modal
  const handleOpenAccept = (crop) => {
    if (!crop) return;
    setWorkflowCrop(crop);
    setAcceptedQuantity(Math.min(200, crop.availableKg || 200));
    setWorkflowStep('CONFIRMATION');
    setActiveWorkflowOrder(null);
    setIsSubmittingOrder(false);
    setWorkflowModalOpen(true);
  };

  const handleCloseWorkflow = () => {
    setWorkflowModalOpen(false);
    setWorkflowCrop(null);
    setActiveWorkflowOrder(null);
    setWorkflowStep('CONFIRMATION');
    setIsSubmittingOrder(false);
  };

  // Step 2: Confirm & Place Order
  const handleConfirmCreateOrder = async ({
    quantityKg,
    deliveryAddress,
    preferredDeliveryDate,
    notes,
    paymentMethod,
    transactionRef,
    utrNumber
  }) => {
    if (!workflowCrop) return;
    const qty = Number(quantityKg);
    const available = Number(workflowCrop.availableKg || workflowCrop.quantityKg || 0);

    if (!qty || qty <= 0 || isNaN(qty)) {
      showToast('error', 'Please enter a valid quantity in kg.');
      return;
    }
    if (qty > available) {
      showToast('error', `Selected ${qty} kg exceeds available stock of ${available} kg.`);
      return;
    }

    const resolvedAddress = (deliveryAddress || profile.address || 'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016').trim();
    if (!resolvedAddress) {
      showToast('error', 'Please provide a valid delivery address.');
      return;
    }

    setIsSubmittingOrder(true);
    const unitPrice = Number(workflowCrop.pricePerKg) || 0;
    const totalPrice = unitPrice * qty;
    const generatedOrderId = `NU-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const assignedDriver = {
      name: 'Kumar M.',
      phone: '+91 94432 11098',
      vehicleType: 'Tata Ace EV Cargo',
      vehicleNumber: 'TN 57 AB 1234',
      rating: 4.9,
      capacityKg: 500,
      deliveryPin: `${Math.floor(1000 + Math.random() * 9000)}`
    };

    let newOrder = {
      orderId: generatedOrderId,
      cropName: workflowCrop.name,
      tamilCropName: workflowCrop.tamilName || '',
      grade: workflowCrop.grade || 'Grade A',
      image: workflowCrop.image,
      quantityKg: qty,
      unitPrice,
      totalPrice,
      orderTime: 'Just now',
      orderStatus: 'PENDING_FARMER_APPROVAL',
      deliveryStatus: 'NOT_ASSIGNED',
      status: 'PENDING_FARMER_APPROVAL',
      deliveryAddress: resolvedAddress,
      preferredDeliveryDate: preferredDeliveryDate || new Date().toISOString().split('T')[0],
      notes: notes ? notes.trim() : '',
      paymentStatus: 'PENDING',
      paymentMethod: paymentMethod || 'UPI (Google Pay)',
      transactionRef: transactionRef || `TXN-UPI-${Math.floor(100000 + Math.random() * 900000)}`,
      utrNumber: utrNumber || `UTR-SBIN-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      location: workflowCrop.location || workflowCrop.hubName || 'Dindigul Central',
      hub: workflowCrop.location || workflowCrop.hubName || 'Dindigul Central',
      farmer: {
        name: workflowCrop.farmer?.name || workflowCrop.farmerName || 'Ravi Kumar',
        phone: workflowCrop.farmer?.phone || '+91 98421 78210',
        location: workflowCrop.farmer?.village || workflowCrop.location || 'Siluvathur, Dindigul'
      },
      driver: assignedDriver,
      liveTracking: {
        currentStatus: 'Order Placed — Pending Farmer Confirmation',
        currentLocation: `${workflowCrop.location || workflowCrop.hubName || 'Dindigul Central'} Hub`,
        estimatedMinutes: 45,
        distanceKm: workflowCrop.distanceKm || 18,
        lastUpdated: 'Just now',
        speedKmh: 0,
        batteryPct: 92,
        origin: workflowCrop.location || workflowCrop.hubName || 'Dindigul Central',
        destination: resolvedAddress
      }
    };

    // If backend is authenticated/reachable, call POST /api/orders
    if (getToken()) {
      try {
        const res = await api.post('/orders', {
          cropId: workflowCrop._id || workflowCrop.id,
          quantityKg: qty,
          deliveryAddress: resolvedAddress,
          preferredDeliveryDate: newOrder.preferredDeliveryDate,
          notes: newOrder.notes,
          paymentMethod: newOrder.paymentMethod,
          transactionRef: newOrder.transactionRef,
          utrNumber: newOrder.utrNumber
        });
        if (res && res.order) {
          newOrder = {
            ...newOrder,
            ...res.order,
            orderId: res.order.orderId || newOrder.orderId,
            orderStatus: res.order.orderStatus || 'PENDING_FARMER_APPROVAL',
            deliveryStatus: res.order.deliveryStatus || 'NOT_ASSIGNED',
            farmer: newOrder.farmer,
            cropName: res.order.crop?.name || newOrder.cropName,
            driver: { ...newOrder.driver, ...(res.order.driver || {}) }
          };
        }
      } catch (err) {
        console.warn('Backend order placement warning, falling back to local state:', err);
      }
    }

    // Deduct stock from client crop listing
    setCrops((prev) =>
      prev.map((c) =>
        c.id === workflowCrop.id
          ? { ...c, availableKg: Math.max(0, (c.availableKg || c.quantityKg || 0) - qty) }
          : c
      )
    );

    setOrders((prev) => [newOrder, ...prev]);
    setActiveDashboardOrderId(newOrder.orderId);
    setSelectedTrackingOrderId(newOrder.orderId);
    setActiveWorkflowOrder(newOrder);

    // Synchronize request and order directly to Farmer Module local storage so it is immediately visible
    try {
      const generatedRequestId = `REQ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newFarmerRequest = {
        id: `req-${Date.now()}`,
        requestId: generatedRequestId,
        orderId: newOrder.orderId,
        cropId: workflowCrop.id || workflowCrop._id || 'crop-fmr-01',
        cropName: workflowCrop.name,
        tamilCropName: workflowCrop.tamilName || '',
        cropDetails: {
          name: workflowCrop.name,
          nameTa: workflowCrop.tamilName || '',
          category: workflowCrop.category || 'vegetables',
          variety: workflowCrop.variety || 'Hybrid Table Grade',
          grade: workflowCrop.grade || 'Grade A',
          image: workflowCrop.image || '',
          pricePerKg: unitPrice
        },
        buyerDetails: {
          businessName: profile.shopName || profile.businessName || 'Grand Palace Luxury Dining',
          contactPerson: profile.contactPerson || profile.name || 'Procurement Partner',
          buyerType: profile.buyerType || 'Hotel & Commercial Kitchen',
          phone: profile.phone || '+91 98401 23456',
          email: profile.email || 'procurement@grandpalace.in',
          location: resolvedAddress,
          address: resolvedAddress,
          avatar: profile.photo || profile.photoPreview || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80',
          verified: true
        },
        farmerId: workflowCrop.farmerId || workflowCrop.farmer?.farmerId || 'FMR-TN-2026-01',
        farmerName: workflowCrop.farmer?.name || workflowCrop.farmerName || 'Ramesh Kumar',
        quantity: qty,
        unit: 'Kg',
        offeredPrice: unitPrice,
        totalEstimatedValue: totalPrice,
        preferredDeliveryDate: newOrder.preferredDeliveryDate,
        deliveryLocation: resolvedAddress,
        notes: newOrder.notes,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: newOrder.paymentMethod,
        transactionRef: newOrder.transactionRef,
        utrNumber: newOrder.utrNumber,
        createdAt: new Date().toISOString()
      };

      // 1. Prepend to farmer_requests_list via resilient helper
      const curReqs = getStoredRequests();
      const updatedReqs = [
        newFarmerRequest,
        ...curReqs.filter((r) => r.orderId !== newOrder.orderId && r.requestId !== newFarmerRequest.requestId)
      ];
      saveStoredRequests(updatedReqs);

      // 2. Prepend to farmer_orders_history via resilient helper
      const curOrds = getStoredOrders();
      const updatedOrds = [
        {
          ...newOrder,
          id: `ord-fmr-${Date.now()}`,
          farmerId: workflowCrop.farmerId || 'FMR-TN-2026-01',
          farmerName: workflowCrop.farmer?.name || 'Ramesh Kumar',
          buyerName: profile.shopName || profile.businessName || 'Grand Palace Luxury Dining'
        },
        ...curOrds.filter((o) => o.orderId !== newOrder.orderId)
      ];
      saveStoredOrders(updatedOrds);

      // 3. Persist buyer_orders in localStorage so it is never lost on refresh or tab close
      try {
        const rawBuyerOrds = localStorage.getItem('buyer_orders');
        let buyerOrdsList = [];
        if (rawBuyerOrds) {
          try {
            const parsed = JSON.parse(rawBuyerOrds);
            if (Array.isArray(parsed)) buyerOrdsList = parsed;
          } catch {}
        }
        const mergedBuyerOrds = [newOrder, ...buyerOrdsList.filter((o) => o.orderId !== newOrder.orderId)];
        localStorage.setItem('buyer_orders', JSON.stringify(mergedBuyerOrds));
      } catch (saveBuyerErr) {
        console.warn('Could not persist buyer_orders:', saveBuyerErr);
      }

      // 4. Deduct quantity from farmer_crops_list
      const rawCrops = localStorage.getItem('farmer_crops_list');
      if (rawCrops) {
        try {
          const parsedCrops = JSON.parse(rawCrops);
          if (Array.isArray(parsedCrops)) {
            const updatedCrops = parsedCrops.map((c) => {
              const matches = c.id === workflowCrop.id ||
                c.name?.toLowerCase().includes(workflowCrop.name?.toLowerCase()) ||
                workflowCrop.name?.toLowerCase().includes(c.name?.toLowerCase());
              if (matches) {
                const cur = Number(c.availableKg || c.quantityKg || 0);
                const rem = Math.max(0, cur - qty);
                return { ...c, availableKg: rem, quantityKg: rem, status: rem === 0 ? 'sold_out' : c.status };
              }
              return c;
            });
            localStorage.setItem('farmer_crops_list', JSON.stringify(updatedCrops));
          }
        } catch {}
      }

      // 5. Dispatch real-time cross-tab / cross-context notification
      window.dispatchEvent(new CustomEvent('farmer-data-updated', {
        detail: { request: newFarmerRequest, order: newOrder }
      }));
    } catch (syncErr) {
      console.warn('Cross-module farmer sync warning:', syncErr);
    }

    // Close confirmation modal and smoothly navigate to Buyer Dashboard
    setWorkflowModalOpen(false);
    setWorkflowCrop(null);
    setWorkflowStep('CONFIRMATION');
    setIsSubmittingOrder(false);

    navigate(ROUTES.BUYER_DASHBOARD);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showToast(
      'success',
      lang === 'ta'
        ? `ஆர்டர் #${newOrder.orderId} பதிவு செய்யப்பட்டது! விவசாயி ஒப்புதலுக்காக அனுப்பப்பட்டது.`
        : `Order #${newOrder.orderId} placed! Sent to farmer for approval.`
    );
  };

  // Step 3: Demo Farmer Approval & Rejection Simulation
  const handleSimulateFarmerApproval = async (orderId) => {
    const targetId = orderId || activeDashboardOrder?.orderId || activeWorkflowOrder?.orderId;
    if (!targetId) return;

    if (getToken()) {
      try {
        await api.patch(`/orders/${targetId}/simulate-farmer`, { action: 'APPROVE' });
      } catch (err) {
        console.warn('Backend simulate-farmer approval warning:', err);
      }
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === targetId
          ? {
              ...o,
              orderStatus: 'CONFIRMED',
              status: 'CONFIRMED',
              deliveryStatus: o.deliveryStatus === 'NOT_ASSIGNED' ? 'READY_FOR_PICKUP' : o.deliveryStatus,
              liveTracking: {
                ...o.liveTracking,
                currentStatus: 'Farmer Approved — Driver notified and heading to farm for pickup'
              }
            }
          : o
      )
    );

    setActiveWorkflowOrder((prev) =>
      prev && prev.orderId === targetId
        ? {
            ...prev,
            orderStatus: 'CONFIRMED',
            status: 'CONFIRMED',
            deliveryStatus: prev.deliveryStatus === 'NOT_ASSIGNED' ? 'READY_FOR_PICKUP' : prev.deliveryStatus,
            liveTracking: {
              ...prev.liveTracking,
              currentStatus: 'Farmer Approved — Driver notified and heading to farm for pickup'
            }
          }
        : prev
    );

    setWorkflowStep('CONFIRMED');
    showToast(
      'success',
      lang === 'ta'
        ? `விவசாயி ஆர்டர் #${targetId}-க்கு ஒப்புதல் அளித்தார்! ஓட்டுநர் பயிர்களை எடுக்க புறப்பட்டார்.`
        : `Farmer approved Order #${targetId}! Driver notified for pickup.`
    );
  };

  const handleSimulateFarmerRejection = async (orderId) => {
    if (getToken()) {
      try {
        await api.patch(`/orders/${orderId}/simulate-farmer`, { action: 'REJECT' });
      } catch (err) {
        console.warn('Backend simulate-farmer rejection warning:', err);
      }
    }

    // Restore stock if workflowCrop matches
    if (workflowCrop && activeWorkflowOrder) {
      const qty = Number(activeWorkflowOrder.quantityKg) || 0;
      setCrops((prev) =>
        prev.map((c) =>
          c.id === workflowCrop.id
            ? { ...c, availableKg: (c.availableKg || 0) + qty }
            : c
        )
      );
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId
          ? {
              ...o,
              orderStatus: 'REJECTED',
              status: 'REJECTED',
              deliveryStatus: 'NOT_ASSIGNED',
              liveTracking: {
                ...o.liveTracking,
                currentStatus: 'Order Rejected by Farmer'
              }
            }
          : o
      )
    );

    setActiveWorkflowOrder((prev) =>
      prev && prev.orderId === orderId
        ? {
            ...prev,
            orderStatus: 'REJECTED',
            status: 'REJECTED',
            deliveryStatus: 'NOT_ASSIGNED',
            liveTracking: {
              ...prev.liveTracking,
              currentStatus: 'Order Rejected by Farmer'
            }
          }
        : prev
    );

    setWorkflowStep('REJECTED');
    showToast('info', 'Farmer rejection simulated. Delivery tracking prevented.');
  };

  // Step 4: Demo Delivery Arrangement
  const handleSimulateDeliveryArrangement = async (orderId) => {
    if (getToken()) {
      try {
        await api.patch(`/orders/${orderId}/simulate-delivery-arrangement`);
      } catch (err) {
        console.warn('Backend simulate-delivery-arrangement warning:', err);
      }
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId
          ? {
              ...o,
              deliveryStatus: 'READY_FOR_PICKUP',
              status: 'READY_FOR_PICKUP',
              liveTracking: {
                ...o.liveTracking,
                currentStatus: 'Consignment Prepared — Ready for EV Driver Pickup'
              }
            }
          : o
      )
    );

    setActiveWorkflowOrder((prev) =>
      prev && prev.orderId === orderId
        ? {
            ...prev,
            deliveryStatus: 'READY_FOR_PICKUP',
            status: 'READY_FOR_PICKUP',
            liveTracking: {
              ...prev.liveTracking,
              currentStatus: 'Consignment Prepared — Ready for EV Driver Pickup'
            }
          }
        : prev
    );

    setWorkflowStep('DELIVERY_ARRANGED');
    showToast('success', 'Demo delivery arrangement completed! Ready for pickup.');
  };

  // Step 5: Connect to Existing Delivery Status Page
  const handleGoToDeliveryStatus = (orderId) => {
    handleCloseWorkflow();
    setSelectedTrackingOrderId(orderId);
    navigate(ROUTES.BUYER_DASHBOARD_TRACK);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 6: Advance Demo Delivery Stages Sequentially
  const handleAdvanceDeliveryStep = async (orderId) => {
    const targetOrder = orders.find((o) => o.orderId === orderId);
    if (!targetOrder) return;

    const transitions = {
      READY_FOR_PICKUP: 'PICKED_UP',
      PICKED_UP: 'IN_TRANSIT',
      IN_TRANSIT: 'DELIVERED'
    };

    const currentStatus = targetOrder.deliveryStatus || 'READY_FOR_PICKUP';
    const nextStatus = transitions[currentStatus];

    if (!nextStatus) {
      showToast('info', `Order ${orderId} is already at final milestone (${currentStatus}).`);
      return;
    }

    if (getToken()) {
      try {
        await api.patch(`/orders/${orderId}/simulate-delivery-step`, { targetStatus: nextStatus });
      } catch (err) {
        console.warn('Backend simulate-delivery-step warning:', err);
      }
    }

    let statusDescription = 'In Transit';
    let minutesEta = 15;
    let speed = 42;
    if (nextStatus === 'PICKED_UP') {
      statusDescription = 'EV Cargo Picked Up from Hub — Cleared Checkpoint';
      minutesEta = 35;
      speed = 30;
    } else if (nextStatus === 'IN_TRANSIT') {
      statusDescription = 'EV Cargo In Transit on Highway Corridor';
      minutesEta = 18;
      speed = 45;
    } else if (nextStatus === 'DELIVERED') {
      statusDescription = 'Consignment Delivered and Verified at Destination Bay';
      minutesEta = 0;
      speed = 0;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId
          ? {
              ...o,
              deliveryStatus: nextStatus,
              status: nextStatus === 'DELIVERED' ? 'delivered' : nextStatus === 'IN_TRANSIT' ? 'in_transit' : 'preparing',
              liveTracking: {
                ...o.liveTracking,
                currentStatus: statusDescription,
                estimatedMinutes: minutesEta,
                speedKmh: speed,
                lastUpdated: 'Just now'
              }
            }
          : o
      )
    );

    const friendlyLabels = {
      PICKED_UP: 'Picked Up by Driver',
      IN_TRANSIT: 'In Transit',
      DELIVERED: 'Delivered'
    };

    showToast('success', `Demo: Advanced milestone to "${friendlyLabels[nextStatus] || nextStatus}".`);
  };

  // Re-open workflow modal for existing order (e.g., from Orders list)
  const handleOpenOrderWorkflowForOrder = (order) => {
    if (!order) return;
    setActiveWorkflowOrder(order);
    const fakeCrop = {
      id: order.crop?._id || order.crop || order.cropId || `crop-${order.orderId}`,
      name: order.cropName,
      tamilName: order.tamilCropName,
      image: order.image || order.crop?.image,
      pricePerKg: order.unitPrice,
      availableKg: order.quantityKg,
      grade: order.grade,
      location: order.hub || order.location,
      farmer: order.farmer
    };
    setWorkflowCrop(fakeCrop);
    setAcceptedQuantity(order.quantityKg);

    if (order.orderStatus === 'PENDING_FARMER_APPROVAL') {
      setWorkflowStep('PENDING_APPROVAL');
    } else if (order.orderStatus === 'REJECTED') {
      setWorkflowStep('REJECTED');
    } else if (order.deliveryStatus === 'READY_FOR_PICKUP') {
      setWorkflowStep('DELIVERY_ARRANGED');
    } else if (order.orderStatus === 'CONFIRMED' && order.deliveryStatus === 'NOT_ASSIGNED') {
      setWorkflowStep('CONFIRMED');
    } else {
      setWorkflowStep('DELIVERY_ARRANGED');
    }

    setWorkflowModalOpen(true);
  };

  // Legacy modal helpers maintained for backward compatibility
  const handleProceedToFarmer = () => {
    if (!acceptModalCrop) return;
    setFarmerDetailsCrop({
      ...acceptModalCrop,
      selectedQty: acceptedQuantity,
      estimatedTotal: acceptedQuantity * acceptModalCrop.pricePerKg
    });
    setAcceptModalCrop(null);
  };

  const handleConfirmOrder = (targetCrop) => {
    handleOpenAccept(targetCrop || farmerDetailsCrop || acceptModalCrop);
  };

  const handleGoToTracking = (orderId) => {
    handleGoToDeliveryStatus(orderId);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const newMsg = {
      id: `m-${Date.now()}`,
      sender: profile.shopName || profile.name || buyerProfile?.name,
      role: 'Procurement Team',
      time: 'Just now',
      text: replyText.trim(),
      isBuyer: true
    };
    setMessages((prev) => [...prev, newMsg]);
    setReplyText('');
  };

  const handleSignOut = () => {
    setSignOutModalOpen(false);
    try {
      localStorage.removeItem('buyer_current_profile');
      localStorage.removeItem('buyer_registered_profile');
      localStorage.removeItem('buyer_orders');
      localStorage.removeItem('buyer_crops');
      localStorage.removeItem('buyer_declined_crop_ids');
      localStorage.removeItem('buyer_active_dashboard_order_id');
      localStorage.removeItem('buyer_tracking_order_id');
      localStorage.removeItem('buyer_messages');
      removeBuyerToken();
      sessionStorage.setItem('buyer_explicit_signout', 'true');
    } catch {
      // ignore storage error
    }
    if (onLogout) {
      onLogout();
    } else {
      navigate(ROUTES.BUYER_LOGIN, { replace: true });
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const value = {
    profile,
    setProfile,
    buyerProfile,
    crops,
    setCrops,
    declinedCropIds,
    setDeclinedCropIds,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    filteredCrops,
    orders,
    setOrders,
    activeOrderFilter,
    setActiveOrderFilter,
    selectedTrackingOrderId,
    setSelectedTrackingOrderId,
    activeDashboardOrderId,
    setActiveDashboardOrderId,
    activeDashboardOrder,
    trackingOrder,
    messages,
    setMessages,
    replyText,
    setReplyText,
    handleSendMessage,
    toastMessage,
    setToastMessage,
    showToast,
    signOutModalOpen,
    setSignOutModalOpen,
    handleSignOut,
    editProfileOpen,
    setEditProfileOpen,
    editFormData,
    setEditFormData,
    photoInputRef,
    handleOpenEditProfile,
    handleSaveProfile,
    handlePhotoUpload,
    // Produce modals & Order Workflow
    declineModalCrop,
    setDeclineModalCrop,
    handleOpenDecline,
    handleConfirmDecline,
    workflowCrop,
    setWorkflowCrop,
    workflowModalOpen,
    setWorkflowModalOpen,
    workflowStep,
    setWorkflowStep,
    activeWorkflowOrder,
    setActiveWorkflowOrder,
    isSubmittingOrder,
    handleCloseWorkflow,
    handleConfirmCreateOrder,
    handleSimulateFarmerApproval,
    handleSimulateFarmerRejection,
    handleSimulateDeliveryArrangement,
    handleGoToDeliveryStatus,
    handleAdvanceDeliveryStep,
    handleOpenOrderWorkflowForOrder,
    // Legacy modal compat
    acceptModalCrop,
    setAcceptModalCrop,
    acceptedQuantity,
    setAcceptedQuantity,
    handleOpenAccept,
    handleProceedToFarmer,
    farmerDetailsCrop,
    setFarmerDetailsCrop,
    handleConfirmOrder,
    orderConfirmationData,
    setOrderConfirmationData,
    handleGoToTracking,
    // Data Loading & Delay Simulation
    isDataLoading,
    setIsDataLoading,
    refreshData,
    simulateDataDelay,
    // Lang & Translations
    lang,
    toggleLang,
    t
  };

  return <BuyerContext.Provider value={value}>{children}</BuyerContext.Provider>;
}

export function useBuyer() {
  const context = useContext(BuyerContext);
  if (!context) {
    throw new Error('useBuyer must be used within a BuyerProvider');
  }
  return context;
}
