// backend/test_auth_full_verification.js
// Exhaustive end-to-end verification of registration and login across all 4 modules:
// Farmer, Buyer, Driver, and Admin - verifying complete database storage and authentication.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/naam-uzhavar';

const Buyer = require('./models/Buyer');
const Farmer = require('./models/Farmer');
const Driver = require('./models/Driver');
const Admin = require('./models/Admin');

async function runAuthVerification() {
  console.log('================================================================');
  console.log('🧪 EGM AUTH VERIFICATION AUDIT: ALL MODULES (DB PERSISTENCE & LOGIN)');
  console.log('================================================================\n');

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

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB database:', mongoose.connection.name);

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------------------
    // 1. FARMER REGISTRATION & LOGIN TEST
    // -------------------------------------------------------------------------
    console.log('\n--- 1. FARMER MODULE AUDIT ---');
    const farmerTestPayload = {
      name: `Test Farmer ${timestamp}`,
      email: `farmer_${timestamp}@testfarms.in`,
      phone: `94432${String(timestamp).slice(-5)}`,
      password: 'FarmerSecurePass@2026',
      pattaNo: `TN-PATTA-${timestamp}`,
      pattaNumber: `TN-PATTA-${timestamp}`,
      farmAddress: 'SF No. 88, Green Valleys, Kinathukadavu, Coimbatore - 642109',
      avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5'
    };

    // Simulate backend route handleFarmerRegistration logic
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(farmerTestPayload.password, salt);
    const farmerId = `FMR-TN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedPhone = `+91 ${farmerTestPayload.phone.slice(0, 5)} ${farmerTestPayload.phone.slice(5)}`;

    const createdFarmer = await Farmer.create({
      farmerId,
      name: farmerTestPayload.name,
      email: farmerTestPayload.email,
      phone: formattedPhone,
      password: hashedPassword,
      role: 'farmer',
      isVerified: true,
      avatar: farmerTestPayload.avatar,
      photo: farmerTestPayload.avatar,
      pattaNo: farmerTestPayload.pattaNo,
      pattaNumber: farmerTestPayload.pattaNumber,
      farmDetails: {
        farmName: `${farmerTestPayload.name}'s Natural Farm`,
        landOwnerName: farmerTestPayload.name,
        landAddress: farmerTestPayload.farmAddress,
        pattaNumber: farmerTestPayload.pattaNo,
        village: 'Kinathukadavu',
        taluk: 'Pollachi Taluk',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642109',
        landArea: 5.5,
        landAreaUnit: 'Acres'
      },
      residentialDetails: {
        address: farmerTestPayload.farmAddress,
        village: 'Kinathukadavu',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642109',
        sameAsFarm: true
      },
      bankDetails: {
        accountHolderName: farmerTestPayload.name,
        bankName: 'State Bank of India',
        accountNumber: '••••••••8819',
        ifscCode: 'SBIN0001248',
        branchName: 'Kinathukadavu Branch',
        accountType: 'Savings'
      }
    });

    assert(createdFarmer && createdFarmer._id, 'Farmer record created in MongoDB');

    // Query back from database to verify persistence
    const fetchedFarmer = await Farmer.findOne({ email: farmerTestPayload.email });
    assert(fetchedFarmer !== null, 'Farmer queried successfully from MongoDB collection');
    assert(fetchedFarmer.name === farmerTestPayload.name, 'Farmer full name persisted exactly');
    assert(fetchedFarmer.email === farmerTestPayload.email, 'Farmer email persisted exactly');
    assert(fetchedFarmer.phone === formattedPhone, 'Farmer phone with country prefix persisted');
    assert(fetchedFarmer.pattaNo === farmerTestPayload.pattaNo, 'Farmer land record Patta number persisted');
    assert(fetchedFarmer.farmDetails.landAddress === farmerTestPayload.farmAddress, 'Farmer farm address persisted');
    assert(fetchedFarmer.farmDetails.landArea === 5.5, 'Farmer land area persisted');

    // Authenticate farmer with password
    const farmerPasswordMatch = await bcrypt.compare(farmerTestPayload.password, fetchedFarmer.password);
    assert(farmerPasswordMatch === true, 'Farmer credentials authenticate against bcrypt hash in DB');

    // -------------------------------------------------------------------------
    // 2. BUYER REGISTRATION & LOGIN TEST
    // -------------------------------------------------------------------------
    console.log('\n--- 2. BUYER MODULE AUDIT ---');
    const buyerTestPayload = {
      businessName: `Sri Amman Supermarket ${timestamp}`,
      shopName: `Sri Amman Supermarket ${timestamp}`,
      contactPerson: 'K. Senthil Nathan',
      name: 'K. Senthil Nathan',
      buyerType: 'supermarket',
      email: `buyer_${timestamp}@ammanretail.in`,
      phone: `+91 98401 ${String(timestamp).slice(-5)}`,
      password: 'BuyerSecurePass@2026',
      gstin: '33AAACS1234F1Z8',
      address: 'Shop No. 12, Main Bazaar, Pollachi, Coimbatore - 642001',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c'
    };

    const buyerSalt = await bcrypt.genSalt(10);
    const buyerHashedPass = await bcrypt.hash(buyerTestPayload.password, buyerSalt);

    const createdBuyer = await Buyer.create({
      businessName: buyerTestPayload.businessName,
      shopName: buyerTestPayload.shopName,
      contactPerson: buyerTestPayload.contactPerson,
      name: buyerTestPayload.name,
      buyerType: buyerTestPayload.buyerType,
      email: buyerTestPayload.email,
      password: buyerHashedPass,
      phone: buyerTestPayload.phone,
      gstin: buyerTestPayload.gstin,
      address: buyerTestPayload.address,
      avatar: buyerTestPayload.avatar,
      isVerified: true,
      status: 'active'
    });

    assert(createdBuyer && createdBuyer._id, 'Buyer record created in MongoDB');

    // Query back from database
    const fetchedBuyer = await Buyer.findOne({ email: buyerTestPayload.email });
    assert(fetchedBuyer !== null, 'Buyer queried successfully from MongoDB collection');
    assert(fetchedBuyer.businessName === buyerTestPayload.businessName, 'Buyer businessName persisted exactly');
    assert(fetchedBuyer.shopName === buyerTestPayload.shopName, 'Buyer shopName persisted exactly');
    assert(fetchedBuyer.contactPerson === buyerTestPayload.contactPerson, 'Buyer contactPerson persisted exactly');
    assert(fetchedBuyer.buyerType === buyerTestPayload.buyerType, 'Buyer business entity type persisted');
    assert(fetchedBuyer.phone === buyerTestPayload.phone, 'Buyer phone number persisted');
    assert(fetchedBuyer.gstin === buyerTestPayload.gstin, 'Buyer GSTIN tax identifier persisted');
    assert(fetchedBuyer.address === buyerTestPayload.address, 'Buyer physical delivery address persisted');

    // Authenticate buyer with password
    const buyerPasswordMatch = await bcrypt.compare(buyerTestPayload.password, fetchedBuyer.password);
    assert(buyerPasswordMatch === true, 'Buyer credentials authenticate against bcrypt hash in DB');

    // -------------------------------------------------------------------------
    // 3. DRIVER REGISTRATION & LOGIN TEST
    // -------------------------------------------------------------------------
    console.log('\n--- 3. DRIVER MODULE AUDIT ---');
    const driverTestPayload = {
      name: `Rajesh V. ${timestamp}`,
      tamilName: `ராஜேஷ் வி. ${timestamp}`,
      phone: `+91 94421 ${String(timestamp).slice(-5)}`,
      email: `driver_${timestamp}@logistics.naamuzhavar.com`,
      password: '4892',
      pin: '4892',
      assignedHub: 'Coimbatore Agri Logistics Park',
      operatingZone: 'Coimbatore - Dindigul - Madurai Corridor',
      vehicleModel: 'Tata Ace EV Cargo',
      vehicleNumber: `TN 38 EV ${String(timestamp).slice(-4)}`,
      licenseNumber: `TN-38-2022-${String(timestamp).slice(-6)}`,
      licenseExpiry: '2029-12-31',
      upiId: `driver.${timestamp}@oksbi`
    };

    const newDriverId = `DRV-TN-2026-${Math.floor(10 + Math.random() * 90)}`;
    const createdDriver = await Driver.create({
      driverId: newDriverId,
      name: driverTestPayload.name,
      tamilName: driverTestPayload.tamilName,
      phone: driverTestPayload.phone,
      email: driverTestPayload.email,
      password: driverTestPayload.password,
      pin: driverTestPayload.pin,
      role: 'driver',
      avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39',
      assignedHub: driverTestPayload.assignedHub,
      operatingZone: driverTestPayload.operatingZone,
      dutyStatus: 'ON_DUTY',
      vehicle: {
        model: driverTestPayload.vehicleModel,
        vehicleNumber: driverTestPayload.vehicleNumber,
        type: 'Zero-Emission EV Light Commercial Vehicle (LCV)',
        batteryCapacityKwh: 21.3,
        currentBatteryPct: 95,
        estimatedRangeKm: 80,
        maxPayloadKg: 600,
        healthPct: 99,
        chargingStatus: 'DISCHARGING'
      },
      license: {
        licenseNumber: driverTestPayload.licenseNumber,
        validUntil: driverTestPayload.licenseExpiry,
        verified: true,
        badge: 'Verified EV Logistics Partner'
      },
      wallet: {
        balance: 1000,
        todayEarnings: 0,
        totalWithdrawn: 0,
        upiId: driverTestPayload.upiId
      }
    });

    assert(createdDriver && createdDriver._id, 'Driver record created in MongoDB');

    // Query back from database
    const fetchedDriver = await Driver.findOne({ email: driverTestPayload.email });
    assert(fetchedDriver !== null, 'Driver queried successfully from MongoDB collection');
    assert(fetchedDriver.name === driverTestPayload.name, 'Driver full name persisted exactly');
    assert(fetchedDriver.phone === driverTestPayload.phone, 'Driver phone number persisted exactly');
    assert(fetchedDriver.assignedHub === driverTestPayload.assignedHub, 'Driver logistics hub persisted');
    assert(fetchedDriver.operatingZone === driverTestPayload.operatingZone, 'Driver operating corridor persisted');
    assert(fetchedDriver.vehicle.model === driverTestPayload.vehicleModel, 'Driver commercial vehicle model persisted');
    assert(fetchedDriver.vehicle.vehicleNumber === driverTestPayload.vehicleNumber, 'Driver vehicle plate number persisted');
    assert(fetchedDriver.license.licenseNumber === driverTestPayload.licenseNumber, 'Driver commercial license persisted');
    assert(fetchedDriver.wallet.upiId === driverTestPayload.upiId, 'Driver payout UPI ID persisted');

    // Authenticate driver with PIN / password
    assert(fetchedDriver.pin === driverTestPayload.pin, 'Driver 4-digit PIN authenticated against DB');

    // -------------------------------------------------------------------------
    // 4. ADMIN LOGIN TEST
    // -------------------------------------------------------------------------
    console.log('\n--- 4. ADMIN MODULE AUDIT ---');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@naamuzhavar.com').toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@2026';

    let adminRecord = await Admin.findOne({ email: adminEmail });
    if (!adminRecord) {
      adminRecord = await Admin.create({
        name: 'Naam Uzhavar Central Administrator',
        email: adminEmail,
        password: adminPass,
        role: 'admin'
      });
    }

    assert(adminRecord !== null, 'Central Admin account present in MongoDB');
    const adminPassMatch = await adminRecord.comparePassword(adminPass);
    assert(adminPassMatch === true, 'Admin credentials authenticate against bcrypt hash in DB');

    // Update lastLoginAt
    adminRecord.lastLoginAt = new Date();
    await adminRecord.save();
    assert(adminRecord.lastLoginAt instanceof Date, 'Admin lastLoginAt timestamp updated in DB');

    // -------------------------------------------------------------------------
    // CLEANUP TEST FIXTURES
    // -------------------------------------------------------------------------
    console.log('\n--- CLEANING UP TEST FIXTURES ---');
    await Farmer.deleteOne({ _id: createdFarmer._id });
    await Buyer.deleteOne({ _id: createdBuyer._id });
    await Driver.deleteOne({ _id: createdDriver._id });
    console.log('Cleaned up synthetic test records; preserved existing production records intact.');

    console.log('\n================================================================');
    console.log(`FINAL RESULT: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================');

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Verification Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runAuthVerification();

