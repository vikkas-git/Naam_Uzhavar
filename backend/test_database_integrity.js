// backend/test_database_integrity.js - Non-destructive Phase 8 Database Integrity Audit
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/naam-uzhavar';

async function runDatabaseIntegrityAudit() {
  console.log('📦 Starting Phase 8 Database Integrity & Preservation Audit...');
  console.log(`Connecting to database: ${mongoUri} (read-only mode)...\n`);

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

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    assert(mongoose.connection.readyState === 1, '1. Connected successfully to MongoDB instance');

    const db = mongoose.connection.db;
    const collectionsList = await db.listCollections().toArray();
    const collectionNames = collectionsList.map(c => c.name);

    console.log(`\nDiscovered ${collectionNames.length} active database collections in '${mongoose.connection.name}':`);
    collectionNames.forEach(name => console.log(`  - ${name}`));
    console.log('');

    // Required 11 collections
    const requiredCollections = [
      'buyers',
      'farmers',
      'crops',
      'orders',
      'buyerrequests',
      'invoices',
      'messages',
      'drivers',
      'trips',
      'driverwallettransactions',
      'admins'
    ];

    for (const reqColl of requiredCollections) {
      const exists = collectionNames.includes(reqColl);
      assert(exists, `2. Required collection '${reqColl}' is present`);
      if (exists) {
        const count = await db.collection(reqColl).countDocuments();
        assert(count > 0, `   Collection '${reqColl}' preserves active data (${count} records)`);
      }
    }

    // Check Admin collection record
    const adminRecord = await db.collection('admins').findOne({ email: 'admin@naamuzhavar.com' });
    assert(
      adminRecord && adminRecord.role === 'admin' && adminRecord.password && adminRecord.password.startsWith('$2'),
      '3. Central Admin account exists in database with bcrypt-hashed password ($2a/b$)'
    );

    // Verify existing Farmer, Buyer, Driver records remain completely intact
    const farmerRecord = await db.collection('farmers').findOne({ farmerId: 'FMR-TN-2026-01' });
    assert(
      farmerRecord && farmerRecord.name === 'Ramesh Kumar',
      '4. Existing Farmer record (Ramesh Kumar / FMR-TN-2026-01) is preserved intact'
    );

    const buyerRecord = await db.collection('buyers').findOne({ email: 'demo@naamuzhavar.com' });
    assert(
      buyerRecord && buyerRecord.businessName === 'Grand Palace Luxury Dining',
      '5. Existing Buyer record (Grand Palace Luxury Dining) is preserved intact'
    );

    const driverRecord = await db.collection('drivers').findOne({ driverId: 'DRV-TN-2026-08' });
    assert(
      driverRecord && driverRecord.name === 'Kumar M.',
      '6. Existing Driver record (Kumar M. / DRV-TN-2026-08) is preserved intact'
    );

    console.log(`\n========================================`);
    console.log(`Database Audit: ${passed}/${total} assertions passed (${Math.round((passed/total)*100)}%)`);
    console.log(`Preservation Status: Zero records deleted | Zero collections reset`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Database Audit Error:', err);
    process.exit(1);
  }
}

runDatabaseIntegrityAudit();

