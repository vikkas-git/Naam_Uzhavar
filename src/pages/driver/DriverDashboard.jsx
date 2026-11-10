// What this file does: Master driver module router and backward-compatible entry point.
// Delegates seamlessly to the specialized modular sub-pages:
// - DriverOverview (Active Dispatch Cockpit & Route Navigator)
// - DriverTrips (Trip Manifest & Schedule)
// - DriverEarnings (Haulage Earnings & Driver Wallet)
// - DriverProfile (Driver License & EV Vehicle Telemetry)

import React from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '../../routes';
import DriverOverview from './DriverOverview';
import DriverTrips from './DriverTrips';
import DriverEarnings from './DriverEarnings';
import DriverProfile from './DriverProfile';

export default function DriverDashboard() {
  const location = useLocation();

  if (location.pathname === ROUTES.DRIVER_DASHBOARD_TRIPS) {
    return <DriverTrips />;
  }

  if (location.pathname === ROUTES.DRIVER_DASHBOARD_EARNINGS) {
    return <DriverEarnings />;
  }

  if (location.pathname === ROUTES.DRIVER_DASHBOARD_PROFILE) {
    return <DriverProfile />;
  }

  return <DriverOverview />;
}
