// backend/test_api_auth_e2e.js - End-to-end HTTP and Database verification of all auth flows
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = require('./server');
const Buyer = require('./models/Buyer');
const Farmer = require('./models/Farmer');
const Driver = require('./models/Driver');
const Admin = require('./models/Admin');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/naam-uzhavar';

async function runE2E() {
  console.log('================================================================');
  console.log('🌐 HTTP API END-TO-END VERIFICATION: ALL LOGIN & REGISTER FLOWS');
  console.log('================================================================\n');

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected successfully.\n');

  const server = http.createServer(app);
  const PORT = 5055;

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
  const createdIds = { farmers: [], buyers: [], drivers: [] };

  try {
    // -------------------------------------------------------------------------
    // 1. FARMER END-TO-END FLOW
    // -------------------------------------------------------------------------
    console.log('--- 1. Testing Farmer Registration & Login over HTTP ---');
    const farmerPayload = {
      name: `Rajan Farmer ${timestamp}`,
      phone: `98421${String(timestamp).slice(-5)}`,
      email: `rajan_${timestamp}@pollachifarms.in`,
      password: 'RajanFarmPass@2026',
      confirmPassword: 'RajanFarmPass@2026',
      pattaNo: `PATTA-POL-${timestamp}`,
      pattaNumber: `PATTA-POL-${timestamp}`,
      farmAddress: 'SF No 204, Anaimalai Road, Pollachi, Coimbatore - 642001',
      avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5'
    };

    // 1A. Register Farmer
    const regFarmerRes = await fetch(`${baseUrl}/auth/farmer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(farmerPayload)
    });
    const regFarmerData = await regFarmerRes.json();
    assert(regFarmerRes.status === 201 || regFarmerRes.status === 200, 'Farmer registration returns HTTP 201/200');
    assert(regFarmerData.token !== undefined, 'Farmer registration returns valid JWT token');

    // 1B. Verify in MongoDB
    const dbFarmer = await Farmer.findOne({ email: farmerPayload.email });
    assert(dbFarmer !== null, 'Farmer record found stored in MongoDB database');
    assert(dbFarmer.name === farmerPayload.name, 'Farmer name matches form submission in DB');
    assert(dbFarmer.pattaNo === farmerPayload.pattaNo, 'Farmer Patta No matches form submission in DB');
    createdIds.farmers.push(dbFarmer._id);

    // 1C. Login Farmer
    const loginFarmerRes = await fetch(`${baseUrl}/auth/farmer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: farmerPayload.email,
        password: farmerPayload.password
      })
    });
    const loginFarmerData = await loginFarmerRes.json();
    assert(loginFarmerRes.status === 200, 'Farmer login with credentials returns HTTP 200');
    assert(loginFarmerData.farmer && loginFarmerData.farmer.name === farmerPayload.name, 'Farmer login returns authenticated farmer data');

    // -------------------------------------------------------------------------
    // 2. BUYER END-TO-END FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Buyer Registration & Login over HTTP ---');
    const buyerPayload = {
      businessName: `Kongu Heritage Hotel ${timestamp}`,
      shopName: `Kongu Heritage Hotel ${timestamp}`,
      contactPerson: 'M. Sivakumar',
      name: 'M. Sivakumar',
      fullName: 'M. Sivakumar',
      buyerType: 'hotel',
      email: `siva_${timestamp}@konguheritage.in`,
      password: 'BuyerSecurePass@2026',
      phone: `+91 98432 ${String(timestamp).slice(-5)}`,
      gstin: '33AABCK1234E1Z4',
      address: '74, Avinashi Road, Near Hope College, Coimbatore - 641004',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c'
    };

    // 2A. Register Buyer
    const regBuyerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buyerPayload)
    });
    const regBuyerData = await regBuyerRes.json();
    assert(regBuyerRes.status === 201, 'Buyer registration returns HTTP 201');
    assert(regBuyerData.token !== undefined, 'Buyer registration returns valid JWT token');

    // 2B. Verify in MongoDB
    const dbBuyer = await Buyer.findOne({ email: buyerPayload.email });
    assert(dbBuyer !== null, 'Buyer record found stored in MongoDB database');
    assert(dbBuyer.businessName === buyerPayload.businessName, 'Buyer businessName matches form submission in DB');
    assert(dbBuyer.contactPerson === buyerPayload.contactPerson, 'Buyer contactPerson matches form submission in DB');
    assert(dbBuyer.gstin === buyerPayload.gstin, 'Buyer GSTIN matches form submission in DB');
    createdIds.buyers.push(dbBuyer._id);

    // 2C. Login Buyer
    const loginBuyerRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: buyerPayload.email,
        password: buyerPayload.password
      })
    });
    const loginBuyerData = await loginBuyerRes.json();
    assert(loginBuyerRes.status === 200, 'Buyer login with credentials returns HTTP 200');
    assert(loginBuyerData.buyer && loginBuyerData.buyer.businessName === buyerPayload.businessName, 'Buyer login returns authenticated buyer data');

    // -------------------------------------------------------------------------
    // 3. DRIVER END-TO-END FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Driver Registration & Login over HTTP ---');
    const driverPayload = {
      name: `Venkatesh S. ${timestamp}`,
      phone: `94435${String(timestamp).slice(-5)}`,
      email: `venkat_${timestamp}@evlogistics.in`,
      password: '3819',
      pin: '3819',
      assignedHub: 'Dindigul Central Hub',
      operatingZone: 'Coimbatore - Dindigul - Madurai Corridor',
      vehicleModel: 'Mahindra Zor Grand EV',
      vehicleNumber: `TN 57 EV ${String(timestamp).slice(-4)}`,
      licenseNumber: `TN-57-2023-${String(timestamp).slice(-6)}`,
      licenseExpiry: '2029-06-30',
      upiId: `venkat.${timestamp}@okaxis`
    };

    // 3A. Register Driver
    const regDriverRes = await fetch(`${baseUrl}/driver/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driverPayload)
    });
    const regDriverData = await regDriverRes.json();
    assert(regDriverRes.status === 201, 'Driver registration returns HTTP 201');
    assert(regDriverData.token !== undefined, 'Driver registration returns valid JWT token');

    // 3B. Verify in MongoDB
    const dbDriver = await Driver.findOne({ email: driverPayload.email });
    assert(dbDriver !== null, 'Driver record found stored in MongoDB database');
    assert(dbDriver.name === driverPayload.name, 'Driver name matches form submission in DB');
    assert(dbDriver.vehicle.vehicleNumber === driverPayload.vehicleNumber, 'Driver vehicle plate matches form submission in DB');
    assert(dbDriver.license.licenseNumber === driverPayload.licenseNumber, 'Driver license matches form submission in DB');
    createdIds.drivers.push(dbDriver._id);

    // 3C. Login Driver
    const loginDriverRes = await fetch(`${baseUrl}/driver/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: driverPayload.email,
        pin: driverPayload.pin
      })
    });
    const loginDriverData = await loginDriverRes.json();
    assert(loginDriverRes.status === 200, 'Driver login with PIN returns HTTP 200');
    assert(loginDriverData.driver && loginDriverData.driver.name === driverPayload.name, 'Driver login returns authenticated driver data');

    // -------------------------------------------------------------------------
    // 4. ADMIN LOGIN FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Admin Login over HTTP ---');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@naamuzhavar.com').toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@2026';

    const loginAdminRes = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPass
      })
    });
    const loginAdminData = await loginAdminRes.json();
    assert(loginAdminRes.status === 200, 'Admin login with valid credentials returns HTTP 200');
    assert(loginAdminData.token !== undefined, 'Admin login returns valid JWT token');
    assert(loginAdminData.admin && loginAdminData.admin.role === 'admin', 'Admin login returns admin role');

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleaning up test fixtures from MongoDB ---');
    for (const fid of createdIds.farmers) await Farmer.deleteOne({ _id: fid });
    for (const bid of createdIds.buyers) await Buyer.deleteOne({ _id: bid });
    for (const did of createdIds.drivers) await Driver.deleteOne({ _id: did });
    console.log('Cleanup complete. Production data preserved.');

    console.log('\n================================================================');
    console.log(`TOTAL HTTP E2E RESULT: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('E2E Verification Error:', err);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runE2E();

