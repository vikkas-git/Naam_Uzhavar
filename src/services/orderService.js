// What this file does: Service layer for Farmer Order History and consignment lifecycle.
// Persists historical orders without clearing or resetting historical transaction records.

import api from '../utils/api';
import { INITIAL_FARMER_ORDERS } from '../data/farmerMockData';

export const FARMER_ORDERS_STORAGE_KEY = 'farmer_orders_history';

/**
 * Deduplicate farmer orders so duplicate entries (by orderId or identical buyer + staple + pending status)
 * are not repeated.
 */
export const deduplicateOrders = (list) => {
  if (!Array.isArray(list) || list.length === 0) return [];

  const seenIds = new Set();
  const seenCompositeKeys = new Set();
  const result = [];

  for (const item of list) {
    if (!item) continue;

    const id = String(item.orderId || item.id || item._id || '').trim();
    const cleanId = id.replace(/2026-2026/g, '2026');
    if (cleanId && seenIds.has(cleanId)) continue;

    const buyerName = String(
      item.buyerName || item.buyerDetails?.businessName || item.buyerDetails?.contactPerson || 'commercial_buyer'
    ).trim().toLowerCase();

    const cropText = String(
      item.cropName || item.cropDetails?.name || item.cropDetails?.nameTa || ''
    ).trim().toLowerCase();

    let staple = 'produce';
    if (cropText.includes('tomato') || cropText.includes('தக்காளி')) staple = 'tomato';
    else if (cropText.includes('onion') || cropText.includes('shallot') || cropText.includes('vengayam') || cropText.includes('வெங்காயம்')) staple = 'onion';
    else if (cropText.includes('potato') || cropText.includes('urulai') || cropText.includes('உருளை')) staple = 'potato';
    else if (cropText.includes('carrot') || cropText.includes('கேரட்')) staple = 'carrot';

    const isPending =
      item.orderStatus === 'PENDING_FARMER_APPROVAL' ||
      item.orderStatus === 'PENDING' ||
      item.status === 'PENDING';
    const statusGroup = isPending ? 'pending' : (item.orderStatus || item.status || 'resolved').toLowerCase();

    const compositeKey = `${buyerName}_${staple}_${statusGroup}`;
    if (seenCompositeKeys.has(compositeKey)) {
      continue;
    }

    if (cleanId) seenIds.add(cleanId);
    if (id) seenIds.add(id);
    seenCompositeKeys.add(compositeKey);
    result.push(item);
  }

  return result;
};

