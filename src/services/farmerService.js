// What this file does: Service layer for Farmer profile and dashboard operations.
// Integrates with backend REST APIs (/api/farmer/*) with resilient synthetic fallbacks.

import api from '../utils/api';
import { INITIAL_FARMER_PROFILE } from '../data/farmerMockData';

const FARMER_PROFILE_STORAGE_KEY = 'farmer_current_profile';

export const farmerService = {
  /**
   * Get Farmer Profile
   */
  async getProfile() {
    try {
      const res = await api.get('/farmer/profile');
      if (res && res.farmer) {
        let farmerData = res.farmer;
        try {
          const savedRaw = localStorage.getItem(FARMER_PROFILE_STORAGE_KEY);
          if (savedRaw) {
            const saved = JSON.parse(savedRaw);
            if (saved && saved.name && saved.name.toLowerCase() !== 'ramesh kumar') {
              farmerData = { ...res.farmer, ...saved, name: saved.name };
            }
          }
        } catch {}
        localStorage.setItem(FARMER_PROFILE_STORAGE_KEY, JSON.stringify(farmerData));
        return { data: farmerData, isDemo: false };
      }
    } catch (err) {
      console.warn('API getProfile notice, using saved/demo profile:', err.message);
    }

    try {
      const saved = localStorage.getItem(FARMER_PROFILE_STORAGE_KEY);
      if (saved) return { data: JSON.parse(saved), isDemo: true };
      const reg = localStorage.getItem('farmer_registered_profile');
      if (reg) return { data: JSON.parse(reg), isDemo: true };
    } catch {
      // ignore
    }

    return { data: INITIAL_FARMER_PROFILE, isDemo: true };
  },

  /**
   * Update Farmer Profile
   */
  async updateProfile(profileData) {
    try {
      const res = await api.put('/farmer/profile', profileData);
      if (res && res.farmer) {
        localStorage.setItem(FARMER_PROFILE_STORAGE_KEY, JSON.stringify(res.farmer));
        return { success: true, farmer: res.farmer, message: res.message };
      }
    } catch (err) {
      console.warn('API updateProfile notice, updating local storage:', err.message);
    }

    localStorage.setItem(FARMER_PROFILE_STORAGE_KEY, JSON.stringify(profileData));
    return { success: true, farmer: profileData, message: 'Profile updated locally' };
  },

  /**
   * Get Farmer Dashboard Metrics & Activity Stream
   */
  async getDashboardMetrics() {
    try {
      const res = await api.get('/farmer/dashboard');
      if (res && res.metrics) {
        return { data: res, isDemo: false };
      }
    } catch (err) {
      console.warn('API getDashboardMetrics notice, calculating from mock:', err.message);
    }

    return {
      data: {
        metrics: {
          activeYield: {
            activeCount: 4,
            totalProduceKg: 1950,
            liveStatus: 'Live & Visible to Marketplace Buyers',
            isLive: true
          },
          activeOrders: {
            total: 1,
            pendingConfirmation: 0,
            accepted: 1,
            processingDispatched: 0
          },
          buyerEnquiries: {
            newEnquiries: 2,
            pendingResponses: 2,
            confirmedOrders: 3
          }
        },
        buyerActivity: [],
        recentActivity: []
      },
      isDemo: true
    };
  }
};

export default farmerService;
