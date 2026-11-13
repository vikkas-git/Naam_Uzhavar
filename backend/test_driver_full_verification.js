// backend/test_driver_full_verification.js
// Comprehensive audit and test of the Driver module:
// Frontend-to-Backend-to-Database connectivity, REST endpoints, MongoDB persistence, EV dispatch, PIN handshake, and wallet ledger.

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = require('./server');
const Driver = require('./models/Driver');
const Trip = require('./models/Trip');
const Order = require('./models/Order');
const Crop = require('./models/Crop');
const DriverWalletTransaction = require('./models/DriverWalletTransaction');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/naam-uzhavar';

async function runDriverModuleAudit() {
  console.log('================================================================');
  console.log('🚚 EGM AUDIT: DRIVER MODULE (FRONTEND - BACKEND - DATABASE)');
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
  const PORT = 5058;
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
  const testPhone = `+91 94432 ${String(timestamp).slice(-5)}`;
  const testPin = '5829';
  const testPassword = 'DriverPassword2026!';
  let driverToken = null;
  let driverId = null;
  let driverDocId = null;
  let testOrderId = null;
  let testTripId = null;
  let testCropId = null;

  try {
    // -------------------------------------------------------------------------
    // 1. DRIVER REGISTRATION, AUTHENTICATION & JWT GENERATION
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Driver Registration, Authentication & JWT ---');

    const registerPayload = {
      name: `Selvam Murugan ${timestamp}`,
      tamilName: `செல்வம் முருகன் ${timestamp}`,
      phone: testPhone,
      email: `driver_${timestamp}@logistics.naamuzhavar.com`,
      password: testPassword,
      pin: testPin,
      avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&auto=format&fit=crop&q=80',
      assignedHub: 'Dindigul Central Hub',
      operatingZone: 'Coimbatore - Dindigul - Madurai Corridor',
      vehicleModel: 'Tata Ace EV Cargo',
      vehicleNumber: `TN 57 EX ${Math.floor(1000 + Math.random() * 9000)}`,
      licenseNumber: `TN-57-2022-${Math.floor(100000 + Math.random() * 900000)}`,
      licenseExpiry: '2028-12-31',
      upiId: `selvam.${timestamp}@okhdfcbank`
    };

    const regRes = await fetch(`${baseUrl}/driver/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload)
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 || regRes.status === 200, 'POST /api/driver/auth/register returns HTTP 201/200');
    assert(regData.token, 'Registration returns valid JWT bearer token');
    driverToken = regData.token;

    // Verify driver record exists in MongoDB drivers collection
    const dbDriver = await Driver.findOne({ phone: testPhone });
    assert(dbDriver && dbDriver._id, 'Driver document persisted in MongoDB drivers collection');
    assert(dbDriver.name === registerPayload.name, 'MongoDB stores exact driver full name');
    assert(dbDriver.role === 'driver', 'Driver role explicitly saved as driver');
    assert(dbDriver.vehicle && dbDriver.vehicle.model === registerPayload.vehicleModel, 'EV vehicle model stored in MongoDB');
    assert(dbDriver.vehicle.vehicleNumber === registerPayload.vehicleNumber, 'EV vehicle number stored in MongoDB');
    assert(dbDriver.license && dbDriver.license.licenseNumber === registerPayload.licenseNumber, 'Driving license number stored in MongoDB');
    assert(dbDriver.license.verified === true, 'Driver commercial license is verified');
    assert(dbDriver.wallet && dbDriver.wallet.balance === 1000, 'Initial sign-up wallet balance credited (Rs. 1000)');
    assert(dbDriver.dutyStatus === 'ON_DUTY', 'Default driver dutyStatus is ON_DUTY');
    driverId = dbDriver.driverId;
    driverDocId = dbDriver._id.toString();

    // Authenticate via Driver Login endpoint
    const loginRes = await fetch(`${baseUrl}/driver/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, pin: testPin })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'POST /api/driver/auth/login with PIN returns HTTP 200');
    assert(loginData.token, 'Driver login returns refreshed JWT token');
    assert(loginData.driver && loginData.driver.driverId === driverId, 'Login payload matches registered driverId');

    // Test invalid PIN rejection
    const invalidLoginRes = await fetch(`${baseUrl}/driver/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, pin: '9999' })
    });
    assert(invalidLoginRes.status === 401, 'POST /api/driver/auth/login with incorrect PIN returns HTTP 401');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`
    };

    // -------------------------------------------------------------------------
    // 2. DRIVER PROFILE & FLEET TELEMETRY
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Driver Profile, EV Telemetry & Update ---');

    // Test GET /api/driver/profile
    const getProfileRes = await fetch(`${baseUrl}/driver/profile?driverId=${driverId}`, { headers: authHeaders });
    const profileData = await getProfileRes.json();
    assert(getProfileRes.status === 200, 'GET /api/driver/profile returns HTTP 200');
    assert(profileData.driver && profileData.driver.driverId === driverId, 'GET profile returns correct driver record');
    assert(profileData.driver.vehicle && profileData.driver.vehicle.batteryCapacityKwh === 21.3, 'EV battery capacity returned (21.3 kWh)');

    // Test PUT /api/driver/profile
    const updateProfilePayload = {
      driverId,
      name: `Selvam Murugan (Lead Pilot) ${timestamp}`,
      phone: testPhone,
      email: `selvam_lead_${timestamp}@logistics.naamuzhavar.com`,
      assignedHub: 'Coimbatore Agri Logistics Park',
      upiId: `selvam.lead.${timestamp}@okhdfcbank`
    };
    const putProfileRes = await fetch(`${baseUrl}/driver/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updateProfilePayload)
    });
    const putProfileData = await putProfileRes.json();
    assert(putProfileRes.status === 200, 'PUT /api/driver/profile returns HTTP 200');

    // Verify persistence in MongoDB
    const verifiedDbDriver = await Driver.findOne({ driverId });
    assert(verifiedDbDriver.name === updateProfilePayload.name, 'Updated driver name saved to MongoDB');
    assert(verifiedDbDriver.assignedHub === updateProfilePayload.assignedHub, 'Updated assignedHub saved to MongoDB');
    assert(verifiedDbDriver.wallet.upiId === updateProfilePayload.upiId, 'Updated UPI ID saved in driver wallet in MongoDB');

    // -------------------------------------------------------------------------
    // 3. ONLINE / OFFLINE DUTY STATUS TOGGLE
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Duty Status Toggle (Online / Offline) ---');

    // Toggle duty to OFF_DUTY
    const dutyOffRes = await fetch(`${baseUrl}/driver/duty`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ driverId, dutyStatus: 'OFF_DUTY' })
    });
    const dutyOffData = await dutyOffRes.json();
    assert(dutyOffRes.status === 200, 'PATCH /api/driver/duty (OFF_DUTY) returns HTTP 200');
    assert(dutyOffData.dutyStatus === 'OFF_DUTY', 'Duty status toggled to OFF_DUTY');

    const dbDutyOff = await Driver.findOne({ driverId });
    assert(dbDutyOff.dutyStatus === 'OFF_DUTY', 'Duty status OFF_DUTY stored in MongoDB');

    // Toggle duty back to ON_DUTY
    const dutyOnRes = await fetch(`${baseUrl}/driver/duty`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ driverId, dutyStatus: 'ON_DUTY' })
    });
    const dutyOnData = await dutyOnRes.json();
    assert(dutyOnRes.status === 200, 'PATCH /api/driver/duty (ON_DUTY) returns HTTP 200');
    assert(dutyOnData.dutyStatus === 'ON_DUTY', 'Duty status toggled to ON_DUTY');

    const dbDutyOn = await Driver.findOne({ driverId });
    assert(dbDutyOn.dutyStatus === 'ON_DUTY', 'Duty status ON_DUTY stored in MongoDB');

    // -------------------------------------------------------------------------
    // 4. DISPATCH TRIPS MANAGEMENT & MANIFEST
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Dispatch Trips Management & Manifest ---');

    // Create a temporary Crop & Order for Trip association
    const testCrop = await Crop.create({
      name: 'Organic Country Tomatoes',
      nameTa: 'நாட்டு தக்காளி',
      category: 'vegetables',
      variety: 'Naatu Thakkali',
      grade: 'Grade A',
      quantityKg: 300,
      pricePerKg: 35,
      harvestDate: new Date(),
      hub: 'Dindigul Central Hub',
      farmerName: 'Ramesh Kumar',
      farmerId: 'FMR-TN-2026-01',
      status: 'active'
    });
    testCropId = testCrop._id.toString();

    testOrderId = `NU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const testOrder = await Order.create({
      orderId: testOrderId,
      crop: testCrop._id,
      cropDetails: {
        name: testCrop.name,
        nameTa: testCrop.nameTa,
        grade: testCrop.grade,
        pricePerKg: testCrop.pricePerKg,
        farmerName: testCrop.farmerName,
        hub: testCrop.hub
      },
      quantityKg: 150,
      totalPrice: 5250,
      orderStatus: 'CONFIRMED',
      deliveryStatus: 'READY_FOR_PICKUP',
      status: 'READY_FOR_PICKUP',
      driver: {
        name: verifiedDbDriver.name,
        vehicle: verifiedDbDriver.vehicle.model,
        phone: verifiedDbDriver.phone,
        deliveryPin: '4892'
      },
      deliveryAddress: 'Kitchen Receiving Dock, Grand Palace, Madurai',
      paymentStatus: 'ESCROW_LOCKED'
    });

    testTripId = `TRIP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const testTrip = await Trip.create({
      tripId: testTripId,
      driverId: driverId,
      driver: verifiedDbDriver._id,
      orderId: testOrderId,
      order: testOrder._id,
      status: 'READY_FOR_PICKUP',
      priority: 'HIGH',
      tripType: 'FARM_GATE_DIRECT',
      cropName: testCrop.name,
      tamilCropName: testCrop.nameTa,
      quantityKg: 150,
      cratesCount: 6,
      totalProduceValue: 5250,
      pickup: {
        farmName: "Ramesh Kumar's Natural Farm",
        farmerName: 'Ramesh Kumar',
        farmerPhone: '+91 94432 78190',
        address: 'SF No. 142/2, Kinathukadavu Main Road, Pollachi',
        village: 'Pollachi',
        district: 'Coimbatore',
        pincode: '642001'
      },
      dropoff: {
        buyerName: 'Grand Palace Luxury Dining',
        contactPerson: 'Mr. S. Rajesh',
        buyerPhone: '+91 98401 23456',
        address: 'Kitchen Receiving Dock, Grand Palace, Madurai',
        location: 'Bypass Road, Madurai'
      },
      telemetry: {
        distanceKm: 42.5,
        speedKmh: 0,
        batteryPct: 88,
        etaMinutes: 38,
        origin: 'Pollachi Farm Gate',
        destination: 'Grand Palace Receiving Dock'
      },
      deliveryPin: '4892',
      crateInspection: {
        countVerified: false,
        qualityInspected: false,
        tamperSealAffixed: false
      },
      haulageEarnings: {
        baseFare: 250,
        distanceRate: 12,
        distanceKm: 42.5,
        handlingBonus: 100,
        totalEarnings: 860,
        payoutStatus: 'ESCROW_HELD'
      }
    });

    // Test GET /api/driver/trips
    const getTripsRes = await fetch(`${baseUrl}/driver/trips?driverId=${driverId}`, { headers: authHeaders });
    const tripsData = await getTripsRes.json();
    assert(getTripsRes.status === 200, 'GET /api/driver/trips returns HTTP 200');
    assert(Array.isArray(tripsData.trips), 'Response contains array of trips');
    const tripFound = tripsData.trips.some((t) => t.tripId === testTripId);
    assert(tripFound, 'Created trip found in driver trip manifest');

    // Test GET /api/driver/trips/:tripId
    const getSingleTripRes = await fetch(`${baseUrl}/driver/trips/${testTripId}`, { headers: authHeaders });
    const singleTripData = await getSingleTripRes.json();
    assert(getSingleTripRes.status === 200, 'GET /api/driver/trips/:tripId returns HTTP 200');
    assert(singleTripData.trip && singleTripData.trip.tripId === testTripId, 'GET trip matches exact tripId');
    assert(singleTripData.trip.pickup && singleTripData.trip.pickup.farmerName === 'Ramesh Kumar', 'Trip details include origin farm and farmer');
    assert(singleTripData.trip.dropoff && singleTripData.trip.dropoff.buyerName === 'Grand Palace Luxury Dining', 'Trip details include destination buyer');
    assert(singleTripData.trip.cratesCount === 6, 'Trip specifies exact crate count (6 crates)');

    // -------------------------------------------------------------------------
    // 5. OPERATIONAL MILESTONE ADVANCEMENT & CRATE INSPECTION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Milestone Progression & Crate Checklist ---');

    // Step A: Advance READY_FOR_PICKUP -> EN_ROUTE_PICKUP
    const step1Res = await fetch(`${baseUrl}/driver/trips/${testTripId}/advance`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    const step1Data = await step1Res.json();
    assert(step1Res.status === 200, 'PATCH trip advance to EN_ROUTE_PICKUP returns HTTP 200');
    assert(step1Data.trip.status === 'EN_ROUTE_PICKUP', 'Trip status transitions to EN_ROUTE_PICKUP');

    const dbTripStep1 = await Trip.findOne({ tripId: testTripId });
    assert(dbTripStep1.status === 'EN_ROUTE_PICKUP', 'EN_ROUTE_PICKUP status stored in MongoDB');

    // Step B: Advance EN_ROUTE_PICKUP -> PICKED_UP (with Crate Inspection)
    const crateInspectionData = {
      countVerified: true,
      qualityInspected: true,
      tamperSealAffixed: true
    };
    const step2Res = await fetch(`${baseUrl}/driver/trips/${testTripId}/advance`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ crateChecks: crateInspectionData })
    });
    const step2Data = await step2Res.json();
    assert(step2Res.status === 200, 'PATCH trip advance to PICKED_UP with crates checklist returns HTTP 200');
    assert(step2Data.trip.status === 'PICKED_UP', 'Trip status transitions to PICKED_UP');

    const dbTripStep2 = await Trip.findOne({ tripId: testTripId });
    assert(dbTripStep2.status === 'PICKED_UP', 'PICKED_UP status stored in MongoDB');
    assert(dbTripStep2.crateInspection.countVerified === true, 'Crate count verified in MongoDB');
    assert(dbTripStep2.crateInspection.qualityInspected === true, 'Produce quality inspection verified in MongoDB');
    assert(dbTripStep2.crateInspection.tamperSealAffixed === true, 'Tamper seal affixation verified in MongoDB');

    // Verify synchronized Order status in MongoDB
    const dbOrderStep2 = await Order.findOne({ orderId: testOrderId });
    assert(dbOrderStep2.deliveryStatus === 'PICKED_UP', 'Order deliveryStatus synchronized to PICKED_UP');

    // Step C: Advance PICKED_UP -> IN_TRANSIT
    const step3Res = await fetch(`${baseUrl}/driver/trips/${testTripId}/advance`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    const step3Data = await step3Res.json();
    assert(step3Res.status === 200, 'PATCH trip advance to IN_TRANSIT returns HTTP 200');
    assert(step3Data.trip.status === 'IN_TRANSIT', 'Trip status transitions to IN_TRANSIT');

    const dbTripStep3 = await Trip.findOne({ tripId: testTripId });
    assert(dbTripStep3.status === 'IN_TRANSIT', 'IN_TRANSIT status stored in MongoDB');

    const dbOrderStep3 = await Order.findOne({ orderId: testOrderId });
    assert(dbOrderStep3.deliveryStatus === 'IN_TRANSIT', 'Order deliveryStatus synchronized to IN_TRANSIT');

    // -------------------------------------------------------------------------
    // 6. BUYER 4-DIGIT DELIVERY PIN HANDSHAKE & WALLET CREDIT
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Delivery PIN Verification & Escrow Payout ---');

    // Initial driver wallet balance before payout
    const driverBeforePayout = await Driver.findOne({ driverId });
    const initialBalance = driverBeforePayout.wallet.balance;

    // Test invalid PIN rejection
    const wrongPinRes = await fetch(`${baseUrl}/driver/trips/${testTripId}/verify-pin`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ pin: '0000' })
    });
    assert(wrongPinRes.status === 400, 'POST /verify-pin with invalid PIN rejected with HTTP 400');

    // Test valid PIN handshake
    const validPinRes = await fetch(`${baseUrl}/driver/trips/${testTripId}/verify-pin`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ pin: '4892' })
    });
    const validPinData = await validPinRes.json();
    assert(validPinRes.status === 200, 'POST /verify-pin with valid 4-digit PIN returns HTTP 200');
    assert(validPinData.trip.status === 'DELIVERED', 'Trip status transitions to final milestone DELIVERED');
    assert(validPinData.trip.haulageEarnings.payoutStatus === 'PAID', 'Haulage payoutStatus transitions to PAID');

    // Verify Trip in MongoDB
    const dbTripDelivered = await Trip.findOne({ tripId: testTripId });
    assert(dbTripDelivered.status === 'DELIVERED', 'Trip status stored as DELIVERED in MongoDB');
    assert(dbTripDelivered.haulageEarnings.payoutStatus === 'PAID', 'Haulage earnings status is PAID in MongoDB');

    // Verify Driver Wallet in MongoDB
    const expectedNewBalance = initialBalance + 860;
    const dbDriverAfterPayout = await Driver.findOne({ driverId });
    assert(dbDriverAfterPayout.wallet.balance === expectedNewBalance, `Driver wallet credited: Rs. ${initialBalance} -> Rs. ${dbDriverAfterPayout.wallet.balance}`);
    assert(dbDriverAfterPayout.wallet.todayEarnings >= 860, 'Driver todayEarnings incremented');
    assert(dbDriverAfterPayout.metrics.totalDispatches >= 1, 'Driver metrics totalDispatches incremented');

    // Verify DriverWalletTransaction in MongoDB
    const dbPayoutTxn = await DriverWalletTransaction.findOne({ tripId: testTripId, type: 'TRIP_PAYOUT' });
    assert(dbPayoutTxn && dbPayoutTxn._id, 'TRIP_PAYOUT transaction created in MongoDB');
    assert(dbPayoutTxn.amount === 860, 'Transaction amount matches trip haulage earnings (Rs. 860)');
    assert(dbPayoutTxn.status === 'COMPLETED', 'Transaction status is COMPLETED');

    // Verify linked Order updated in MongoDB
    const dbOrderDelivered = await Order.findOne({ orderId: testOrderId });
    assert(dbOrderDelivered.deliveryStatus === 'DELIVERED', 'Order deliveryStatus synchronized to DELIVERED');
    assert(dbOrderDelivered.paymentStatus === 'RELEASED_TO_FARMER', 'Order paymentStatus released upon delivery');

    // -------------------------------------------------------------------------
    // 7. FINANCIAL WALLET & INSTANT UPI WITHDRAWAL
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Financial Wallet & Instant UPI Withdrawal ---');

    // Test GET /api/driver/wallet
    const getWalletRes = await fetch(`${baseUrl}/driver/wallet?driverId=${driverId}`, { headers: authHeaders });
    const walletData = await getWalletRes.json();
    assert(getWalletRes.status === 200, 'GET /api/driver/wallet returns HTTP 200');
    assert(walletData.wallet && walletData.wallet.balance === expectedNewBalance, 'Wallet endpoint returns correct balance');
    assert(Array.isArray(walletData.transactions) && walletData.transactions.length > 0, 'Wallet ledger includes transaction list');

    // Test instant withdrawal
    const withdrawAmount = 500;
    const withdrawUpi = `selvam.${timestamp}@okhdfcbank`;
    const postWithdrawRes = await fetch(`${baseUrl}/driver/wallet/withdraw`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        driverId,
        amount: withdrawAmount,
        upiId: withdrawUpi
      })
    });
    const postWithdrawData = await postWithdrawRes.json();
    assert(postWithdrawRes.status === 200, 'POST /api/driver/wallet/withdraw returns HTTP 200');
    assert(postWithdrawData.wallet.balance === expectedNewBalance - withdrawAmount, `Balance after withdrawal: Rs. ${postWithdrawData.wallet.balance}`);

    // Verify MongoDB Driver document after withdrawal
    const dbDriverAfterWithdraw = await Driver.findOne({ driverId });
    assert(dbDriverAfterWithdraw.wallet.balance === expectedNewBalance - withdrawAmount, 'Updated wallet balance saved in MongoDB');
    assert(dbDriverAfterWithdraw.wallet.totalWithdrawn === withdrawAmount, 'totalWithdrawn recorded in MongoDB');

    // Verify UPI_WITHDRAWAL transaction in MongoDB
    const dbWithdrawTxn = await DriverWalletTransaction.findOne({ driverId, type: 'UPI_WITHDRAWAL' });
    assert(dbWithdrawTxn && dbWithdrawTxn._id, 'UPI_WITHDRAWAL transaction record persisted in MongoDB');
    assert(dbWithdrawTxn.amount === withdrawAmount, `Withdrawal amount recorded as Rs. ${withdrawAmount}`);
    assert(dbWithdrawTxn.bankRef && dbWithdrawTxn.bankRef.startsWith('UPI/HDFC/'), 'Bank transaction reference generated');

    // Test excessive withdrawal rejection
    const excessWithdrawRes = await fetch(`${baseUrl}/driver/wallet/withdraw`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        driverId,
        amount: 999999,
        upiId: withdrawUpi
      })
    });
    assert(excessWithdrawRes.status === 400, 'Excessive withdrawal rejected with HTTP 400 Insufficient Funds');

    // -------------------------------------------------------------------------
    // 8. MULTI-TENANT ISOLATION & ACCESS CONTROL
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Multi-Tenant Isolation & Role Boundaries ---');

    // Driver attempting to access Farmer-only route must receive 403 Forbidden
    const farmerRestrictedRes = await fetch(`${baseUrl}/farmer/profile`, { headers: authHeaders });
    assert(farmerRestrictedRes.status === 403 || farmerRestrictedRes.status === 401, 'Driver token calling /api/farmer/profile blocked with 403 Forbidden');

  } catch (err) {
    console.error('\nAudit encountered unexpected error:', err);
    failed++;
  } finally {
    // Cleanup temporary test artifacts
    console.log('\n--- Cleaning up temporary test artifacts ---');
    if (driverId) {
      await Driver.deleteOne({ driverId });
      await DriverWalletTransaction.deleteMany({ driverId });
      console.log('  Cleaned test driver and wallet transactions from MongoDB');
    }
    if (testTripId) {
      await Trip.deleteOne({ tripId: testTripId });
      console.log('  Cleaned test trip from MongoDB');
    }
    if (testOrderId) {
      await Order.deleteOne({ orderId: testOrderId });
      console.log('  Cleaned test order from MongoDB');
    }
    if (testCropId) {
      await Crop.findByIdAndDelete(testCropId);
      console.log('  Cleaned test crop listing from MongoDB');
    }

    server.close();
    await mongoose.disconnect();
    console.log('Database disconnected and HTTP test server closed.');

    console.log('\n================================================================');
    console.log(`EGM DRIVER MODULE AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runDriverModuleAudit();
