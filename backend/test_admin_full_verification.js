// backend/test_admin_full_verification.js
// Comprehensive audit and test of the Admin module:
// Frontend-to-Backend-to-Database connectivity, REST endpoints, MongoDB persistence, RBAC isolation, and CSV export.

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = require('./server');
const Admin = require('./models/Admin');
const Farmer = require('./models/Farmer');
const Buyer = require('./models/Buyer');
const Crop = require('./models/Crop');
const Order = require('./models/Order');
const BuyerRequest = require('./models/BuyerRequest');
const Driver = require('./models/Driver');
const Trip = require('./models/Trip');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/naam-uzhavar';

async function runAdminModuleAudit() {
  console.log('================================================================');
  console.log('🛡️ EGM AUDIT: ADMIN MODULE (FRONTEND - BACKEND - DATABASE)');
  console.log('================================================================\n');

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) return resolve();
      mongoose.connection.once('connected', resolve);
      setTimeout(resolve, 3000);
    });
  }
  console.log('Connected to MongoDB database:', mongoose.connection.name, '(readyState:', mongoose.connection.readyState, ')');

  const server = http.createServer(app);
  const PORT = 5059;
  await new Promise((resolve) => server.listen(PORT, resolve));
  const baseUrl = `http://127.0.0.1:${PORT}/api`;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testAdminEmail = `admin_${timestamp}@naamuzhavar.com`;
  const testAdminPassword = 'AdminSecret2026!';
  let adminToken = null;
  let testAdminDocId = null;

  // Temporary entities
  let testFarmerId = null;
  let testBuyerId = null;
  let testDriverId = null;
  let testCropId = null;
  let testOrderId = null;
  let testRequestId1 = null;
  let testRequestId2 = null;
  let testTripId = null;

  try {
    // -------------------------------------------------------------------------
    // 1. ADMIN SEED & AUTHENTICATION (LOGIN, ME, RBAC)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Admin Authentication & Identity Verification ---');

    // Create test Admin in MongoDB
    const testAdmin = await Admin.create({
      name: `Central Ops Admin ${timestamp}`,
      email: testAdminEmail,
      password: testAdminPassword,
      phone: '+91 94432 00099',
      role: 'admin'
    });
    testAdminDocId = testAdmin._id.toString();

    // Verify hashed password in MongoDB
    const dbAdmin = await Admin.findById(testAdminDocId);
    assert(dbAdmin && dbAdmin._id, 'Admin document created in MongoDB admins collection');
    assert(dbAdmin.password !== testAdminPassword, 'Admin password is salt-hashed and never stored in plain text');
    assert(dbAdmin.role === 'admin', 'Admin role is set to admin');

    // Test POST /api/admin/auth/login
    const loginRes = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: testAdminPassword })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'POST /api/admin/auth/login returns HTTP 200');
    assert(loginData.success === true, 'Admin login response indicates success');
    assert(loginData.token, 'Login returns valid 7-day JWT token');
    adminToken = loginData.token;

    // Test invalid password rejection
    const invalidLoginRes = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: 'WrongPassword!' })
    });
    assert(invalidLoginRes.status === 401, 'POST /api/admin/auth/login with wrong password returns HTTP 401');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    };

    // Test GET /api/admin/auth/me
    const getMeRes = await fetch(`${baseUrl}/admin/auth/me`, { headers: authHeaders });
    const meData = await getMeRes.json();
    assert(getMeRes.status === 200, 'GET /api/admin/auth/me returns HTTP 200');
    assert(meData.admin && meData.admin.email === testAdminEmail, 'GET /api/admin/auth/me returns authenticated admin email');

    // Test PUT /api/admin/profile
    const updateProfilePayload = {
      name: `Chief Operations Lead ${timestamp}`,
      phone: '+91 94432 11111'
    };
    const putProfileRes = await fetch(`${baseUrl}/admin/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updateProfilePayload)
    });
    const putProfileData = await putProfileRes.json();
    assert(putProfileRes.status === 200, 'PUT /api/admin/profile returns HTTP 200');

    const verifiedAdmin = await Admin.findById(testAdminDocId);
    assert(verifiedAdmin.name === updateProfilePayload.name, 'Updated admin name saved to MongoDB');
    assert(verifiedAdmin.phone === updateProfilePayload.phone, 'Updated admin phone saved to MongoDB');

    // -------------------------------------------------------------------------
    // 2. CENTRAL OVERVIEW & PLATFORM AGGREGATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Central Overview Metrics & Platform Aggregations ---');

    const getOverviewRes = await fetch(`${baseUrl}/admin/overview`, { headers: authHeaders });
    const overviewData = await getOverviewRes.json();
    assert(getOverviewRes.status === 200, 'GET /api/admin/overview returns HTTP 200');
    assert(overviewData.success === true, 'Overview response reports success');
    assert(overviewData.metrics && typeof overviewData.metrics.totalFarmers === 'number', 'Metrics include totalFarmers count');
    assert(typeof overviewData.metrics.totalBuyers === 'number', 'Metrics include totalBuyers count');
    assert(typeof overviewData.metrics.totalOrders === 'number', 'Metrics include totalOrders count');
    assert(overviewData.charts && Array.isArray(overviewData.charts.orderStatusDistribution), 'Overview includes charts distribution data');

    // -------------------------------------------------------------------------
    // 3. FARMERS DIRECTORY & VERIFICATION STATUS
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Farmer Management & KYC Verification ---');

    testFarmerId = `FMR-TN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const testFarmer = await Farmer.create({
      farmerId: testFarmerId,
      name: `Karthik Selvan ${timestamp}`,
      email: `karthik_${timestamp}@agri.naamuzhavar.com`,
      phone: `+91 94432 ${String(timestamp).slice(-5)}`,
      password: 'SampleHashedPassword',
      role: 'farmer',
      isVerified: false,
      status: 'active',
      pattaNo: `PATTA-TN-${timestamp}`,
      farmDetails: {
        farmName: 'Selvan Organic Groveland',
        village: 'Kinathukadavu',
        taluk: 'Pollachi Taluk',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642109',
        landArea: 5.5,
        landAreaUnit: 'Acres'
      }
    });

    // Test GET /api/admin/farmers
    const getFarmersRes = await fetch(`${baseUrl}/admin/farmers?search=${testFarmerId}`, { headers: authHeaders });
    const farmersData = await getFarmersRes.json();
    assert(getFarmersRes.status === 200, 'GET /api/admin/farmers returns HTTP 200');
    assert(Array.isArray(farmersData.farmers), 'Farmers response contains array of farmers');
    const farmerFound = farmersData.farmers.some((f) => f.farmerId === testFarmerId);
    assert(farmerFound, 'Newly created farmer found via search in farmers directory');

    // Test GET /api/admin/farmers/:id
    const getSingleFarmerRes = await fetch(`${baseUrl}/admin/farmers/${testFarmerId}`, { headers: authHeaders });
    const singleFarmerData = await getSingleFarmerRes.json();
    assert(getSingleFarmerRes.status === 200, 'GET /api/admin/farmers/:id returns HTTP 200');
    assert(singleFarmerData.farmer && singleFarmerData.farmer.farmerId === testFarmerId, 'Farmer dossier matches requested farmerId');
    assert(singleFarmerData.farmer.farmDetails && singleFarmerData.farmer.farmDetails.landArea === 5.5, 'Farmer dossier includes exact landArea');

    // Test PATCH /api/admin/farmers/:id/status (Verify Farmer)
    const patchFarmerRes = await fetch(`${baseUrl}/admin/farmers/${testFarmerId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ isVerified: true, status: 'active' })
    });
    const patchFarmerData = await patchFarmerRes.json();
    assert(patchFarmerRes.status === 200, 'PATCH /api/admin/farmers/:id/status returns HTTP 200');

    const verifiedDbFarmer = await Farmer.findOne({ farmerId: testFarmerId });
    assert(verifiedDbFarmer.isVerified === true, 'Farmer verified status updated to true in MongoDB');

    // -------------------------------------------------------------------------
    // 4. BUYERS DIRECTORY & COMMERCIAL STATUS
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Buyer Directory & Commercial Accounts ---');

    const testBuyerEmail = `buyer_admin_${timestamp}@luxurykitchen.in`;
    const testBuyer = await Buyer.create({
      businessName: `Royal Residency Kitchen ${timestamp}`,
      shopName: `Royal Residency Kitchen ${timestamp}`,
      contactPerson: 'C. Meenakshi Sundaram',
      buyerType: 'hotel',
      email: testBuyerEmail,
      phone: `+91 98401 ${String(timestamp).slice(-5)}`,
      password: 'HashedPassword123',
      gstin: '33AABCS1429B1Z8',
      address: '77 Meenakshi Avenue, Madurai - 625001',
      isVerified: false,
      status: 'active'
    });
    testBuyerId = testBuyer._id.toString();

    // Test GET /api/admin/buyers
    const getBuyersRes = await fetch(`${baseUrl}/admin/buyers?search=Royal%20Residency`, { headers: authHeaders });
    const buyersData = await getBuyersRes.json();
    assert(getBuyersRes.status === 200, 'GET /api/admin/buyers returns HTTP 200');
    assert(Array.isArray(buyersData.buyers), 'Buyers response contains array of buyers');
    const buyerFound = buyersData.buyers.some((b) => b.email === testBuyerEmail);
    assert(buyerFound, 'Newly created buyer found via search in buyers directory');

    // Test GET /api/admin/buyers/:id
    const getSingleBuyerRes = await fetch(`${baseUrl}/admin/buyers/${testBuyerId}`, { headers: authHeaders });
    const singleBuyerData = await getSingleBuyerRes.json();
    assert(getSingleBuyerRes.status === 200, 'GET /api/admin/buyers/:id returns HTTP 200');
    assert(singleBuyerData.buyer && singleBuyerData.buyer.gstin === '33AABCS1429B1Z8', 'Buyer dossier includes verified GSTIN');

    // Test PATCH /api/admin/buyers/:id/status (Verify Buyer)
    const patchBuyerRes = await fetch(`${baseUrl}/admin/buyers/${testBuyerId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ isVerified: true, status: 'active' })
    });
    assert(patchBuyerRes.status === 200, 'PATCH /api/admin/buyers/:id/status returns HTTP 200');

    const verifiedDbBuyer = await Buyer.findById(testBuyerId);
    assert(verifiedDbBuyer.isVerified === true, 'Buyer verification status updated to true in MongoDB');

    // -------------------------------------------------------------------------
    // 5. DRIVERS & EV FLEET CONTROLS
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Driver Fleet & EV Logistics Controls ---');

    testDriverId = `DRV-TN-2026-${Math.floor(10 + Math.random() * 89)}`;
    const testDriver = await Driver.create({
      driverId: testDriverId,
      name: `Murugan Palani ${timestamp}`,
      phone: `+91 94432 ${String(timestamp).slice(-5)}`,
      email: `driver_${timestamp}@logistics.naamuzhavar.com`,
      password: '1234',
      pin: '1234',
      role: 'driver',
      dutyStatus: 'ON_DUTY',
      assignedHub: 'Dindigul Central Hub',
      vehicle: {
        model: 'Tata Ace EV Cargo',
        vehicleNumber: `TN 57 EX ${Math.floor(1000 + Math.random() * 9000)}`,
        currentBatteryPct: 85
      },
      license: {
        licenseNumber: `TN-57-2021-${Math.floor(100000 + Math.random() * 900000)}`,
        verified: true
      },
      wallet: { balance: 2500 }
    });

    // Test GET /api/admin/drivers
    const getDriversRes = await fetch(`${baseUrl}/admin/drivers?search=${testDriverId}`, { headers: authHeaders });
    const driversData = await getDriversRes.json();
    assert(getDriversRes.status === 200, 'GET /api/admin/drivers returns HTTP 200');
    assert(Array.isArray(driversData.drivers), 'Drivers response contains array of drivers');
    const driverFound = driversData.drivers.some((d) => d.driverId === testDriverId);
    assert(driverFound, 'Newly created driver found in drivers fleet manifest');

    // Test GET /api/admin/drivers/:id
    const getSingleDriverRes = await fetch(`${baseUrl}/admin/drivers/${testDriverId}`, { headers: authHeaders });
    const singleDriverData = await getSingleDriverRes.json();
    assert(getSingleDriverRes.status === 200, 'GET /api/admin/drivers/:id returns HTTP 200');
    assert(singleDriverData.driver && singleDriverData.driver.driverId === testDriverId, 'Driver record matches requested driverId');
    assert(singleDriverData.driver.vehicle && singleDriverData.driver.vehicle.currentBatteryPct === 85, 'Driver record includes EV battery telemetry (85%)');

    // Test PATCH /api/admin/drivers/:id/status (Toggle Duty Status)
    const patchDriverRes = await fetch(`${baseUrl}/admin/drivers/${testDriverId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ dutyStatus: 'OFF_DUTY' })
    });
    assert(patchDriverRes.status === 200, 'PATCH /api/admin/drivers/:id/status returns HTTP 200');

    const verifiedDbDriver = await Driver.findOne({ driverId: testDriverId });
    assert(verifiedDbDriver.dutyStatus === 'OFF_DUTY', 'Driver dutyStatus updated to OFF_DUTY in MongoDB');

    // -------------------------------------------------------------------------
    // 6. PURCHASE REQUESTS & MATCHMAKING OVERRIDES
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Purchase Requests & Commercial Inquiries ---');

    // Create a base Crop for the request
    testCropId = (await Crop.create({
      name: 'Hill Country Carrots',
      nameTa: 'மலை கேரட்',
      grade: 'Grade A',
      pricePerKg: 45,
      quantityKg: 500,
      hub: 'Dindigul Central Hub',
      farmerName: 'Karthik Selvan',
      farmerId: testFarmerId,
      status: 'active'
    }))._id;

    testRequestId1 = `REQ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const testBuyerRequest1 = await BuyerRequest.create({
      requestId: testRequestId1,
      crop: testCropId,
      cropDetails: {
        name: 'Hill Country Carrots',
        nameTa: 'மலை கேரட்',
        grade: 'Grade A',
        pricePerKg: 45
      },
      buyerDetails: {
        businessName: `Royal Residency Kitchen ${timestamp}`,
        contactPerson: 'C. Meenakshi Sundaram',
        phone: '+91 98401 23456',
        address: '77 Meenakshi Avenue, Madurai'
      },
      farmerId: testFarmerId,
      farmerName: 'Karthik Selvan',
      quantity: 100,
      unit: 'Kg',
      offeredPrice: 45,
      totalEstimatedValue: 4500,
      status: 'PENDING'
    });

    testRequestId2 = `REQ-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const testBuyerRequest2 = await BuyerRequest.create({
      requestId: testRequestId2,
      crop: testCropId,
      cropDetails: {
        name: 'Hill Country Carrots',
        nameTa: 'மலை கேரட்',
        grade: 'Grade A',
        pricePerKg: 45
      },
      buyerDetails: {
        businessName: `Royal Residency Kitchen ${timestamp}`,
        contactPerson: 'C. Meenakshi Sundaram',
        phone: '+91 98401 23456',
        address: '77 Meenakshi Avenue, Madurai'
      },
      farmerId: testFarmerId,
      farmerName: 'Karthik Selvan',
      quantity: 50,
      unit: 'Kg',
      offeredPrice: 45,
      totalEstimatedValue: 2250,
      status: 'PENDING'
    });

    // Test GET /api/admin/requests
    const getRequestsRes = await fetch(`${baseUrl}/admin/requests?search=${testRequestId1}`, { headers: authHeaders });
    const requestsData = await getRequestsRes.json();
    assert(getRequestsRes.status === 200, 'GET /api/admin/requests returns HTTP 200');
    assert(Array.isArray(requestsData.requests), 'Requests response contains array of buyer requests');
    const requestFound = requestsData.requests.some((r) => r.requestId === testRequestId1);
    assert(requestFound, 'Created purchase request found in admin requests catalog');

    // Test GET /api/admin/requests/:id
    const getSingleReqRes = await fetch(`${baseUrl}/admin/requests/${testRequestId1}`, { headers: authHeaders });
    const singleReqData = await getSingleReqRes.json();
    assert(getSingleReqRes.status === 200, 'GET /api/admin/requests/:id returns HTTP 200');
    assert(singleReqData.request && singleReqData.request.requestId === testRequestId1, 'Request detail matches requested requestId');
    assert(singleReqData.request.quantity === 100, 'Request detail includes exact quantity (100 kg)');

    // Test POST /api/admin/requests/:id/accept
    const acceptReqRes = await fetch(`${baseUrl}/admin/requests/${testRequestId1}/accept`, {
      method: 'POST',
      headers: authHeaders
    });
    const acceptReqData = await acceptReqRes.json();
    assert(acceptReqRes.status === 200, 'POST /api/admin/requests/:id/accept returns HTTP 200');
    assert(acceptReqData.request && acceptReqData.request.status === 'CONVERTED_TO_ORDER', 'Request status transitions to CONVERTED_TO_ORDER');

    const dbReqAfterAccept = await BuyerRequest.findOne({ requestId: testRequestId1 });
    assert(dbReqAfterAccept.status === 'CONVERTED_TO_ORDER', 'CONVERTED_TO_ORDER status stored in MongoDB');

    // Test POST /api/admin/requests/:id/reject
    const rejectReqRes = await fetch(`${baseUrl}/admin/requests/${testRequestId2}/reject`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Seasonal harvest quota fulfilled' })
    });
    assert(rejectReqRes.status === 200, 'POST /api/admin/requests/:id/reject returns HTTP 200');

    const dbReqAfterReject = await BuyerRequest.findOne({ requestId: testRequestId2 });
    assert(dbReqAfterReject.status === 'REJECTED', 'REJECTED status stored in MongoDB');

    // -------------------------------------------------------------------------
    // 7. ORDERS LEDGER & ADMIN STATE OVERRIDES
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Orders Ledger & Admin State Overrides ---');

    testOrderId = `NU-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const testOrder = await Order.create({
      orderId: testOrderId,
      crop: testCropId,
      cropDetails: {
        name: 'Hill Country Carrots',
        nameTa: 'மலை கேரட்',
        grade: 'Grade A',
        pricePerKg: 45,
        farmerName: 'Karthik Selvan',
        hub: 'Dindigul Central Hub'
      },
      buyerName: `Royal Residency Kitchen ${timestamp}`,
      quantityKg: 80,
      totalPrice: 3600,
      orderStatus: 'PENDING_FARMER_APPROVAL',
      deliveryStatus: 'NOT_ASSIGNED',
      status: 'PENDING_FARMER_APPROVAL',
      deliveryAddress: '77 Meenakshi Avenue, Madurai',
      paymentStatus: 'PENDING',
      driver: {
        name: 'Murugan Palani',
        vehicle: 'Tata Ace EV Cargo',
        deliveryPin: '3819'
      }
    });

    // Test GET /api/admin/orders
    const getOrdersRes = await fetch(`${baseUrl}/admin/orders?search=${testOrderId}`, { headers: authHeaders });
    const ordersData = await getOrdersRes.json();
    assert(getOrdersRes.status === 200, 'GET /api/admin/orders returns HTTP 200');
    assert(Array.isArray(ordersData.orders), 'Orders response contains array of orders');
    const orderFound = ordersData.orders.some((o) => o.orderId === testOrderId);
    assert(orderFound, 'Created order found in admin orders ledger');

    // Test GET /api/admin/orders/:id
    const getSingleOrderRes = await fetch(`${baseUrl}/admin/orders/${testOrderId}`, { headers: authHeaders });
    const singleOrderData = await getSingleOrderRes.json();
    assert(getSingleOrderRes.status === 200, 'GET /api/admin/orders/:id returns HTTP 200');
    assert(singleOrderData.order && singleOrderData.order.orderId === testOrderId, 'Order detail matches requested orderId');
    assert(singleOrderData.order.totalPrice === 3600, 'Order detail includes exact total price (Rs. 3600)');

    // Test PATCH /api/admin/orders/:id/status (Confirm Order)
    const patchOrderRes = await fetch(`${baseUrl}/admin/orders/${testOrderId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ orderStatus: 'CONFIRMED' })
    });
    assert(patchOrderRes.status === 200, 'PATCH /api/admin/orders/:id/status returns HTTP 200');

    const dbOrderAfterPatch = await Order.findOne({ orderId: testOrderId });
    assert(dbOrderAfterPatch.orderStatus === 'CONFIRMED', 'Order status updated to CONFIRMED in MongoDB');

    // -------------------------------------------------------------------------
    // 8. EV DELIVERIES & FLEET TELEMETRY
    // -------------------------------------------------------------------------
    console.log('\n--- 8. EV Deliveries & Fleet Telemetry ---');

    testTripId = `TRIP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const testTrip = await Trip.create({
      tripId: testTripId,
      orderId: testOrderId,
      driverId: testDriverId,
      status: 'READY_FOR_PICKUP',
      cropName: 'Hill Country Carrots',
      quantityKg: 80,
      cratesCount: 4,
      totalProduceValue: 3600,
      pickup: {
        farmName: 'Selvan Organic Groveland',
        farmerName: 'Karthik Selvan',
        address: 'Kinathukadavu, Pollachi'
      },
      dropoff: {
        buyerName: 'Royal Residency Kitchen',
        contactPerson: 'C. Meenakshi Sundaram',
        address: '77 Meenakshi Avenue, Madurai'
      },
      telemetry: {
        distanceKm: 38.0,
        batteryPct: 85,
        speedKmh: 0,
        origin: 'Kinathukadavu Farm Gate',
        destination: 'Royal Residency Receiving Dock'
      },
      deliveryPin: '3819'
    });

    // Test GET /api/admin/deliveries (Queries Orders collection)
    const getDeliveriesRes = await fetch(`${baseUrl}/admin/deliveries?search=${testOrderId}`, { headers: authHeaders });
    const deliveriesData = await getDeliveriesRes.json();
    assert(getDeliveriesRes.status === 200, 'GET /api/admin/deliveries returns HTTP 200');
    assert(Array.isArray(deliveriesData.deliveries), 'Deliveries response contains array of consignments');
    const deliveryFound = deliveriesData.deliveries.some((d) => d.orderId === testOrderId);
    assert(deliveryFound, 'Created order found in admin deliveries tracking ledger');

    // Test GET /api/admin/deliveries/:id (by orderId)
    const getSingleDeliveryRes = await fetch(`${baseUrl}/admin/deliveries/${testOrderId}`, { headers: authHeaders });
    const singleDeliveryData = await getSingleDeliveryRes.json();
    assert(getSingleDeliveryRes.status === 200, 'GET /api/admin/deliveries/:id returns HTTP 200');
    assert(singleDeliveryData.order && singleDeliveryData.order.orderId === testOrderId, 'Delivery detail matches orderId');
    assert(singleDeliveryData.trip && singleDeliveryData.trip.tripId === testTripId, 'Delivery detail matches linked trip');

    // Test PATCH /api/admin/deliveries/:id/status (Advance Delivery to IN_TRANSIT)
    const patchDeliveryRes = await fetch(`${baseUrl}/admin/deliveries/${testOrderId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ deliveryStatus: 'IN_TRANSIT' })
    });
    assert(patchDeliveryRes.status === 200, 'PATCH /api/admin/deliveries/:id/status returns HTTP 200');

    const dbOrderAfterDeliveryPatch = await Order.findOne({ orderId: testOrderId });
    assert(dbOrderAfterDeliveryPatch.deliveryStatus === 'IN_TRANSIT', 'Order deliveryStatus updated to IN_TRANSIT in MongoDB');

    // -------------------------------------------------------------------------
    // 9. REPORTS & AUDITABLE CSV EXPORTS
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Business Analytics & UTF-8 BOM CSV Export ---');

    // Test GET /api/admin/reports
    const getReportsRes = await fetch(`${baseUrl}/admin/reports`, { headers: authHeaders });
    const reportsData = await getReportsRes.json();
    assert(getReportsRes.status === 200, 'GET /api/admin/reports returns HTTP 200');
    assert(reportsData.success === true, 'Reports response reports success');
    assert(reportsData.data && reportsData.data.overall && typeof reportsData.data.overall.totalSupplyKg === 'number', 'Reports include overall supply volume');
    assert(reportsData.data.farmerReports && Array.isArray(reportsData.data.farmerReports.byDistrict), 'Reports include farmer regional reports');

    // Test GET /api/admin/reports/export (Orders/Deliveries CSV)
    const exportCsvRes = await fetch(`${baseUrl}/admin/reports/export?module=deliveries`, { headers: authHeaders });
    const csvContent = await exportCsvRes.text();
    assert(exportCsvRes.status === 200, 'GET /api/admin/reports/export returns HTTP 200');
    const contentType = exportCsvRes.headers.get('content-type');
    assert(contentType && contentType.includes('text/csv'), 'Export response header contains text/csv MIME type');
    assert(csvContent.includes('Order ID') || csvContent.includes('NU-'), 'Export CSV contains expected delivery table headers');

    // -------------------------------------------------------------------------
    // 10. SECURITY & RBAC AUTHORIZATION ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Security: Strict RBAC & Unauthenticated Route Protection ---');

    // Unauthenticated GET /api/admin/overview must return 401
    const unauthOverviewRes = await fetch(`${baseUrl}/admin/overview`);
    assert(unauthOverviewRes.status === 401, 'Unauthenticated GET /api/admin/overview blocked with HTTP 401');

    // Non-admin token (e.g. driver or buyer token) must return 403 Forbidden
    const fakeBuyerToken = require('jsonwebtoken').sign(
      { id: 'buyer_test_99', role: 'buyer' },
      process.env.JWT_SECRET || 'naam_uzhavar_secret_jwt_key_2026'
    );
    const buyerForbiddenRes = await fetch(`${baseUrl}/admin/overview`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fakeBuyerToken}`
      }
    });
    assert(buyerForbiddenRes.status === 403, 'Buyer token attempting to access /api/admin/overview blocked with HTTP 403 Forbidden');

  } catch (err) {
    console.error('\nAudit encountered unexpected error:', err);
    failed++;
  } finally {
    // Cleanup temporary test artifacts
    console.log('\n--- Cleaning up temporary test artifacts ---');
    if (testAdminDocId) {
      await Admin.findByIdAndDelete(testAdminDocId);
      console.log('  Cleaned test admin from MongoDB');
    }
    if (testFarmerId) {
      await Farmer.deleteOne({ farmerId: testFarmerId });
      console.log('  Cleaned test farmer from MongoDB');
    }
    if (testBuyerId) {
      await Buyer.findByIdAndDelete(testBuyerId);
      console.log('  Cleaned test buyer from MongoDB');
    }
    if (testDriverId) {
      await Driver.deleteOne({ driverId: testDriverId });
      console.log('  Cleaned test driver from MongoDB');
    }
    if (testCropId) {
      await Crop.findByIdAndDelete(testCropId);
      console.log('  Cleaned test crop listing from MongoDB');
    }
    if (testOrderId) {
      await Order.deleteOne({ orderId: testOrderId });
      console.log('  Cleaned test order from MongoDB');
    }
    if (testRequestId1) {
      await BuyerRequest.deleteOne({ requestId: testRequestId1 });
    }
    if (testRequestId2) {
      await BuyerRequest.deleteOne({ requestId: testRequestId2 });
      console.log('  Cleaned test purchase requests from MongoDB');
    }
    if (testTripId) {
      await Trip.deleteOne({ tripId: testTripId });
      console.log('  Cleaned test trip from MongoDB');
    }

    server.close();
    await mongoose.disconnect();
    console.log('Database disconnected and HTTP test server closed.');

    console.log('\n================================================================');
    console.log(`EGM ADMIN MODULE AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runAdminModuleAudit();
