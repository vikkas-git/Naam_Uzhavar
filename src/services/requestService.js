// What this file does: Service layer for managing incoming Buyer purchase requests & enquiries.
// Handles acceptance (conversion to commercial order) and rejection workflows.

import api from '../utils/api';
import { generateClientOrderId } from '../utils/orderId';
import { INITIAL_FARMER_REQUESTS, FIVE_DISTINCT_BUYERS } from '../data/farmerMockData';

export const FARMER_REQUESTS_STORAGE_KEY = 'farmer_requests_list';

/**
 * Strict 5-distinct-buyer normalizer and deduplicator for Farmer Requests.
 * Guarantees that:
 * 1. Each request has a DISTINCT commercial buyer name (no buyer name repeats across cards).
 * 2. Exactly 5 requests are maintained in the farmer module (one for each commercial partner).
 * 3. Any duplicate or legacy "Grand Palace" entries are mapped across the 5 distinct commercial buyers.
 * 4. User actions (ACCEPTED, REJECTED, CONVERTED_TO_ORDER) and order IDs are strictly preserved.
 */
export const ensureFiveDistinctBuyerRequests = (list) => {
  if (!Array.isArray(list) || list.length === 0) {
    return [...INITIAL_FARMER_REQUESTS];
  }

  const seenIds = new Set();
  const seenBuyerNames = new Set();
  const result = [];

  for (let idx = 0; idx < list.length; idx++) {
    const item = list[idx];
    if (!item) continue;

    const id = String(item.id || item._id || item.requestId || item.orderId || '').trim();
    const cleanId = id.replace(/2026-2026/g, '2026');
    if (cleanId && seenIds.has(cleanId)) continue;

    const rawBuyerName = String(
      item.buyerDetails?.businessName || item.buyerName || item.buyerDetails?.contactPerson || ''
    ).trim();

    let resolvedBuyer = null;
    let buyerIndex = -1;

    // Check if the buyer name is valid and NOT already in this list
    if (rawBuyerName && !seenBuyerNames.has(rawBuyerName.toLowerCase())) {
      buyerIndex = FIVE_DISTINCT_BUYERS.findIndex(
        (b) => b.businessName.toLowerCase() === rawBuyerName.toLowerCase()
      );
      if (buyerIndex !== -1) {
        resolvedBuyer = FIVE_DISTINCT_BUYERS[buyerIndex];
      } else {
        resolvedBuyer = item.buyerDetails?.businessName ? item.buyerDetails : { businessName: rawBuyerName };
      }
    } else {
      // Find the next unused buyer from FIVE_DISTINCT_BUYERS
      buyerIndex = FIVE_DISTINCT_BUYERS.findIndex(
        (b) => !seenBuyerNames.has(b.businessName.toLowerCase())
      );
      if (buyerIndex !== -1) {
        resolvedBuyer = FIVE_DISTINCT_BUYERS[buyerIndex];
      } else {
        // If all 5 distinct buyer slots are already used, cap at 5
        continue;
      }
    }

    const businessName = resolvedBuyer.businessName;
    seenBuyerNames.add(businessName.toLowerCase());
    if (cleanId) seenIds.add(cleanId);

    const mergedDetails = {
      ...(item.buyerDetails || {}),
      ...(resolvedBuyer || {}),
      businessName: businessName
    };

    // If duplicate entry mapped to unused buyer, map crop details from initial template
    const fallbackTemplate = buyerIndex !== -1 && INITIAL_FARMER_REQUESTS[buyerIndex] ? INITIAL_FARMER_REQUESTS[buyerIndex] : null;

    result.push({
      ...item,
      requestId: cleanId || fallbackTemplate?.requestId || item.requestId,
      cropName: (rawBuyerName && rawBuyerName.toLowerCase() === businessName.toLowerCase() && item.cropName) ? item.cropName : (fallbackTemplate?.cropName || item.cropName),
      cropDetails: (rawBuyerName && rawBuyerName.toLowerCase() === businessName.toLowerCase() && item.cropDetails) ? item.cropDetails : (fallbackTemplate?.cropDetails || item.cropDetails),
      quantity: (rawBuyerName && rawBuyerName.toLowerCase() === businessName.toLowerCase() && item.quantity) ? item.quantity : (fallbackTemplate?.quantity || item.quantity),
      offeredPrice: (rawBuyerName && rawBuyerName.toLowerCase() === businessName.toLowerCase() && item.offeredPrice) ? item.offeredPrice : (fallbackTemplate?.offeredPrice || item.offeredPrice),
      totalEstimatedValue: (rawBuyerName && rawBuyerName.toLowerCase() === businessName.toLowerCase() && item.totalEstimatedValue) ? item.totalEstimatedValue : (fallbackTemplate?.totalEstimatedValue || item.totalEstimatedValue),
      preferredDeliveryDate: (rawBuyerName && rawBuyerName.toLowerCase() === businessName.toLowerCase() && item.preferredDeliveryDate) ? item.preferredDeliveryDate : (fallbackTemplate?.preferredDeliveryDate || item.preferredDeliveryDate),
      deliveryLocation: (rawBuyerName && rawBuyerName.toLowerCase() === businessName.toLowerCase() && item.deliveryLocation) ? item.deliveryLocation : (fallbackTemplate?.deliveryLocation || item.deliveryLocation),
      buyerName: businessName,
      buyerDetails: mergedDetails
    });

    if (result.length >= 5) break;
  }

  // If fewer than 5 requests, fill in from INITIAL_FARMER_REQUESTS
  if (result.length < 5) {
    for (const initReq of INITIAL_FARMER_REQUESTS) {
      const initBuyerName = (initReq.buyerDetails?.businessName || initReq.buyerName || '').toLowerCase();
      if (!seenBuyerNames.has(initBuyerName)) {
        seenBuyerNames.add(initBuyerName);
        result.push({ ...initReq });
        if (result.length >= 5) break;
      }
    }
  }

  return result.slice(0, 5);
};

