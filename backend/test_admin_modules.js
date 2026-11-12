// backend/test_admin_modules.js - Verify all 7 Admin Portal modules & endpoints
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

async function run() {
  console.log('🧪 Starting Naam Uzhavar Admin Portal 7-Module Audit...');
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

  // 1. Admin Login
  const loginRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'admin@naamuzhavar.com',
    password: 'Admin@2026'
  });

  assert(loginRes.status === 200 && loginRes.data.token, '1. Admin authentication successful');
  const token = loginRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Farmer Management
  const farmersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/farmers',
    method: 'GET',
    headers: authHeaders
  });
  assert(farmersRes.status === 200 && Array.isArray(farmersRes.data.farmers), '2. Farmer Management (/admin/farmers) returns farmers list');

  // 3. Buyer Management
  const buyersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/buyers',
    method: 'GET',
    headers: authHeaders
  });
  assert(buyersRes.status === 200 && Array.isArray(buyersRes.data.buyers), '3. Buyer Management (/admin/buyers) returns buyers list');

  // 4. Driver Management
  const driversRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/drivers',
    method: 'GET',
    headers: authHeaders
  });
  assert(driversRes.status === 200 && Array.isArray(driversRes.data.drivers), '4. Driver Management (/admin/drivers) returns fleet roster');

  // 5. Purchase Requests Management (NEW)
  const requestsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/requests',
    method: 'GET',
    headers: authHeaders
  });
  assert(
    requestsRes.status === 200 &&
    Array.isArray(requestsRes.data.requests) &&
    requestsRes.data.metrics &&
    requestsRes.data.metrics.total > 0,
    '5. Purchase Requests (/admin/requests) returns requests & metrics'
  );

  // 5b. Purchase Request Detail
  const testReqId = requestsRes.data.requests?.[0]?.requestId || requestsRes.data.requests?.[0]?._id || 'REQ-7701';
  const singleReqRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/admin/requests/${testReqId}`,
    method: 'GET',
    headers: authHeaders
  });
  assert(
    singleReqRes.status === 200 &&
    singleReqRes.data.request &&
    (singleReqRes.data.request.requestId === testReqId || singleReqRes.data.request._id === testReqId),
    `5b. Single Purchase Request (/admin/requests/${testReqId}) returns detail`
  );

  // 6. Delivery Management
  const deliveriesRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/deliveries',
    method: 'GET',
    headers: authHeaders
  });
  assert(deliveriesRes.status === 200 && Array.isArray(deliveriesRes.data.deliveries), '6. Delivery Management (/admin/deliveries) returns consignments');

  // 7. Order Management (NEW)
  const ordersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/orders',
    method: 'GET',
    headers: authHeaders
  });
  assert(
    ordersRes.status === 200 &&
    Array.isArray(ordersRes.data.orders) &&
    ordersRes.data.metrics &&
    ordersRes.data.metrics.totalOrders > 0,
    '7. Order Management (/admin/orders) returns orders & escrow metrics'
  );

  // 7b. Order Detail
  const testOrderId = ordersRes.data.orders?.[0]?.orderId || ordersRes.data.orders?.[0]?._id || 'ORD-8095';
  const singleOrderRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/admin/orders/${testOrderId}`,
    method: 'GET',
    headers: authHeaders
  });
  assert(
    singleOrderRes.status === 200 &&
    singleOrderRes.data.order &&
    (singleOrderRes.data.order.orderId === testOrderId || singleOrderRes.data.order._id === testOrderId),
    `7b. Single Order (/admin/orders/${testOrderId}) returns order & trip detail`
  );

  // 7c. Order Admin Status Intervention (e.g. Escrow Release)
  const patchOrderRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: `/api/admin/orders/${testOrderId}/status`,
    method: 'PATCH',
    headers: { ...authHeaders, 'Content-Type': 'application/json' }
  }, {
    paymentStatus: 'RELEASED_TO_FARMER',
    note: 'Admin verified harvest delivery quality and released escrow'
  });
  assert(
    patchOrderRes.status === 200 &&
    patchOrderRes.data.order &&
    patchOrderRes.data.order.paymentStatus === 'RELEASED_TO_FARMER',
    '7c. Order Admin Intervention (PATCH /admin/orders/:id/status) updates escrow/order status'
  );

  // 8. Reports & Analytics
  const reportsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/reports',
    method: 'GET',
    headers: authHeaders
  });
  assert(reportsRes.status === 200 && reportsRes.data.success, '8. Reports & Analytics (/admin/reports) returns metrics');

  // 9. CSV Exports for Requests & Orders
  const exportRequestsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/reports/export?module=requests',
    method: 'GET',
    headers: authHeaders
  });
  assert(
    exportRequestsRes.status === 200 &&
    exportRequestsRes.raw &&
    exportRequestsRes.raw.includes('Request ID'),
    '9a. CSV Export for Purchase Requests returns valid CSV content'
  );

  const exportOrdersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/reports/export?module=orders',
    method: 'GET',
    headers: authHeaders
  });
  assert(
    exportOrdersRes.status === 200 &&
    exportOrdersRes.raw &&
    exportOrdersRes.raw.includes('Order ID'),
    '9b. CSV Export for Commercial Orders returns valid CSV content'
  );

  console.log(`\n========================================`);
  console.log(`Audit Complete: ${passed}/${total} assertions passed (${Math.round((passed/total)*100)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
