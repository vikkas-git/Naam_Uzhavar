// What this file does: Main application component with route definitions, lazy loading, and language provider wrapper.

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ROUTES } from './routes';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import RoleSelectPage from './pages/RoleSelectPage';
import BuyerRegister from './pages/BuyerRegister';
import FarmerRegister from './pages/FarmerRegister';
import DriverRegister from './pages/DriverRegister';
import ComingSoonPage from './pages/ComingSoonPage';
import NotFoundPage from './pages/NotFoundPage';
import BuyerDashboardLayout from './components/BuyerDashboardLayout';
import FarmerDashboardLayout from './components/farmer/FarmerDashboardLayout';
import DriverDashboardLayout from './components/driver/DriverDashboardLayout';
import { ModulePageSkeleton } from './components/Skeleton';
import { AdminProvider } from './context/AdminContext';

// Lazy-loaded buyer dashboard sub-pages directly without barrel files for optimal code splitting
const Overview = lazy(() => import('./pages/buyer/Overview.jsx'));
const Crops = lazy(() => import('./pages/buyer/Crops.jsx'));
const Orders = lazy(() => import('./pages/buyer/Orders.jsx'));
const Track = lazy(() => import('./pages/buyer/Track.jsx'));
const Invoices = lazy(() => import('./pages/buyer/Invoices.jsx'));
const Profile = lazy(() => import('./pages/buyer/Profile.jsx'));

// Lazy-loaded farmer dashboard sub-pages
const FarmerDashboard = lazy(() => import('./pages/farmer/Dashboard.jsx'));
const FarmerYield = lazy(() => import('./pages/farmer/YieldManagement.jsx'));
const FarmerRequests = lazy(() => import('./pages/farmer/Requests.jsx'));
const FarmerOrders = lazy(() => import('./pages/farmer/OrderHistory.jsx'));
const FarmerProfile = lazy(() => import('./pages/farmer/FarmerProfile.jsx'));
const DriverOverview = lazy(() => import('./pages/driver/DriverOverview.jsx'));
const DriverTrips = lazy(() => import('./pages/driver/DriverTrips.jsx'));
const DriverEarnings = lazy(() => import('./pages/driver/DriverEarnings.jsx'));
const DriverProfile = lazy(() => import('./pages/driver/DriverProfile.jsx'));

