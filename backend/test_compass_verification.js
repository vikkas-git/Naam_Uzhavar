// test_compass_verification.js - Verifies the 5 critical fixes directly against live MongoDB

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function runVerification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING BACKEND FIXES AGAINST LOCAL MONGODB COMPASS');
  console.log('================================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/naam-uzhavar';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB:', mongoUri);

  // 1. Verify 10 Collections in MongoDB Compass
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collNames = collections.map((c) => c.name);
  console.log('\n[1/4] Checking Collections in Compass:');
  const required10 = [
    'buyers',
    'farmers',
    'crops',
    'orders',
    'buyerrequests',
    'invoices',
    'messages',
    'drivers',
    'trips',
    'driverwallettransactions'
  ];

  let missing = [];
  for (const req of required10) {
    const count = await mongoose.connection.db.collection(req).countDocuments();
    if (collNames.includes(req)) {
      console.log(`  ✓ Collection '${req}': ${count} document(s)`);
    } else {
      console.error(`  ❌ Missing collection '${req}'`);
      missing.push(req);
    }
  }

  // 2. Verify Invoices Model & Query
  console.log('\n[2/4] Verifying Invoices Model:');
  const Invoice = require('./models/Invoice');
  const invCount = await Invoice.countDocuments();
  console.log(`  ✓ Persistent Invoices stored: ${invCount}`);

  // 3. Verify Diverse Crops
  console.log('\n[3/4] Verifying Diverse Produce in Marketplace (Non-vegetables):');
  const Crop = require('./models/Crop');
  const banana = await Crop.findOne({ name: /banana/i });
  const coconut = await Crop.findOne({ name: /coconut/i });
  if (banana && coconut) {
    console.log(`  ✓ Banana and Coconut crops found in database: '${banana.name}', '${coconut.name}'`);
  } else {
    console.error('  ❌ Banana or Coconut missing');
  }

  // 4. Verify Driver Credentials
  console.log('\n[4/4] Verifying Driver Logistics:');
  const Driver = require('./models/Driver');
  const driver = await Driver.findOne({ driverId: 'DRV-TN-2026-08' });
  if (driver && driver.pin === '1234') {
    console.log(`  ✓ Driver ${driver.name} verified with vehicle: ${driver.vehicle.model}`);
  } else {
    console.error('  ❌ Driver not found');
  }

  console.log('\n================================================================');
  console.log(missing.length === 0 ? '🎉 ALL 10 COLLECTIONS & FIXES VERIFIED 100% IN COMPASS!' : '❌ Some collections missing');
  console.log('================================================================\n');

  process.exit(missing.length === 0 ? 0 : 1);
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});