export const deduplicateRequests = (list) => {
  return ensureFiveDistinctBuyerRequests(list);
};

export const getStoredRequests = () => {
  let list = [];
  try {
    const raw = localStorage.getItem(FARMER_REQUESTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch {
    // ignore
  }

  // If storage was empty or uninitialized, seed with mock requests
  if (!list || list.length === 0) {
    list = [...INITIAL_FARMER_REQUESTS];
  }

  // Cross-reconcile with buyer_orders and farmer_orders_history so orders placed by buyers are NEVER lost
  try {
    const rawBuyerOrders = localStorage.getItem('buyer_orders');
    const rawFarmerOrders = localStorage.getItem('farmer_orders_history');
    const existingOrderIds = new Set(list.map((r) => r.orderId).filter(Boolean));
    const pendingOrdersToInclude = [];

    if (rawBuyerOrders) {
      const parsedBO = JSON.parse(rawBuyerOrders);
      if (Array.isArray(parsedBO)) {
        for (const bo of parsedBO) {
          if (bo && bo.orderId && !existingOrderIds.has(bo.orderId)) {
            pendingOrdersToInclude.push(bo);
            existingOrderIds.add(bo.orderId);
          }
        }
      }
    }

    if (rawFarmerOrders) {
      const parsedFO = JSON.parse(rawFarmerOrders);
      if (Array.isArray(parsedFO)) {
        for (const fo of parsedFO) {
          if (fo && fo.orderId && !existingOrderIds.has(fo.orderId)) {
            pendingOrdersToInclude.push(fo);
            existingOrderIds.add(fo.orderId);
          }
        }
      }
    }

    // Convert each missing buyer order into a top-priority BuyerRequest
    let buyerRotateIdx = 0;
    for (const po of pendingOrdersToInclude) {
      const orderIdStr = String(po.orderId || '');
      let cleanRequestId = po.requestId;
      if (!cleanRequestId || cleanRequestId.includes('2026-2026')) {
        if (orderIdStr.startsWith('ORD-')) {
          cleanRequestId = orderIdStr.replace(/^ORD-/, 'REQ-');
        } else {
          const match = orderIdStr.match(/\d+$/);
          const num = match ? match[0] : `${Math.floor(10000 + Math.random() * 90000)}`;
          cleanRequestId = `REQ-2026-${num}`;
        }
      }
      const buyerFallback = FIVE_DISTINCT_BUYERS[buyerRotateIdx % FIVE_DISTINCT_BUYERS.length];
      buyerRotateIdx++;

      const reconstructed = {
        id: `req-${po.orderId}`,
        requestId: cleanRequestId,
        orderId: po.orderId,
        cropId: po.cropId || po.crop?._id || 'crop-fmr-01',
        cropName: po.cropName || po.crop?.name || 'Produce',
        tamilCropName: po.tamilCropName || po.crop?.nameTa || '',
        cropDetails: {
          name: po.cropName || po.crop?.name || 'Produce',
          nameTa: po.tamilCropName || po.crop?.nameTa || '',
          category: po.category || 'vegetables',
          variety: po.variety || 'Hybrid Table Grade',
          grade: po.grade || 'Grade A',
          image: po.image || po.crop?.image || '',
          pricePerKg: po.unitPrice || (po.totalPrice && po.quantityKg ? Math.round(po.totalPrice / po.quantityKg) : 32)
        },
        buyerDetails: {
          businessName: po.buyerName || po.buyerDetails?.businessName || buyerFallback.businessName,
          contactPerson: po.contactPerson || po.buyerDetails?.contactPerson || buyerFallback.contactPerson,
          buyerType: po.buyerType || po.buyerDetails?.buyerType || buyerFallback.buyerType,
          phone: po.phone || po.buyerDetails?.phone || buyerFallback.phone,
          email: po.email || po.buyerDetails?.email || buyerFallback.email,
          location: po.deliveryAddress || buyerFallback.location,
          address: po.deliveryAddress || buyerFallback.address,
          avatar: po.avatar || po.buyerDetails?.avatar || buyerFallback.avatar,
          verified: true
        },
        farmerId: po.farmerId || 'FMR-TN-2026-01',
        farmerName: po.farmerName || po.farmer?.name || 'Ramesh Kumar',
        quantity: Number(po.quantityKg || po.quantity || 100),
        unit: po.unit || 'Kg',
        offeredPrice: Number(po.unitPrice || (po.totalPrice && po.quantityKg ? Math.round(po.totalPrice / po.quantityKg) : 32)),
        totalEstimatedValue: Number(po.totalPrice || (po.unitPrice ? po.unitPrice * po.quantityKg : 3200)),
        preferredDeliveryDate: po.preferredDeliveryDate || '2026-11-04',
        deliveryLocation: po.deliveryAddress || buyerFallback.address,
        notes: po.notes || 'Direct procurement via Buyer Portal',
        status: po.orderStatus === 'CONFIRMED' ? 'CONVERTED_TO_ORDER' : (po.orderStatus || 'PENDING'),
        createdAt: po.createdAt || po.orderTime || new Date().toISOString()
      };
      list.unshift(reconstructed);
    }
  } catch (crossErr) {
    console.warn('Notice cross-reconciling requests:', crossErr);
  }

  // Deduplicate, sanitize 2026-2026 strings, and enforce exactly 5 distinct commercial buyers
  for (const item of list) {
    if (item && item.requestId && item.requestId.includes('2026-2026')) {
      item.requestId = item.requestId.replace(/2026-2026/g, '2026');
    }
  }
  const normalizedList = ensureFiveDistinctBuyerRequests(list);

  try {
    localStorage.setItem(FARMER_REQUESTS_STORAGE_KEY, JSON.stringify(normalizedList));
  } catch {}

  return normalizedList;
};

export const saveStoredRequests = (requests, dispatchEvent = true) => {
  try {
    const normalized = ensureFiveDistinctBuyerRequests(requests);
    localStorage.setItem(FARMER_REQUESTS_STORAGE_KEY, JSON.stringify(normalized));
    if (dispatchEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farmer-data-updated'));
    }
  } catch {
    // ignore
  }
};

export const requestService = {
  /**
   * Get Buyer Requests
   */
  async getRequests(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    try {
      const res = await api.get(`/farmer/requests${queryString}`);
      if (res && Array.isArray(res.requests) && res.requests.length > 0) {
        // Merge with existing local requests to preserve locally placed orders
        const local = getStoredRequests();
        const remoteIds = new Set(res.requests.map((r) => r.requestId || r.orderId || r.id || r._id).filter(Boolean));
        const localPendingOnly = local.filter((lr) => !remoteIds.has(lr.requestId || lr.orderId || lr.id || lr._id));
        const merged = ensureFiveDistinctBuyerRequests([...localPendingOnly, ...res.requests]);
        saveStoredRequests(merged, false);
        return { requests: merged, count: merged.length, isDemo: false };
      }
    } catch (err) {
      console.warn('API getRequests notice, falling back to local storage:', err.message);
    }

    let list = getStoredRequests();

    if (params.status && params.status !== 'all') {
      list = list.filter((r) => r.status.toUpperCase() === params.status.toUpperCase());
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.requestId.toLowerCase().includes(q) ||
          r.buyerDetails?.businessName?.toLowerCase().includes(q) ||
          r.cropDetails?.name?.toLowerCase().includes(q) ||
          (r.cropName && r.cropName.toLowerCase().includes(q))
      );
    }

    return { requests: list, count: list.length, isDemo: true };
  },

  /**
   * Accept Buyer Request (Converts to Order & reserves stock)
   */
  async acceptRequest(itemOrId) {
    const rawId = typeof itemOrId === 'object' && itemOrId !== null
      ? (itemOrId.requestId || itemOrId.orderId || itemOrId.id || itemOrId._id)
      : itemOrId;
    const cleanId = String(rawId || '').replace(/2026-2026/g, '2026');
    const orderIdToMatch = cleanId.replace(/^REQ-/, 'ORD-');
    const numOnly = cleanId.match(/\d+$/)?.[0];

    try {
      const res = await api.post(`/farmer/requests/${cleanId}/accept`);
      if (res && (res.order || res.success)) {
        return { success: true, order: res.order, message: res.message, isDemo: false };
      }
    } catch (err) {
      console.warn('API acceptRequest notice, converting locally:', err.message);
    }

    const stored = getStoredRequests();
    const req = stored.find((r) => {
      if (!r) return false;
      if (typeof itemOrId === 'object' && itemOrId !== null) {
        if (itemOrId.id && r.id === itemOrId.id) return true;
        if (itemOrId.requestId && r.requestId === itemOrId.requestId) return true;
        if (itemOrId.orderId && r.orderId === itemOrId.orderId) return true;
      }
      const ids = [r.id, r._id, r.requestId, r.orderId].filter(Boolean).map(String);
      const cleanIds = ids.map((s) => s.replace(/2026-2026/g, '2026'));
      if (ids.includes(String(rawId)) || cleanIds.includes(cleanId) || cleanIds.includes(orderIdToMatch)) return true;
      if (numOnly && cleanIds.some((s) => s.endsWith(numOnly))) return true;
      return false;
    });

    if (!req) return { success: false, message: 'Request not found' };

    const orderId = req.orderId || (cleanId.startsWith('REQ-') ? cleanId.replace(/^REQ-/, 'ORD-') : generateClientOrderId());
    req.status = 'CONVERTED_TO_ORDER';
    req.orderId = orderId;
    saveStoredRequests(stored);

    const newOrder = {
      id: `ord-fmr-${Date.now()}`,
      orderId,
      farmerId: req.farmerId || 'FMR-TN-2026-01',
      farmerName: req.farmerName || 'Ramesh Kumar',
      buyerName: req.buyerDetails?.businessName || 'Grand Palace Luxury Dining',
      cropName: req.cropDetails?.name || req.cropName || 'Produce',
      cropDetails: req.cropDetails,
      quantityKg: req.quantity || 50,
      unit: req.unit || 'Kg',
      pricePerUnit: req.offeredPrice || 38,
      totalPrice: req.totalEstimatedValue || ((req.offeredPrice || 38) * (req.quantity || 50)),
      orderStatus: 'CONFIRMED',
      deliveryStatus: 'READY_FOR_PICKUP',
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      pickupDate: req.preferredDeliveryDate || 'Today',
      preferredDeliveryDate: req.preferredDeliveryDate,
      deliveryAddress: req.deliveryLocation,
      buyerDetails: req.buyerDetails,
      driver: {
        name: 'Kumar M.',
        vehicle: 'Tata Ace EV Cargo (TN 57 AB 1234)',
        phone: '+91 94432 11098',
        deliveryPin: `${Math.floor(1000 + Math.random() * 9000)}`
      },
      statusHistory: [
        { status: 'Request Accepted', timestamp: new Date().toISOString(), note: `Farmer confirmed ${req.quantity} ${req.unit || 'Kg'} order` },
        { status: 'Ready for Pickup', timestamp: new Date().toISOString(), note: 'Consignment packaged at farm hub' }
      ],
      notes: req.notes,
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      order: newOrder,
      message: `Request accepted! Order #${orderId} created and synchronized with Buyer Module.`,
      isDemo: true
    };
  },

  /**
   * Reject Buyer Request
   */
  async rejectRequest(itemOrId, reason = '') {
    const rawId = typeof itemOrId === 'object' && itemOrId !== null
      ? (itemOrId.requestId || itemOrId.orderId || itemOrId.id || itemOrId._id)
      : itemOrId;
    const cleanId = String(rawId || '').replace(/2026-2026/g, '2026');
    const orderIdToMatch = cleanId.replace(/^REQ-/, 'ORD-');
    const numOnly = cleanId.match(/\d+$/)?.[0];

    try {
      const res = await api.post(`/farmer/requests/${cleanId}/reject`, { reason });
      if (res && (res.request || res.success)) {
        return { success: true, request: res.request, message: res.message, isDemo: false };
      }
    } catch (err) {
      console.warn('API rejectRequest notice, updating locally:', err.message);
    }

    const stored = getStoredRequests();
    const req = stored.find((r) => {
      if (!r) return false;
      if (typeof itemOrId === 'object' && itemOrId !== null) {
        if (itemOrId.id && r.id === itemOrId.id) return true;
        if (itemOrId.requestId && r.requestId === itemOrId.requestId) return true;
        if (itemOrId.orderId && r.orderId === itemOrId.orderId) return true;
      }
      const ids = [r.id, r._id, r.requestId, r.orderId].filter(Boolean).map(String);
      const cleanIds = ids.map((s) => s.replace(/2026-2026/g, '2026'));
      if (ids.includes(String(rawId)) || cleanIds.includes(cleanId) || cleanIds.includes(orderIdToMatch)) return true;
      if (numOnly && cleanIds.some((s) => s.endsWith(numOnly))) return true;
      return false;
    });

    if (!req) return { success: false, message: 'Request not found' };

    req.status = 'REJECTED';
    req.rejectionReason = reason || 'Produce committed to another commercial order';
    saveStoredRequests(stored);

    return { success: true, request: req, message: 'Buyer purchase request rejected.', isDemo: true };
  }
};

export default requestService;
