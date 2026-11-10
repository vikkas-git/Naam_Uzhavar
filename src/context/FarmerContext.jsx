// What this file does: Reactive state management context for the Farmer Module.
// Coordinates farmer identity, crop listings, buyer purchase requests, order lifecycle, and bilingual translation.

/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import { useT } from '../hooks/useT';
import { farmerService } from '../services/farmerService';
import { cropService, deduplicateCrops, ensureStapleCrops, getStoredCrops, saveStoredCrops } from '../services/cropService';
import { requestService, deduplicateRequests, getStoredRequests, saveStoredRequests } from '../services/requestService';
import { orderService, deduplicateOrders, getStoredOrders, saveStoredOrders } from '../services/orderService';
import { INITIAL_FARMER_PROFILE } from '../data/farmerMockData';
import { formatDisplayOrderId } from '../utils/orderId';
import { removeFarmerToken } from '../utils/api';

const FarmerContext = createContext(null);

export function FarmerProvider({ children }) {
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useT('farmerDashboard');

  // 1. Farmer Profile State
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('farmer_current_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name) return parsed;
      }
      const reg = localStorage.getItem('farmer_registered_profile');
      if (reg) {
        const parsedReg = JSON.parse(reg);
        if (parsedReg && parsedReg.name) return parsedReg;
      }
    } catch {
      // ignore
    }
    return INITIAL_FARMER_PROFILE;
  });

  // 2. Core Entities State
  const [crops, setCrops] = useState(() => ensureStapleCrops(getStoredCrops()));
  const [requests, setRequests] = useState(() => deduplicateRequests(getStoredRequests()));
  const [orders, setOrders] = useState(() => deduplicateOrders(getStoredOrders()));
  const [_metrics, setMetrics] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Synchronized refs to avoid re-triggering loops on identity checks
  const requestsRef = useRef(requests);
  const ordersRef = useRef(orders);
  const cropsRef = useRef(crops);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    cropsRef.current = crops;
  }, [crops]);

  // 3. Modals & Detail Overlays
  const [selectedCropDetails, setSelectedCropDetails] = useState(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);
  const [acceptRequestModal, setAcceptRequestModal] = useState(null);
  const [rejectRequestModal, setRejectRequestModal] = useState(null);
  const [statusConfirmCrop, setStatusConfirmCrop] = useState(null);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);

  // 4. Toast Notifications
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = useCallback((type, text) => {
    setToastMessage({ type, text });
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Auto-persist requests to localStorage whenever updated
  useEffect(() => {
    if (typeof window !== 'undefined' && Array.isArray(requests)) {
      saveStoredRequests(requests, false);
    }
  }, [requests]);

  // Auto-persist orders to localStorage whenever updated
  useEffect(() => {
    if (typeof window !== 'undefined' && Array.isArray(orders)) {
      saveStoredOrders(orders, false);
    }
  }, [orders]);

  // Auto-persist crops to localStorage whenever updated
  useEffect(() => {
    if (typeof window !== 'undefined' && Array.isArray(crops)) {
      saveStoredCrops(crops, false);
    }
  }, [crops]);

  // Real-time synchronization: listen for events when Buyer accepts a crop or updates an order
  useEffect(() => {
    const areReqsEqual = (a, b) => {
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        const itemA = a[i];
        const itemB = b[i];
        if ((itemA?.id || itemA?.requestId) !== (itemB?.id || itemB?.requestId)) return false;
        if (itemA?.status !== itemB?.status) return false;
        if (itemA?.orderId !== itemB?.orderId) return false;
        if (itemA?.quantity !== itemB?.quantity) return false;
        if (itemA?.offeredPrice !== itemB?.offeredPrice) return false;
      }
      return true;
    };

    const areOrdsEqual = (a, b) => {
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        const itemA = a[i];
        const itemB = b[i];
        if ((itemA?.id || itemA?.orderId) !== (itemB?.id || itemB?.orderId)) return false;
        if (itemA?.orderStatus !== itemB?.orderStatus) return false;
        if (itemA?.deliveryStatus !== itemB?.deliveryStatus) return false;
        if (itemA?.quantityKg !== itemB?.quantityKg) return false;
        if (itemA?.totalPrice !== itemB?.totalPrice) return false;
      }
      return true;
    };

    const areCropsEqual = (a, b) => {
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        const itemA = a[i];
        const itemB = b[i];
        if ((itemA?.id || itemA?._id) !== (itemB?.id || itemB?._id)) return false;
        if (itemA?.status !== itemB?.status) return false;
        if (itemA?.quantityKg !== itemB?.quantityKg) return false;
        if (itemA?.availableKg !== itemB?.availableKg) return false;
        if (itemA?.pricePerKg !== itemB?.pricePerKg) return false;
      }
      return true;
    };

    const handleSync = () => {
      const latestReqs = getStoredRequests();
      const latestOrds = getStoredOrders();
      const latestCrops = getStoredCrops();

      if (!areReqsEqual(latestReqs, requestsRef.current)) {
        setRequests(latestReqs);
      }
      if (!areOrdsEqual(latestOrds, ordersRef.current)) {
        setOrders(latestOrds);
      }
      if (!areCropsEqual(latestCrops, cropsRef.current)) {
        setCrops(latestCrops);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('farmer-data-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('farmer-data-updated', handleSync);
    };
  }, []);

  // 5. Fetch Remote / Local Data
  const refreshAllData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const [pRes, cRes, rRes, oRes, dRes] = await Promise.allSettled([
        farmerService.getProfile(),
        cropService.getCrops(),
        requestService.getRequests(),
        orderService.getOrders({ limit: 50 }),
        farmerService.getDashboardMetrics()
      ]);

      if (pRes.status === 'fulfilled' && pRes.value?.data) {
        const remoteData = pRes.value.data;
        let activeProfile = remoteData;
        try {
          const curRaw = localStorage.getItem('farmer_current_profile');
          if (curRaw) {
            const cur = JSON.parse(curRaw);
            if (cur && cur.name && cur.name.toLowerCase() !== 'ramesh kumar') {
              activeProfile = { ...remoteData, ...cur, name: cur.name };
            }
          }
        } catch {}
        setProfile(activeProfile);
        try {
          localStorage.setItem('farmer_current_profile', JSON.stringify(activeProfile));
        } catch {}
      }
      if (cRes.status === 'fulfilled' && Array.isArray(cRes.value?.crops)) {
        setCrops(ensureStapleCrops(cRes.value.crops));
      }
      if (rRes.status === 'fulfilled' && Array.isArray(rRes.value?.requests)) {
        const fetched = rRes.value.requests;
        const fetchedIds = new Set(fetched.map((r) => r.requestId || r.id || r._id));
        const localPending = getStoredRequests().filter((lr) => !fetchedIds.has(lr.requestId || lr.id || lr._id));
        const merged = deduplicateRequests([...localPending, ...fetched]);
        setRequests(merged);
        saveStoredRequests(merged, false);
      }
      if (oRes.status === 'fulfilled' && Array.isArray(oRes.value?.orders)) {
        const fetched = oRes.value.orders;
        const fetchedIds = new Set(fetched.map((o) => o.orderId || o.id || o._id));
        const localOnly = getStoredOrders().filter((lo) => !fetchedIds.has(lo.orderId || lo.id || lo._id));
        const merged = [...localOnly, ...fetched];
        setOrders(merged);
        saveStoredOrders(merged, false);
      }
      if (dRes.status === 'fulfilled' && dRes.value?.data?.metrics) {
        setMetrics(dRes.value.data.metrics);
      }
    } catch (err) {
      console.warn('Data sync notice:', err.message);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Derived Summary Metric Cards
  const computedMetrics = useMemo(() => {
    const activeCrops = crops.filter((c) => (c.status === 'active' || !c.status) && c.status !== 'removed');
    const totalProduceKg = activeCrops.reduce(
      (sum, c) => sum + (Number(c.quantityKg || c.availableKg) || 0),
      0
    );

    const pendingOrders = orders.filter((o) => o.orderStatus === 'PENDING_FARMER_APPROVAL');
    const acceptedOrders = orders.filter(
      (o) => o.orderStatus === 'CONFIRMED' && (o.deliveryStatus === 'READY_FOR_PICKUP' || o.deliveryStatus === 'NOT_ASSIGNED')
    );
    const processingDispatched = orders.filter(
      (o) => o.deliveryStatus === 'PICKED_UP' || o.deliveryStatus === 'IN_TRANSIT'
    );

    const pendingRequests = requests.filter((r) => r.status === 'PENDING');
    const confirmedOrders = orders.filter((o) => o.orderStatus === 'CONFIRMED');

    return {
      activeYield: {
        activeCount: activeCrops.length,
        totalProduceKg,
        liveStatus: lang === 'ta' ? 'வாங்குபவர்களுக்கு நேரலையில் தெரியும்' : 'Live & Visible to Marketplace Buyers',
        isLive: true
      },
      activeOrders: {
        total: pendingOrders.length + acceptedOrders.length + processingDispatched.length,
        pendingConfirmation: pendingOrders.length,
        accepted: acceptedOrders.length,
        processingDispatched: processingDispatched.length
      },
      buyerEnquiries: {
        newEnquiries: pendingRequests.length,
        pendingResponses: pendingRequests.length + pendingOrders.length,
        confirmedOrders: confirmedOrders.length
      }
    };
  }, [crops, orders, requests, lang]);

  // Actions
  const handleSignOut = () => {
    try {
      sessionStorage.setItem('farmer_explicit_signout', 'true');
      localStorage.removeItem('farmer_current_profile');
      removeFarmerToken();
    } catch {
      // ignore
    }
    setSignOutModalOpen(false);
    navigate(ROUTES.FARMER_LOGIN, { replace: true });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAcceptRequest = async (itemOrId) => {
    const item = typeof itemOrId === 'object' && itemOrId !== null ? itemOrId : null;
    const rawId = item ? (item.requestId || item.orderId || item.id || item._id) : itemOrId;
    const cleanId = String(rawId || '').replace(/2026-2026/g, '2026');
    const orderIdToMatch = cleanId.startsWith('REQ-') ? cleanId.replace(/^REQ-/, 'ORD-') : cleanId;
    const numOnly = cleanId.match(/\d+$/)?.[0];

    // Resilient matching helper
    const isTargetMatch = (entry) => {
      if (!entry) return false;
      if (item) {
        if (entry === item) return true;
        if (item.id && entry.id === item.id) return true;
        if (item._id && entry._id === item._id) return true;
        if (item.requestId && entry.requestId === item.requestId) return true;
        if (item.orderId && entry.orderId === item.orderId) return true;
      }
      const entryIds = [entry.id, entry._id, entry.requestId, entry.orderId].filter(Boolean).map(String);
      const cleanEntryIds = entryIds.map((s) => s.replace(/2026-2026/g, '2026'));
      const targets = [String(rawId), cleanId, orderIdToMatch].filter(Boolean);
      for (const t of targets) {
        if (entryIds.includes(t) || cleanEntryIds.includes(t)) return true;
      }
      if (numOnly && cleanEntryIds.some((s) => s.endsWith(numOnly))) return true;
      return false;
    };

    // 1. Check if it matches an existing Order or Request
    const targetRequest = requests.find(isTargetMatch);
    const matchedOrder = orders.find(isTargetMatch);
    const resolvedOrderId = matchedOrder?.orderId || targetRequest?.orderId || orderIdToMatch || `ORD-${Date.now()}`;

    // 2. Crop stock validation & deduction
    const targetCropRef = item?.cropId || targetRequest?.cropId || targetRequest?.crop || item?.crop || matchedOrder?.cropId;
    const targetCropName = item?.displayCrop || item?.cropName || targetRequest?.cropDetails?.name || targetRequest?.cropName || matchedOrder?.cropName;
    const matchedCrop = crops.find(
      (c) =>
        (targetCropRef && (c.id === targetCropRef || c._id === targetCropRef)) ||
        (targetCropName && c.name?.toLowerCase() === targetCropName?.toLowerCase())
    );

    const requiredQty = Number(item?.quantity || item?.displayQty || targetRequest?.quantity || matchedOrder?.quantityKg || 50);

    if (matchedCrop) {
      const avail = Number(matchedCrop.availableKg || matchedCrop.quantityKg || 0);
      if (avail < requiredQty) {
        showToast('error', `Cannot accept: Available ${avail} Kg is less than requested ${requiredQty} Kg.`);
        return;
      }
      // Decrement inventory locally
      const updatedQty = Math.max(0, avail - requiredQty);
      setCrops((prev) =>
        prev.map((c) =>
          c.id === matchedCrop.id || c._id === matchedCrop._id
            ? { ...c, availableKg: updatedQty, quantityKg: updatedQty, status: updatedQty === 0 ? 'sold_out' : c.status }
            : c
        )
      );
    }

    // 3. Delegate to service (remote API with local storage fallback)
    let serviceResult = null;
    if (matchedOrder) {
      serviceResult = await orderService.approveOrder(matchedOrder);
    } else {
      serviceResult = await requestService.acceptRequest(item || cleanId);
    }

    // 4. Update Orders State
    setOrders((prev) => {
      const exists = prev.some(isTargetMatch);
      if (exists) {
        return prev.map((o) =>
          isTargetMatch(o)
            ? {
                ...o,
                orderStatus: 'CONFIRMED',
                status: 'CONFIRMED',
                deliveryStatus: o.deliveryStatus === 'NOT_ASSIGNED' || !o.deliveryStatus ? 'READY_FOR_PICKUP' : o.deliveryStatus
              }
            : o
        );
      }
      if (serviceResult?.order) {
        return [serviceResult.order, ...prev];
      }
      return prev;
    });

    // 5. Update Requests State
    setRequests((prev) =>
      prev.map((r) =>
        isTargetMatch(r)
          ? {
              ...r,
              status: 'CONVERTED_TO_ORDER',
              displayStatus: 'CONVERTED_TO_ORDER',
              orderId: resolvedOrderId
            }
          : r
      )
    );

    // 6. Cross-sync: Update buyer_orders in localStorage so buyer immediately sees order confirmed
    try {
      const rawBuyerOrders = localStorage.getItem('buyer_orders');
      if (rawBuyerOrders) {
        const buyerOrds = JSON.parse(rawBuyerOrders);
        if (Array.isArray(buyerOrds)) {
          const updatedBuyerOrds = buyerOrds.map((bo) => {
            const boIds = [bo.orderId, bo.id, bo._id].filter(Boolean).map(String);
            const cleanBoIds = boIds.map((s) => s.replace(/2026-2026/g, '2026'));
            const matchesBo =
              cleanBoIds.includes(cleanId) ||
              cleanBoIds.includes(orderIdToMatch) ||
              cleanBoIds.includes(resolvedOrderId) ||
              (numOnly && cleanBoIds.some((s) => s.endsWith(numOnly)));
            if (matchesBo) {
              return {
                ...bo,
                orderStatus: 'CONFIRMED',
                status: 'CONFIRMED',
                deliveryStatus: 'READY_FOR_PICKUP'
              };
            }
            return bo;
          });
          localStorage.setItem('buyer_orders', JSON.stringify(updatedBuyerOrds));
          window.dispatchEvent(new CustomEvent('buyer-data-updated'));
        }
      }
    } catch {}

    showToast('success', serviceResult?.message || `Order #${resolvedOrderId} approved and confirmed!`);
    setAcceptRequestModal(null);
    setSelectedRequestDetails(null);
  };

  const handleRejectRequest = async (itemOrId, reason) => {
    const item = typeof itemOrId === 'object' && itemOrId !== null ? itemOrId : null;
    const rawId = item ? (item.requestId || item.orderId || item.id || item._id) : itemOrId;
    const cleanId = String(rawId || '').replace(/2026-2026/g, '2026');
    const orderIdToMatch = cleanId.startsWith('REQ-') ? cleanId.replace(/^REQ-/, 'ORD-') : cleanId;
    const numOnly = cleanId.match(/\d+$/)?.[0];

    // Resilient matching helper
    const isTargetMatch = (entry) => {
      if (!entry) return false;
      if (item) {
        if (entry === item) return true;
        if (item.id && entry.id === item.id) return true;
        if (item._id && entry._id === item._id) return true;
        if (item.requestId && entry.requestId === item.requestId) return true;
        if (item.orderId && entry.orderId === item.orderId) return true;
      }
      const entryIds = [entry.id, entry._id, entry.requestId, entry.orderId].filter(Boolean).map(String);
      const cleanEntryIds = entryIds.map((s) => s.replace(/2026-2026/g, '2026'));
      const targets = [String(rawId), cleanId, orderIdToMatch].filter(Boolean);
      for (const t of targets) {
        if (entryIds.includes(t) || cleanEntryIds.includes(t)) return true;
      }
      if (numOnly && cleanEntryIds.some((s) => s.endsWith(numOnly))) return true;
      return false;
    };

    // 1. Delegate to service
    const matchedOrder = orders.find(isTargetMatch);
    let serviceResult = null;
    if (matchedOrder) {
      serviceResult = await orderService.rejectOrder(matchedOrder, reason);
    } else {
      serviceResult = await requestService.rejectRequest(item || cleanId, reason);
    }

    // 2. Update Orders State
    setOrders((prev) =>
      prev.map((o) =>
        isTargetMatch(o)
          ? { ...o, orderStatus: 'REJECTED', status: 'REJECTED', rejectionReason: reason }
          : o
      )
    );

    // 3. Update Requests State
    setRequests((prev) =>
      prev.map((r) =>
        isTargetMatch(r)
          ? { ...r, status: 'REJECTED', displayStatus: 'REJECTED', rejectionReason: reason }
          : r
      )
    );

    // 4. Cross-sync: Update buyer_orders in localStorage
    try {
      const rawBuyerOrders = localStorage.getItem('buyer_orders');
      if (rawBuyerOrders) {
        const buyerOrds = JSON.parse(rawBuyerOrders);
        if (Array.isArray(buyerOrds)) {
          const updatedBuyerOrds = buyerOrds.map((bo) => {
            const boIds = [bo.orderId, bo.id, bo._id].filter(Boolean).map(String);
            const cleanBoIds = boIds.map((s) => s.replace(/2026-2026/g, '2026'));
            const matchesBo =
              cleanBoIds.includes(cleanId) ||
              cleanBoIds.includes(orderIdToMatch) ||
              (numOnly && cleanBoIds.some((s) => s.endsWith(numOnly)));
            if (matchesBo) {
              return { ...bo, orderStatus: 'REJECTED', status: 'REJECTED', rejectionReason: reason };
            }
            return bo;
          });
          localStorage.setItem('buyer_orders', JSON.stringify(updatedBuyerOrds));
          window.dispatchEvent(new CustomEvent('buyer-data-updated'));
        }
      }
    } catch {}

    showToast('info', serviceResult?.message || 'Purchase enquiry declined.');
    setRejectRequestModal(null);
    setSelectedRequestDetails(null);
  };

  const handleToggleCropStatus = async (cropId, targetStatus) => {
    const res = await cropService.updateStatus(cropId, targetStatus);
    if (res.success) {
      setCrops((prev) =>
        prev.map((c) => (c.id === cropId || c._id === cropId ? { ...c, status: targetStatus } : c))
      );
      showToast('success', `Listing status updated to ${targetStatus}`);
    } else {
      showToast('error', 'Failed to update listing status');
    }
    setStatusConfirmCrop(null);
  };

  const handleRemoveCrop = async (cropId) => {
    const activeOrder = orders.find(
      (o) =>
        (String(o.cropId) === String(cropId) || String(o.crop) === String(cropId)) &&
        o.orderStatus === 'CONFIRMED' &&
        o.deliveryStatus !== 'DELIVERED'
    );

    if (activeOrder) {
      showToast(
        'error',
        `Cannot remove listing: Active order #${formatDisplayOrderId(activeOrder.orderId)} is currently in progress. Please fulfill or resolve active orders first.`
      );
      setStatusConfirmCrop(null);
      return false;
    }

    const res = await cropService.removeCrop(cropId);
    if (res.success) {
      setCrops((prev) =>
        deduplicateCrops(prev.map((c) => (c.id === cropId || c._id === cropId ? { ...c, status: 'removed' } : c)))
      );
      showToast('success', res.message || 'Crop listing removed from active marketplace.');
      setStatusConfirmCrop(null);
      return true;
    } else {
      showToast('error', res.message || 'Failed to remove listing');
      setStatusConfirmCrop(null);
      return false;
    }
  };

  const handleSaveProfile = async (updatedData) => {
    const res = await farmerService.updateProfile(updatedData);
    if (res.success) {
      setProfile(res.farmer);
      showToast('success', res.message || 'Profile saved successfully!');
      return true;
    } else {
      showToast('error', res.message || 'Failed to save profile');
      return false;
    }
  };

  const handleCreateCrop = async (cropPayload) => {
    const res = await cropService.createCrop(cropPayload);
    if (res.success) {
      setCrops((prev) => deduplicateCrops([res.crop, ...prev]));
      showToast('success', res.message || 'Crop listed successfully!');
      return true;
    } else {
      showToast('error', res.message || 'Failed to list crop');
      return false;
    }
  };

  const value = {
    profile,
    setProfile,
    crops,
    setCrops,
    requests,
    setRequests,
    orders,
    setOrders,
    metrics: computedMetrics,
    isDataLoading,
    setIsDataLoading,
    refreshAllData,
    toastMessage,
    showToast,
    setToastMessage,
    // Modals
    selectedCropDetails,
    setSelectedCropDetails,
    selectedRequestDetails,
    setSelectedRequestDetails,
    selectedOrderDetails,
    setSelectedOrderDetails,
    orderDrawerOpen,
    setOrderDrawerOpen,
    acceptRequestModal,
    setAcceptRequestModal,
    rejectRequestModal,
    setRejectRequestModal,
    statusConfirmCrop,
    setStatusConfirmCrop,
    signOutModalOpen,
    setSignOutModalOpen,
    // Handlers
    handleSignOut,
    handleAcceptRequest,
    handleRejectRequest,
    handleToggleCropStatus,
    handleRemoveCrop,
    handleSaveProfile,
    handleCreateCrop,
    // i18n
    lang,
    toggleLang,
    t
  };

  return <FarmerContext.Provider value={value}>{children}</FarmerContext.Provider>;
}

export function useFarmer() {
  const context = useContext(FarmerContext);
  if (!context) {
    throw new Error('useFarmer must be used within a FarmerProvider');
  }
  return context;
}

export default FarmerContext;
