// seed.js - Database initialization script for Naam Uzhavar (Commercial Buyer & Farmer Module)
// Viva Note: Clears old test collections and seeds production-grade agricultural data
// including regional crops, demo buyer account, demo farmer account, requests, EV orders, and messages.
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
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1561136594-7f68413baa99?w=600&auto=format&fit=crop&q=80'
    ],
    pickupDate: '2026-11-03',
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
    pickupDate: '2026-11-04',
    status: 'active',
    enquiryCount: 2,
    farmLocation: {
      address: 'SF No. 142/2, Kinathukadavu Main Road',
      village: 'Pollachi',
      taluk: 'Pollachi Taluk',
      district: 'Coimbatore',
      pincode: '642001'
    }
  },
  {
    name: 'Batlagundu Potato',
    nameTa: 'பட்லகுண்டு உருளைக்கிழங்கு',
    category: 'tubers',
    grade: 'Grade A',
    variety: 'Kufri Jyoti Table',
    farmingMethod: 'Natural',
    pricePerKg: 32,
    quantityKg: 450,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Batlagundu Hub',
    distanceKm: 34,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80'],
    pickupDate: '2026-11-04',
    status: 'active',
    enquiryCount: 3,
    farmLocation: {
      address: 'SF No. 142/2, Kinathukadavu Main Road',
      village: 'Pollachi',
      taluk: 'Pollachi Taluk',
      district: 'Coimbatore',
      pincode: '642001'
    }
  },
  {
    name: 'Ooty Country Carrot',
    nameTa: 'ஊட்டி மலை கேரட்',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Kuroda Sweet',
    farmingMethod: 'Conventional',
    pricePerKg: 42,
    quantityKg: 300,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Mettupalayam Hub',
    distanceKm: 42,
    image: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1447175008436-054170c2e979?w=600&auto=format&fit=crop&q=80'],
    pickupDate: '2026-11-05',
    status: 'active',
    enquiryCount: 1,
    farmLocation: {
      address: 'SF No. 142/2, Kinathukadavu Main Road',
      village: 'Pollachi',
      taluk: 'Pollachi Taluk',
      district: 'Coimbatore',
      pincode: '642001'
    }
  }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/naam-uzhavar';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log('✓ Connected to MongoDB');

    // 1. Clear old data
    console.log('Clearing old collections...');
    await Promise.all([
      Crop.deleteMany({}),
      Buyer.deleteMany({}),
      Farmer.deleteMany({}),
      Order.deleteMany({}),
      BuyerRequest.deleteMany({}),
      Message.deleteMany({})
    ]);
    console.log('✓ Cleaned existing collections');

    // 2. Insert Crops
    console.log(`Seeding ${SEED_CROPS.length} produce consignments...`);
    const insertedCrops = await Crop.insertMany(SEED_CROPS);
    console.log(`✓ Inserted ${insertedCrops.length} crops`);

    // 3. Create Demo Commercial Buyer
    console.log('Creating demo buyer account (demo@naamuzhavar.com)...');
    const salt = await bcrypt.genSalt(10);
    const hashedBuyerPassword = await bcrypt.hash('demo1234', salt);

    const demoBuyer = await Buyer.create({
      businessName: 'Grand Palace Luxury Dining',
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
        address: '12/4, South Thottam Street, Kinathukadavu',
        village: 'Pollachi',
        taluk: 'Pollachi Taluk',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642001',
        sameAsFarm: false
      },
      bankDetails: {
        accountHolderName: 'Ramesh Kumar',
        bankName: 'State Bank of India',
        accountNumber: '30495821034',
        ifscCode: 'SBIN0001248',
        branchName: 'Pollachi Bazaar Branch',
        accountType: 'Savings'
      }
    });
    console.log(`✓ Created demo farmer: ${demoFarmer.email} (${demoFarmer.farmerId})`);

    // 5. Create Buyer Requests
    console.log('Creating sample buyer purchase requests...');
    const tomatoCrop = insertedCrops[0];
    const onionCrop = insertedCrops[1];

    await BuyerRequest.create([
      {
        requestId: 'REQ-2026-78192',
        crop: tomatoCrop._id,
        cropDetails: {
          name: tomatoCrop.name,
          nameTa: tomatoCrop.nameTa,
          category: tomatoCrop.category,
          variety: tomatoCrop.variety,
          grade: tomatoCrop.grade,
          image: tomatoCrop.image
        },
        buyer: demoBuyer._id,
        buyerDetails: {
          businessName: demoBuyer.businessName,
          contactPerson: 'M. Senthil Nathan',
          buyerType: 'Hotel & Commercial Kitchen',
          phone: demoBuyer.phone,
          email: demoBuyer.email,
          location: 'Coimbatore Commercial Hub',
          avatar: demoBuyer.avatar,
          verified: true
        },
        farmerId: demoFarmer.farmerId,
        farmerName: demoFarmer.name,
        quantity: 200,
        unit: 'Kg',
        offeredPrice: 28,
        totalEstimatedValue: 5600,
        preferredDeliveryDate: '2026-11-03',
        deliveryLocation: 'Sri Lakshmi Hotels Kitchen Gate 1, Gandhipuram, Coimbatore',
        notes: 'Require freshly harvested red table-grade tomatoes. Morning dispatch preferred.',
        status: 'PENDING'
      }
    ]);
    console.log('✓ Created sample buyer request');

    // 6. Create sample orders linked to buyer & farmer
    console.log('Creating initial demo orders...');
    await Order.create([
      {
        orderId: 'ORD-4821',
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
          name: 'Kumar M.',
          vehicle: 'Tata Ace EV Cargo (TN 57 AB 1234)',
          phone: '+91 94432 11098',
          deliveryPin: '4892'
        },
        deliveryAddress: demoBuyer.address,
        farmerId: demoFarmer.farmerId,
        notes: 'Bulk consignment for daily retail dispatch.'
      }
    ]);
    console.log('✓ Created sample order');

    // 7. Initial chat messages
    await Message.create([
      {
        buyer: demoBuyer._id,
        sender: 'driver',
        text: 'Good morning sir, produce picked from Dindigul Central. Expected arrival at Kitchen Gate 2 in 25 minutes.'
      }
    ]);
    console.log('✓ Created initial thread messages');

    console.log('\n======================================================');
    console.log('🌱 Naam Uzhavar Unified Database Seed Completed!');
    console.log('Buyer Credentials:   demo@naamuzhavar.com / demo1234');
    console.log('Farmer Credentials:  farmer@naamuzhavar.com / farmer1234');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Notice/Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
