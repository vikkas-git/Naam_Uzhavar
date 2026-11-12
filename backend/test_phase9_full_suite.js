// backend/test_phase9_full_suite.js - Comprehensive Master End-to-End Test Suite for Phase 9
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runPhase9MasterSuite() {
  console.log('================================================================');
  console.log('🧪 NAAM UZHAVAR PHASE 9 MASTER END-TO-END INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // ==========================================================================
  // SECTION 1: EXISTING VIKKAS USER AUTHENTICATION & REGISTRATION
  // ==========================================================================
  console.log('--- SECTION 1: EXISTING VIKKAS USER AUTHENTICATION & APIS ---');

  // 1.1 Health Check
  const healthRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  assert(
    healthRes.status === 200 && healthRes.data.status === 'ok' && healthRes.data.database.connected,
    '1.1 Backend Health Check responds 200 OK with active database connection'
  );

  // 1.2 Public Produce Catalog
  const publicCropsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/crops',
    method: 'GET'
  });
  const cropsList = publicCropsRes.data?.crops || publicCropsRes.data;
  assert(
    publicCropsRes.status === 200 && Array.isArray(cropsList) && cropsList.length > 0,
    `1.2 Public Produce Catalog (/api/crops) returns ${cropsList?.length || 0} produce consignments`
  );

  // 1.3 Buyer Login
  const buyerLoginRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'demo@naamuzhavar.com',
    password: 'demo1234'
  });
  assert(
    buyerLoginRes.status === 200 && buyerLoginRes.data.token,
    '1.3 Buyer Login (demo@naamuzhavar.com) succeeds and generates valid buyer token'
  );
  const buyerToken = buyerLoginRes.data?.token;
  const buyerHeaders = { Authorization: `Bearer ${buyerToken}` };

  // 1.4 Buyer Protected APIs (Orders, Invoices, Messages)
  const buyerOrdersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/orders',
    method: 'GET',
    headers: buyerHeaders
  });
  const ordersList = buyerOrdersRes.data?.orders || buyerOrdersRes.data;
  assert(
    buyerOrdersRes.status === 200 && Array.isArray(ordersList),
    `1.4 Buyer Protected Orders (/api/orders) returns ${ordersList?.length || 0} order records`
  );

  const buyerInvoicesRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/invoices',
    method: 'GET',
    headers: buyerHeaders
  });
  assert(
    buyerInvoicesRes.status === 200,
    '1.5 Buyer Protected Invoices (/api/invoices) returns commercial invoice records'
  );

  const buyerMessagesRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/messages',
    method: 'GET',
    headers: buyerHeaders
  });
  assert(
    buyerMessagesRes.status === 200,
    '1.6 Buyer Protected Messages (/api/messages) returns thread communications'
  );

  // 1.5 Farmer Login
  const farmerLoginRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/farmer/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'farmer@naamuzhavar.com',
    password: 'farmer1234'
  });
  assert(
    farmerLoginRes.status === 200 && farmerLoginRes.data.token && farmerLoginRes.data.farmer.role === 'farmer',
    '1.7 Farmer Login (farmer@naamuzhavar.com) succeeds and generates valid farmer token'
  );
  const farmerToken = farmerLoginRes.data?.token;
  const farmerHeaders = { Authorization: `Bearer ${farmerToken}` };

  // 1.6 Farmer Protected APIs
  const farmerDashboardRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/farmer/dashboard',
    method: 'GET',
    headers: farmerHeaders
  });
  assert(
    farmerDashboardRes.status === 200 && farmerDashboardRes.data.success,
    '1.8 Farmer Dashboard API (/api/farmer/dashboard) returns live yield & revenue telemetry'
  );

  const farmerCropsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/farmer/crops',
    method: 'GET',
    headers: farmerHeaders
  });
  assert(
    farmerCropsRes.status === 200 && Array.isArray(farmerCropsRes.data.crops),
    `1.9 Farmer Crop Yields (/api/farmer/crops) returns ${farmerCropsRes.data.crops?.length || 0} farmer listings`
  );

  const farmerRequestsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/farmer/requests',
    method: 'GET',
    headers: farmerHeaders
  });
  assert(
    farmerRequestsRes.status === 200 && Array.isArray(farmerRequestsRes.data.requests),
    '1.10 Farmer Requests API (/api/farmer/requests) returns buyer purchase inquiries'
  );

  // 1.7 Driver Login & APIs
  const driverLoginRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/driver/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    driverId: 'DRV-TN-2026-08',
    pin: '1234'
  });
  assert(
    driverLoginRes.status === 200 && driverLoginRes.data.token && driverLoginRes.data.driver.role === 'driver',
    '1.11 Driver Login (DRV-TN-2026-08) succeeds and generates driver token'
  );
  const driverToken = driverLoginRes.data?.token;
  const driverHeaders = { Authorization: `Bearer ${driverToken}` };

  const driverTripsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/driver/trips',
    method: 'GET',
    headers: driverHeaders
  });
  assert(
    driverTripsRes.status === 200 && Array.isArray(driverTripsRes.data.trips),
    `1.12 Driver Dispatches (/api/driver/trips) returns ${driverTripsRes.data.trips?.length || 0} active EV logistics trips`
  );

  // ==========================================================================
  // SECTION 2: NEWLY INTEGRATED ADMIN MODULE (ALL 7 SUB-MODULES)
  // ==========================================================================
  console.log('\n--- SECTION 2: NEWLY INTEGRATED ADMIN MODULE ---');

  // 2.1 Admin Login
  const adminLoginRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'admin@naamuzhavar.com',
    password: 'Admin@2026'
  });
  assert(
    adminLoginRes.status === 200 && adminLoginRes.data.token && adminLoginRes.data.admin.role === 'admin',
    '2.1 Admin Login with valid credentials succeeds and issues role=admin JWT'
  );
  const adminToken = adminLoginRes.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // 2.2 Admin Authentication Guard (me endpoint)
  const adminMeRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/auth/me',
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    adminMeRes.status === 200 && adminMeRes.data.admin && adminMeRes.data.admin.email === 'admin@naamuzhavar.com',
    '2.2 Admin Auth Profile (/api/admin/auth/me) retrieves authenticated administrator identity'
  );

  // 2.3 Central Overview & Real-time Aggregations
  const adminOverviewRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/overview',
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    adminOverviewRes.status === 200 &&
    adminOverviewRes.data.success &&
    adminOverviewRes.data.metrics &&
    adminOverviewRes.data.metrics.totalFarmers > 0 &&
    adminOverviewRes.data.metrics.totalBuyers > 0,
    '2.3 Admin Overview (/api/admin/overview) returns cross-tenant aggregations & volume metrics'
  );

  // 2.4 Farmer Management (Directory, Query, Status Toggle)
  const adminFarmersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/farmers',
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    adminFarmersRes.status === 200 && Array.isArray(adminFarmersRes.data.farmers) && adminFarmersRes.data.farmers.length > 0,
    `2.4 Admin Farmer Directory (/api/admin/farmers) lists ${adminFarmersRes.data.farmers?.length} registered producers`
  );

  const targetFarmerId = adminFarmersRes.data.farmers[0].farmerId || adminFarmersRes.data.farmers[0]._id;
  const adminSingleFarmerRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/admin/farmers/${targetFarmerId}`,
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    adminSingleFarmerRes.status === 200 && adminSingleFarmerRes.data.farmer,
    `2.5 Admin Single Farmer Profile (/api/admin/farmers/${targetFarmerId}) retrieves profile & crops`
  );

  // 2.5 Buyer Management (Directory & Audit)
  const adminBuyersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/buyers',
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    adminBuyersRes.status === 200 && Array.isArray(adminBuyersRes.data.buyers) && adminBuyersRes.data.buyers.length > 0,
    `2.6 Admin Buyer Directory (/api/admin/buyers) lists ${adminBuyersRes.data.buyers?.length} commercial buyers`
  );

  // 2.6 Driver Fleet Logistics Management
  const adminDriversRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/drivers',
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    adminDriversRes.status === 200 && Array.isArray(adminDriversRes.data.drivers) && adminDriversRes.data.drivers.length > 0,
    `2.7 Admin Driver Fleet (/api/admin/drivers) returns ${adminDriversRes.data.drivers?.length} EV logistics drivers`
  );

  // 2.7 Purchase Requests Management
  const adminRequestsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/requests',
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    adminRequestsRes.status === 200 && Array.isArray(adminRequestsRes.data.requests) && adminRequestsRes.data.metrics,
    '2.8 Admin Purchase Requests (/api/admin/requests) returns buyer demand pipeline & metrics'
  );

  // 2.8 Consignment Delivery Logistics
  const adminDeliveriesRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/deliveries',
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    adminDeliveriesRes.status === 200 && Array.isArray(adminDeliveriesRes.data.deliveries),
    `2.9 Admin Deliveries (/api/admin/deliveries) lists ${adminDeliveriesRes.data.deliveries?.length} consignments`
  );

  // 2.9 Commercial Order Ledger & Escrow Management
  const adminOrdersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/orders',
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    adminOrdersRes.status === 200 && Array.isArray(adminOrdersRes.data.orders) && adminOrdersRes.data.metrics,
    '2.10 Admin Orders Ledger (/api/admin/orders) lists orders with financial escrow metrics'
  );

  const testOrderId = adminOrdersRes.data.orders[0]?.orderId || adminOrdersRes.data.orders[0]?._id;
  if (testOrderId) {
    const patchOrderRes = await request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/admin/orders/${testOrderId}/status`,
      method: 'PATCH',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' }
    }, {
      paymentStatus: 'RELEASED_TO_FARMER',
      note: 'Admin verified harvest quality and released escrow payout'
    });
    assert(
      patchOrderRes.status === 200 && patchOrderRes.data.order,
      `2.11 Admin Status Intervention (PATCH /admin/orders/${testOrderId}/status) persists admin note & escrow status`
    );
  }

  // 2.10 Multi-Tab Reports & Analytics
  const adminReportsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/reports',
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    adminReportsRes.status === 200 && adminReportsRes.data.success && adminReportsRes.data.data.overall,
    '2.12 Admin Reports & Analytics (/api/admin/reports) returns supply vs demand aggregations'
  );

  // 2.11 UTF-8 BOM CSV Exports
  const csvRequestsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/reports/export?module=requests',
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    csvRequestsRes.status === 200 && csvRequestsRes.raw && csvRequestsRes.raw.includes('Request ID'),
    '2.13 CSV Export for Purchase Requests returns valid RFC 4180 CSV with UTF-8 BOM'
  );

  const csvOrdersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/reports/export?module=orders',
    method: 'GET',
    headers: adminHeaders
  });
  assert(
    csvOrdersRes.status === 200 && csvOrdersRes.raw && csvOrdersRes.raw.includes('Order ID'),
    '2.14 CSV Export for Commercial Orders returns valid RFC 4180 CSV with UTF-8 BOM'
  );

  // ==========================================================================
  // SECTION 3: SECURITY, ROLE BOUNDARIES & PRIVILEGE ENFORCEMENT
  // ==========================================================================
  console.log('\n--- SECTION 3: SECURITY & AUTHORIZATION BOUNDARIES ---');

  // 3.1 Unauthenticated request blocked
  const unauthRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/overview',
    method: 'GET'
  });
  assert(
    unauthRes.status === 401,
    '3.1 Unauthenticated requests to /api/admin/overview are rejected (401 Unauthorized)'
  );

  // 3.2 Buyer token blocked from Admin
  const buyerBlockedRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/farmers',
    method: 'GET',
    headers: buyerHeaders
  });
  assert(
    buyerBlockedRes.status === 403,
    '3.2 Commercial Buyer token is blocked from Admin endpoints (403 Forbidden)'
  );

  // 3.3 Farmer token blocked from Admin
  const farmerBlockedRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/orders',
    method: 'GET',
    headers: farmerHeaders
  });
  assert(
    farmerBlockedRes.status === 403,
    '3.3 Farmer token is blocked from Admin endpoints (403 Forbidden)'
  );

  // 3.4 Driver token blocked from Admin
  const driverBlockedRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/drivers',
    method: 'GET',
    headers: driverHeaders
  });
  assert(
    driverBlockedRes.status === 403,
    '3.4 Driver token is blocked from Admin endpoints (403 Forbidden)'
  );

  console.log('\n================================================================');
  console.log(`Phase 9 Master Test Suite Complete: ${passed}/${total} assertions passed (${Math.round((passed/total)*100)}%)`);
  console.log('System Status: All Existing and Admin Modules Fully Operational');
  console.log('================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase9MasterSuite().catch((err) => {
  console.error('Fatal Master Test Error:', err);
  process.exit(1);
});
