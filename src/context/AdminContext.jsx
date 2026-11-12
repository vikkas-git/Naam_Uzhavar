// context/AdminContext.jsx - Centralized state and authentication for Naam Uzhavar Admin Dashboard
// Viva Note: Manages admin session lifecycle, overview telemetry, and module coordination across Farmer, Buyer, and Driver operations.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { ADMIN_TOKEN_KEY, setAdminToken, removeAdminToken } from '../utils/api';

const AdminContext = createContext(null);

export const DEFAULT_ADMIN_PROFILE = {
  id: 'admin_central_01',
  name: 'Naam Uzhavar Central Administrator',
  email: 'admin@naamuzhavar.com',
  phone: '+91 94432 00000',
  role: 'admin',
  avatar: ''
};

export function AdminProvider({ children }) {
  // Synchronous initialization to prevent route guard flashing on direct URL refresh
  const [adminProfile, setAdminProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_current_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'admin' || parsed.email)) {
          if (parsed.avatar && parsed.avatar.includes('photo-1534528741775-53994a69daeb')) {
            parsed.avatar = '';
          }
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [token, setTokenState] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [overviewMetrics, setOverviewMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const isAuthenticated = Boolean(adminProfile && token);

  const showToast = useCallback((type, message) => {
    setToastMessage({ type, message, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Fetch Admin overview stats
  const fetchOverview = useCallback(async () => {
    if (!isAuthenticated) return null;
    setIsLoading(true);
    try {
      const res = await api.get('/admin/overview');
      if (res && res.success) {
        setOverviewMetrics(res);
        return res;
      }
    } catch (err) {
      console.warn('Notice loading admin overview:', err?.message);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [isAuthenticated]);

  // Handle Admin Login
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await api.post('/admin/auth/login', { email, password });
      if (res && res.success && res.token) {
        setAdminToken(res.token);
        setTokenState(res.token);
        setAdminProfile(res.admin);
        try {
          localStorage.setItem('admin_current_profile', JSON.stringify(res.admin));
        } catch {}
        showToast('success', 'Welcome, Central Administrator!');
        return { success: true, admin: res.admin };
      }
      throw new Error(res?.message || 'Authentication failed');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid admin credentials';
      showToast('error', msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Admin Logout
  const logout = useCallback(() => {
    removeAdminToken();
    setTokenState(null);
    setAdminProfile(null);
    setOverviewMetrics(null);
    try {
      localStorage.removeItem('admin_current_profile');
    } catch {}
    showToast('info', 'Logged out of Admin Portal');
  }, [showToast]);

  // Update Admin Profile
  const updateProfile = async (formData) => {
    setIsLoading(true);
    try {
      const res = await api.put('/admin/profile', formData);
      if (res && res.success && res.admin) {
        setAdminProfile(res.admin);
        try {
          localStorage.setItem('admin_current_profile', JSON.stringify(res.admin));
        } catch {}
        showToast('success', 'Admin profile updated successfully');
        return { success: true };
      }
      throw new Error(res?.message || 'Failed to update profile');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Update failed';
      showToast('error', msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // On mount: load overview data if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOverview();
    }
  }, [isAuthenticated, fetchOverview]);

  const value = {
    adminProfile,
    token,
    isAuthenticated,
    isLoading,
    overviewMetrics,
    fetchOverview,
    login,
    logout,
    updateProfile,
    showToast,
    toastMessage
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

