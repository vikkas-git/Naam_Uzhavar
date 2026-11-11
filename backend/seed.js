// seed.js - Database initialization script for Naam Uzhavar (Full 10-Collection Suite)
// Viva Note: Seeds all 10 MongoDB collections for Compass verification:
// 1. buyers, 2. farmers, 3. crops, 4. orders, 5. buyerrequests, 6. invoices,
// 7. messages, 8. drivers, 9. trips, 10. driverwallettransactions.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const Buyer = require('./models/Buyer');
const Farmer = require('./models/Farmer');
const Crop = require('./models/Crop');
const Order = require('./models/Order');
const BuyerRequest = require('./models/BuyerRequest');
const Message = require('./models/Message');
const Driver = require('./models/Driver');
const Trip = require('./models/Trip');
const DriverWalletTransaction = require('./models/DriverWalletTransaction');
const Invoice = require('./models/Invoice');

const SEED_CROPS = [
  {
    name: 'Country Tomato',
    nameTa: 'நாட்டு தக்காளி',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Hybrid Tomato',
    farmingMethod: 'Natural',
    pricePerKg: 28,
    quantityKg: 500,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Pollachi Hub',
    distanceKm: 12,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
    ],
    pickupDate: '2026-11-15',
    status: 'active',
    enquiryCount: 3,
    farmLocation: {
      address: 'SF No. 142/2, Kinathukadavu Main Road',
      village: 'Pollachi',
      taluk: 'Pollachi Taluk',
      district: 'Coimbatore',
      pincode: '642001',
      gps: '10.6588° N, 77.0094° E'
    }
  },
  {
    name: 'Dindigul Red Onion',
    nameTa: 'திண்டுக்கல் வெங்காயம்',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Small Shallot (Chinna Vengayam)',
    farmingMethod: 'Organic',
    pricePerKg: 55,
    quantityKg: 350,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Oddanchatram Hub',
    distanceKm: 28,
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80'],
    pickupDate: '2026-11-16',
    status: 'active',
    enquiryCount: 2,
    farmLocation: {
      address: 'SF No. 142/2, Kinathukadavu Main Road',
      village: 'Pollachi',
      taluk: 'Pollachi Taluk',
      district: 'Coimbatore',
      pincode: '642001',
      gps: '10.6588° N, 77.0094° E'
    }
  },
  {
    name: 'Nilgiris Mountain Potato',
    nameTa: 'நீலகிரி உருளைக்கிழங்கு',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Kufri Jyoti Hill Potato',
    farmingMethod: 'Natural',
    pricePerKg: 38,
    quantityKg: 800,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Ooty / Mettupalayam Hub',
    distanceKm: 45,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80'],
    pickupDate: '2026-11-17',
    status: 'active',
    enquiryCount: 5,
    farmLocation: {
      address: 'SF No. 89, Ketti Valley Road',
      village: 'Ketti',
      taluk: 'Coonoor Taluk',
      district: 'The Nilgiris',
      pincode: '643215',
      gps: '11.3654° N, 76.7324° E'
    }
  },
  {
    name: 'Ooty Country Carrot',
    nameTa: 'ஊட்டி நாட்டு கேரட்',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Hill Country Sweet Carrot',
    farmingMethod: 'Natural',
    pricePerKg: 42,
    quantityKg: 400,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Mettupalayam Hub',
    distanceKm: 42,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80'],
    pickupDate: '2026-11-18',
    status: 'active',
    enquiryCount: 1,
    farmLocation: {
      address: 'SF No. 12, Fern Hill Terraces',
      village: 'Ooty',
      taluk: 'Udhagamandalam',
      district: 'The Nilgiris',
      pincode: '643004',
      gps: '11.4064° N, 76.6932° E'
    }
  },
  {
    name: 'Sirumalai Hill Bananas',
    nameTa: 'சிறுமலை மலை வாழை',
    category: 'fruits',
    grade: 'Grade A',
    variety: 'Sirumalai Malai Pazham',
    farmingMethod: 'Natural',
    pricePerKg: 65,
    quantityKg: 600,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Dindigul Central Hub',
    distanceKm: 32,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80'],
    pickupDate: '2026-11-19',
    status: 'active',
    enquiryCount: 4,
    farmLocation: {
      address: 'Sirumalai Foothill Mandi',
      village: 'Sirumalai',
      taluk: 'Dindigul Taluk',
      district: 'Dindigul',
      pincode: '624003',
      gps: '10.1982° N, 77.9942° E'
    }
  },
  {
    name: 'Pollachi Tender Coconut',
    nameTa: 'பொள்ளாச்சி இளநீர்',
    category: 'plantation',
    grade: 'Grade A',
    variety: 'West Coast Tall Green',
    farmingMethod: 'Natural',
    pricePerKg: 35,
    quantityKg: 1200,
    unit: 'Pieces',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Pollachi Hub',
    distanceKm: 8,
    image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=600&auto=format&fit=crop&q=80'],
    pickupDate: '2026-11-20',
    status: 'active',
    enquiryCount: 6,
    farmLocation: {
      address: 'Anamalai Road, Pollachi',
      village: 'Pollachi',
      taluk: 'Pollachi Taluk',
      district: 'Coimbatore',
      pincode: '642001',
      gps: '10.6588° N, 77.0094° E'
    }
  }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/naam-uzhavar';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log('✓ Connected to MongoDB');

    // 1. Clear old collections across all 10 collections
    console.log('Clearing existing collections...');
    await Promise.all([
      Crop.deleteMany({}),
      Buyer.deleteMany({}),
      Farmer.deleteMany({}),
      Order.deleteMany({}),
      BuyerRequest.deleteMany({}),
      Message.deleteMany({}),
      Driver.deleteMany({}),
      Trip.deleteMany({}),
      DriverWalletTransaction.deleteMany({}),
      Invoice.deleteMany({})
    ]);
    console.log('✓ Cleaned all 10 collections');

    // 2. Insert Crops
    console.log(`Seeding ${SEED_CROPS.length} produce consignments...`);
    const insertedCrops = await Crop.insertMany(SEED_CROPS);
    console.log(`✓ Inserted ${insertedCrops.length} crops into 'crops' collection`);

    // 3. Create Demo Commercial Buyer
    console.log('Creating demo buyer account (demo@naamuzhavar.com)...');
    const salt = await bcrypt.genSalt(10);
    const hashedBuyerPassword = await bcrypt.hash('demo1234', salt);

    const demoBuyer = await Buyer.create({
      businessName: 'Grand Palace Luxury Dining',
      contactPerson: 'Mr. S. Rajesh (Procurement Head)',
      buyerType: 'hotel',
      email: 'demo@naamuzhavar.com',
      password: hashedBuyerPassword,
      phone: '+91 98401 23456',
      gstin: '33AAAAA0000A1Z5',
      address: 'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80'
    });
    console.log(`✓ Created demo buyer: ${demoBuyer.email}`);

    // 4. Create Demo Agricultural Farmer
    console.log('Creating demo farmer account (farmer@naamuzhavar.com)...');
    const hashedFarmerPassword = await bcrypt.hash('farmer1234', salt);

    const demoFarmer = await Farmer.create({
      farmerId: 'FMR-TN-2026-01',
      name: 'Ramesh Kumar',
      email: 'farmer@naamuzhavar.com',
      phone: '+91 94432 78190',
      password: hashedFarmerPassword,
      role: 'farmer',
      avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80',
      rating: 4.92,
      totalHarvests: 54,
      isVerified: true,
      farmDetails: {
        farmName: 'Green Valley Natural Farm',
        landOwnerName: 'Ramesh Kumar',
        landAddress: 'SF No. 142/2, Kinathukadavu Main Road',
        village: 'Pollachi',
        taluk: 'Pollachi Taluk',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642001',
        landArea: 4.5,
        landAreaUnit: 'Acres',
        gpsCoordinates: '10.6588° N, 77.0094° E'
      },
      residentialDetails: {
        address: 'SF No. 142/2, Kinathukadavu Main Road, Pollachi, Coimbatore - 642001',
        village: 'Pollachi',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642001',
        sameAsFarm: true
      },
      bankDetails: {
        accountHolderName: 'Ramesh Kumar',
        bankName: 'State Bank of India',
        accountNumber: '••••••••1034',
        ifscCode: 'SBIN0001248',
        branchName: 'Pollachi Agri-Commercial Branch',
        accountType: 'Savings'
      }
    });
    console.log(`✓ Created demo farmer: ${demoFarmer.email} (${demoFarmer.farmerId})`);

    // 5. Create Demo EV Logistics Driver
    console.log('Creating demo driver account (DRV-TN-2026-08)...');
    const demoDriver = await Driver.create({
      driverId: 'DRV-TN-2026-08',
      name: 'Kumar M.',
      tamilName: 'குமார் எம்.',
      phone: '+91 94432 11098',
      email: 'kumar.logistics@naamuzhavar.com',
      pin: '1234',
      password: '1234',
      role: 'driver',
      avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&auto=format&fit=crop&q=80',
      assignedHub: 'Dindigul Central Hub',
      operatingZone: 'Coimbatore - Dindigul - Madurai Corridor',
      dutyStatus: 'ON_DUTY',
      vehicle: {
        model: 'Tata Ace EV Cargo',
        vehicleNumber: 'TN 57 AB 1234',
        type: 'Zero-Emission EV Light Commercial Vehicle (LCV)',
        batteryCapacityKwh: 21.3,
        currentBatteryPct: 82,
        estimatedRangeKm: 68,
        maxPayloadKg: 600,
        healthPct: 98,
        chargingStatus: 'DISCHARGING'
      },
      license: {
        licenseNumber: 'TN-57-2020-008912',
        validUntil: '2028-09-30',
        verified: true,
        badge: 'Green Logistics Pro'
      },
      wallet: {
        balance: 4250,
        todayEarnings: 1424,
        totalWithdrawn: 0,
        upiId: 'kumar.logistics@okhdfcbank'
      },
      metrics: {
        rating: 4.92,
        totalDispatches: 148,
        onTimeRatePct: 99.1,
        totalDistanceKm: 4820,
        co2SavedKg: 1240
      }
    });
    console.log(`✓ Created demo driver: ${demoDriver.name} (${demoDriver.driverId})`);

    // 6. Create Buyer Requests
    console.log('Creating initial buyer requests...');
    await BuyerRequest.create([
      {
        requestId: 'REQ-2026-78192',
        crop: insertedCrops[0]._id,
        cropDetails: {
          name: insertedCrops[0].name,
          nameTa: insertedCrops[0].nameTa,
          grade: insertedCrops[0].grade,
          variety: insertedCrops[0].variety,
          image: insertedCrops[0].image,
          pricePerKg: insertedCrops[0].pricePerKg,
          hub: insertedCrops[0].hub
        },
        buyer: demoBuyer._id,
        buyerDetails: {
          businessName: demoBuyer.businessName,
          buyerType: demoBuyer.buyerType,
          contactPerson: demoBuyer.contactPerson,
          phone: demoBuyer.phone,
          address: demoBuyer.address
        },
        farmerId: demoFarmer.farmerId,
        quantity: 200,
        unit: 'Kg',
        offeredPrice: 28,
        totalEstimatedValue: 5600,
        preferredDeliveryDate: '2026-11-15',
        deliveryLocation: 'Grand Palace Luxury Dining Gate 1, Madurai',
        notes: 'Require freshly harvested table-grade tomatoes. Morning dispatch preferred.',
        status: 'PENDING'
      }
    ]);
    console.log('✓ Created sample buyer request in buyerrequests');

    // 7. Create Orders (Confirmed & Delivered)
    console.log('Creating initial orders...');
    const deliveredOrder = await Order.create({
      orderId: 'NU-2026-00088',
      buyer: demoBuyer._id,
      crop: insertedCrops[4]._id,
      cropDetails: {
        name: insertedCrops[4].name,
        nameTa: insertedCrops[4].nameTa,
        grade: insertedCrops[4].grade,
        image: insertedCrops[4].image,
        pricePerKg: insertedCrops[4].pricePerKg,
        farmerName: demoFarmer.name,
        hub: insertedCrops[4].hub
      },
      quantityKg: 300,
      totalPrice: 19500,
      orderStatus: 'CONFIRMED',
      deliveryStatus: 'DELIVERED',
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI (Instant Payout)',
      driver: {
        name: demoDriver.name,
        vehicle: `${demoDriver.vehicle.model} (${demoDriver.vehicle.vehicleNumber})`,
        phone: demoDriver.phone,
        deliveryPin: '8095'
      },
      deliveryAddress: demoBuyer.address,
      farmerId: demoFarmer.farmerId,
      notes: 'Delivered successfully at kitchen store.'
    });

    const activeOrder = await Order.create({
      orderId: 'NU-2026-04821',
      buyer: demoBuyer._id,
      crop: insertedCrops[2]._id,
      cropDetails: {
        name: insertedCrops[2].name,
        nameTa: insertedCrops[2].nameTa,
        grade: insertedCrops[2].grade,
        image: insertedCrops[2].image,
        pricePerKg: 38,
        farmerName: demoFarmer.name,
        hub: insertedCrops[2].hub
      },
      quantityKg: 500,
      totalPrice: 19000,
      orderStatus: 'CONFIRMED',
      deliveryStatus: 'READY_FOR_PICKUP',
      status: 'READY_FOR_PICKUP',
      paymentStatus: 'ESCROW_LOCKED',
      driver: {
        name: demoDriver.name,
        vehicle: `${demoDriver.vehicle.model} (${demoDriver.vehicle.vehicleNumber})`,
        phone: demoDriver.phone,
        deliveryPin: '4892'
      },
      deliveryAddress: demoBuyer.address,
      farmerId: demoFarmer.farmerId,
      notes: 'Bulk consignment for daily kitchen inventory.'
    });
    console.log('✓ Created initial orders in orders collection');

    // 8. Create Invoices
    console.log('Creating initial commercial invoices...');
    await Invoice.create({
      invoiceNumber: 'INV-2026-00088',
      orderId: deliveredOrder.orderId,
      order: deliveredOrder._id,
      buyer: demoBuyer._id,
      buyerName: demoBuyer.businessName,
      farmerId: demoFarmer.farmerId,
      cropName: deliveredOrder.cropDetails.name,
      tamilCropName: deliveredOrder.cropDetails.nameTa,
      grade: deliveredOrder.cropDetails.grade,
      quantityKg: deliveredOrder.quantityKg,
      unitPrice: 65,
      subtotal: 19500,
      taxAmount: 0,
      totalAmount: 19500,
      status: 'PAID',
      hub: deliveredOrder.cropDetails.hub,
      farmer: {
        name: demoFarmer.name,
        phone: demoFarmer.phone,
        location: demoFarmer.farmDetails.village + ', ' + demoFarmer.farmDetails.district
      },
      invoiceDate: new Date('2026-11-10')
    });
    console.log('✓ Created initial invoice in invoices collection');

    // 9. Create Driver Trips
    console.log('Creating initial driver trips...');
    await Trip.create({
      tripId: 'TRIP-2026-8095',
      driverId: demoDriver.driverId,
      orderId: activeOrder.orderId,
      requestId: 'REQ-2026-78192',
      status: 'READY_FOR_PICKUP',
      priority: 'HIGH',
      tripType: 'FARM_GATE_DIRECT',
      cropName: activeOrder.cropDetails.name,
      tamilCropName: activeOrder.cropDetails.nameTa,
      cropImage: activeOrder.cropDetails.image,
      quantityKg: activeOrder.quantityKg,
      cratesCount: 20,
      totalProduceValue: activeOrder.totalPrice,
      pickup: {
        farmName: demoFarmer.farmDetails.farmName,
        farmerName: demoFarmer.name,
        farmerPhone: demoFarmer.phone,
        address: demoFarmer.farmDetails.landAddress,
        village: demoFarmer.farmDetails.village,
        district: demoFarmer.farmDetails.district,
        pincode: demoFarmer.farmDetails.pincode,
        gps: demoFarmer.farmDetails.gpsCoordinates,
        timeSlot: 'Morning Harvest Dispatch (07:00 AM - 08:30 AM)'
      },
      dropoff: {
        buyerName: demoBuyer.businessName,
        contactPerson: demoBuyer.contactPerson,
        buyerPhone: demoBuyer.phone,
        address: demoBuyer.address,
        hub: 'Dindigul Central Hub',
        estimatedDropoffTime: '11:00 AM',
        deliveryPin: '4892'
      },
      distanceKm: 42,
      driverEarnings: 840,
      estimatedMinutes: 65,
      routeSummary: 'Pollachi -> Udumalaipettai -> Palani Road',
      crateChecklist: {
        totalCrates: 20,
        gradeACrates: 20,
        damagedCrates: 0,
        verifiedAtPickup: false
      }
    });
    console.log('✓ Created initial trip in trips collection');

    // 10. Create Driver Wallet Transactions
    console.log('Creating initial driver wallet transactions...');
    await DriverWalletTransaction.create({
      transactionId: 'TXN-WAL-2026-001',
      driverId: demoDriver.driverId,
      type: 'TRIP_PAYOUT',
      amount: 840,
      balanceAfter: 4250,
      tripId: 'TRIP-2026-8095',
      description: 'Dispatch payout for TRIP-2026-8095 (Farm gate to kitchen gate)',
      status: 'COMPLETED'
    });
    console.log('✓ Created initial driver wallet transaction in driverwallettransactions');

    // 11. Initial Chat Messages
    console.log('Creating initial thread messages...');
    await Message.create([
      {
        buyer: demoBuyer._id,
        sender: 'driver',
        text: 'Vanakkam sir, produce loaded at Pollachi Farm. EV cargo dispatched towards Madurai kitchen gate.'
      },
      {
        buyer: demoBuyer._id,
        sender: 'buyer',
        text: 'Received status update. Gate 1 security is notified for crate inspection.'
      }
    ]);
    console.log('✓ Created initial thread messages in messages collection');

    console.log('\n================================================================');
    console.log('🌱 Naam Uzhavar 10-Collection Database Seed Complete!');
    console.log('MongoDB URI:        mongodb://localhost:27017/naam-uzhavar');
    console.log('Buyer Login:        demo@naamuzhavar.com / demo1234');
    console.log('Farmer Login:       farmer@naamuzhavar.com / farmer1234');
    console.log('Driver Login:       DRV-TN-2026-08 / PIN: 1234');
    console.log('All 10 collections populated and ready for Compass inspection:');
    console.log('  1. buyers');
    console.log('  2. farmers');
    console.log('  3. crops');
    console.log('  4. orders');
    console.log('  5. buyerrequests');
    console.log('  6. invoices');
    console.log('  7. messages');
    console.log('  8. drivers');
    console.log('  9. trips');
    console.log('  10. driverwallettransactions');
    console.log('================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
