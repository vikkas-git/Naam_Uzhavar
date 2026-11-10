// What this file does: Service layer for Farmer crop listings and produce inventory management.
// Integrates with backend REST endpoints with persistent local storage fallbacks.

import api from '../utils/api';
import { INITIAL_FARMER_CROPS } from '../data/farmerMockData';

const FARMER_CROPS_STORAGE_KEY = 'farmer_crops_list';

const CROP_DEFAULT_IMAGES = {
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
  carrot: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=600&auto=format&fit=crop&q=80'
};
export { CROP_DEFAULT_IMAGES };

export const resolveCropFallbackImage = (cropName) => {
  const norm = String(cropName || '').toLowerCase();
  if (norm.includes('onion') || norm.includes('வெங்காயம்')) return CROP_DEFAULT_IMAGES.onion;
  if (norm.includes('potato') || norm.includes('உருளை')) return CROP_DEFAULT_IMAGES.potato;
  if (norm.includes('carrot') || norm.includes('கேரட்')) return CROP_DEFAULT_IMAGES.carrot;
  if (norm.includes('tomato') || norm.includes('தக்காளி')) return CROP_DEFAULT_IMAGES.tomato;
  return CROP_DEFAULT_IMAGES.tomato;
};

/**
 * Deduplicate crops list by unique ID and staple produce category
 * to prevent repeated tomato submissions, filter out tender coconut,
 * and guarantee proper non-tomato images for all crops.
 */
export const deduplicateCrops = (list) => {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenTypes = new Set();
  const cleanList = [];

  for (const crop of list) {
    if (!crop) continue;

    const normName = String(crop.name || '').trim().toLowerCase();

    // 1. Strictly remove tender coconut from produce listings
    if (normName.includes('coconut') || normName.includes('tender') || normName.includes('இளநீர்')) {
      continue;
    }

    // 2. Remove turmeric or other unwanted crops (strictly keep the 4 staple crops + user-created crops)
    if (normName.includes('turmeric') || normName.includes('மஞ்சள்')) {
      continue;
    }

    const id = crop.id || crop._id;
    if (id && seenIds.has(String(id))) continue;

    // 3. Prevent duplicate staple crop listings (e.g. repeated tomato submissions)
    let stapleType = null;
    if (normName.includes('tomato') || normName.includes('தக்காளி')) stapleType = 'tomato';
    else if (normName.includes('onion') || normName.includes('வெங்காயம்')) stapleType = 'onion';
    else if (normName.includes('potato') || normName.includes('உருளை')) stapleType = 'potato';
    else if (normName.includes('carrot') || normName.includes('கேரட்')) stapleType = 'carrot';

    if (stapleType) {
      if (seenTypes.has(stapleType)) {
        continue; // Drop repeating duplicate rows of the same staple crop
      }
      seenTypes.add(stapleType);
    }

    if (id) seenIds.add(String(id));

    // Ensure proper image matching the crop type rather than defaulting to tomato
    const correctedImage = crop.image && !crop.image.includes('photo-1592924357228')
      ? crop.image
      : (stapleType ? CROP_DEFAULT_IMAGES[stapleType] : crop.image);

    cleanList.push({
      ...crop,
      image: correctedImage || resolveCropFallbackImage(crop.name)
    });
  }
  return cleanList;
};

export const ensureStapleCrops = (list) => {
  let clean = deduplicateCrops(list);

  // Guarantee strictly all 4 staple crops exist: Tomato, Onion, Potato, Carrot
  const hasTomato = clean.some((c) => String(c.name || '').toLowerCase().includes('tomato') || String(c.nameTa || '').includes('தக்காளி'));
  const hasOnion = clean.some((c) => String(c.name || '').toLowerCase().includes('onion') || String(c.nameTa || '').includes('வெங்காயம்'));
  const hasPotato = clean.some((c) => String(c.name || '').toLowerCase().includes('potato') || String(c.nameTa || '').includes('உருளை'));
  const hasCarrot = clean.some((c) => String(c.name || '').toLowerCase().includes('carrot') || String(c.nameTa || '').includes('கேரட்'));

  const staplesToAdd = [];
  if (!hasTomato) {
    const tomato = INITIAL_FARMER_CROPS.find((c) => c.name.toLowerCase().includes('tomato'));
    if (tomato) staplesToAdd.push(tomato);
  }
  if (!hasOnion) {
    const onion = INITIAL_FARMER_CROPS.find((c) => c.name.toLowerCase().includes('onion'));
    if (onion) staplesToAdd.push(onion);
  }
  if (!hasPotato) {
    const potato = INITIAL_FARMER_CROPS.find((c) => c.name.toLowerCase().includes('potato'));
    if (potato) staplesToAdd.push(potato);
  }
  if (!hasCarrot) {
    const carrot = INITIAL_FARMER_CROPS.find((c) => c.name.toLowerCase().includes('carrot'));
    if (carrot) staplesToAdd.push(carrot);
  }

  if (staplesToAdd.length > 0) {
    clean = deduplicateCrops([...clean, ...staplesToAdd]);
  }

  // Sort in intuitive standard order: Tomato, Onion, Potato, Carrot
  const getOrder = (c) => {
    const n = (c.name || '').toLowerCase();
    if (n.includes('tomato')) return 1;
    if (n.includes('onion')) return 2;
    if (n.includes('potato')) return 3;
    if (n.includes('carrot')) return 4;
    return 5;
  };
  clean.sort((a, b) => getOrder(a) - getOrder(b));

  return clean;
};

export const getStoredCrops = () => {
  try {
    const raw = localStorage.getItem(FARMER_CROPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = ensureStapleCrops(parsed);
        saveStoredCrops(clean);
        return clean;
      }
    }
  } catch {
    // ignore
  }
  return ensureStapleCrops(INITIAL_FARMER_CROPS);
};