export const getStoredOrders = () => {
  let list = [];
  try {
    const raw = localStorage.getItem(FARMER_ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch {
    // ignore
  }

  if (!list || list.length === 0) {
    list = [...INITIAL_FARMER_ORDERS];
  }

  // Cross-reconcile with buyer_orders
  try {
    const rawBuyerOrders = localStorage.getItem('buyer_orders');
    if (rawBuyerOrders) {
      const parsedBO = JSON.parse(rawBuyerOrders);
      if (Array.isArray(parsedBO)) {
        const existingOrderIds = new Set(list.map((o) => o.orderId).filter(Boolean));
        for (const bo of parsedBO) {
          if (bo && bo.orderId && !existingOrderIds.has(bo.orderId)) {
            existingOrderIds.add(bo.orderId);
            list.unshift({
              ...bo,
              id: bo.id || `ord-fmr-${bo.orderId}`,
              farmerId: bo.farmerId || 'FMR-TN-2026-01',
              farmerName: bo.farmerName || 'Ramesh Kumar',
              buyerName: bo.buyerName || bo.buyerDetails?.businessName || 'Grand Palace Luxury Dining',
              cropName: bo.cropName || bo.cropDetails?.name || 'Produce',
              quantityKg: bo.quantityKg || 100,
              pricePerUnit: bo.unitPrice || Math.round((bo.totalPrice || 3200) / (bo.quantityKg || 100)),
              deliveryAddress: bo.deliveryAddress || 'Madurai / Coimbatore',
              orderStatus: bo.orderStatus || 'PENDING_FARMER_APPROVAL',
              deliveryStatus: bo.deliveryStatus || 'NOT_ASSIGNED',
              createdAt: bo.createdAt || bo.orderTime || new Date().toISOString()
            });
          }
        }
      }
    }
  } catch (crossErr) {
    console.warn('Notice cross-reconciling orders:', crossErr);
  }

  const originalCount = list.length;
  for (const item of list) {
    if (item && item.orderId && item.orderId.includes('2026-2026')) {
      item.orderId = item.orderId.replace(/2026-2026/g, '2026');
    }
  }
  const dedupedList = deduplicateOrders(list);

  if (dedupedList.length !== originalCount) {
    try {
      localStorage.setItem(FARMER_ORDERS_STORAGE_KEY, JSON.stringify(dedupedList));
    } catch {}
  }

  return dedupedList;
};

export const saveStoredOrders = (orders, dispatchEvent = true) => {
  try {
    localStorage.setItem(FARMER_ORDERS_STORAGE_KEY, JSON.stringify(orders));
    if (dispatchEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farmer-data-updated'));
    }
  } catch {
    // ignore
  }
};

export const orderService = {
  /**
   * Get Farmer Order History with filtering, search, and pagination
   */
  async getOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.filter && params.filter !== 'all') query.append('filter', params.filter);
    if (params.search) query.append('search', params.search);
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    try {
      const res = await api.get(`/farmer/orders${queryString}`);
      if (res && Array.isArray(res.orders) && res.orders.length > 0) {
        // Merge with existing local orders to preserve locally placed orders
        const local = getStoredOrders();
        const remoteIds = new Set(res.orders.map((o) => o.orderId || o.id || o._id).filter(Boolean));
        const localOnly = local.filter((lo) => !remoteIds.has(lo.orderId || lo.id || lo._id));
        const merged = [...localOnly, ...res.orders];
        saveStoredOrders(merged, false);
        return {
          orders: merged,
          totalCount: merged.length,
          page: res.page || 1,
          totalPages: res.totalPages || 1,
          isDemo: false
        };
      }
    } catch (err) {
      console.warn('API getOrders notice, filtering from local storage:', err.message);
    }

    let list = getStoredOrders();

    // Filter by order state
    if (params.filter === 'active') {
      list = list.filter((o) => o.orderStatus === 'CONFIRMED' && o.deliveryStatus !== 'DELIVERED');
    } else if (params.filter === 'completed') {
      list = list.filter((o) => o.deliveryStatus === 'DELIVERED');
    } else if (params.filter === 'cancelled') {
      list = list.filter((o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'REJECTED');
    }

    // Keyword search
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          (o.buyerName && o.buyerName.toLowerCase().includes(q)) ||
          (o.cropName && o.cropName.toLowerCase().includes(q)) ||
          (o.cropDetails?.name && o.cropDetails.name.toLowerCase().includes(q))
      );
    }

    // Sort
    if (params.sort === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const page = Number(params.page || 1);
    const limit = Number(params.limit || 10);
    const totalCount = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      orders: paginated,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
      isDemo: true
    };
  },

  /**
   * Get Single Order Details
   */
  async getOrderById(id) {
    try {
      const res = await api.get(`/farmer/orders/${id}`);
      if (res && res.order) {
        return { order: res.order, isDemo: false };
      }
    } catch (err) {
      console.warn('API getOrderById notice:', err.message);
    }

    const stored = getStoredOrders();
    const order = stored.find((o) => o.id === id || o._id === id || o.orderId === id);
    if (order) return { order, isDemo: true };

    return { order: null, isDemo: true };
  },

  /**
   * Update Order Status
   */
  async updateStatus(id, deliveryStatus) {
    try {
      const res = await api.patch(`/farmer/orders/${id}/status`, { deliveryStatus });
      if (res && res.order) {
        return { success: true, order: res.order };
      }
    } catch (err) {
      console.warn('API updateStatus notice:', err.message);
    }

    const stored = getStoredOrders();
    const order = stored.find((o) => o.id === id || o._id === id || o.orderId === id);
    if (order) {
      order.deliveryStatus = deliveryStatus;
      order.status = deliveryStatus;
      if (deliveryStatus === 'DELIVERED') {
        order.paymentStatus = 'RELEASED_TO_FARMER';
      }
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: deliveryStatus,
        timestamp: new Date().toISOString(),
        note: `Status updated by farmer to ${deliveryStatus}`
      });
      saveStoredOrders(stored);
      return { success: true, order };
    }

    return { success: false, message: 'Order not found' };
  },

  /**
   * Approve / Confirm Buyer Order
   */
  async approveOrder(itemOrId) {
    const rawId = typeof itemOrId === 'object' && itemOrId !== null
      ? (itemOrId.orderId || itemOrId.id || itemOrId._id || itemOrId.requestId)
      : itemOrId;
    const cleanId = String(rawId || '').replace(/2026-2026/g, '2026');
    const orderIdToMatch = cleanId.replace(/^REQ-/, 'ORD-');
    const numOnly = cleanId.match(/\d+$/)?.[0];

    try {
      const res = await api.patch(`/farmer/orders/${orderIdToMatch}/approve`);
      if (res && res.order) {
        return { success: true, order: res.order, message: res.message, isDemo: false };
      }
    } catch (err) {
      console.warn('API approveOrder notice, updating locally:', err.message);
    }

    const stored = getStoredOrders();
    const order = stored.find((o) => {
      if (!o) return false;
      if (typeof itemOrId === 'object' && itemOrId !== null) {
        if (itemOrId.orderId && o.orderId === itemOrId.orderId) return true;
        if (itemOrId.id && o.id === itemOrId.id) return true;
      }
      const ids = [o.orderId, o.id, o._id].filter(Boolean).map(String);
      const cleanIds = ids.map((s) => s.replace(/2026-2026/g, '2026'));
      if (ids.includes(String(rawId)) || cleanIds.includes(cleanId) || cleanIds.includes(orderIdToMatch)) return true;
      if (numOnly && cleanIds.some((s) => s.endsWith(numOnly))) return true;
      return false;
    });

    if (order) {
      order.orderStatus = 'CONFIRMED';
      order.status = 'CONFIRMED';
      if (!order.deliveryStatus || order.deliveryStatus === 'NOT_ASSIGNED') {
        order.deliveryStatus = 'READY_FOR_PICKUP';
      }
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: 'Confirmed by Farmer',
        timestamp: new Date().toISOString(),
        note: `Farmer confirmed order #${order.orderId}`
      });
      saveStoredOrders(stored);
      return {
        success: true,
        order,
        message: `Order #${order.orderId} approved and confirmed! Consignment ready for pickup.`,
        isDemo: true
      };
    }

    return { success: false, message: 'Order not found' };
  },

  /**
   * Reject / Decline Buyer Order
   */
  async rejectOrder(itemOrId, reason = '') {
    const rawId = typeof itemOrId === 'object' && itemOrId !== null
      ? (itemOrId.orderId || itemOrId.id || itemOrId._id || itemOrId.requestId)
      : itemOrId;
    const cleanId = String(rawId || '').replace(/2026-2026/g, '2026');
    const orderIdToMatch = cleanId.replace(/^REQ-/, 'ORD-');
    const numOnly = cleanId.match(/\d+$/)?.[0];

    try {
      const res = await api.patch(`/farmer/orders/${orderIdToMatch}/reject`, { reason });
      if (res && res.order) {
        return { success: true, order: res.order, message: res.message, isDemo: false };
      }
    } catch (err) {
      console.warn('API rejectOrder notice, updating locally:', err.message);
    }

    const stored = getStoredOrders();
    const order = stored.find((o) => {
      if (!o) return false;
      if (typeof itemOrId === 'object' && itemOrId !== null) {
        if (itemOrId.orderId && o.orderId === itemOrId.orderId) return true;
        if (itemOrId.id && o.id === itemOrId.id) return true;
      }
      const ids = [o.orderId, o.id, o._id].filter(Boolean).map(String);
      const cleanIds = ids.map((s) => s.replace(/2026-2026/g, '2026'));
      if (ids.includes(String(rawId)) || cleanIds.includes(cleanId) || cleanIds.includes(orderIdToMatch)) return true;
      if (numOnly && cleanIds.some((s) => s.endsWith(numOnly))) return true;
      return false;
    });

    if (order) {
      order.orderStatus = 'REJECTED';
      order.status = 'REJECTED';
      order.deliveryStatus = 'NOT_ASSIGNED';
      order.rejectionReason = reason || 'Declined by farmer';
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: 'Rejected by Farmer',
        timestamp: new Date().toISOString(),
        note: reason || 'Declined by farmer'
      });
      saveStoredOrders(stored);
      return { success: true, order, message: `Order #${order.orderId} declined.`, isDemo: true };
    }

    return { success: false, message: 'Order not found' };
  }
};

export default orderService;
