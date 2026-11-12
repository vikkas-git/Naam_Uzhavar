// backend/test_auth_security.js - Comprehensive Phase 7 Authentication & Authorization Audit
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

async function runAuthSecurityAudit() {
  console.log('🔒 Starting Phase 7 Authentication & Authorization Security Audit...\n');
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

  // 1. Admin login with correct credentials
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
    '1. Admin login with valid credentials succeeds and issues role=admin JWT'
  );
  const adminToken = adminLoginRes.data.token;

  // 2. Admin login rejection with invalid credentials
  const adminBadLoginRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'admin@naamuzhavar.com',
    password: 'WrongPassword123'
  });
  assert(
    adminBadLoginRes.status === 401,
    '2. Admin login with invalid password returns 401 Unauthorized'
  );

  // 3. Admin-only APIs blocked without authorization header
  const noAuthRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/farmers',
    method: 'GET'
  });
  assert(
    noAuthRes.status === 401,
    '3. Admin-only endpoint (/api/admin/farmers) rejects unauthenticated request (401)'
  );

  const noAuthOverviewRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/overview',
    method: 'GET'
  });
  assert(
    noAuthOverviewRes.status === 401,
    '3b. Admin-only endpoint (/api/admin/overview) rejects unauthenticated request (401)'
  );

  // 4. Buyer Login & Privilege Boundary
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
    '4a. Existing Buyer login (demo@naamuzhavar.com) continues working'
  );
  const buyerToken = buyerLoginRes.data.token;

  // Buyer attempting to access Admin endpoint must be 403 Forbidden
  const buyerAccessAdminRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/farmers',
    method: 'GET',
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assert(
    buyerAccessAdminRes.status === 403,
    '4b. Normal Buyer token is blocked from accessing Admin endpoints (403 Forbidden)'
  );

  // 5. Farmer Login & Privilege Boundary
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
    farmerLoginRes.status === 200 && farmerLoginRes.data.token,
    '5a. Existing Farmer login (farmer@naamuzhavar.com) continues working'
  );
  const farmerToken = farmerLoginRes.data.token;

  // Farmer attempting to access Admin endpoint must be 403 Forbidden
  const farmerAccessAdminRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/farmers',
    method: 'GET',
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  assert(
    farmerAccessAdminRes.status === 403,
    '5b. Normal Farmer token is blocked from accessing Admin endpoints (403 Forbidden)'
  );

  // 6. Driver Login & Privilege Boundary
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
    driverLoginRes.status === 200 && driverLoginRes.data.token,
    '6a. Existing Driver login (DRV-TN-2026-08) continues working'
  );
  const driverToken = driverLoginRes.data.token;

  // Driver attempting to access Admin endpoint must be 403 Forbidden
  const driverAccessAdminRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/drivers',
    method: 'GET',
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  assert(
    driverAccessAdminRes.status === 403,
    '6b. Normal Driver token is blocked from accessing Admin endpoints (403 Forbidden)'
  );

  // 7. Authorized Admin user accessing Admin endpoints
  const adminAuthorizedRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/overview',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(
    adminAuthorizedRes.status === 200 && adminAuthorizedRes.data.success,
    '7. Authorized Admin token can access protected Admin endpoints (200 OK)'
  );

  // 8. Existing modules continue operating with their normal credentials
  const buyerOrdersRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/orders',
    method: 'GET',
    headers: { Authorization: `Bearer ${buyerToken}` }
  });
  assert(
    buyerOrdersRes.status === 200,
    '8a. Buyer token successfully accesses Buyer API (/api/orders)'
  );

  const farmerCropsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/farmer/crops',
    method: 'GET',
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  assert(
    farmerCropsRes.status === 200,
    '8b. Farmer token successfully accesses Farmer API (/api/farmer/crops)'
  );

  const driverTripsRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/driver/trips',
    method: 'GET',
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  assert(
    driverTripsRes.status === 200,
    '8c. Driver token successfully accesses Driver API (/api/driver/trips)'
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

runAuthSecurityAudit().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

