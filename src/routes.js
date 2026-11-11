// What this file does: Defines all application route path constants (e.g., ROUTES.HOME, ROUTES.BUYER_DASHBOARD, ROUTES.FARMER_DASHBOARD).

/**
 * Centralized Route Paths Definition
 * Provides single source of truth for navigation across the entire application.
 */
export const ROUTES = {
  HOME: '/',
  ROLE_SELECT: '/role-select',
  BUYER_LOGIN: '/role-select?role=buyer',
  BUYER_REGISTER: '/buyer-register',
  BUYER_DASHBOARD: '/buyer-dashboard',
  BUYER_DASHBOARD_CROPS: '/buyer-dashboard/crops',
  BUYER_DASHBOARD_ORDERS: '/buyer-dashboard/orders',
  BUYER_DASHBOARD_TRACK: '/buyer-dashboard/track',
  BUYER_DASHBOARD_INVOICES: '/buyer-dashboard/invoices',
  BUYER_DASHBOARD_MESSAGES: '/buyer-dashboard/messages',
  BUYER_DASHBOARD_PROFILE: '/buyer-dashboard/profile',
  // Farmer Authentication Routes
  FARMER_LOGIN: '/role-select?role=farmer',
  LOGIN: '/role-select?role=farmer',
  FARMER_REGISTER: '/farmer-register',
  REGISTER: '/farmer-register',
  // Farmer Module Dashboard & Sub-pages
  FARMER_DASHBOARD: '/farmer-dashboard',
  DASHBOARD: '/farmer-dashboard',
  FARMER_DASHBOARD_CROPS: '/farmer-dashboard/crops',
  FARMER_DASHBOARD_YIELD: '/farmer-dashboard/crops',
  FARMER_YIELD: '/farmer-dashboard/crops',
  YIELD: '/farmer-dashboard/crops',
  FARMER_DASHBOARD_REQUESTS: '/farmer-dashboard/requests',
  FARMER_DASHBOARD_ORDERS: '/farmer-dashboard/orders',
  FARMER_DASHBOARD_PROFILE: '/farmer-dashboard/profile',
  // Driver Module Routes
  DRIVER_LOGIN: '/role-select?role=driver',
  DRIVER_REGISTER: '/driver-register',
  DRIVER_DASHBOARD: '/driver-dashboard',
  DRIVER_DASHBOARD_TRIPS: '/driver-dashboard/trips',
  DRIVER_DASHBOARD_EARNINGS: '/driver-dashboard/earnings',
  DRIVER_DASHBOARD_PROFILE: '/driver-dashboard/profile',
  // Shared
  COMING_SOON: '/coming-soon',
  NOT_FOUND: '/404',
};
