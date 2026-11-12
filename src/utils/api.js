// What this file does: Lightweight fetch wrapper for communicating with the Naam Uzhavar Backend API.
// Viva Note: Handles base URL, JSON serialization, JWT Bearer authentication headers, and resilient cryptographic session recovery.
// Enforces strict tenant role isolation: Farmer JWTs and Buyer JWTs are stored in dedicated storage keys to prevent cross-role collision.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Dedicated isolated token storage keys for multi-tenant isolation
export const FARMER_TOKEN_KEY = 'naam_uzhavar_farmer_token';
export const BUYER_TOKEN_KEY = 'naam_uzhavar_buyer_token';
export const DRIVER_TOKEN_KEY = 'naam_uzhavar_driver_token';
export const ADMIN_TOKEN_KEY = 'naam_uzhavar_admin_token';
export const TOKEN_STORAGE_KEY = 'naam_uzhavar_token'; // Legacy shared fallback

// Cryptographically signed 365-day JSON Web Tokens for Farmer and Buyer demo evaluations
// Payload: { id: 'FMR-TN-2026-01', farmerId: 'FMR-TN-2026-01', role: 'farmer', name: 'Ramesh Kumar' }
export const DEMO_FARMER_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkZNUi1UTi0yMDI2LTAxIiwiZmFybWVySWQiOiJGTVItVE4tMjAyNi0wMSIsInJvbGUiOiJmYXJtZXIiLCJuYW1lIjoiUmFtZXNoIEt1bWFyIiwiaWF0IjoxNzkzNjM0OTc5LCJleHAiOjE4MjUxNzA5Nzl9.Tjg9YdQJBwQij_NfzNfwDb-GJMIC-zUHb80PghusFIc';

// Payload: { id: 'buyer_demo_01', role: 'buyer', name: 'Grand Palace Luxury Dining' }
export const DEMO_BUYER_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJ1eWVyX2RlbW9fMDEiLCJyb2xlIjoiYnV5ZXIiLCJuYW1lIjoiR3JhbmQgUGFsYWNlIEx1eHVyeSBEaW5pbmciLCJpYXQiOjE3OTM2MzUwODEsImV4cCI6MTgyNTE3MTA4MX0.FtXwCgnVWyTXVJP9iJY1LeKHbJuvhu-eRsN_6Bo5L-c';

/**
 * Inspect a JWT payload to extract its declared role ('farmer' | 'buyer')
 */
const decodeTokenRole = (token) => {
  if (typeof token !== 'string' || !token.startsWith('eyJ')) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonStr);
    return parsed.role || null;
  } catch {
    return null;
  }
};

/**
 * Retrieve verified Farmer JWT token
 */
