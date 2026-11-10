// test_farmer_apis.js - Comprehensive test suite for Naam Uzhavar Integrated Farmer Backend APIs
// Tests every endpoint, multi-tenant isolation, authorization, and data privacy.

const http = require('http');
const app = require('./server');

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING NAAM UZHAVAR INTEGRATED FARMER BACKEND API TEST SUITE');
  console.log('================================================================\n');

  // Start test server on dynamic free port
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Test server running at ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // 1. HEALTH CHECK
    // ------------------------------------------------------------------------
    console.log('[Test Suite 1: System Health]');
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200 && healthRes.data.status === 'ok', 'GET /api/health returns 200 OK');

    // ------------------------------------------------------------------------
    // 2. FARMER AUTHENTICATION (REGISTER & LOGIN)
    // ------------------------------------------------------------------------
    console.log('\n[Test Suite 2: Farmer Authentication & JWT Generation]');

    // 2a. Farmer 1 Login (Demo credentials)
    const f1LoginRes = await request('POST', '/api/auth/farmer/login', {
      identifier: 'farmer@naamuzhavar.com',
      password: 'farmer1234'
    });
    assert(f1LoginRes.status === 200 && f1LoginRes.data.token, 'POST /api/auth/farmer/login returns 200 with JWT token');
    const farmer1Token = f1LoginRes.data.token;
    const farmer1Auth = { Authorization: `Bearer ${farmer1Token}` };

    // 2b. Register a second distinct farmer (Farmer 2) to test isolation
    const uniquePhone = `98421${Math.floor(10000 + Math.random() * 90000)}`;
    const f2RegRes = await request('POST', '/api/auth/farmer/register', {
      name: 'Murugan Palanisamy',
      phone: uniquePhone,
      email: `murugan_${Date.now()}@naamuzhavar.com`,
      password: 'farmerPassword123',
      farmAddress: 'SF No. 89, Oddanchatram Valley Road, Dindigul'
    });
    assert(f2RegRes.status === 201 && f2RegRes.data.token, 'POST /api/auth/farmer/register creates Farmer 2 with token');
    const farmer2Token = f2RegRes.data.token;
    const farmer2Auth = { Authorization: `Bearer ${farmer2Token}` };
    const farmer2Id = f2RegRes.data.farmer.farmerId;

    // 2c. GET /api/auth/farmer/me
    const meRes = await request('GET', '/api/auth/farmer/me', null, farmer1Auth);
    assert(meRes.status === 200 && meRes.data.farmer, 'GET /api/auth/farmer/me retrieves current session');

    // ------------------------------------------------------------------------
    // 3. FARMER PROFILE & MASKING SENSITIVE DATA
    // ------------------------------------------------------------------------
    console.log('\n[Test Suite 3: Farmer Profile & Data Masking]');
    const profileRes = await request('GET', '/api/farmer/profile', null, farmer1Auth);
    assert(profileRes.status === 200 && profileRes.data.success, 'GET /api/farmer/profile returns 200');
    assert(
      profileRes.data.farmer.bankDetails?.accountNumber?.includes('••••'),
      'Sensitive bank account number is properly masked in profile response'
    );

    // Update Profile
    const updateProfileRes = await request('PUT', '/api/farmer/profile', {
      farmDetails: {
        farmName: 'Green Valley Organic & Natural Farm'
      }
    }, farmer1Auth);
    assert(updateProfileRes.status === 200 && updateProfileRes.data.success, 'PUT /api/farmer/profile updates profile');

    // ------------------------------------------------------------------------
    // 4. FARMER DASHBOARD METRICS
    // ------------------------------------------------------------------------
    console.log('\n[Test Suite 4: Dashboard Metrics & Telemetry]');
    const dashRes = await request('GET', '/api/farmer/dashboard', null, farmer1Auth);
    assert(dashRes.status === 200 && dashRes.data.metrics?.activeYield, 'GET /api/farmer/dashboard returns computed metrics');

    // ------------------------------------------------------------------------
    // 5. CROPS & INVENTORY LIFECYCLE
    // ------------------------------------------------------------------------
    console.log('\n[Test Suite 5: Crops & Produce Inventory Management]');
    // 5a. GET crops
    const cropsRes = await request('GET', '/api/farmer/crops', null, farmer1Auth);
    assert(cropsRes.status === 200 && Array.isArray(cropsRes.data.crops), 'GET /api/farmer/crops returns farmer produce list');

    // 5b. POST /api/farmer/crops (Create new crop)
    const newCropRes = await request('POST', '/api/farmer/crops', {
      name: 'Oddanchatram Drumstick (Murungai)',
      nameTa: 'திண்டுக்கல் முருங்கைக்காய்',
      category: 'vegetables',
      grade: 'Grade A',
      variety: 'PKM-1 Hybrid',
      pricePerKg: 45,
      quantityKg: 300,
      unit: 'Kg',
      hub: 'Oddanchatram Hub'
    }, farmer1Auth);
    assert(newCropRes.status === 201 && newCropRes.data.crop, 'POST /api/farmer/crops creates new produce listing');
    const createdCropId = newCropRes.data.crop._id || newCropRes.data.crop.id;

    // 5c. PUT /api/farmer/crops/:id (Update crop)
    const putCropRes = await request('PUT', `/api/farmer/crops/${createdCropId}`, {
      pricePerKg: 48,
      variety: 'PKM-1 Premium Export Grade'
    }, farmer1Auth);
    assert(putCropRes.status === 200 && putCropRes.data.crop.pricePerKg === 48, 'PUT /api/farmer/crops/:id updates crop details');

    // 5d. PATCH /api/farmer/crops/:id/status (Toggle pause/resume)
    const patchStatusRes = await request('PATCH', `/api/farmer/crops/${createdCropId}/status`, {
      status: 'paused'
    }, farmer1Auth);
    assert(patchStatusRes.status === 200 && patchStatusRes.data.crop.status === 'paused', 'PATCH /api/farmer/crops/:id/status pauses listing');

    // 5e. POST /api/farmer/crops/:id/remove (Soft remove listing)
    const removeCropRes = await request('POST', `/api/farmer/crops/${createdCropId}/remove`, {}, farmer1Auth);
    assert(removeCropRes.status === 200 && removeCropRes.data.crop.status === 'removed', 'POST /api/farmer/crops/:id/remove archives listing');

    // 5f. DELETE /api/farmer/crops/:id (Audit compliance rule)
    const deleteRes = await request('DELETE', `/api/farmer/crops/${createdCropId}`, null, farmer1Auth);
    assert(deleteRes.status === 405, 'DELETE /api/farmer/crops/:id returns 405 Method Not Allowed to preserve audit history');

    // ------------------------------------------------------------------------
    // 6. BUYER REQUESTS & ACCEPTANCE WORKFLOW
    // ------------------------------------------------------------------------
    console.log('\n[Test Suite 6: Buyer Purchase Requests & Acceptance]');
    const requestsRes = await request('GET', '/api/farmer/requests', null, farmer1Auth);
    assert(requestsRes.status === 200 && Array.isArray(requestsRes.data.requests), 'GET /api/farmer/requests returns enquiries');

    const firstReq = requestsRes.data.requests[0];
    if (firstReq) {
      const acceptRes = await request('POST', `/api/farmer/requests/${firstReq._id || firstReq.id || firstReq.requestId}/accept`, {}, farmer1Auth);
      assert(acceptRes.status === 200 && acceptRes.data.order, 'POST /api/farmer/requests/:id/accept converts request to commercial order');
    }

    // ------------------------------------------------------------------------
    // 7. ORDER HISTORY & STATUS MILESTONES
    // ------------------------------------------------------------------------
    console.log('\n[Test Suite 7: Order History Ledger & Milestone Tracking]');
    const ordersRes = await request('GET', '/api/farmer/orders', null, farmer1Auth);
    assert(ordersRes.status === 200 && Array.isArray(ordersRes.data.orders), 'GET /api/farmer/orders returns orders ledger');

    const firstOrder = ordersRes.data.orders[0];
    if (firstOrder) {
      const orderId = firstOrder._id || firstOrder.id || firstOrder.orderId;
      const singleOrderRes = await request('GET', `/api/farmer/orders/${orderId}`, null, farmer1Auth);
      assert(singleOrderRes.status === 200 && singleOrderRes.data.order, 'GET /api/farmer/orders/:id returns single order details');

      const patchOrderRes = await request('PATCH', `/api/farmer/orders/${orderId}/status`, {
        deliveryStatus: 'PICKED_UP'
      }, farmer1Auth);
      assert(patchOrderRes.status === 200 && patchOrderRes.data.order.deliveryStatus === 'PICKED_UP', 'PATCH /api/farmer/orders/:id/status updates delivery milestone');
    }

    // ------------------------------------------------------------------------
    // 8. STRICT MULTI-TENANT ISOLATION (SECURITY & PRIVACY CHECK)
    // ------------------------------------------------------------------------
    console.log('\n[Test Suite 8: Strict Multi-Tenant Isolation & Security]');
    // Create a crop belonging to Farmer 2
    const f2CropRes = await request('POST', '/api/farmer/crops', {
      name: 'Farmer 2 Private Turmeric',
      pricePerKg: 100,
      quantityKg: 150
    }, farmer2Auth);
    const f2CropId = f2CropRes.data.crop._id || f2CropRes.data.crop.id;

    // ATTEMPT 1: Farmer 1 tries to UPDATE Farmer 2's crop
    const f1HacksF2Crop = await request('PUT', `/api/farmer/crops/${f2CropId}`, {
      pricePerKg: 10 // malicious unauthorized price change
    }, farmer1Auth);
    assert(
      f1HacksF2Crop.status === 403,
      'Farmer 1 cannot update Farmer 2’s crop listing (Strictly blocked with 403 Forbidden)'
    );

    // ATTEMPT 2: Farmer 1 tries to REMOVE Farmer 2's crop
    const f1RemovesF2Crop = await request('POST', `/api/farmer/crops/${f2CropId}/remove`, {}, farmer1Auth);
    assert(
      f1RemovesF2Crop.status === 403,
      'Farmer 1 cannot remove Farmer 2’s crop listing (Strictly blocked with 403 Forbidden)'
    );

    // ATTEMPT 3: Farmer 1's crops list does NOT include Farmer 2's crops
    const f1CropsList = await request('GET', '/api/farmer/crops', null, farmer1Auth);
    const leakedCrop = f1CropsList.data.crops.find((c) => c.farmerId === farmer2Id || c.name === 'Farmer 2 Private Turmeric');
    assert(!leakedCrop, 'Farmer 1’s crop catalog does not leak Farmer 2’s private produce listings');

    // ATTEMPT 4: Unauthenticated request to /api/farmer/profile
    const unauthRes = await request('GET', '/api/farmer/profile');
    assert(unauthRes.status === 401, 'Unauthenticated request to /api/farmer/* rejected with 401 Unauthorized');

    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    server.close();
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('UNEXPECTED TEST SUITE ERROR:', err);
    if (server) server.close();
    const mongoose = require('mongoose');
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

runAllTests();
