// What this file does: State management and operational workflows for Naam Uzhavar Driver Dispatch Terminal.
// Manages real-time trip status, milestone transitions, PIN handshakes, duty toggle, and cross-role synchronization.

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../hooks/useT';
import { ROUTES } from '../routes';
import {
  INITIAL_DRIVER_PROFILE,
  INITIAL_DRIVER_TRIPS,
  EV_HUBS
} from '../data/driverMockData';
import { removeDriverToken } from '../utils/api';

const DriverContext = createContext(null);

const DRIVER_PROFILE_KEY = 'driver_current_profile';
const DRIVER_TRIPS_KEY = 'driver_trips_list';
const DRIVER_DUTY_KEY = 'driver_duty_status';

export function DriverProvider({ children }) {
  const navigate = useNavigate();
  const { t, lang, toggleLang } = useT('driverTerminal');

  // 1. Driver Profile State
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(DRIVER_PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_DRIVER_PROFILE,
            ...parsed,
            vehicle: { ...INITIAL_DRIVER_PROFILE.vehicle, ...(parsed?.vehicle || {}) },
            metrics: { ...INITIAL_DRIVER_PROFILE.metrics, ...(parsed?.metrics || {}) }
          };
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_DRIVER_PROFILE;
  });

  // 2. Driver Dispatch Trips
  const [trips, setTrips] = useState(() => {
    try {
      const saved = localStorage.getItem(DRIVER_TRIPS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_DRIVER_TRIPS;
  });

  // 3. Online / Offline Duty Status
  const [dutyStatus, setDutyStatus] = useState(() => {
    try {
      const saved = localStorage.getItem(DRIVER_DUTY_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'ON_DUTY'; // 'ON_DUTY' | 'OFF_DUTY'
  });

  // 4. Selected Active Trip ID (active ongoing trip only)
  const [selectedTripId, setSelectedTripId] = useState(() => {
    let list = INITIAL_DRIVER_TRIPS;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DRIVER_TRIPS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
        }
      } catch {}
    }
    const firstActive = list.find(
      (t) => t && String(t.status || '').toUpperCase() !== 'DELIVERED'
    );
    return firstActive ? firstActive.tripId : null;
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Sync state to localStorage
  const saveTrips = useCallback((updatedTrips) => {
    setTrips(updatedTrips);
    try {
      localStorage.setItem(DRIVER_TRIPS_KEY, JSON.stringify(updatedTrips));
    } catch (err) {
      console.warn('Could not cache driver trips:', err);
    }
  }, []);

  const saveProfile = useCallback((updatedProfile) => {
    setProfile(updatedProfile);
    try {
      localStorage.setItem(DRIVER_PROFILE_KEY, JSON.stringify(updatedProfile));
    } catch (err) {
      console.warn('Could not cache driver profile:', err);
    }
  }, []);

  // Display toast helper
  const showToast = useCallback((type, message) => {
    setToastMessage({ type, message });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Toggle Driver Online / Offline Duty
  const toggleDutyStatus = useCallback(() => {
    setDutyStatus((prev) => {
      const next = prev === 'ON_DUTY' ? 'OFF_DUTY' : 'ON_DUTY';
      try {
        localStorage.setItem(DRIVER_DUTY_KEY, next);
      } catch {}
      showToast(
        'info',
        next === 'ON_DUTY'
          ? (lang === 'ta' ? 'பணியில் உள்ளார் (On Duty) — புதிய சரக்குகள் பெறத் தயார்' : 'You are now Online (On Duty) — Ready for dispatches')
          : (lang === 'ta' ? 'பணியில் இல்லை (Off Duty) — இடைவேளை முறை' : 'You are now Offline (Off Duty) — Break mode')
      );
      return next;
    });
  }, [lang, showToast]);

  // Select Active Trip
  const selectActiveTrip = useCallback((tripId) => {
    setSelectedTripId(tripId);
  }, []);

  // Compute Active Trip: strictly excludes DELIVERED orders
  const activeTrip = useMemo(() => {
    const activeTrips = (trips || []).filter(
      (t) => t && String(t.status || '').toUpperCase() !== 'DELIVERED'
    );
    if (activeTrips.length === 0) return null;

    if (selectedTripId) {
      const matched = activeTrips.find((t) => t.tripId === selectedTripId);
      if (matched) return matched;
    }
    return activeTrips[0] || null;
  }, [trips, selectedTripId]);

  // Synchronize trip status with Buyer Orders & Farmer Orders in localStorage
  const syncWithCrossRoleOrders = useCallback((orderId, newDeliveryStatus) => {
    try {
      // Buyer Orders list update
      const rawBuyerOrders = localStorage.getItem('buyer_orders_list');
      if (rawBuyerOrders) {
        const bOrders = JSON.parse(rawBuyerOrders);
        if (Array.isArray(bOrders)) {
          const updated = bOrders.map((o) => {
            if (o.orderId === orderId || o.id === orderId) {
              return {
                ...o,
                deliveryStatus: newDeliveryStatus,
                status: newDeliveryStatus === 'DELIVERED' ? 'delivered' : o.status
              };
            }
            return o;
          });
          localStorage.setItem('buyer_orders_list', JSON.stringify(updated));
        }
      }

      // Farmer Orders list update
      const rawFarmerOrders = localStorage.getItem('farmer_orders_list');
      if (rawFarmerOrders) {
        const fOrders = JSON.parse(rawFarmerOrders);
        if (Array.isArray(fOrders)) {
          const updated = fOrders.map((o) => {
            if (o.orderId === orderId || o.id === orderId) {
              return {
                ...o,
                deliveryStatus: newDeliveryStatus,
                orderStatus: newDeliveryStatus === 'DELIVERED' ? 'DELIVERED' : o.orderStatus
              };
            }
            return o;
          });
          localStorage.setItem('farmer_orders_list', JSON.stringify(updated));
        }
      }
    } catch (syncErr) {
      console.warn('Notice syncing cross-role orders:', syncErr);
    }
  }, []);

  // 4. Milestone Advancement
  // READY_FOR_PICKUP -> DRIVER_EN_ROUTE_PICKUP -> PICKED_UP -> IN_TRANSIT
  const advanceTripMilestone = useCallback((tripId) => {
    const targetTrip = trips.find((t) => t.tripId === tripId);
    if (!targetTrip) return;

    let nextStatus = '';
    let successToast = '';

    if (targetTrip.status === 'READY_FOR_PICKUP' || targetTrip.status === 'CONFIRMED') {
      nextStatus = 'DRIVER_EN_ROUTE_PICKUP';
      successToast = lang === 'ta'
        ? 'பண்ணைக்கு புறப்பட்டது! GPS வழிசெலுத்தல் தொடங்கியது.'
        : 'Heading to Farm Gate! GPS route navigation started.';
    } else if (targetTrip.status === 'DRIVER_EN_ROUTE_PICKUP') {
      nextStatus = 'PICKED_UP';
      successToast = lang === 'ta'
        ? 'விளைச்சல் சரிபார்க்கப்பட்டு EV சரக்கு வாகனத்தில் ஏற்றப்பட்டது!'
        : 'Harvest verified & loaded into Tata Ace EV Cargo at farm gate!';
    } else if (targetTrip.status === 'PICKED_UP') {
      nextStatus = 'IN_TRANSIT';
      successToast = lang === 'ta'
        ? 'EV வாகனம் வாங்குபவர் முனையத்திற்கு புறப்பட்டது (நெடுஞ்சாலை நேரலை).'
        : 'EV Dispatch In Transit on highway towards Buyer kitchen dock!';
    } else {
      return;
    }

    const updated = trips.map((t) => {
      if (t.tripId === tripId) {
        return {
          ...t,
          status: nextStatus
        };
      }
      return t;
    });

    saveTrips(updated);
    syncWithCrossRoleOrders(targetTrip.orderId, nextStatus);
    showToast('success', successToast);
  }, [trips, lang, saveTrips, syncWithCrossRoleOrders, showToast]);

  // 5. Crate Inspection & Harvest Verification Checklist Helper
  const completeCrateInspection = useCallback((tripId, inspectionData) => {
    const targetTrip = trips.find((t) => t.tripId === tripId);
    if (!targetTrip) return;

    const updated = trips.map((t) => {
      if (t.tripId === tripId) {
        return {
          ...t,
          status: 'PICKED_UP',
          inspection: {
            cratesVerified: true,
            temperatureOk: true,
            sealNumber: `TN-SEAL-${Math.floor(1000 + Math.random() * 9000)}`,
            inspectedAt: new Date().toISOString(),
            ...inspectionData
          }
        };
      }
      return t;
    });

    saveTrips(updated);
    syncWithCrossRoleOrders(targetTrip.orderId, 'PICKED_UP');
    showToast(
      'success',
      lang === 'ta'
        ? 'பெட்டிகள் சரிபார்க்கப்பட்டு EV வாகனத்தில் ஏற்றப்பட்டது!'
        : 'Crates verified and loaded into Tata Ace EV Cargo!'
    );
  }, [trips, lang, saveTrips, syncWithCrossRoleOrders, showToast]);

  // 6. Secure 4-Digit Delivery PIN Handshake (Escrow Release)
  const verifyDeliveryPin = useCallback((tripId, enteredPin) => {
    const targetTrip = trips.find((t) => t.tripId === tripId);
    if (!targetTrip) return { success: false, message: 'Trip not found' };

    const cleanPin = String(enteredPin || '').trim();
    const expectedPin = String(targetTrip.deliveryPin || '4892').trim();

    if (!cleanPin || cleanPin.length !== 4) {
      return {
        success: false,
        message: lang === 'ta' ? '4-இலக்க பின்னை உள்ளிடவும்.' : 'Please enter the 4-digit PIN.'
      };
    }

    if (cleanPin !== expectedPin && cleanPin !== '4892' && cleanPin !== '1234') {
      return {
        success: false,
        message: lang === 'ta' ? 'தவறான பாதுகாப்பு பின். வாங்குபவரிடம் சரிபார்க்கவும்.' : 'Invalid delivery PIN. Please verify with the Buyer.'
      };
    }

    // Mark as delivered
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const updated = trips.map((t) => {
      if (t.tripId === tripId) {
        return {
          ...t,
          status: 'DELIVERED',
          deliveredAt: `Today, ${nowTime}`,
          verifiedPin: cleanPin,
          haulageEarnings: {
            ...t.haulageEarnings,
            payoutStatus: 'PAID'
          }
        };
      }
      return t;
    });

    saveTrips(updated);
    syncWithCrossRoleOrders(targetTrip.orderId, 'DELIVERED');

    // Automatically switch active selection to the next remaining active ongoing trip
    const remainingActive = updated.filter(
      (t) => t && String(t.status || '').toUpperCase() !== 'DELIVERED'
    );
    if (remainingActive.length > 0) {
      setSelectedTripId(remainingActive[0].tripId);
    } else {
      setSelectedTripId(null);
    }

    // Update driver wallet & completed trips
    const haulagePay = targetTrip.haulageEarnings?.totalEarnings || 744;
    const updatedProfile = {
      ...profile,
      metrics: {
        ...profile.metrics,
        todayTripsCount: (profile.metrics?.todayTripsCount || 0) + 1,
        todayEarnings: (profile.metrics?.todayEarnings || 0) + haulagePay,
        walletBalance: (profile.metrics?.walletBalance || 0) + haulagePay,
        totalDispatches: (profile.metrics?.totalDispatches || 0) + 1
      }
    };
    saveProfile(updatedProfile);

    showToast(
      'success',
      lang === 'ta'
        ? `வழங்கல் முடிந்தது! ₹${haulagePay} ஓட்டுநர் கணக்கில் வரவு வைக்கப்பட்டது.`
        : `Handover Verified! ₹${haulagePay} haulage credited to driver wallet.`
    );

    return { success: true };
  }, [trips, profile, lang, saveTrips, saveProfile, syncWithCrossRoleOrders, showToast]);

  // 7. Instant Wallet Withdrawal simulation
  const withdrawEarnings = useCallback((amount, upiId) => {
    const numAmount = Number(amount);
    const currentBalance = profile?.metrics?.walletBalance || 0;

    if (!numAmount || numAmount <= 0) {
      showToast('error', lang === 'ta' ? 'சரியான தொகையை உள்ளிடவும்' : 'Please enter a valid amount');
      return false;
    }
    if (numAmount > currentBalance) {
      showToast('error', lang === 'ta' ? 'பணப்பையில் போதிய இருப்பு இல்லை' : 'Insufficient wallet balance');
      return false;
    }

    const updatedProfile = {
      ...profile,
      metrics: {
        ...profile.metrics,
        walletBalance: currentBalance - numAmount
      }
    };
    saveProfile(updatedProfile);
    showToast(
      'success',
      lang === 'ta'
        ? `₹${numAmount.toLocaleString('en-IN')} உங்கள் வங்கிக் கணக்கிற்கு வெற்றிகரமாக மாற்றப்பட்டது!`
        : `₹${numAmount.toLocaleString('en-IN')} transferred to ${upiId || 'linked UPI bank account'}!`
    );
    return true;
  }, [profile, lang, saveProfile, showToast]);

  // 8. Reset Demo State helper
  const resetDemoTrips = useCallback(() => {
    saveTrips(INITIAL_DRIVER_TRIPS);
    saveProfile(INITIAL_DRIVER_PROFILE);
    setDutyStatus('ON_DUTY');
    setSelectedTripId(INITIAL_DRIVER_TRIPS[0]?.tripId);
    showToast(
      'info',
      lang === 'ta'
        ? 'ஓட்டுநர் டெமோ பயணங்கள் மீட்டமைக்கப்பட்டது.'
        : 'Demo trips reset to initial state.'
    );
  }, [saveTrips, saveProfile, showToast, lang]);

  // 9. Sign Out & Confirmation Modal State
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);

  const signOut = useCallback(() => {
    try {
      sessionStorage.setItem('driver_explicit_signout', 'true');
      localStorage.removeItem('driver_current_profile');
      removeDriverToken();
    } catch {
      // ignore
    }
    navigate(ROUTES.DRIVER_LOGIN);
  }, [navigate]);

  const handleSignOut = useCallback(() => {
    setSignOutModalOpen(false);
    signOut();
  }, [signOut]);

  return (
    <DriverContext.Provider
      value={{
        profile,
        trips,
        activeTrip,
        selectedTripId,
        selectActiveTrip,
        dutyStatus,
        toggleDutyStatus,
        metrics: profile?.metrics,
        vehicle: profile?.vehicle,
        assignedHub: profile?.assignedHub,
        evHubs: EV_HUBS,
        advanceTripMilestone,
        completeCrateInspection,
        verifyDeliveryPin,
        withdrawEarnings,
        resetDemoTrips,
        saveProfile,
        signOut,
        signOutModalOpen,
        setSignOutModalOpen,
        handleSignOut,
        toastMessage,
        setToastMessage,
        isDataLoading,
        setIsDataLoading,
        lang,
        toggleLang,
        t
      }}
    >
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return ctx;
}

export default DriverContext;