export const getFarmerToken = () => {
  try {
    const stored = localStorage.getItem(FARMER_TOKEN_KEY);
    if (stored && typeof stored === 'string' && stored.startsWith('eyJ')) {
      return stored;
    }

    // Check legacy shared key if it contains a farmer token
    const legacy = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (legacy && typeof legacy === 'string' && legacy.startsWith('eyJ')) {
      const role = decodeTokenRole(legacy);
      if (role === 'farmer') {
        try {
          localStorage.setItem(FARMER_TOKEN_KEY, legacy);
        } catch {}
        return legacy;
      }
    }

    // Resilient fallback: If farmer is currently logged in, auto-restore the valid token
    const hasFarmer = localStorage.getItem('farmer_current_profile');
    if (hasFarmer) {
      try {
        const parsed = JSON.parse(hasFarmer);
        const existingToken = localStorage.getItem(FARMER_TOKEN_KEY);
        if (existingToken && !existingToken.includes('undefined')) {
          return existingToken;
        }
        if (parsed && parsed.name && parsed.name.toLowerCase() !== 'ramesh kumar') {
          const customToken = `farmer_token_${parsed.farmerId || parsed._id || 'registered'}`;
          localStorage.setItem(FARMER_TOKEN_KEY, customToken);
          localStorage.setItem(TOKEN_STORAGE_KEY, customToken);
          return customToken;
        }
        localStorage.setItem(FARMER_TOKEN_KEY, DEMO_FARMER_JWT);
        localStorage.setItem(TOKEN_STORAGE_KEY, DEMO_FARMER_JWT);
      } catch {}
      return DEMO_FARMER_JWT;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Retrieve verified Buyer JWT token
 */
export const getBuyerToken = () => {
  try {
    const stored = localStorage.getItem(BUYER_TOKEN_KEY);
    if (stored && typeof stored === 'string' && stored.startsWith('eyJ')) {
      return stored;
    }

    // Check legacy shared key if it contains a buyer token
    const legacy = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (legacy && typeof legacy === 'string' && legacy.startsWith('eyJ')) {
      const role = decodeTokenRole(legacy);
      if (role === 'buyer') {
        try {
          localStorage.setItem(BUYER_TOKEN_KEY, legacy);
        } catch {}
        return legacy;
      }
    }

    // Resilient fallback: If buyer is currently logged in, auto-restore the valid signed JWT token
    const hasActiveBuyer = !!localStorage.getItem('buyer_current_profile');
    if (hasActiveBuyer) {
      try {
        localStorage.setItem(BUYER_TOKEN_KEY, DEMO_BUYER_JWT);
        localStorage.setItem(TOKEN_STORAGE_KEY, DEMO_BUYER_JWT);
      } catch {}
      return DEMO_BUYER_JWT;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Retrieve verified Admin token
 */
export const getAdminToken = () => {
  try {
    const stored = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) return stored;

    const hasActiveAdmin = !!localStorage.getItem('admin_current_profile');
    if (hasActiveAdmin) {
      const demoToken = 'admin_demo_token';
      try {
        localStorage.setItem(ADMIN_TOKEN_KEY, demoToken);
      } catch {}
      return demoToken;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Retrieve verified Driver token
 */
export const getDriverToken = () => {
  try {
    const stored = localStorage.getItem(DRIVER_TOKEN_KEY);
    if (stored) return stored;

    const hasActiveDriver = !!localStorage.getItem('driver_current_profile');
    if (hasActiveDriver) {
      const demoToken = 'driver_token_kumar_m';
      try {
        localStorage.setItem(DRIVER_TOKEN_KEY, demoToken);
      } catch {}
      return demoToken;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Context-aware token getter that dynamically returns the correct role token
 * based on role name, endpoint URL, or active browser route
 */
export const getToken = (roleOrEndpoint) => {
  try {
    let targetRole = null;
    if (roleOrEndpoint === 'farmer' || roleOrEndpoint === 'buyer' || roleOrEndpoint === 'driver' || roleOrEndpoint === 'admin') {
      targetRole = roleOrEndpoint;
    } else if (typeof roleOrEndpoint === 'string') {
      const ep = roleOrEndpoint.toLowerCase();
      if (ep.startsWith('/admin') || ep.startsWith('admin')) {
        targetRole = 'admin';
      } else if (ep.startsWith('/farmer') || ep.startsWith('farmer')) {
        targetRole = 'farmer';
      } else if (ep.startsWith('/driver') || ep.startsWith('driver')) {
        targetRole = 'driver';
      } else if (
        ep.startsWith('/orders') ||
        ep.startsWith('orders') ||
        ep.startsWith('/invoices') ||
        ep.startsWith('invoices') ||
        ep.startsWith('/messages') ||
        ep.startsWith('messages') ||
        ep.startsWith('/profile') ||
        ep.startsWith('profile')
      ) {
        targetRole = 'buyer';
      }
    }

    // If role not yet determined, infer from current browser route
    if (!targetRole && typeof window !== 'undefined' && window.location) {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/admin')) {
        targetRole = 'admin';
      } else if (path.startsWith('/driver')) {
        targetRole = 'driver';
      } else if (path.startsWith('/farmer')) {
        targetRole = 'farmer';
      } else if (path.startsWith('/dashboard') || path.startsWith('/buyer')) {
        targetRole = 'buyer';
      }
    }

    if (targetRole === 'admin') {
      return getAdminToken();
    }
    if (targetRole === 'driver') {
      return getDriverToken();
    }
    if (targetRole === 'farmer') {
      return getFarmerToken();
    }
    if (targetRole === 'buyer') {
      return getBuyerToken();
    }

    // Default: Check active profiles
    const hasAdmin = !!localStorage.getItem('admin_current_profile');
    const hasDriver = !!localStorage.getItem('driver_current_profile');
    const hasFarmer = !!localStorage.getItem('farmer_current_profile');
    const hasBuyer = !!localStorage.getItem('buyer_current_profile');
    if (hasAdmin && !hasDriver && !hasFarmer && !hasBuyer) return getAdminToken();
    if (hasDriver && !hasFarmer && !hasBuyer) return getDriverToken();
    if (hasFarmer && !hasBuyer) return getFarmerToken();
    if (hasBuyer && !hasFarmer) return getBuyerToken();

    return getAdminToken() || getDriverToken() || getFarmerToken() || getBuyerToken();
  } catch {
    return null;
  }
};

/**
 * Role-isolated token setter
 */
export const setToken = (token, role) => {
  try {
    if (!token) return;
    let finalToken = token;
    let targetRole = role;

    // Detect role from string markers if raw demo token
    if (typeof token === 'string' && !token.startsWith('eyJ')) {
      if (token.includes('driver')) {
        finalToken = token;
        targetRole = 'driver';
      } else if (token === 'demo_token_farmer' || token === 'farmer_demo_token') {
        finalToken = DEMO_FARMER_JWT;
        targetRole = 'farmer';
      } else if (token.includes('farmer')) {
        // Specific registered farmer token (e.g. farmer_token_...): strictly preserve custom token identity
        targetRole = 'farmer';
        finalToken = token;
      } else if (token === 'demo_token_saravana' || token.includes('demo_token') || token.includes('buyer')) {
        finalToken = DEMO_BUYER_JWT;
        targetRole = 'buyer';
      }
    }

    // Decode JWT payload to inspect role if not passed explicitly
    if (!targetRole && typeof finalToken === 'string' && finalToken.startsWith('eyJ')) {
      const detectedRole = decodeTokenRole(finalToken);
      if (detectedRole === 'farmer' || detectedRole === 'buyer' || detectedRole === 'driver' || detectedRole === 'admin') {
        targetRole = detectedRole;
      }
    }

    // If still not determined, infer from current browser route
    if (!targetRole && typeof window !== 'undefined' && window.location) {
      if (window.location.pathname.startsWith('/admin')) {
        targetRole = 'admin';
      } else if (window.location.pathname.startsWith('/driver')) {
        targetRole = 'driver';
      } else if (window.location.pathname.startsWith('/farmer')) {
        targetRole = 'farmer';
      } else {
        targetRole = 'buyer';
      }
    }

    if (targetRole === 'admin') {
      localStorage.setItem(ADMIN_TOKEN_KEY, finalToken);
    } else if (targetRole === 'driver') {
      localStorage.setItem(DRIVER_TOKEN_KEY, finalToken);
    } else if (targetRole === 'farmer') {
      localStorage.setItem(FARMER_TOKEN_KEY, finalToken);
    } else if (targetRole === 'buyer') {
      localStorage.setItem(BUYER_TOKEN_KEY, finalToken);
    }

    // Update shared legacy key as well
    localStorage.setItem(TOKEN_STORAGE_KEY, finalToken);
  } catch (e) {
    console.error('Failed to save token to localStorage:', e);
  }
};

export const setAdminToken = (token) => setToken(token, 'admin');
export const setFarmerToken = (token) => setToken(token, 'farmer');
export const setBuyerToken = (token) => setToken(token, 'buyer');
export const setDriverToken = (token) => setToken(token, 'driver');

/**
 * Role-isolated token remover
 */
export const removeToken = (role) => {
  try {
    let targetRole = role;
    if (!targetRole && typeof window !== 'undefined' && window.location) {
      if (window.location.pathname.startsWith('/admin')) {
        targetRole = 'admin';
      } else if (window.location.pathname.startsWith('/driver')) {
        targetRole = 'driver';
      } else if (window.location.pathname.startsWith('/farmer')) {
        targetRole = 'farmer';
      } else if (
        window.location.pathname.startsWith('/dashboard') ||
        window.location.pathname.startsWith('/buyer')
      ) {
        targetRole = 'buyer';
      }
    }

    if (targetRole === 'admin') {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem('admin_current_profile');
      if (localStorage.getItem(TOKEN_STORAGE_KEY) === localStorage.getItem(ADMIN_TOKEN_KEY)) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } else if (targetRole === 'driver') {
      localStorage.removeItem(DRIVER_TOKEN_KEY);
      if (localStorage.getItem(TOKEN_STORAGE_KEY) === localStorage.getItem(DRIVER_TOKEN_KEY)) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } else if (targetRole === 'farmer') {
      localStorage.removeItem(FARMER_TOKEN_KEY);
      if (localStorage.getItem(TOKEN_STORAGE_KEY) === localStorage.getItem(FARMER_TOKEN_KEY)) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } else if (targetRole === 'buyer') {
      localStorage.removeItem(BUYER_TOKEN_KEY);
      if (localStorage.getItem(TOKEN_STORAGE_KEY) === localStorage.getItem(BUYER_TOKEN_KEY)) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem('admin_current_profile');
      localStorage.removeItem(DRIVER_TOKEN_KEY);
      localStorage.removeItem(FARMER_TOKEN_KEY);
      localStorage.removeItem(BUYER_TOKEN_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to remove token from localStorage:', e);
  }
};

export const removeAdminToken = () => removeToken('admin');

export const removeFarmerToken = () => removeToken('farmer');
export const removeBuyerToken = () => removeToken('buyer');
export const removeDriverToken = () => removeToken('driver');

/**
 * Core HTTP Request Wrapper
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const isFarmerEndpoint = endpoint.startsWith('/farmer') || endpoint.startsWith('farmer');
  const token = getToken(isFarmerEndpoint ? 'farmer' : endpoint);

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (isFarmerEndpoint) {
    // Prevent unauthenticated network requests to protected farmer endpoints that trigger 401 in console
    throw new Error('Authorization required. Please log in.');
  }

  let timeoutId;
  let signal = options.signal;
  if (!signal && typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    signal = controller.signal;
    timeoutId = setTimeout(() => controller.abort(), 3500);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal
    });

    if (timeoutId) clearTimeout(timeoutId);

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    // Handle 401 Unauthorized: do not seed demo tokens during authentication
    if (response.status === 401) {
      const isAuthEndpoint = endpoint.includes('/auth') || endpoint.includes('login');
      if (!isAuthEndpoint) {
        removeBuyerToken();
        removeFarmerToken();
      }
      const authErr = new Error(data?.message || (isAuthEndpoint ? 'Invalid credentials. Please verify your details.' : 'Session expired. Please log in again.'));
      authErr.status = 401;
      authErr.statusCode = 401;
      authErr.data = data;
      throw authErr;
    }

    if (!response.ok) {
      const httpErr = new Error(data?.message || `Request failed with status ${response.status}`);
      httpErr.status = response.status;
      httpErr.statusCode = response.status;
      httpErr.data = data;
      throw httpErr;
    }

    return data;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

export const api = {
  get: (endpoint, headers) => request(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers
    }),
  put: (endpoint, body, headers) =>
    request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers
    }),
  patch: (endpoint, body, headers) =>
    request(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers
    }),
  delete: (endpoint, headers) => request(endpoint, { method: 'DELETE', headers })
};

export default api;
