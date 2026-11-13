// backend/test_buyer_full_verification.js
// Comprehensive audit and test of the Buyer module:
// Frontend-to-Backend-to-Database connectivity, REST endpoints, MongoDB persistence, EV dispatch, and multi-tenant security.

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = require('./server');
const Buyer = require('./models/Buyer');
const Crop = require('./models/Crop');
const Order = require('./models/Order');
const Invoice = require('./models/Invoice');
const BuyerRequest = require('./models/BuyerRequest');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/naam-uzhavar';

async function runBuyerModuleAudit() {
  console.log('================================================================');
  console.log('🛒 EGM AUDIT: BUYER MODULE (FRONTEND - BACKEND - DATABASE)');
  console.log('================================================================\n');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB database:', mongoose.connection.name);

  const server = http.createServer(app);
  const PORT = 5057;
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
  const testEmail = `buyer_${timestamp}@saravanagrand.in`;
  const testPassword = 'SecurePassword2026!';
  let buyerToken = null;
  let buyerId = null;
  let testCropId = null;
  let originalStock = 0;
  let createdOrderId = null;
  let createdOrderDocId = null;

  try {
    // -------------------------------------------------------------------------
    // 1. REGISTRATION, AUTHENTICATION & BUYER PROFILE PERSISTENCE
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Buyer Registration, Authentication & Profile ---');

    // Register commercial buyer account
    const registerPayload = {
      businessName: `Hotel Saravana Grand ${timestamp}`,
      shopName: `Hotel Saravana Grand ${timestamp}`,
      contactPerson: 'S. Rajesh Kumar',
      name: 'S. Rajesh Kumar',
      buyerType: 'hotel',
      phone: `+91 98401 ${String(timestamp).slice(-5)}`,
      email: testEmail,
      password: testPassword,
      gstin: '33AAAAA0000A1Z5',
      address: '14/2 Bypass Road, Near Meenakshi Temple, Madurai - 625016'
    };

    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload)
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 || regRes.status === 200, 'POST /api/auth/register returns HTTP 201/200');
    assert(regData.token, 'Registration returns valid JWT bearer token');
    buyerToken = regData.token;

    // Verify buyer document exists in MongoDB buyers collection
    const dbBuyer = await Buyer.findOne({ email: testEmail });
    assert(dbBuyer && dbBuyer._id, 'Buyer record persisted in MongoDB buyers collection');
    assert(dbBuyer.businessName === registerPayload.businessName, 'MongoDB stores exact businessName');
    assert(dbBuyer.gstin === registerPayload.gstin, 'MongoDB stores exact GSTIN');
    assert(dbBuyer.password !== testPassword, 'Password is salt-hashed and never stored in plain text');
    buyerId = dbBuyer._id.toString();

    // Authenticate via Login endpoint
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'POST /api/auth/login returns HTTP 200');
    assert(loginData.token, 'Login returns valid refreshed JWT token');
    buyerToken = loginData.token;

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${buyerToken}`
    };

    // Test GET /api/profile
    const getProfileRes = await fetch(`${baseUrl}/profile`, { headers: authHeaders });
    const profileData = await getProfileRes.json();
    assert(getProfileRes.status === 200, 'GET /api/profile returns HTTP 200');
    assert(profileData.buyer && profileData.buyer.email === testEmail, 'GET /api/profile returns authenticated buyer profile');
    assert(profileData.buyer.contactPerson === 'S. Rajesh Kumar', 'Profile includes contact person name');

    // Test PUT /api/profile
    const updateProfilePayload = {
      contactPerson: 'S. Rajesh Kumar (General Manager)',
      phone: '+91 98401 99999',
      address: 'Loading Dock B, Hotel Saravana Grand, Madurai - 625016',
      gstin: '33AABCS1429B1Z8'
    };
    const putProfileRes = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updateProfilePayload)
    });
    const updatedProfileData = await putProfileRes.json();
    assert(putProfileRes.status === 200, 'PUT /api/profile returns HTTP 200');

    // Verify direct persistence in MongoDB
    const verifiedDbBuyer = await Buyer.findById(buyerId);
    assert(verifiedDbBuyer.contactPerson === updateProfilePayload.contactPerson, 'Updated contact person saved to MongoDB');
    assert(verifiedDbBuyer.phone === updateProfilePayload.phone, 'Updated phone saved to MongoDB');
    assert(verifiedDbBuyer.address === updateProfilePayload.address, 'Updated commercial delivery address saved to MongoDB');
    assert(verifiedDbBuyer.gstin === updateProfilePayload.gstin, 'Updated GSTIN saved to MongoDB');

    // -------------------------------------------------------------------------
    // 2. PRODUCE MARKETPLACE DISCOVERY & CROPS CATALOG
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Produce Marketplace Catalog & Search ---');

    // Ensure we have a sample crop listing in MongoDB for the test
    let testCrop = await Crop.findOne({ status: 'active', quantityKg: { $gte: 200 } });
    if (!testCrop) {
      testCrop = await Crop.create({
        name: 'Country Tomato',
        nameTa: 'நாட்டு தக்காளி',
        category: 'vegetables',
        variety: 'Shivam Hybrid',
        grade: 'Grade A',
        quantityKg: 500,
        pricePerKg: 38,
        harvestDate: new Date(),
        hub: 'Dindigul Central Hub',
        farmerName: 'Ramesh Kumar',
        farmerId: 'FMR-TN-2026-01',
        status: 'active',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80'
      });
    }
    testCropId = testCrop._id.toString();
    originalStock = testCrop.quantityKg;

    // Test GET /api/crops
    const getCropsRes = await fetch(`${baseUrl}/crops`);
    const cropsData = await getCropsRes.json();
    assert(getCropsRes.status === 200, 'GET /api/crops returns HTTP 200');
    assert(Array.isArray(cropsData.crops) && cropsData.crops.length > 0, 'Produce catalog returns array of available farm crops');

    // Test GET /api/crops with search and filter
    const filteredRes = await fetch(`${baseUrl}/crops?search=tomato&category=vegetables`);
    const filteredData = await filteredRes.json();
    assert(filteredRes.status === 200, 'GET /api/crops?search=tomato&category=vegetables returns HTTP 200');
    assert(Array.isArray(filteredData.crops), 'Filtered catalog returns matching produce array');

    // Test GET /api/crops/:id
    const singleCropRes = await fetch(`${baseUrl}/crops/${testCropId}`);
    const singleCropData = await singleCropRes.json();
    assert(singleCropRes.status === 200, 'GET /api/crops/:id returns HTTP 200');
    assert(singleCropData.crop && singleCropData.crop.name === testCrop.name, 'GET /api/crops/:id matches exact crop listing in MongoDB');

    // -------------------------------------------------------------------------
    // 3. ORDER CREATION, DB PERSISTENCE & BUYER REQUEST SYNCHRONIZATION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Order Placement & Cross-Module Synchronization ---');

    const orderQty = 120;
    const orderPayload = {
      cropId: testCropId,
      quantityKg: orderQty,
      deliveryAddress: 'Loading Dock B, Hotel Saravana Grand, Madurai - 625016',
      preferredDeliveryDate: '2026-11-15',
      notes: 'Morning delivery required before 8:00 AM for kitchen prep',
      paymentMethod: 'UPI (Google Pay)'
    };

    const postOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(orderPayload)
    });
    const postOrderData = await postOrderRes.json();
    assert(postOrderRes.status === 201, 'POST /api/orders returns HTTP 201 Created');
    assert(postOrderData.order && postOrderData.order.orderId, 'Response contains generated orderId');

    createdOrderId = postOrderData.order.orderId;
    createdOrderDocId = postOrderData.order._id;
    assert(/^NU-\d{4}-\d{5}$/.test(createdOrderId), `Order ID follows standard format NU-YYYY-XXXXX (${createdOrderId})`);

    // Verify Order document in MongoDB orders collection
    const dbOrder = await Order.findOne({ orderId: createdOrderId });
    assert(dbOrder && dbOrder._id, 'Order document verified in MongoDB orders collection');
    assert(dbOrder.orderStatus === 'PENDING_FARMER_APPROVAL', 'Initial orderStatus is PENDING_FARMER_APPROVAL');
    assert(dbOrder.deliveryStatus === 'NOT_ASSIGNED', 'Initial deliveryStatus is NOT_ASSIGNED');
    assert(dbOrder.quantityKg === orderQty, `Order quantity saved as ${orderQty} kg`);
    assert(dbOrder.totalPrice === testCrop.pricePerKg * orderQty, `Total price calculated server-side: Rs. ${dbOrder.totalPrice}`);
    assert(dbOrder.driver && dbOrder.driver.deliveryPin, `EV driver assigned with delivery PIN: ${dbOrder.driver.deliveryPin}`);

    // Verify matching BuyerRequest document in MongoDB buyerrequests collection (Cross-Module Sync)
    const dbBuyerReq = await BuyerRequest.findOne({ orderId: createdOrderId });
    assert(dbBuyerReq && dbBuyerReq._id, 'Matching BuyerRequest auto-created in MongoDB for Farmer Module');
    assert(dbBuyerReq.quantity === orderQty, 'BuyerRequest quantity synchronizes with Order');
    assert(dbBuyerReq.farmerId === (testCrop.farmerId || 'FMR-TN-2026-01'), 'BuyerRequest routes to correct Farmer ID');

    // -------------------------------------------------------------------------
    // 4. BUYER ORDER LEDGER & DETAIL TRACKING
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Buyer Order Ledger & Detail Tracking ---');

    // Test GET /api/orders
    const getOrdersRes = await fetch(`${baseUrl}/orders`, { headers: authHeaders });
    const ordersData = await getOrdersRes.json();
    assert(getOrdersRes.status === 200, 'GET /api/orders returns HTTP 200');
    assert(Array.isArray(ordersData.orders), 'Order ledger returns list of buyer orders');
    const foundOrderInList = ordersData.orders.some((o) => o.orderId === createdOrderId);
    assert(foundOrderInList, 'Newly placed order appears in buyer order ledger');

    // Test GET /api/orders/:id
    const getSingleOrderRes = await fetch(`${baseUrl}/orders/${createdOrderId}`, { headers: authHeaders });
    const singleOrderData = await getSingleOrderRes.json();
    assert(getSingleOrderRes.status === 200, 'GET /api/orders/:id returns HTTP 200');
    assert(singleOrderData.order && singleOrderData.order.orderId === createdOrderId, 'GET single order returns matching order record');

    // -------------------------------------------------------------------------
    // 5. LIFECYCLE PROGRESSION & EV DISPATCH TELEMETRY
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Lifecycle Progression & EV Dispatch Telemetry ---');

    // Step A: Farmer Approval Simulation
    const approveRes = await fetch(`${baseUrl}/orders/${createdOrderId}/simulate-farmer`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ action: 'APPROVE' })
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, 'PATCH /api/orders/:id/simulate-farmer (APPROVE) returns HTTP 200');
    assert(approveData.order.orderStatus === 'CONFIRMED', 'Order status transitions to CONFIRMED');

    // Verify inventory deduction in MongoDB crops collection
    const updatedCrop = await Crop.findById(testCropId);
    assert(updatedCrop.quantityKg === originalStock - orderQty, `Crop stock decremented in MongoDB: ${originalStock} -> ${updatedCrop.quantityKg} kg`);

    // Step B: Delivery Arrangement Simulation
    const arrangeRes = await fetch(`${baseUrl}/orders/${createdOrderId}/simulate-delivery-arrangement`, {
      method: 'PATCH',
      headers: authHeaders
    });
    const arrangeData = await arrangeRes.json();
    assert(arrangeRes.status === 200, 'PATCH /api/orders/:id/simulate-delivery-arrangement returns HTTP 200');
    assert(arrangeData.order.deliveryStatus === 'READY_FOR_PICKUP', 'Delivery status transitions to READY_FOR_PICKUP');

    // Step C: Advance Delivery Step 1: PICKED_UP
    const step1Res = await fetch(`${baseUrl}/orders/${createdOrderId}/simulate-delivery-step`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ targetStatus: 'PICKED_UP' })
    });
    const step1Data = await step1Res.json();
    assert(step1Res.status === 200, 'Advance delivery to PICKED_UP returns HTTP 200');
    assert(step1Data.order.deliveryStatus === 'PICKED_UP', 'Delivery status transitions to PICKED_UP');

    // Step D: Advance Delivery Step 2: IN_TRANSIT
    const step2Res = await fetch(`${baseUrl}/orders/${createdOrderId}/simulate-delivery-step`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ targetStatus: 'IN_TRANSIT' })
    });
    const step2Data = await step2Res.json();
    assert(step2Res.status === 200, 'Advance delivery to IN_TRANSIT returns HTTP 200');
    assert(step2Data.order.deliveryStatus === 'IN_TRANSIT', 'Delivery status transitions to IN_TRANSIT');

    // Step E: Advance Delivery Step 3: DELIVERED
    const step3Res = await fetch(`${baseUrl}/orders/${createdOrderId}/simulate-delivery-step`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ targetStatus: 'DELIVERED' })
    });
    const step3Data = await step3Res.json();
    assert(step3Res.status === 200, 'Advance delivery to DELIVERED returns HTTP 200');
    assert(step3Data.order.deliveryStatus === 'DELIVERED', 'Delivery status reaches final milestone DELIVERED');

    // Verify status directly in MongoDB
    const verifiedOrderAfterDelivery = await Order.findOne({ orderId: createdOrderId });
    assert(verifiedOrderAfterDelivery.deliveryStatus === 'DELIVERED', 'Order deliveryStatus stored as DELIVERED in MongoDB');

    // -------------------------------------------------------------------------
    // 6. COMMERCIAL INVOICE GENERATION & ACCOUNTING AUDIT
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Commercial Invoice Generation & Invoices Collection ---');

    // Test GET /api/invoices
    const getInvoicesRes = await fetch(`${baseUrl}/invoices`, { headers: authHeaders });
    const invoicesData = await getInvoicesRes.json();
    assert(getInvoicesRes.status === 200, 'GET /api/invoices returns HTTP 200');
    assert(Array.isArray(invoicesData.invoices), 'Invoices endpoint returns array of invoices');

    // Verify invoice document in MongoDB invoices collection
    const dbInvoice = await Invoice.findOne({ orderId: createdOrderId });
    assert(dbInvoice && dbInvoice._id, 'Invoice document persisted in MongoDB invoices collection');
    assert(dbInvoice.orderId === createdOrderId, 'Invoice orderId matches delivered order');
    assert(dbInvoice.totalAmount === verifiedOrderAfterDelivery.totalPrice, `Invoice totalAmount (Rs. ${dbInvoice.totalAmount}) matches order totalPrice`);
    assert(dbInvoice.status === 'PAID', 'Invoice status is PAID');
    assert(/^INV-\d{4}-\d{5}$/.test(dbInvoice.invoiceNumber), `Invoice number generated with prefix INV (${dbInvoice.invoiceNumber})`);

    // -------------------------------------------------------------------------
    // 7. MULTI-TENANT ISOLATION & ROUTE PROTECTION
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Security: Multi-Tenant & Route Protection ---');

    // Unauthenticated GET /api/orders must return 401
    const unauthOrdersRes = await fetch(`${baseUrl}/orders`);
    assert(unauthOrdersRes.status === 401, 'Unauthenticated GET /api/orders blocked with HTTP 401');

    // Unauthenticated POST /api/orders must return 401
    const unauthPostOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cropId: testCropId, quantityKg: 10 })
    });
    assert(unauthPostOrderRes.status === 401, 'Unauthenticated POST /api/orders blocked with HTTP 401');

    // Unauthenticated GET /api/profile must return 401
    const unauthProfileRes = await fetch(`${baseUrl}/profile`);
    assert(unauthProfileRes.status === 401, 'Unauthenticated GET /api/profile blocked with HTTP 401');

    // Tenant isolation: Register a second buyer and ensure they cannot view or tamper with first buyer's order
    const otherBuyerEmail = `other_buyer_${timestamp}@rivalkitchen.in`;
    const otherBuyerRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: `Rival Restaurant ${timestamp}`,
        contactPerson: 'Other Buyer',
        email: otherBuyerEmail,
        password: testPassword,
        phone: '+91 91234 56789',
        address: 'Coimbatore Food Street'
      })
    });
    const otherBuyerRegData = await otherBuyerRegRes.json();
    const otherAuthHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${otherBuyerRegData.token}`
    };

    // Other buyer querying their own orders should NOT see the first buyer's order
    const otherOrdersRes = await fetch(`${baseUrl}/orders`, { headers: otherAuthHeaders });
    const otherOrdersData = await otherOrdersRes.json();
    const containsFirstBuyerOrder = otherOrdersData.orders?.some((o) => o.orderId === createdOrderId);
    assert(!containsFirstBuyerOrder, 'Tenant isolation verified: Second buyer cannot view first buyer orders');

    // Other buyer trying to fetch first buyer order by ID should receive 404
    const otherFetchOrderRes = await fetch(`${baseUrl}/orders/${createdOrderId}`, { headers: otherAuthHeaders });
    assert(otherFetchOrderRes.status === 404, 'Cross-tenant order lookup blocked with HTTP 404 Not Found');

    // Clean up second buyer
    await Buyer.deleteOne({ email: otherBuyerEmail });

  } catch (err) {
    console.error('\nAudit encountered unexpected error:', err);
    failed++;
  } finally {
    // Cleanup created test records
    console.log('\n--- Cleaning up temporary test artifacts ---');
    if (buyerId) {
      await Buyer.findByIdAndDelete(buyerId);
      console.log('  Cleaned test buyer from MongoDB');
    }
    if (createdOrderId) {
      await Order.deleteOne({ orderId: createdOrderId });
      await BuyerRequest.deleteOne({ orderId: createdOrderId });
      await Invoice.deleteOne({ orderId: createdOrderId });
      console.log('  Cleaned test order, buyer request, and invoice from MongoDB');
    }
    if (testCropId && originalStock) {
      await Crop.findByIdAndUpdate(testCropId, { quantityKg: originalStock });
      console.log('  Restored original crop stock in MongoDB');
    }

    server.close();
    await mongoose.disconnect();
    console.log('Database disconnected and HTTP test server closed.');

    console.log('\n================================================================');
    console.log(`EGM BUYER MODULE AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runBuyerModuleAudit();

