// What this file does: Guards routes based on role (buyer/farmer) and authentication status ('auth' requires login, 'guest' requires unauthenticated).

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../routes';

/**
 * ProtectedRoute Component
 * - role='buyer' (default): Protects commercial buyer routes.
 * - role='farmer': Protects farmer producer portal routes.
 * - mode='auth' (default): Protects private routes.
 * - mode='guest': For guest/auth routes (login/register).
 */
export function ProtectedRoute({ role = 'buyer', mode = 'auth', children }) {
  if (role === 'driver') {
    const hasDriverSignedOut =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('driver_explicit_signout') === 'true';

    let isDriverAuth = false;
    if (!hasDriverSignedOut) {
      try {
        const raw = localStorage.getItem('driver_current_profile');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            isDriverAuth = true;
          }
        }
      } catch {
        isDriverAuth = false;
      }
    }

    if (mode === 'auth' && !isDriverAuth) {
      return <Navigate to={ROUTES.DRIVER_LOGIN} replace />;
    }

    if (mode === 'guest' && isDriverAuth) {
      return <Navigate to={ROUTES.DRIVER_DASHBOARD} replace />;
    }

    return children ? children : <Outlet />;
  }

  if (role === 'farmer') {
    const hasFarmerSignedOut =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('farmer_explicit_signout') === 'true';

    let isFarmerAuth = false;
    if (!hasFarmerSignedOut) {
      try {
        const raw = localStorage.getItem('farmer_current_profile');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            isFarmerAuth = true;
          }
        }
      } catch {
        isFarmerAuth = false;
      }
    }

    if (mode === 'auth' && !isFarmerAuth) {
      return <Navigate to={ROUTES.FARMER_LOGIN} replace />;
    }

    if (mode === 'guest' && isFarmerAuth) {
      return <Navigate to={ROUTES.FARMER_DASHBOARD} replace />;
    }

    return children ? children : <Outlet />;
  }

  // Default: Buyer Role
  const hasSignedOut =
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('buyer_explicit_signout') === 'true';

  let isAuthenticated = false;
  if (!hasSignedOut) {
    try {
      const raw =
        localStorage.getItem('buyer_current_profile') ||
        localStorage.getItem('buyer_registered_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          isAuthenticated = true;
        }
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // If accessing protected buyer dashboard without valid credentials:
  // Redirect unauthenticated users to the login page
  if (mode === 'auth' && !isAuthenticated) {
    return <Navigate to={ROUTES.BUYER_LOGIN} replace />;
  }

  if (mode === 'guest' && isAuthenticated) {
    return <Navigate to={ROUTES.BUYER_DASHBOARD} replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