export const saveStoredCrops = (crops, dispatchEvent = false) => {
  try {
    const clean = ensureStapleCrops(crops);
    localStorage.setItem(FARMER_CROPS_STORAGE_KEY, JSON.stringify(clean));
    if (dispatchEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farmer-data-updated'));
    }
  } catch {
    // ignore
  }
};

export const cropService = {
  /**
   * Get Farmer Crop Listings
   */
  async getCrops(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.sortBy) query.append('sortBy', params.sortBy);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    try {
      const res = await api.get(`/farmer/crops${queryString}`);
      if (res && Array.isArray(res.crops)) {
        const clean = ensureStapleCrops(res.crops);
        saveStoredCrops(clean);
        return { crops: clean, count: clean.length, isDemo: false };
      }
    } catch (err) {
      console.warn('API getCrops notice, filtering from local storage:', err.message);
    }

    let list = getStoredCrops();

    if (params.status && params.status !== 'all') {
      list = list.filter((c) => String(c.status || 'active').toLowerCase() === params.status.toLowerCase());
    }

    if (params.category && params.category !== 'all') {
      list = list.filter((c) => String(c.category || '').toLowerCase() === params.category.toLowerCase());
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.tamilName && c.tamilName.toLowerCase().includes(q)) ||
          (c.variety && c.variety.toLowerCase().includes(q))
      );
    }

    if (params.sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return { crops: list, count: list.length, isDemo: true };
  },

  /**
   * Create New Crop Listing
   */
  async createCrop(cropData) {
    try {
      const res = await api.post('/farmer/crops', cropData);
      if (res && res.crop) {
        const stored = getStoredCrops();
        saveStoredCrops([res.crop, ...stored]);
        return { success: true, crop: res.crop, message: res.message, isDemo: false };
      }
    } catch (err) {
      console.warn('API createCrop notice, persisting to local storage:', err.message);
    }

    const newCrop = {
      id: `crop-fmr-${Date.now()}`,
      _id: `crop-fmr-${Date.now()}`,
      name: cropData.name,
      tamilName: cropData.nameTa || cropData.tamilName || '',
      category: cropData.category || 'vegetables',
      grade: cropData.grade || 'Grade A',
      variety: cropData.variety || 'Commercial Variety',
      farmingMethod: cropData.farmingMethod || 'Natural',
      pricePerKg: Number(cropData.expectedPrice || cropData.pricePerKg),
      availableKg: Number(cropData.quantity || cropData.availableQuantity || cropData.quantityKg),
      unit: cropData.unit || 'Kg',
      priceUnit: cropData.priceUnit || 'per Kg',
      farmerId: 'FMR-TN-2026-01',
      farmerName: 'Ramesh Kumar',
      hub: `${cropData.district || 'Pollachi'} Hub`,
      distanceKm: 12,
      image: cropData.image || (cropData.images && cropData.images[0]) || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      images: cropData.images || [cropData.image],
      pickupDate: cropData.pickupDate || '2026-11-03',
      status: 'active',
      enquiryCount: 0,
      farmLocation: {
        address: cropData.farmAddress,
        village: cropData.village,
        taluk: cropData.taluk,
        district: cropData.district,
        pincode: cropData.pincode,
        gps: cropData.gps
      },
      createdAt: new Date().toISOString()
    };

    const stored = getStoredCrops();
    saveStoredCrops([newCrop, ...stored]);

    return {
      success: true,
      crop: newCrop,
      message: 'Produce listed successfully and is now active in Buyer Marketplace!',
      isDemo: true
    };
  },

  /**
   * Update Crop Details
   */
  async updateCrop(id, updates) {
    try {
      const res = await api.put(`/farmer/crops/${id}`, updates);
      if (res && res.crop) {
        return { success: true, crop: res.crop };
      }
    } catch (err) {
      console.warn('API updateCrop notice:', err.message);
    }

    const stored = getStoredCrops();
    const index = stored.findIndex((c) => c.id === id || c._id === id);
    if (index !== -1) {
      stored[index] = { ...stored[index], ...updates };
      saveStoredCrops(stored);
      return { success: true, crop: stored[index] };
    }

    return { success: false, message: 'Crop not found' };
  },

  /**
   * Pause / Resume Listing Status
   */
  async updateStatus(id, status) {
    try {
      const res = await api.patch(`/farmer/crops/${id}/status`, { status });
      if (res && res.crop) {
        return { success: true, crop: res.crop };
      }
    } catch (err) {
      console.warn('API updateStatus notice:', err.message);
    }

    const stored = getStoredCrops();
    const crop = stored.find((c) => c.id === id || c._id === id);
    if (crop) {
      crop.status = status;
      saveStoredCrops(stored);
      return { success: true, crop };
    }

    return { success: false, message: 'Crop not found' };
  },

  /**
   * Soft Remove Listing (Marks as removed, hides from buyer marketplace)
   */
  async removeCrop(id) {
    try {
      const res = await api.post(`/farmer/crops/${id}/remove`);
      if (res && res.crop) {
        return { success: true, crop: res.crop, message: res.message };
      }
    } catch (err) {
      if (err.message && (err.message.includes('Active order') || err.message.includes('progress'))) {
        return { success: false, message: err.message };
      }
      console.warn('API removeCrop notice, updating locally:', err.message);
    }

    const stored = getStoredCrops();
    const crop = stored.find((c) => c.id === id || c._id === id);
    if (crop) {
      crop.status = 'removed';
      saveStoredCrops(stored);
      return { success: true, crop, message: 'Crop listing removed from active marketplace.' };
    }

    return { success: false, message: 'Crop not found' };
  }
};

export default cropService;
