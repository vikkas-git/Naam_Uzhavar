// backend/test_farmer_full_verification.js
// Comprehensive audit and test of the Farmer module:
// Frontend-to-Backend-to-Database connectivity, REST endpoints, MongoDB persistence, and multi-tenant security.

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = require('./server');
const Farmer = require('./models/Farmer');
const Crop = require('./models/Crop');
const Order = require('./models/Order');
const BuyerRequest = require('./models/BuyerRequest');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/naam-uzhavar';

async function runFarmerModuleAudit() {
  console.log('================================================================');
  console.log('🌾 EGM AUDIT: FARMER MODULE (FRONTEND - BACKEND - DATABASE)');
  console.log('================================================================\n');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB database:', mongoose.connection.name);

  const server = http.createServer(app);
  const PORT = 5056;
  await new Promise((resolve) => server.listen(PORT, resolve));
  const baseUrl = `http://127.0.0.1:${PORT}/api`;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testFarmerId = `FMR-TN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const testToken = `farmer_token_${testFarmerId}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${testToken}`
  };

  let createdCropId = null;
  let createdRequestId = null;
  let createdOrderId = null;

  try {
    // -------------------------------------------------------------------------
    // 1. DATABASE CONNECTIVITY & FARMER PROFILE
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Farmer Profile & Identity Verification ---');

    // Create active farmer in MongoDB
    const farmerRecord = await Farmer.create({
      farmerId: testFarmerId,
      name: `Kavitha Selvam ${timestamp}`,
      email: `kavitha_${timestamp}@agrifarms.in`,
      phone: `+91 94432 ${String(timestamp).slice(-5)}`,
      password: 'SampleHashedPassword',
      role: 'farmer',
      isVerified: true,
      pattaNo: `PATTA-TN-${timestamp}`,
      pattaNumber: `PATTA-TN-${timestamp}`,
      farmDetails: {
        farmName: 'Selvam Agro Fields',
        landOwnerName: `Kavitha Selvam ${timestamp}`,
        landAddress: 'SF No. 34/2, Kinathukadavu Road',
        village: 'Kinathukadavu',
        taluk: 'Pollachi Taluk',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642109',
        landArea: 6.2,
        landAreaUnit: 'Acres',
        gpsCoordinates: '10.8241° N, 77.0189° E'
      },
      residentialDetails: {
        address: '14, Main Road, Kinathukadavu',
        village: 'Kinathukadavu',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642109',
        sameAsFarm: false
      },
      bankDetails: {
        accountHolderName: `Kavitha Selvam ${timestamp}`,
        bankName: 'Canara Bank',
        accountNumber: '104829103948',
        ifscCode: 'CNRB0001824',
        branchName: 'Kinathukadavu Branch',
        accountType: 'Savings'
      }
    });

    assert(farmerRecord && farmerRecord._id, 'Farmer record created in MongoDB');

    // Test GET /api/farmer/profile
    const getProfileRes = await fetch(`${baseUrl}/farmer/profile`, { headers });
    const profileData = await getProfileRes.json();
    assert(getProfileRes.status === 200, 'GET /api/farmer/profile returns HTTP 200');
    assert(profileData.farmer && profileData.farmer.farmerId === testFarmerId, 'GET profile returns correct farmerId from DB');
    assert(profileData.farmer.name === farmerRecord.name, 'GET profile returns exact farmer name');
    assert(profileData.farmer.farmDetails.landArea === 6.2, 'GET profile returns exact landArea in acres');

    // Test PUT /api/farmer/profile (Update land and village details)
    const updatePayload = {
      farmDetails: {
        ...farmerRecord.farmDetails.toObject(),
        landAddress: 'Updated SF No. 35/1, Near New Canal Bridge',
        landArea: 7.5
      }
    };
    const putProfileRes = await fetch(`${baseUrl}/farmer/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatePayload)
    });
    const updatedProfileData = await putProfileRes.json();
    assert(putProfileRes.status === 200, 'PUT /api/farmer/profile returns HTTP 200');

    // Verify persistence directly in MongoDB
    const verifiedDbFarmer = await Farmer.findOne({ farmerId: testFarmerId });
    assert(verifiedDbFarmer.farmDetails.landAddress === 'Updated SF No. 35/1, Near New Canal Bridge', 'Updated farmAddress stored in MongoDB');
    assert(verifiedDbFarmer.farmDetails.landArea === 7.5, 'Updated landArea stored in MongoDB');

    // -------------------------------------------------------------------------
    // 2. DASHBOARD METRICS ENDPOINT
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Farmer Dashboard Metrics Verification ---');
    const getDashRes = await fetch(`${baseUrl}/farmer/dashboard`, { headers });
    const dashData = await getDashRes.json();
    assert(getDashRes.status === 200, 'GET /api/farmer/dashboard returns HTTP 200');
    assert(dashData.metrics !== undefined, 'Dashboard returns structured operational metrics');
    assert(dashData.metrics.activeYield !== undefined, 'Dashboard returns activeYield metrics object');
    assert(dashData.metrics.activeOrders !== undefined, 'Dashboard returns activeOrders metrics object');
    assert(dashData.metrics.buyerEnquiries !== undefined, 'Dashboard returns buyerEnquiries metrics object');

    // -------------------------------------------------------------------------
    // 3. CROPS & YIELD MANAGEMENT (CREATE, READ, UPDATE, STATUS TOGGLE)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Crop Inventory & Yield Management Verification ---');
    const newCropPayload = {
      name: `Native Country Brinjal ${timestamp}`,
      nameTa: 'நாட்டு கத்தரிக்காய்',
      category: 'vegetables',
      grade: 'Grade A',
      variety: 'Udumalai Stripe',
      farmingMethod: 'Natural Zero-Budget',
      pricePerKg: 32,
      quantityKg: 850,
      unit: 'Kg',
      district: 'Coimbatore',
      hub: 'Pollachi Agri Logistics Hub',
      pickupDate: 'Tomorrow Morning',
      farmAddress: 'SF No. 35/1, Kinathukadavu'
    };

    // 3A. POST /api/farmer/crops
    const postCropRes = await fetch(`${baseUrl}/farmer/crops`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newCropPayload)
    });
    const postCropData = await postCropRes.json();
    assert(postCropRes.status === 201, 'POST /api/farmer/crops returns HTTP 201');
    assert(postCropData.crop && postCropData.crop.farmerId === testFarmerId, 'Crop created with tenant-isolated farmerId');
    createdCropId = postCropData.crop._id || postCropData.crop.id;

    // 3B. Verify in MongoDB Crop collection
    const dbCrop = await Crop.findOne({ _id: createdCropId });
    assert(dbCrop !== null, 'Crop successfully persisted into MongoDB crops collection');
    assert(dbCrop.name === newCropPayload.name, 'Crop name stored exactly in MongoDB');
    assert(dbCrop.pricePerKg === 32, 'Crop pricePerKg stored exactly in MongoDB');
    assert(dbCrop.quantityKg === 850, 'Crop quantityKg stored exactly in MongoDB');
    assert(dbCrop.status === 'active', 'Crop status defaulted to active in MongoDB');

    // 3C. GET /api/farmer/crops
    const getCropsRes = await fetch(`${baseUrl}/farmer/crops`, { headers });
    const getCropsData = await getCropsRes.json();
    assert(getCropsRes.status === 200, 'GET /api/farmer/crops returns HTTP 200');
    assert(Array.isArray(getCropsData.crops), 'GET crops returns an array');
    assert(getCropsData.crops.some((c) => (c._id || c.id) == createdCropId), 'Newly created crop is listed in GET response');

    // 3D. PUT /api/farmer/crops/:id (Update price and quantity)
    const putCropRes = await fetch(`${baseUrl}/farmer/crops/${createdCropId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ pricePerKg: 35, quantityKg: 1000 })
    });
    const putCropData = await putCropRes.json();
    assert(putCropRes.status === 200, 'PUT /api/farmer/crops/:id returns HTTP 200');

    const verifiedDbCrop = await Crop.findById(createdCropId);
    assert(verifiedDbCrop.pricePerKg === 35, 'Updated pricePerKg persisted into MongoDB');
    assert(verifiedDbCrop.quantityKg === 1000, 'Updated quantityKg persisted into MongoDB');

    // 3E. PATCH /api/farmer/crops/:id/status (Toggle status to paused)
    const patchStatusRes = await fetch(`${baseUrl}/farmer/crops/${createdCropId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'paused' })
    });
    const patchStatusData = await patchStatusRes.json();
    assert(patchStatusRes.status === 200, 'PATCH /api/farmer/crops/:id/status returns HTTP 200');

    const pausedDbCrop = await Crop.findById(createdCropId);
    assert(pausedDbCrop.status === 'paused', 'Paused crop status persisted into MongoDB');

    // -------------------------------------------------------------------------
    // 4. BUYER PURCHASE REQUESTS (GET, ACCEPT TO ORDER, REJECT)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Buyer Purchase Requests & Acceptance Verification ---');

    // Create a buyer request targeted to this farmer in MongoDB
    const testReqNum = Math.floor(1000 + Math.random() * 9000);
    const testRequestId = `REQ-2026-${testReqNum}`;
    const buyerRequestRecord = await BuyerRequest.create({
      requestId: testRequestId,
      crop: createdCropId,
      cropDetails: {
        name: newCropPayload.name,
        grade: 'Grade A',
        pricePerKg: 35
      },
      buyerDetails: {
        businessName: 'Grand Palace Luxury Dining',
        contactPerson: 'Mr. S. Rajesh',
        buyerType: 'hotel',
        phone: '+91 98401 23456',
        address: 'Bypass Road, Madurai'
      },
      farmerId: testFarmerId,
      farmerName: farmerRecord.name,
      quantity: 300,
      unit: 'Kg',
      offeredPrice: 34,
      totalEstimatedValue: 10200,
      preferredDeliveryDate: '2026-11-20',
      deliveryLocation: 'Madurai Receiving Dock 1',
      status: 'PENDING'
    });
    createdRequestId = buyerRequestRecord._id;
    assert(buyerRequestRecord && buyerRequestRecord._id, 'BuyerRequest record created in MongoDB');

    // 4A. GET /api/farmer/requests
    const getRequestsRes = await fetch(`${baseUrl}/farmer/requests`, { headers });
    const getRequestsData = await getRequestsRes.json();
    assert(getRequestsRes.status === 200, 'GET /api/farmer/requests returns HTTP 200');
    assert(Array.isArray(getRequestsData.requests), 'GET requests returns an array');
    assert(getRequestsData.requests.some((r) => r.requestId === testRequestId), 'Targeted buyer request retrieved in GET response');

    // 4B. POST /api/farmer/requests/:id/accept (Converts request to Order)
    const acceptReqRes = await fetch(`${baseUrl}/farmer/requests/${testRequestId}/accept`, {
      method: 'POST',
      headers
    });
    const acceptReqData = await acceptReqRes.json();
    assert(acceptReqRes.status === 200, 'POST /api/farmer/requests/:id/accept returns HTTP 200');
    assert(acceptReqData.order !== undefined, 'Accepting request creates and returns confirmed Order');
    assert(acceptReqData.request.status === 'CONVERTED_TO_ORDER', 'Request status updated to CONVERTED_TO_ORDER');

    // Verify in MongoDB that request status changed and Order was created
    const updatedDbReq = await BuyerRequest.findById(buyerRequestRecord._id);
    assert(updatedDbReq.status === 'CONVERTED_TO_ORDER', 'CONVERTED_TO_ORDER status stored in MongoDB BuyerRequest collection');

    const createdOrderFromReq = await Order.findOne({ orderId: acceptReqData.order.orderId });
    assert(createdOrderFromReq !== null, 'Confirmed commercial Order document created in MongoDB orders collection');
    assert(createdOrderFromReq.farmerId === testFarmerId, 'Order belongs to the authenticated farmer');
    assert(createdOrderFromReq.orderStatus === 'CONFIRMED', 'Order status is CONFIRMED in MongoDB');
    assert(createdOrderFromReq.paymentStatus === 'ESCROW_LOCKED', 'Payment status is ESCROW_LOCKED in MongoDB');
    createdOrderId = createdOrderFromReq._id;

    // -------------------------------------------------------------------------
    // 5. ORDERS & PAYOUT WORKFLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Orders Ledger & Escrow Payout Claim Verification ---');

    // 5A. GET /api/farmer/orders
    const getOrdersRes = await fetch(`${baseUrl}/farmer/orders`, { headers });
    const getOrdersData = await getOrdersRes.json();
    assert(getOrdersRes.status === 200, 'GET /api/farmer/orders returns HTTP 200');
    assert(Array.isArray(getOrdersData.orders), 'GET orders returns an array');
    assert(getOrdersData.orders.some((o) => o.orderId === createdOrderFromReq.orderId), 'Created order is present in farmer order ledger');

    // 5B. POST /api/farmer/orders/:id/claim-payout
    const payoutPayload = {
      utrNumber: `UTR-UPI-TN-${Date.now()}`,
      method: 'DIRECT_BANK_TRANSFER'
    };
    const claimRes = await fetch(`${baseUrl}/farmer/orders/${createdOrderFromReq.orderId}/claim-payout`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payoutPayload)
    });
    const claimData = await claimRes.json();
    assert(claimRes.status === 200, 'POST /api/farmer/orders/:id/claim-payout returns HTTP 200');
    assert(claimData.success === true, 'Payout claimed successfully');

    // Verify in MongoDB that order paymentStatus is RELEASED_TO_FARMER
    const dbOrderAfterPayout = await Order.findOne({ orderId: createdOrderFromReq.orderId });
    assert(dbOrderAfterPayout.paymentStatus === 'RELEASED_TO_FARMER', 'Order paymentStatus updated to RELEASED_TO_FARMER in MongoDB');

    // -------------------------------------------------------------------------
    // 6. MULTI-TENANT SECURITY / PRIVACY CHECK
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Multi-Tenant Authorization Security Check ---');
    const hackerHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer farmer_token_FMR-HACKER-TENANT`
    };

    // Another farmer should NOT be able to access or mutate this farmer's crop
    const unauthorizedPutRes = await fetch(`${baseUrl}/farmer/crops/${createdCropId}`, {
      method: 'PUT',
      headers: hackerHeaders,
      body: JSON.stringify({ pricePerKg: 1 })
    });
    assert(unauthorizedPutRes.status === 403 || unauthorizedPutRes.status === 404, 'Cross-tenant crop update blocked with HTTP 403/404');

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleaning up synthetic audit records ---');
    if (createdCropId) await Crop.deleteOne({ _id: createdCropId });
    if (createdRequestId) await BuyerRequest.deleteOne({ _id: createdRequestId });
    if (createdOrderId) await Order.deleteOne({ _id: createdOrderId });
    await Farmer.deleteOne({ _id: farmerRecord._id });
    console.log('Cleanup completed. Production database intact.');

    console.log('\n================================================================');
    console.log(`TOTAL AUDIT RESULT: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Farmer Module Audit Error:', err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runFarmerModuleAudit();