// Lazy-loaded centralized admin dashboard sub-pages
const AdminPage = lazy(() => import('./pages/admin/AdminPage.jsx'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview.jsx'));
const AdminFarmers = lazy(() => import('./pages/admin/AdminFarmers.jsx'));
const AdminBuyers = lazy(() => import('./pages/admin/AdminBuyers.jsx'));
const AdminDrivers = lazy(() => import('./pages/admin/AdminDrivers.jsx'));
const AdminRequests = lazy(() => import('./pages/admin/AdminRequests.jsx'));
const AdminDeliveries = lazy(() => import('./pages/admin/AdminDeliveries.jsx'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports.jsx'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile.jsx'));

/**
 * Fallback skeleton loader during lazy chunk transition for Admin pages
 */
function AdminPageFallback() {
  return (
    <div style={{ padding: '24px' }}>
      <ModulePageSkeleton />
    </div>
  );
}

/**
 * Fallback skeleton loader during lazy chunk transition for Buyer pages
 */
function DashboardPageFallback() {
  return (
    <div className="buyer-view-container animate-fade-in" style={{ padding: '8px 0' }}>
      <ModulePageSkeleton />
    </div>
  );
}

/**
 * Fallback skeleton loader during lazy chunk transition for Farmer pages
 */
function FarmerDashboardPageFallback() {
  return (
    <div className="farmer-view-container animate-fade-in" style={{ padding: '8px 0' }}>
      <ModulePageSkeleton />
    </div>
  );
}

/**
 * Universal Dashboard Redirect
 * Automatically determines whether to route to Farmer Dashboard or Buyer Dashboard
 * based on the active session role, preserving both Farmer and Buyer portal navigation contracts.
 */
function UniversalDashboardRedirect() {
  let isFarmer = false;
  let isBuyer = false;
  const hasFarmerSignedOut =
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('farmer_explicit_signout') === 'true';
  const hasBuyerSignedOut =
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('buyer_explicit_signout') === 'true';

  try {
    isFarmer = Boolean(localStorage.getItem('farmer_current_profile'));
    isBuyer = Boolean(localStorage.getItem('buyer_current_profile') || localStorage.getItem('buyer_registered_profile'));
  } catch {
    // ignore
  }

  // If buyer profile is active and not explicitly signed out, route to Buyer Dashboard
  if (isBuyer && !hasBuyerSignedOut && (hasFarmerSignedOut || !isFarmer)) {
    return <Navigate to={ROUTES.BUYER_DASHBOARD} replace />;
  }

  // If farmer profile is active and not explicitly signed out, route to Farmer Dashboard
  if (isFarmer && !hasFarmerSignedOut) {
    return <Navigate to={ROUTES.FARMER_DASHBOARD} replace />;
  }

  // If buyer profile is present and not signed out
  if (isBuyer && !hasBuyerSignedOut) {
    return <Navigate to={ROUTES.BUYER_DASHBOARD} replace />;
  }

  // Default: Route to role-select if no session is active
  return <Navigate to={ROUTES.ROLE_SELECT} replace />;
}

/**
 * Universal Subpage Redirect
 * Routes /dashboard/crops, /dashboard/orders, /dashboard/profile to either
 * Buyer portal or Farmer portal depending on the authenticated role.
 */
function UniversalSubpageRedirect({ subpage }) {
  let isFarmer = false;
  let isBuyer = false;
  const hasFarmerSignedOut =
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('farmer_explicit_signout') === 'true';
  const hasBuyerSignedOut =
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('buyer_explicit_signout') === 'true';

  try {
    isFarmer = Boolean(localStorage.getItem('farmer_current_profile'));
    isBuyer = Boolean(localStorage.getItem('buyer_current_profile') || localStorage.getItem('buyer_registered_profile'));
  } catch {
    // ignore
  }

  // If buyer is active
  if (isBuyer && !hasBuyerSignedOut && (hasFarmerSignedOut || !isFarmer)) {
    if (subpage === 'crops') return <Navigate to={ROUTES.BUYER_DASHBOARD_CROPS} replace />;
    if (subpage === 'orders') return <Navigate to={ROUTES.BUYER_DASHBOARD_ORDERS} replace />;
    if (subpage === 'profile') return <Navigate to={ROUTES.BUYER_DASHBOARD_PROFILE} replace />;
    return <Navigate to={ROUTES.BUYER_DASHBOARD} replace />;
  }

  // Default to Farmer subpage
  if (subpage === 'crops' || subpage === 'yield') return <Navigate to={ROUTES.FARMER_DASHBOARD_CROPS} replace />;
  if (subpage === 'requests') return <Navigate to={ROUTES.FARMER_DASHBOARD_REQUESTS} replace />;
  if (subpage === 'orders') return <Navigate to={ROUTES.FARMER_DASHBOARD_ORDERS} replace />;
  if (subpage === 'profile') return <Navigate to={ROUTES.FARMER_DASHBOARD_PROFILE} replace />;
  return <Navigate to={ROUTES.FARMER_DASHBOARD} replace />;
}

/**
 * App Component
 * Wraps application in LanguageProvider and defines top-level route tree.
 */
export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        {/* 1. Public Home Landing Page */}
        <Route path={ROUTES.HOME} element={<HomePage />} />

        {/* 2. Unified Role Selection */}
        <Route path={ROUTES.ROLE_SELECT} element={<RoleSelectPage />} />

        {/* 3. Buyer Portal Auth: Unified Role Select & Register */}
        <Route path="/buyer-login" element={<Navigate to="/role-select?role=buyer" replace />} />
        <Route path="/buyer/login" element={<Navigate to="/role-select?role=buyer" replace />} />
        <Route
          path={ROUTES.BUYER_REGISTER}
          element={
            <ProtectedRoute role="buyer" mode="guest">
              <BuyerRegister />
            </ProtectedRoute>
          }
        />
        <Route path="/buyer/register" element={<Navigate to={ROUTES.BUYER_REGISTER} replace />} />

        {/* Buyer dashboard alias routes */}
        <Route path="/buyer" element={<Navigate to={ROUTES.BUYER_DASHBOARD} replace />} />
        <Route path="/buyer/crops" element={<Navigate to={ROUTES.BUYER_DASHBOARD_CROPS} replace />} />
        <Route path="/buyer/orders" element={<Navigate to={ROUTES.BUYER_DASHBOARD_ORDERS} replace />} />
        <Route path="/buyer/track" element={<Navigate to={ROUTES.BUYER_DASHBOARD_TRACK} replace />} />
        <Route path="/buyer/invoices" element={<Navigate to={ROUTES.BUYER_DASHBOARD_INVOICES} replace />} />
        <Route path="/buyer/profile" element={<Navigate to={ROUTES.BUYER_DASHBOARD_PROFILE} replace />} />
        <Route path="/buyer/dashboard" element={<Navigate to={ROUTES.BUYER_DASHBOARD} replace />} />
        <Route path="/buyer/dashboard/crops" element={<Navigate to={ROUTES.BUYER_DASHBOARD_CROPS} replace />} />
        <Route path="/buyer/dashboard/orders" element={<Navigate to={ROUTES.BUYER_DASHBOARD_ORDERS} replace />} />
        <Route path="/buyer/dashboard/track" element={<Navigate to={ROUTES.BUYER_DASHBOARD_TRACK} replace />} />
        <Route path="/buyer/dashboard/invoices" element={<Navigate to={ROUTES.BUYER_DASHBOARD_INVOICES} replace />} />
        <Route path="/buyer/dashboard/messages" element={<Navigate to={ROUTES.BUYER_DASHBOARD} replace />} />
        <Route path="/buyer/dashboard/profile" element={<Navigate to={ROUTES.BUYER_DASHBOARD_PROFILE} replace />} />
        <Route path="/buyer/dashboard/*" element={<Navigate to={ROUTES.BUYER_DASHBOARD} replace />} />

        {/* 4. Commercial Buyer Hub Dashboard */}
        <Route
          path={ROUTES.BUYER_DASHBOARD}
          element={
            <ProtectedRoute role="buyer" mode="auth">
              <BuyerDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<DashboardPageFallback />}>
                <Overview />
              </Suspense>
            }
          />
          <Route
            path="crops"
            element={
              <Suspense fallback={<DashboardPageFallback />}>
                <Crops />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<DashboardPageFallback />}>
                <Orders />
              </Suspense>
            }
          />
          <Route
            path="track"
            element={
              <Suspense fallback={<DashboardPageFallback />}>
                <Track />
              </Suspense>
            }
          />
          <Route
            path="invoices"
            element={
              <Suspense fallback={<DashboardPageFallback />}>
                <Invoices />
              </Suspense>
            }
          />
          <Route
            path="messages"
            element={<Navigate to={ROUTES.BUYER_DASHBOARD} replace />}
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<DashboardPageFallback />}>
                <Profile />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to={ROUTES.BUYER_DASHBOARD} replace />} />
        </Route>

        {/* 5. Farmer Portal Auth Routes */}
        <Route path="/farmer-login" element={<Navigate to={ROUTES.FARMER_LOGIN} replace />} />
        <Route path="/farmer/login" element={<Navigate to={ROUTES.FARMER_LOGIN} replace />} />
        <Route
          path={ROUTES.FARMER_REGISTER}
          element={
            <ProtectedRoute role="farmer" mode="guest">
              <FarmerRegister />
            </ProtectedRoute>
          }
        />
        <Route path="/farmer/register" element={<Navigate to={ROUTES.FARMER_REGISTER} replace />} />

        {/* Universal Dashboard Routes */}
        <Route path="/dashboard" element={<UniversalDashboardRedirect />} />
        <Route path="/dashboard/crops" element={<UniversalSubpageRedirect subpage="crops" />} />
        <Route path="/dashboard/yield" element={<Navigate to={ROUTES.FARMER_DASHBOARD_CROPS} replace />} />
        <Route path="/dashboard/requests" element={<Navigate to={ROUTES.FARMER_DASHBOARD_REQUESTS} replace />} />
        <Route path="/dashboard/orders" element={<UniversalSubpageRedirect subpage="orders" />} />
        <Route path="/dashboard/profile" element={<UniversalSubpageRedirect subpage="profile" />} />
        <Route path="/dashboard/*" element={<UniversalDashboardRedirect />} />

        {/* Universal Auth Aliases */}
        <Route path="/login" element={<Navigate to={ROUTES.ROLE_SELECT} replace />} />
        <Route path="/register" element={<Navigate to={ROUTES.ROLE_SELECT} replace />} />

        {/* Global Shorthands */}
        <Route path="/crops" element={<UniversalSubpageRedirect subpage="crops" />} />
        <Route path="/yield" element={<Navigate to={ROUTES.FARMER_DASHBOARD_CROPS} replace />} />
        <Route path="/requests" element={<Navigate to={ROUTES.FARMER_DASHBOARD_REQUESTS} replace />} />
        <Route path="/orders" element={<UniversalSubpageRedirect subpage="orders" />} />
        <Route path="/profile" element={<UniversalSubpageRedirect subpage="profile" />} />

        {/* Farmer Portal Aliases */}
        <Route path="/farmer" element={<Navigate to={ROUTES.FARMER_DASHBOARD} replace />} />
        <Route path="/farmer/dashboard" element={<Navigate to={ROUTES.FARMER_DASHBOARD} replace />} />
        <Route path="/farmer/crops" element={<Navigate to={ROUTES.FARMER_DASHBOARD_CROPS} replace />} />
        <Route path="/farmer/yield" element={<Navigate to={ROUTES.FARMER_DASHBOARD_CROPS} replace />} />
        <Route path="/farmer/requests" element={<Navigate to={ROUTES.FARMER_DASHBOARD_REQUESTS} replace />} />
        <Route path="/farmer/orders" element={<Navigate to={ROUTES.FARMER_DASHBOARD_ORDERS} replace />} />
        <Route path="/farmer/profile" element={<Navigate to={ROUTES.FARMER_DASHBOARD_PROFILE} replace />} />
        <Route path="/farmer/dashboard/crops" element={<Navigate to={ROUTES.FARMER_DASHBOARD_CROPS} replace />} />
        <Route path="/farmer/dashboard/yield" element={<Navigate to={ROUTES.FARMER_DASHBOARD_CROPS} replace />} />
        <Route path="/farmer/dashboard/requests" element={<Navigate to={ROUTES.FARMER_DASHBOARD_REQUESTS} replace />} />
        <Route path="/farmer/dashboard/orders" element={<Navigate to={ROUTES.FARMER_DASHBOARD_ORDERS} replace />} />
        <Route path="/farmer/dashboard/profile" element={<Navigate to={ROUTES.FARMER_DASHBOARD_PROFILE} replace />} />
        <Route path="/farmer/dashboard/*" element={<Navigate to={ROUTES.FARMER_DASHBOARD} replace />} />
        <Route path="/farmer-yield" element={<Navigate to={ROUTES.FARMER_DASHBOARD_CROPS} replace />} />
        <Route path="/farmer-crops" element={<Navigate to={ROUTES.FARMER_DASHBOARD_CROPS} replace />} />
        <Route path="/farmer-requests" element={<Navigate to={ROUTES.FARMER_DASHBOARD_REQUESTS} replace />} />
        <Route path="/farmer-orders" element={<Navigate to={ROUTES.FARMER_DASHBOARD_ORDERS} replace />} />
        <Route path="/farmer-profile" element={<Navigate to={ROUTES.FARMER_DASHBOARD_PROFILE} replace />} />
        <Route path="/farmer/*" element={<Navigate to={ROUTES.FARMER_DASHBOARD} replace />} />

        {/* 6. Complete Responsive Farmer Module (5 Pages) */}
        <Route
          path={ROUTES.FARMER_DASHBOARD}
          element={
            <ProtectedRoute role="farmer" mode="auth">
              <FarmerDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<FarmerDashboardPageFallback />}>
                <FarmerDashboard />
              </Suspense>
            }
          />
          <Route
            path="crops"
            element={
              <Suspense fallback={<FarmerDashboardPageFallback />}>
                <FarmerYield />
              </Suspense>
            }
          />
          <Route
            path="yield"
            element={
              <Suspense fallback={<FarmerDashboardPageFallback />}>
                <FarmerYield />
              </Suspense>
            }
          />
          <Route
            path="requests"
            element={
              <Suspense fallback={<FarmerDashboardPageFallback />}>
                <FarmerRequests />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<FarmerDashboardPageFallback />}>
                <FarmerOrders />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<FarmerDashboardPageFallback />}>
                <FarmerProfile />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to={ROUTES.FARMER_DASHBOARD} replace />} />
        </Route>

        {/* 7. Complete Responsive Driver Logistics Module */}
        <Route
          path={ROUTES.DRIVER_DASHBOARD}
          element={
            <ProtectedRoute role="driver" mode="auth">
              <DriverDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<FarmerDashboardPageFallback />}>
                <DriverOverview />
              </Suspense>
            }
          />
          <Route
            path="trips"
            element={
              <Suspense fallback={<FarmerDashboardPageFallback />}>
                <DriverTrips />
              </Suspense>
            }
          />
          <Route
            path="earnings"
            element={
              <Suspense fallback={<FarmerDashboardPageFallback />}>
                <DriverEarnings />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<FarmerDashboardPageFallback />}>
                <DriverProfile />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to={ROUTES.DRIVER_DASHBOARD} replace />} />
        </Route>

        {/* Driver Aliases */}
        <Route path="/driver" element={<Navigate to={ROUTES.DRIVER_DASHBOARD} replace />} />
        <Route path="/driver/dashboard" element={<Navigate to={ROUTES.DRIVER_DASHBOARD} replace />} />
        <Route path="/driver-login" element={<Navigate to={ROUTES.DRIVER_LOGIN} replace />} />
        <Route path="/driver/login" element={<Navigate to={ROUTES.DRIVER_LOGIN} replace />} />
        <Route
          path={ROUTES.DRIVER_REGISTER}
          element={
            <ProtectedRoute role="driver" mode="guest">
              <DriverRegister />
            </ProtectedRoute>
          }
        />
        <Route path="/driver/register" element={<Navigate to={ROUTES.DRIVER_REGISTER} replace />} />
        <Route path="/driver/*" element={<Navigate to={ROUTES.DRIVER_DASHBOARD} replace />} />

        {/* 8. Centralized Operations Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <AdminProvider>
              <Suspense fallback={<AdminPageFallback />}>
                <AdminPage />
              </Suspense>
            </AdminProvider>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminOverview />
              </Suspense>
            }
          />
          <Route
            path="farmers"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminFarmers />
              </Suspense>
            }
          />
          <Route
            path="buyers"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminBuyers />
              </Suspense>
            }
          />
          <Route
            path="drivers"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminDrivers />
              </Suspense>
            }
          />
          <Route
            path="requests"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminRequests />
              </Suspense>
            }
          />
          <Route
            path="deliveries"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminDeliveries />
              </Suspense>
            }
          />
          <Route
            path="orders"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminOrders />
              </Suspense>
            }
          />
          <Route
            path="reports"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminReports />
              </Suspense>
            }
          />
          <Route
            path="profile"
            element={
              <Suspense fallback={<AdminPageFallback />}>
                <AdminProfile />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* 9. Placeholder Portals */}
        <Route path={ROUTES.COMING_SOON} element={<ComingSoonPage />} />

        {/* 8. 404 Catch-All Page Not Found Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </LanguageProvider>
  );
}
