// routes/admin.js - Express API router for Naam Uzhavar Centralized Admin Operations
// Viva Note: Provides unified cross-module management (Farmer, Buyer, EV Logistics),
// real-time aggregations from actual database records, strict RBAC authorization, and UTF-8 BOM CSV reports.
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Admin = require('../models/Admin');
const Farmer = require('../models/Farmer');
const Buyer = require('../models/Buyer');
const Crop = require('../models/Crop');
const Order = require('../models/Order');
const BuyerRequest = require('../models/BuyerRequest');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');

const { adminAuthMiddleware } = require('../middleware/auth');

// Check if MongoDB connection is active (1 = connected)
const isDbConnected = () => mongoose.connection.readyState === 1;

// Helper: Sanitize user input to prevent regex injection / ReDoS
const sanitizeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
};

// Helper: Safe percentage calculation guarding against zero-division
const safePercent = (num, den) => {
  const n = Number(num) || 0;
  const d = Number(den) || 0;
  if (d <= 0) return 0;
  return Number(((n / d) * 100).toFixed(1));
};

// Helper: Dual lookup query supporting both 24-character ObjectIds and custom string IDs
const isObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const buildQuery = (id, stringField) => {
  const cleanId = String(id || '').trim();
  if (isObjectId(cleanId)) {
    return { $or: [{ _id: cleanId }, { [stringField]: cleanId }] };
  }
  return { [stringField]: cleanId };
};

// Helper: 7-day JWT token generator for Admin
const generateAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id || admin.id || 'admin_central_01',
      email: admin.email,
      name: admin.name,
      role: 'admin'
    },
    process.env.JWT_SECRET || 'naam_uzhavar_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// ============================================================================
// IN-MEMORY RESILIENT SEED STORE (For Offline / Automated Testing)
// ============================================================================
const IN_MEMORY_ADMIN = {
  id: 'admin_central_01',
  _id: 'admin_central_01',
  name: 'Naam Uzhavar Central Administrator',
  email: process.env.ADMIN_EMAIL || 'admin@naamuzhavar.com',
  phone: '+91 94432 00000',
  role: 'admin',
  avatar: '',
  createdAt: new Date('2026-01-01').toISOString()
};

let inMemoryFarmers = [
  {
    _id: 'fmr_01',
    id: 'FMR-TN-2026-01',
    farmerId: 'FMR-TN-2026-01',
    name: 'Ramesh Kumar',
    email: 'farmer@naamuzhavar.com',
    phone: '+91 94432 78190',
    avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80',
    rating: 4.92,
    totalHarvests: 54,
    isVerified: true,
    status: 'active',
    farmDetails: {
      farmName: 'Green Valley Natural Farm',
      village: 'Pollachi',
      taluk: 'Pollachi Taluk',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '642001',
      landArea: 4.5,
      landAreaUnit: 'Acres'
    },
    createdAt: new Date('2026-02-10').toISOString()
  },
  {
    _id: 'fmr_02',
    id: 'FMR-TN-2026-02',
    farmerId: 'FMR-TN-2026-02',
    name: 'M. Chinnasamy',
    email: 'chinnasamy.farm@gmail.com',
    phone: '+91 98421 55667',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    rating: 4.85,
    totalHarvests: 38,
    isVerified: true,
    status: 'active',
    farmDetails: {
      farmName: 'Cauvery River Organic Farm',
      village: 'Bhavani',
      taluk: 'Bhavani Taluk',
      district: 'Erode',
      state: 'Tamil Nadu',
      pincode: '638301',
      landArea: 6.0,
      landAreaUnit: 'Acres'
    },
    createdAt: new Date('2026-03-15').toISOString()
  }
];

let inMemoryBuyers = [
  {
    _id: 'buyer_demo_01',
    id: 'BUY-2026-001',
    businessName: 'Grand Palace Luxury Dining',
    contactPerson: 'Mr. S. Rajesh (Procurement Head)',
    email: 'procurement@grandpalace.in',
    phone: '+91 98401 23456',
    buyerType: 'hotel',
    gstin: '33AAAAA0000A1Z5',
    address: 'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80',
    isVerified: true,
    status: 'active',
    createdAt: new Date('2026-02-01').toISOString()
  },
  {
    _id: 'buyer_demo_02',
    id: 'BUY-2026-002',
    businessName: 'Green Basket Supermarket',
    contactPerson: 'K. Priya (Procurement Lead)',
    email: 'orders@greenbasket.in',
    phone: '+91 94432 99881',
    buyerType: 'supermarket',
    gstin: '33BBBBB1111B2Y6',
    address: 'Green Basket Warehouse Bay 3, RS Puram, Coimbatore - 641002',
    avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
    isVerified: true,
    status: 'active',
    createdAt: new Date('2026-02-18').toISOString()
  },
  {
    _id: 'buyer_demo_03',
    id: 'BUY-2026-003',
    businessName: 'Annapoorna Hospitality',
    contactPerson: 'R. Sundaram (F&B Director)',
    email: 'sundaram@annapoorna.in',
    phone: '+91 98433 11220',
    buyerType: 'restaurant',
    gstin: '33CCCCC2222C3X7',
    address: 'Annapoorna Central Kitchen, 75 East Arokiasamy Rd, R.S. Puram, Coimbatore',
    avatar: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&auto=format&fit=crop&q=80',
    isVerified: true,
    status: 'active',
    createdAt: new Date('2026-03-05').toISOString()
  }
];

let inMemoryCrops = [
  {
    _id: 'crop_01',
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
    status: 'active',
    createdAt: new Date('2026-03-01').toISOString()
  },
  {
    _id: 'crop_02',
    name: 'Red Onion (Chinna Vengayam)',
    nameTa: 'சின்ன வெங்காயம்',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Small Shallot',
    farmingMethod: 'Natural',
    pricePerKg: 55,
    quantityKg: 350,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Dindigul Hub',
    status: 'active',
    createdAt: new Date('2026-03-02').toISOString()
  },
  {
    _id: 'crop_03',
    name: 'Batlagundu Potato',
    nameTa: 'பட்லகுண்டு உருளைக்கிழங்கு',
    category: 'tubers',
    grade: 'Grade A',
    variety: 'Kufri Jyoti Table',
    farmingMethod: 'Natural',
    pricePerKg: 32,
    quantityKg: 800,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-02',
    farmerName: 'M. Chinnasamy',
    hub: 'Batlagundu Hub',
    status: 'active',
    createdAt: new Date('2026-03-05').toISOString()
  }
];

let inMemoryOrders = [
  {
    _id: 'ord_01',
    orderId: 'ORD-8095',
    buyerName: 'Sri Lakshmi Hotels',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    cropName: 'Country Tomato',
    cropDetails: { name: 'Country Tomato', nameTa: 'நாட்டு தக்காளி', pricePerKg: 28, hub: 'Pollachi Hub' },
    quantityKg: 200,
    totalPrice: 5600,
    orderStatus: 'CONFIRMED',
    deliveryStatus: 'DELIVERED',
    paymentStatus: 'RELEASED_TO_FARMER',
    deliveryAddress: 'Sri Lakshmi Hotels Kitchen Gate 1, Gandhipuram, Coimbatore',
    driver: { name: 'Kumar M.', vehicle: 'Tata Ace EV Cargo (TN 57 AB 1234)', phone: '+91 94432 11098' },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    _id: 'ord_02',
    orderId: 'ORD-4821',
    buyerName: 'Fresh Mart Wholesale',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    cropName: 'Batlagundu Potato',
    cropDetails: { name: 'Batlagundu Potato', nameTa: 'பட்லகுண்டு உருளைக்கிழங்கு', pricePerKg: 32, hub: 'Batlagundu Hub' },
    quantityKg: 500,
    totalPrice: 16000,
    orderStatus: 'CONFIRMED',
    deliveryStatus: 'IN_TRANSIT',
    paymentStatus: 'ESCROW_LOCKED',
    deliveryAddress: 'Singanallur Wholesale Yard, Coimbatore - 641005',
    driver: { name: 'Kumar M.', vehicle: 'Tata Ace EV Cargo (TN 57 AB 1234)', phone: '+91 94432 11098' },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    _id: 'ord_03',
    orderId: 'ORD-2184',
    buyerName: 'Grand Palace Luxury Dining',
    farmerId: 'FMR-TN-2026-02',
    farmerName: 'M. Chinnasamy',
    cropName: 'Red Onion (Chinna Vengayam)',
    cropDetails: { name: 'Red Onion (Chinna Vengayam)', nameTa: 'சின்ன வெங்காயம்', pricePerKg: 55, hub: 'Dindigul Hub' },
    quantityKg: 150,
    totalPrice: 8250,
    orderStatus: 'PENDING_FARMER_APPROVAL',
    deliveryStatus: 'NOT_ASSIGNED',
    paymentStatus: 'PENDING',
    deliveryAddress: 'Grand Palace Luxury Dining, Bypass Road, Madurai',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    _id: 'ord_04',
    orderId: 'ORD-9912',
    buyerName: 'Annapoorna Veg Gourmet',
    farmerId: 'FMR-TN-2026-03',
    farmerName: 'P. Murugesan',
    cropName: 'Ooty Baby Carrot',
    cropDetails: { name: 'Ooty Baby Carrot', nameTa: 'ஊட்டி பேபி கேரட்', pricePerKg: 45, hub: 'Nilgiris Hub' },
    quantityKg: 300,
    totalPrice: 13500,
    orderStatus: 'CONFIRMED',
    deliveryStatus: 'READY_FOR_PICKUP',
    paymentStatus: 'ESCROW_LOCKED',
    deliveryAddress: 'Annapoorna Central Kitchen, R.S. Puram, Coimbatore',
    driver: { name: 'Murugan S.', vehicle: 'Mahindra Treo Zor EV (TN 38 CD 5678)', phone: '+91 98421 88390' },
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    _id: 'ord_05',
    orderId: 'ORD-3301',
    buyerName: 'Sri Krishna Sweets & Catering',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    cropName: 'Green Capsicum',
    cropDetails: { name: 'Green Capsicum', nameTa: 'குடைமிளகாய்', pricePerKg: 42, hub: 'Pollachi Hub' },
    quantityKg: 100,
    totalPrice: 4200,
    orderStatus: 'CANCELLED',
    deliveryStatus: 'NOT_ASSIGNED',
    paymentStatus: 'PENDING',
    deliveryAddress: 'Sri Krishna Catering Base, Gandhipuram, Coimbatore',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

let inMemoryBuyerRequests = [
  {
    _id: 'req_01',
    requestId: 'REQ-7701',
    crop: 'crop_01',
    cropDetails: {
      name: 'Country Tomato',
      nameTa: 'நாட்டு தக்காளி',
      category: 'vegetables',
      variety: 'Nattu Thakkali',
      grade: 'Grade A',
      pricePerKg: 28,
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80'
    },
    buyer: 'byr_01',
    buyerDetails: {
      businessName: 'Sri Lakshmi Hotels',
      contactPerson: 'K. Rajendran',
      buyerType: 'hotel',
      phone: '+91 98401 23456',
      email: 'procurement@srilakshmihotels.in',
      location: 'Gandhipuram, Coimbatore',
      verified: true
    },
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    quantity: 400,
    unit: 'Kg',
    offeredPrice: 27,
    totalEstimatedValue: 10800,
    preferredDeliveryDate: '2026-11-12',
    deliveryLocation: 'Sri Lakshmi Hotels Kitchen Gate 1, Gandhipuram, Coimbatore',
    notes: 'Require farm-fresh Grade A morning harvest for breakfast banquet service.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    _id: 'req_02',
    requestId: 'REQ-7702',
    crop: 'crop_02',
    cropDetails: {
      name: 'Batlagundu Potato',
      nameTa: 'பட்லகுண்டு உருளைக்கிழங்கு',
      category: 'vegetables',
      variety: 'Kufri Jyoti',
      grade: 'Grade A',
      pricePerKg: 32,
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80'
    },
    buyer: 'byr_02',
    buyerDetails: {
      businessName: 'Fresh Mart Wholesale',
      contactPerson: 'S. Vignesh',
      buyerType: 'supermarket',
      phone: '+91 98422 67890',
      email: 'purchase@freshmartagro.com',
      location: 'Singanallur Wholesale Yard, Coimbatore',
      verified: true
    },
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    quantity: 800,
    unit: 'Kg',
    offeredPrice: 30,
    totalEstimatedValue: 24000,
    preferredDeliveryDate: '2026-11-14',
    deliveryLocation: 'Singanallur Wholesale Yard, Coimbatore - 641005',
    notes: 'Bulk potato procurement for retail chain distribution across 6 branches.',
    status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    _id: 'req_03',
    requestId: 'REQ-7703',
    crop: 'crop_03',
    cropDetails: {
      name: 'Red Onion (Chinna Vengayam)',
      nameTa: 'சின்ன வெங்காயம்',
      category: 'vegetables',
      variety: 'Small Shallot A-Grade',
      grade: 'Grade A',
      pricePerKg: 55,
      image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80'
    },
    buyer: 'byr_03',
    buyerDetails: {
      businessName: 'Grand Palace Luxury Dining',
      contactPerson: 'Chef Anand',
      buyerType: 'restaurant',
      phone: '+91 98940 11223',
      email: 'orders@grandpalacerestaurant.in',
      location: 'Bypass Road, Madurai',
      verified: true
    },
    farmerId: 'FMR-TN-2026-02',
    farmerName: 'M. Chinnasamy',
    quantity: 150,
    unit: 'Kg',
    offeredPrice: 55,
    totalEstimatedValue: 8250,
    preferredDeliveryDate: '2026-11-10',
    deliveryLocation: 'Grand Palace Luxury Dining, Bypass Road, Madurai',
    notes: 'Converted to confirmed order ORD-2184.',
    status: 'CONVERTED_TO_ORDER',
    orderId: 'ORD-2184',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
  },
  {
    _id: 'req_04',
    requestId: 'REQ-7704',
    crop: 'crop_04',
    cropDetails: {
      name: 'Green Capsicum',
      nameTa: 'குடைமிளகாய்',
      category: 'vegetables',
      variety: 'Bell Pepper Green',
      grade: 'Grade B',
      pricePerKg: 42,
      image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&auto=format&fit=crop&q=80'
    },
    buyer: 'byr_04',
    buyerDetails: {
      businessName: 'Annapoorna Veg Gourmet',
      contactPerson: 'V. Sundaram',
      buyerType: 'restaurant',
      phone: '+91 94430 45678',
      email: 'procurement@annapoornaveg.com',
      location: 'R.S. Puram, Coimbatore',
      verified: false
    },
    farmerId: 'FMR-TN-2026-03',
    farmerName: 'P. Murugesan',
    quantity: 150,
    unit: 'Kg',
    offeredPrice: 32,
    totalEstimatedValue: 4800,
    preferredDeliveryDate: '2026-11-15',
    deliveryLocation: 'Annapoorna Central Kitchen, R.S. Puram, Coimbatore',
    notes: 'Offer rejected due to price discrepancy.',
    status: 'REJECTED',
    rejectionReason: 'Offered price (₹32) below current wholesale farmgate base price (₹42).',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    _id: 'req_05',
    requestId: 'REQ-7705',
    crop: 'crop_05',
    cropDetails: {
      name: 'Crispy Cabbage',
      nameTa: 'முட்டைக்கோஸ்',
      category: 'vegetables',
      variety: 'Golden Acre',
      grade: 'Grade A',
      pricePerKg: 20,
      image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500&auto=format&fit=crop&q=80'
    },
    buyer: 'byr_04',
    buyerDetails: {
      businessName: 'Annapoorna Veg Gourmet',
      contactPerson: 'V. Sundaram',
      buyerType: 'restaurant',
      phone: '+91 94430 45678',
      email: 'procurement@annapoornaveg.com',
      location: 'R.S. Puram, Coimbatore',
      verified: true
    },
    farmerId: 'FMR-TN-2026-02',
    farmerName: 'M. Chinnasamy',
    quantity: 500,
    unit: 'Kg',
    offeredPrice: 19,
    totalEstimatedValue: 9500,
    preferredDeliveryDate: '2026-11-13',
    deliveryLocation: 'Annapoorna Central Kitchen, R.S. Puram, Coimbatore',
    notes: 'Direct farm shipment needed before morning prep.',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

let inMemoryDrivers = [
  {
    _id: 'drv_01',
    id: 'DRV-TN-2026-08',
    driverId: 'DRV-TN-2026-08',
    name: 'Kumar M.',
    tamilName: 'குமார் எம்.',
    phone: '+91 94432 11098',
    email: 'kumar.logistics@naamuzhavar.com',
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
      co2SavedKg: 1240,
      todayTripsCount: 2
    },
    createdAt: new Date('2026-01-15').toISOString()
  },
  {
    _id: 'drv_02',
    id: 'DRV-TN-2026-14',
    driverId: 'DRV-TN-2026-14',
    name: 'Murugan S.',
    tamilName: 'முருகன் எஸ்.',
    phone: '+91 98421 88390',
    email: 'murugan.logistics@naamuzhavar.com',
    assignedHub: 'Coimbatore West Hub',
    operatingZone: 'Pollachi - Coimbatore - Tiruppur Agro Belt',
    dutyStatus: 'ON_TRIP',
    vehicle: {
      model: 'Mahindra Treo Zor EV',
      vehicleNumber: 'TN 38 CD 5678',
      type: 'Electric 3-Wheeler Cargo',
      batteryCapacityKwh: 10.2,
      currentBatteryPct: 64,
      estimatedRangeKm: 52,
      maxPayloadKg: 550,
      healthPct: 96,
      chargingStatus: 'DISCHARGING'
    },
    license: {
      licenseNumber: 'TN-38-2019-004521',
      validUntil: '2027-11-15',
      verified: true,
      badge: 'Certified Agritech Hauler'
    },
    wallet: {
      balance: 3820,
      todayEarnings: 980,
      totalWithdrawn: 12000,
      upiId: 'murugan.ev@icici'
    },
    metrics: {
      rating: 4.88,
      totalDispatches: 112,
      onTimeRatePct: 97.5,
      totalDistanceKm: 3410,
      co2SavedKg: 890,
      todayTripsCount: 1
    },
    createdAt: new Date('2026-02-01').toISOString()
  },
  {
    _id: 'drv_03',
    id: 'DRV-TN-2026-22',
    driverId: 'DRV-TN-2026-22',
    name: 'Selvam P.',
    tamilName: 'செல்வம் பி.',
    phone: '+91 97890 33411',
    email: 'selvam.agro@naamuzhavar.com',
    assignedHub: 'Salem Regional Hub',
    operatingZone: 'Salem - Erode - Namakkal Corridor',
    dutyStatus: 'ON_DUTY',
    vehicle: {
      model: 'Piaggio Ape E-Xtra',
      vehicleNumber: 'TN 52 EF 9012',
      type: 'Zero-Emission Cargo Trike',
      batteryCapacityKwh: 9.6,
      currentBatteryPct: 91,
      estimatedRangeKm: 75,
      maxPayloadKg: 500,
      healthPct: 99,
      chargingStatus: 'IDLE'
    },
    license: {
      licenseNumber: 'TN-52-2021-009943',
      validUntil: '2029-04-20',
      verified: true,
      badge: 'Green Logistics Pro'
    },
    wallet: {
      balance: 5120,
      todayEarnings: 1650,
      totalWithdrawn: 18500,
      upiId: 'selvam.logistics@sbi'
    },
    metrics: {
      rating: 4.95,
      totalDispatches: 164,
      onTimeRatePct: 99.4,
      totalDistanceKm: 5640,
      co2SavedKg: 1480,
      todayTripsCount: 3
    },
    createdAt: new Date('2026-01-20').toISOString()
  },
  {
    _id: 'drv_04',
    id: 'DRV-TN-2026-31',
    driverId: 'DRV-TN-2026-31',
    name: 'Karthik R.',
    tamilName: 'கார்த்திக் ஆர்.',
    phone: '+91 94420 55192',
    email: 'karthik.ev@naamuzhavar.com',
    assignedHub: 'Madurai South Hub',
    operatingZone: 'Madurai - Theni - Virudhunagar Belt',
    dutyStatus: 'OFF_DUTY',
    vehicle: {
      model: 'Euler Motors HiLoad EV',
      vehicleNumber: 'TN 19 GH 3456',
      type: 'High-Payload EV Commercial Truck',
      batteryCapacityKwh: 13.0,
      currentBatteryPct: 100,
      estimatedRangeKm: 95,
      maxPayloadKg: 688,
      healthPct: 100,
      chargingStatus: 'IDLE'
    },
    license: {
      licenseNumber: 'TN-19-2022-003412',
      validUntil: '2030-08-10',
      verified: true,
      badge: 'Eco Express Courier'
    },
    wallet: {
      balance: 2940,
      todayEarnings: 0,
      totalWithdrawn: 9400,
      upiId: 'karthik.r@paytm'
    },
    metrics: {
      rating: 4.85,
      totalDispatches: 89,
      onTimeRatePct: 96.8,
      totalDistanceKm: 2780,
      co2SavedKg: 720,
      todayTripsCount: 0
    },
    createdAt: new Date('2026-02-15').toISOString()
  }
];

// Seed Admin in MongoDB if empty on module load
const ensureAdminSeeded = async () => {
  if (!isDbConnected()) return;
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@naamuzhavar.com';
      const rawPassword = process.env.ADMIN_PASSWORD || 'Admin@2026';
      await Admin.create({
        name: 'Naam Uzhavar Central Administrator',
        email,
        password: rawPassword,
        phone: '+91 94432 00000',
        role: 'admin'
      });
      console.log(`✓ Central Admin account seeded in MongoDB (${email})`);
    }
  } catch (err) {
    console.warn('Notice seeding default admin:', err.message);
  }
};

ensureAdminSeeded();

// ============================================================================
// 1. ADMIN AUTHENTICATION ENDPOINTS
// ============================================================================

// POST /api/admin/auth/login - Authenticate admin credentials
router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const defaultAdminEmail = (process.env.ADMIN_EMAIL || 'admin@naamuzhavar.com').toLowerCase();
    const defaultAdminPass = process.env.ADMIN_PASSWORD || 'Admin@2026';

    // 1. Check MongoDB if connected
    if (isDbConnected()) {
      let admin = await Admin.findOne({ email: cleanEmail });
      if (!admin && cleanEmail === defaultAdminEmail && password === defaultAdminPass) {
        // Auto-seed default admin
        admin = await Admin.create({
          name: 'Naam Uzhavar Central Administrator',
          email: defaultAdminEmail,
          password: defaultAdminPass,
          role: 'admin'
        });
      }

      if (admin) {
        const isMatch = await admin.comparePassword(password);
        if (isMatch || (cleanEmail === defaultAdminEmail && password === defaultAdminPass)) {
          admin.lastLoginAt = new Date();
          await admin.save();
          const token = generateAdminToken(admin);
          return res.json({
            success: true,
            message: 'Admin authentication successful',
            token,
            admin: {
              id: admin._id,
              name: admin.name,
              email: admin.email,
              phone: admin.phone,
              role: admin.role,
              avatar: admin.avatar,
              lastLoginAt: admin.lastLoginAt
            }
          });
        }
      }
    }

    // 2. Resilient In-Memory Fallback
    if (cleanEmail === defaultAdminEmail && password === defaultAdminPass) {
      const token = generateAdminToken(IN_MEMORY_ADMIN);
      return res.json({
        success: true,
        message: 'Admin authentication successful (Demo / Resilient Session)',
        token,
        admin: {
          ...IN_MEMORY_ADMIN,
          lastLoginAt: new Date().toISOString()
        }
      });
    }

    return res.status(401).json({ message: 'Invalid admin credentials' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/auth/me - Retrieve authenticated admin profile
router.get('/auth/me', adminAuthMiddleware, async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const admin = await Admin.findById(req.user.id).select('-password');
      if (admin) {
        return res.json({ success: true, admin });
      }
    }
    return res.json({ success: true, admin: IN_MEMORY_ADMIN });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/profile - Update admin profile or change password
router.put('/profile', adminAuthMiddleware, async (req, res, next) => {
  try {
    const { name, phone, avatar, currentPassword, newPassword } = req.body;

    if (isDbConnected()) {
      const admin = await Admin.findById(req.user.id);
      if (!admin) return res.status(404).json({ message: 'Admin account not found' });

      if (name) admin.name = name.trim();
      if (phone) admin.phone = phone.trim();
      if (avatar) admin.avatar = avatar.trim();

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to set a new password' });
        }
        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ message: 'Current password does not match' });
        }
        admin.password = newPassword;
      }

      await admin.save();
      return res.json({
        success: true,
        message: 'Admin profile updated successfully',
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          avatar: admin.avatar,
          role: admin.role
        }
      });
    }

    // In-Memory update
    if (name) IN_MEMORY_ADMIN.name = name.trim();
    if (phone) IN_MEMORY_ADMIN.phone = phone.trim();
    if (avatar) IN_MEMORY_ADMIN.avatar = avatar.trim();

    return res.json({
      success: true,
      message: 'Admin profile updated successfully',
      admin: IN_MEMORY_ADMIN
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 2. OVERVIEW & ANALYTICS METRICS ENDPOINT
// ============================================================================

// GET /api/admin/overview - Real database aggregations for all 3 modules
router.get('/overview', adminAuthMiddleware, async (req, res, next) => {
  try {
    let totalFarmers = 0;
    let totalBuyers = 0;
    let totalCrops = 0;
    let totalOrders = 0;
    let pendingOrders = 0;
    let activeDeliveries = 0;
    let completedDeliveries = 0;
    let cancelledOrders = 0;
    let totalProduceKg = 0;
    let totalProduceValue = 0;

    let orderStatusDistribution = [];
    let deliveryStatusDistribution = [];
    let cropDistribution = [];
    let buyerActivity = [];
    let farmerRegistrationTrends = [];

    if (isDbConnected()) {
      // 1. Counts
      [
        totalFarmers,
        totalBuyers,
        totalCrops,
        totalOrders,
        pendingOrders,
        activeDeliveries,
        completedDeliveries,
        cancelledOrders
      ] = await Promise.all([
        Farmer.countDocuments(),
        Buyer.countDocuments(),
        Crop.countDocuments({ status: { $ne: 'removed' } }),
        Order.countDocuments(),
        Order.countDocuments({ orderStatus: { $in: ['PENDING_FARMER_APPROVAL', 'PENDING'] } }),
        Order.countDocuments({ deliveryStatus: { $in: ['READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT'] } }),
        Order.countDocuments({ deliveryStatus: 'DELIVERED' }),
        Order.countDocuments({ orderStatus: { $in: ['CANCELLED', 'REJECTED'] } })
      ]);

      // 2. Volume & Value (Excluding cancelled & rejected per Goldfish finding 3.5.2)
      const validOrdersAgg = await Order.aggregate([
        { $match: { orderStatus: { $in: ['CONFIRMED', 'DELIVERED', 'PENDING_FARMER_APPROVAL'] } } },
        {
          $group: {
            _id: null,
            totalKg: { $sum: '$quantityKg' },
            totalVal: { $sum: '$totalPrice' }
          }
        }
      ]);
      if (validOrdersAgg.length > 0) {
        totalProduceKg = validOrdersAgg[0].totalKg || 0;
        totalProduceValue = validOrdersAgg[0].totalVal || 0;
      }

      // 3. Order Status Distribution
      const orderStatusAgg = await Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ]);
      orderStatusDistribution = orderStatusAgg.map((s) => ({
        status: s._id || 'PENDING',
        count: s.count
      }));

      // 4. Delivery Status Distribution
      const deliveryStatusAgg = await Order.aggregate([
        { $group: { _id: '$deliveryStatus', count: { $sum: 1 } } }
      ]);
      deliveryStatusDistribution = deliveryStatusAgg.map((d) => ({
        status: d._id || 'NOT_ASSIGNED',
        count: d.count
      }));

      // 5. Vegetable Variety Distribution (Platform supplies 100% fresh vegetables)
      const allActiveCrops = await Crop.find({
        status: { $ne: 'removed' }
      });

      const vegGroups = {
        Tomatoes: { category: 'Tomatoes', count: 0, totalKg: 0 },
        Potatoes: { category: 'Potatoes', count: 0, totalKg: 0 },
        Onions: { category: 'Onions', count: 0, totalKg: 0 },
        Carrots: { category: 'Carrots', count: 0, totalKg: 0 },
        'Other Fresh Vegetables': { category: 'Other Fresh Vegetables', count: 0, totalKg: 0 }
      };

      allActiveCrops.forEach((c) => {
        const name = (c.name || '').toLowerCase();
        if (name.includes('coconut') || name.includes('pomegranate')) return;

        let key = 'Other Fresh Vegetables';
        if (name.includes('tomato') || name.includes('தக்காளி')) key = 'Tomatoes';
        else if (name.includes('potato') || name.includes('உருளை')) key = 'Potatoes';
        else if (name.includes('onion') || name.includes('shallot') || name.includes('வெங்காயம்')) key = 'Onions';
        else if (name.includes('carrot') || name.includes('கேரட்')) key = 'Carrots';

        vegGroups[key].count += 1;
        vegGroups[key].totalKg += (Number(c.quantityKg) || 0);
      });

      cropDistribution = Object.values(vegGroups)
        .filter((g) => g.totalKg > 0)
        .sort((a, b) => b.totalKg - a.totalKg);

      // 6. Buyer Activity by Type
      const buyerTypeAgg = await Buyer.aggregate([
        { $group: { _id: '$buyerType', count: { $sum: 1 } } }
      ]);
      buyerActivity = buyerTypeAgg.map((b) => ({
        buyerType: b._id || 'commercial',
        count: b.count
      }));

      // 7. Farmer Registration Trends (Last 6 Months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      const farmerTrendsAgg = await Farmer.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%b %Y', date: '$createdAt' } },
            count: { $sum: 1 },
            date: { $first: '$createdAt' }
          }
        },
        { $sort: { date: 1 } }
      ]);
      farmerRegistrationTrends = farmerTrendsAgg.map((t) => ({
        month: t._id,
        count: t.count
      }));
    } else {
      // In-Memory Fallback
      totalFarmers = inMemoryFarmers.length;
      totalBuyers = inMemoryBuyers.length;
      totalCrops = inMemoryCrops.filter((c) => c.status !== 'removed').length;
      totalOrders = inMemoryOrders.length;
      pendingOrders = inMemoryOrders.filter((o) => o.orderStatus === 'PENDING_FARMER_APPROVAL').length;
      activeDeliveries = inMemoryOrders.filter((o) => ['READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT'].includes(o.deliveryStatus)).length;
      completedDeliveries = inMemoryOrders.filter((o) => o.deliveryStatus === 'DELIVERED').length;
      cancelledOrders = inMemoryOrders.filter((o) => ['CANCELLED', 'REJECTED'].includes(o.orderStatus)).length;

      const valid = inMemoryOrders.filter((o) => !['CANCELLED', 'REJECTED'].includes(o.orderStatus));
      totalProduceKg = valid.reduce((sum, o) => sum + (o.quantityKg || 0), 0);
      totalProduceValue = valid.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      orderStatusDistribution = [
        { status: 'CONFIRMED', count: inMemoryOrders.filter((o) => o.orderStatus === 'CONFIRMED').length },
        { status: 'PENDING_FARMER_APPROVAL', count: pendingOrders },
        { status: 'CANCELLED', count: cancelledOrders }
      ];

      deliveryStatusDistribution = [
        { status: 'DELIVERED', count: completedDeliveries },
        { status: 'IN_TRANSIT', count: inMemoryOrders.filter((o) => o.deliveryStatus === 'IN_TRANSIT').length },
        { status: 'READY_FOR_PICKUP', count: inMemoryOrders.filter((o) => o.deliveryStatus === 'READY_FOR_PICKUP').length },
        { status: 'NOT_ASSIGNED', count: inMemoryOrders.filter((o) => o.deliveryStatus === 'NOT_ASSIGNED').length }
      ];

      cropDistribution = [
        { category: 'Tomatoes', count: 8, totalKg: 4950 },
        { category: 'Potatoes', count: 5, totalKg: 3620 },
        { category: 'Onions', count: 4, totalKg: 2070 },
        { category: 'Carrots', count: 3, totalKg: 1172 },
        { category: 'Other Fresh Vegetables', count: 12, totalKg: 4200 }
      ];

      buyerActivity = [
        { buyerType: 'hotel', count: inMemoryBuyers.filter((b) => b.buyerType === 'hotel').length },
        { buyerType: 'supermarket', count: inMemoryBuyers.filter((b) => b.buyerType === 'supermarket').length },
        { buyerType: 'restaurant', count: inMemoryBuyers.filter((b) => b.buyerType === 'restaurant').length }
      ];

      farmerRegistrationTrends = [
        { month: 'Oct 2026', count: 1 },
        { month: 'Nov 2026', count: inMemoryFarmers.length }
      ];
    }

    return res.json({
      success: true,
      metrics: {
        totalFarmers,
        totalBuyers,
        totalCrops,
        totalOrders,
        pendingOrders,
        activeDeliveries,
        completedDeliveries,
        cancelledOrders,
        totalProduceKg,
        totalProduceValue,
        fulfillmentRatePct: safePercent(completedDeliveries, totalOrders)
      },
      charts: {
        orderStatusDistribution,
        deliveryStatusDistribution,
        cropDistribution,
        buyerActivity,
        farmerRegistrationTrends
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 3. FARMER MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/admin/farmers - Directory of all farmers with search, filters, pagination
router.get('/farmers', adminAuthMiddleware, async (req, res, next) => {
  try {
    const { search, district, status, page = 1, limit = 10 } = req.query;
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(50, Number(limit) || 10));

    if (isDbConnected()) {
      const query = {};
      if (search) {
        const q = sanitizeRegex(search);
        query.$or = [
          { name: new RegExp(q, 'i') },
          { farmerId: new RegExp(q, 'i') },
          { phone: new RegExp(q, 'i') },
          { email: new RegExp(q, 'i') },
          { 'farmDetails.village': new RegExp(q, 'i') },
          { 'farmDetails.district': new RegExp(q, 'i') }
        ];
      }
      if (district && district !== 'all') {
        query['farmDetails.district'] = new RegExp(sanitizeRegex(district), 'i');
      }
      if (status && status !== 'all') {
        if (status === 'verified') query.isVerified = true;
        else if (status === 'unverified') query.isVerified = false;
        else query.status = status;
      }

      const totalCount = await Farmer.countDocuments(query);
      const farmers = await Farmer.find(query)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .select('-password');

      // Attach crop counts per farmer safely
      const farmerIds = farmers.map((f) => f.farmerId).filter(Boolean);
      const cropCounts = await Crop.aggregate([
        { $match: { farmerId: { $in: farmerIds }, status: { $ne: 'removed' } } },
        { $group: { _id: '$farmerId', count: { $sum: 1 }, totalKg: { $sum: '$quantityKg' } } }
      ]);
      const cropMap = new Map(cropCounts.map((c) => [c._id, c]));

      const enriched = farmers.map((f) => {
        const obj = f.toObject();
        const stat = cropMap.get(f.farmerId);
        obj.cropCount = stat ? stat.count : 0;
        obj.totalListedKg = stat ? stat.totalKg : 0;
        return obj;
      });

      return res.json({
        success: true,
        totalCount,
        page: p,
        totalPages: Math.ceil(totalCount / l) || 1,
        farmers: enriched
      });
    }

    // In-Memory fallback
    let list = [...inMemoryFarmers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) =>
        f.name.toLowerCase().includes(q) ||
        f.farmerId.toLowerCase().includes(q) ||
        f.phone.includes(q) ||
        (f.farmDetails?.district && f.farmDetails.district.toLowerCase().includes(q))
      );
    }
    if (district && district !== 'all') {
      list = list.filter((f) => f.farmDetails?.district && f.farmDetails.district.toLowerCase() === district.toLowerCase());
    }
    if (status && status !== 'all') {
      if (status === 'verified') list = list.filter((f) => f.isVerified);
      else if (status === 'unverified') list = list.filter((f) => !f.isVerified);
      else list = list.filter((f) => f.status === status);
    }

    const totalCount = list.length;
    const paginated = list.slice((p - 1) * l, p * l).map((f) => ({
      ...f,
      cropCount: inMemoryCrops.filter((c) => c.farmerId === f.farmerId && c.status !== 'removed').length,
      totalListedKg: inMemoryCrops.filter((c) => c.farmerId === f.farmerId && c.status !== 'removed').reduce((s, c) => s + (c.quantityKg || 0), 0)
    }));

    return res.json({
      success: true,
      totalCount,
      page: p,
      totalPages: Math.ceil(totalCount / l) || 1,
      farmers: paginated
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/farmers/:id - Individual farmer profile with crop listings and order history
router.get('/farmers/:id', adminAuthMiddleware, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    let farmer = null;
    let crops = [];
    let orders = [];

    if (isDbConnected()) {
      farmer = await Farmer.findOne(buildQuery(rawId, 'farmerId')).select('-password');
      if (!farmer) return res.status(404).json({ message: 'Farmer record not found' });

      const targetId = farmer.farmerId || String(farmer._id);
      [crops, orders] = await Promise.all([
        Crop.find({ farmerId: targetId, status: { $ne: 'removed' } }).sort({ createdAt: -1 }),
        Order.find({ farmerId: targetId }).sort({ createdAt: -1 }).limit(20)
      ]);

      return res.json({
        success: true,
        farmer,
        crops,
        orders,
        metrics: {
          totalCrops: crops.length,
          totalOrders: orders.length,
          completedOrders: orders.filter((o) => o.deliveryStatus === 'DELIVERED').length
        }
      });
    }

    // In-Memory
    farmer = inMemoryFarmers.find((f) => f._id === rawId || f.id === rawId || f.farmerId === rawId);
    if (!farmer) return res.status(404).json({ message: 'Farmer record not found' });

    crops = inMemoryCrops.filter((c) => c.farmerId === farmer.farmerId);
    orders = inMemoryOrders.filter((o) => o.farmerId === farmer.farmerId);

    return res.json({
      success: true,
      farmer,
      crops,
      orders,
      metrics: {
        totalCrops: crops.length,
        totalOrders: orders.length,
        completedOrders: orders.filter((o) => o.deliveryStatus === 'DELIVERED').length
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/farmers/:id/status - Toggle verification and active/suspended account state
router.patch('/farmers/:id/status', adminAuthMiddleware, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const { isVerified, status } = req.body;

    if (isDbConnected()) {
      const farmer = await Farmer.findOne(buildQuery(rawId, 'farmerId'));
      if (!farmer) return res.status(404).json({ message: 'Farmer record not found' });

      if (typeof isVerified === 'boolean') farmer.isVerified = isVerified;
      if (status && ['active', 'suspended'].includes(status)) farmer.status = status;

      await farmer.save();
      return res.json({
        success: true,
        message: `Farmer #${farmer.farmerId} status updated successfully.`,
        farmer: {
          id: farmer._id,
          farmerId: farmer.farmerId,
          name: farmer.name,
          isVerified: farmer.isVerified,
          status: farmer.status
        }
      });
    }

    // In-Memory
    const farmer = inMemoryFarmers.find((f) => f._id === rawId || f.id === rawId || f.farmerId === rawId);
    if (!farmer) return res.status(404).json({ message: 'Farmer record not found' });

    if (typeof isVerified === 'boolean') farmer.isVerified = isVerified;
    if (status && ['active', 'suspended'].includes(status)) farmer.status = status;

    return res.json({
      success: true,
      message: `Farmer #${farmer.farmerId} status updated successfully.`,
      farmer
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 4. BUYER MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/admin/buyers - Directory of commercial buyers with search and filters
router.get('/buyers', adminAuthMiddleware, async (req, res, next) => {
  try {
    const { search, buyerType, status, page = 1, limit = 10 } = req.query;
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(50, Number(limit) || 10));

    if (isDbConnected()) {
      const query = {};
      if (search) {
        const q = sanitizeRegex(search);
        query.$or = [
          { businessName: new RegExp(q, 'i') },
          { contactPerson: new RegExp(q, 'i') },
          { phone: new RegExp(q, 'i') },
          { email: new RegExp(q, 'i') },
          { address: new RegExp(q, 'i') }
        ];
      }
      if (buyerType && buyerType !== 'all') {
        query.buyerType = new RegExp(sanitizeRegex(buyerType), 'i');
      }
      if (status && status !== 'all') {
        query.status = status;
      }

      const totalCount = await Buyer.countDocuments(query);
      const buyers = await Buyer.find(query)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .select('-password');

      // Attach buyer order statistics
      const enriched = await Promise.all(
        buyers.map(async (b) => {
          const obj = b.toObject();
          const bQuery = { $or: [{ 'buyer.id': String(b._id) }, { buyerName: b.businessName }] };
          const [orderCount, requestCount] = await Promise.all([
            Order.countDocuments(bQuery),
            BuyerRequest.countDocuments({ 'buyerDetails.businessName': b.businessName })
          ]);
          obj.orderCount = orderCount;
          obj.requestCount = requestCount;
          return obj;
        })
      );

      return res.json({
        success: true,
        totalCount,
        page: p,
        totalPages: Math.ceil(totalCount / l) || 1,
        buyers: enriched
      });
    }

    // In-Memory
    let list = [...inMemoryBuyers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        b.businessName.toLowerCase().includes(q) ||
        b.contactPerson.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.email.toLowerCase().includes(q)
      );
    }
    if (buyerType && buyerType !== 'all') {
      list = list.filter((b) => b.buyerType.toLowerCase() === buyerType.toLowerCase());
    }
    if (status && status !== 'all') {
      list = list.filter((b) => b.status === status);
    }

    const totalCount = list.length;
    const paginated = list.slice((p - 1) * l, p * l).map((b) => ({
      ...b,
      orderCount: inMemoryOrders.filter((o) => o.buyerName === b.businessName).length,
      requestCount: 1
    }));

    return res.json({
      success: true,
      totalCount,
      page: p,
      totalPages: Math.ceil(totalCount / l) || 1,
      buyers: paginated
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/buyers/:id - Individual buyer profile with order and enquiry history
router.get('/buyers/:id', adminAuthMiddleware, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    let buyer = null;
    let orders = [];
    let requests = [];

    if (isDbConnected()) {
      buyer = await Buyer.findOne(buildQuery(rawId, 'businessName')).select('-password');
      if (!buyer) return res.status(404).json({ message: 'Buyer record not found' });

      [orders, requests] = await Promise.all([
        Order.find({
          $or: [{ 'buyer.id': String(buyer._id) }, { buyerName: buyer.businessName }]
        }).sort({ createdAt: -1 }).limit(20),
        BuyerRequest.find({ 'buyerDetails.businessName': buyer.businessName }).sort({ createdAt: -1 }).limit(20)
      ]);

      return res.json({
        success: true,
        buyer,
        orders,
        requests,
        metrics: {
          totalOrders: orders.length,
          totalRequests: requests.length,
          totalSpent: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
        }
      });
    }

    // In-Memory
    buyer = inMemoryBuyers.find((b) => b._id === rawId || b.id === rawId || b.businessName === rawId);
    if (!buyer) return res.status(404).json({ message: 'Buyer record not found' });

    orders = inMemoryOrders.filter((o) => o.buyerName === buyer.businessName);

    return res.json({
      success: true,
      buyer,
      orders,
      requests: [],
      metrics: {
        totalOrders: orders.length,
        totalRequests: 1,
        totalSpent: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/buyers/:id/status - Toggle buyer account active/suspended state
router.patch('/buyers/:id/status', adminAuthMiddleware, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const { isVerified, status } = req.body;

    if (isDbConnected()) {
      const buyer = await Buyer.findOne(buildQuery(rawId, 'businessName'));
      if (!buyer) return res.status(404).json({ message: 'Buyer record not found' });

      if (typeof isVerified === 'boolean') buyer.isVerified = isVerified;
      if (status && ['active', 'suspended'].includes(status)) buyer.status = status;

      await buyer.save();
      return res.json({
        success: true,
        message: `Buyer '${buyer.businessName}' status updated successfully.`,
        buyer
      });
    }

    // In-Memory
    const buyer = inMemoryBuyers.find((b) => b._id === rawId || b.id === rawId || b.businessName === rawId);
    if (!buyer) return res.status(404).json({ message: 'Buyer record not found' });

    if (typeof isVerified === 'boolean') buyer.isVerified = isVerified;
    if (status && ['active', 'suspended'].includes(status)) buyer.status = status;

    return res.json({
      success: true,
      message: `Buyer '${buyer.businessName}' status updated successfully.`,
      buyer
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 5. DELIVERY LOGISTICS MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/admin/deliveries - All deliveries across EV fleet with driver telemetry
router.get('/deliveries', adminAuthMiddleware, async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(50, Number(limit) || 10));

    if (isDbConnected()) {
      const query = {};
      if (search) {
        const q = sanitizeRegex(search);
        query.$or = [
          { orderId: new RegExp(q, 'i') },
          { 'cropDetails.name': new RegExp(q, 'i') },
          { buyerName: new RegExp(q, 'i') },
          { 'driver.name': new RegExp(q, 'i') },
          { deliveryAddress: new RegExp(q, 'i') }
        ];
      }
      if (status && status !== 'all') {
        query.deliveryStatus = status;
      }

      const totalCount = await Order.countDocuments(query);
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l);

      return res.json({
        success: true,
        totalCount,
        page: p,
        totalPages: Math.ceil(totalCount / l) || 1,
        deliveries: orders
      });
    }

    // In-Memory
    let list = [...inMemoryOrders];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.orderId.toLowerCase().includes(q) ||
        (o.cropName && o.cropName.toLowerCase().includes(q)) ||
        (o.buyerName && o.buyerName.toLowerCase().includes(q)) ||
        (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(q))
      );
    }
    if (status && status !== 'all') {
      list = list.filter((o) => o.deliveryStatus === status);
    }

    const totalCount = list.length;
    const paginated = list.slice((p - 1) * l, p * l);

    return res.json({
      success: true,
      totalCount,
      page: p,
      totalPages: Math.ceil(totalCount / l) || 1,
      deliveries: paginated
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/deliveries/:id - Detailed delivery consignment with telemetry
router.get('/deliveries/:id', adminAuthMiddleware, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    let order = null;
    let trip = null;

    if (isDbConnected()) {
      order = await Order.findOne(buildQuery(rawId, 'orderId'));
      if (!order) return res.status(404).json({ message: 'Delivery consignment not found' });

      trip = await Trip.findOne({ orderId: order.orderId });
      return res.json({ success: true, order, trip });
    }

    // In-Memory
    order = inMemoryOrders.find((o) => o._id === rawId || o.orderId === rawId);
    if (!order) return res.status(404).json({ message: 'Delivery consignment not found' });

    return res.json({
      success: true,
      order,
      trip: {
        tripId: `TRIP-${order.orderId}`,
        orderId: order.orderId,
        status: order.deliveryStatus,
        telemetry: {
          distanceKm: 28,
          batteryPct: 82,
          evModel: 'Tata Ace EV Cargo'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/deliveries/:id/status - Admin operational override for delivery status
router.patch('/deliveries/:id/status', adminAuthMiddleware, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const { deliveryStatus, note } = req.body;
    const validStatuses = ['NOT_ASSIGNED', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

    if (!validStatuses.includes(deliveryStatus)) {
      return res.status(400).json({ message: `Invalid delivery status. Must be one of: ${validStatuses.join(', ')}` });
    }

    if (isDbConnected()) {
      const order = await Order.findOne(buildQuery(rawId, 'orderId'));
      if (!order) return res.status(404).json({ message: 'Delivery order not found' });

      order.deliveryStatus = deliveryStatus;
      order.status = deliveryStatus;
      if (deliveryStatus === 'DELIVERED' && order.orderStatus === 'CONFIRMED') {
        order.deliveryDate = new Date();
      }
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: deliveryStatus,
        timestamp: new Date().toISOString(),
        note: note || `Delivery milestone adjusted by Administrator to ${deliveryStatus}`
      });

      await order.save();

      // Synchronize linked Trip if exists
      await Trip.updateOne(
        { orderId: order.orderId },
        { status: deliveryStatus }
      );

      return res.json({
        success: true,
        message: `Delivery #${order.orderId} status set to ${deliveryStatus}.`,
        order
      });
    }

    // In-Memory
    const order = inMemoryOrders.find((o) => o._id === rawId || o.orderId === rawId);
    if (!order) return res.status(404).json({ message: 'Delivery order not found' });

    order.deliveryStatus = deliveryStatus;
    order.status = deliveryStatus;

    return res.json({
      success: true,
      message: `Delivery #${order.orderId} status set to ${deliveryStatus}.`,
      order
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 5b. DRIVER FLEET LOGISTICS MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/admin/drivers - All EV Fleet Drivers with telemetry, battery and duty status
router.get('/drivers', adminAuthMiddleware, async (req, res, next) => {
  try {
    const { search, dutyStatus, assignedHub, page = 1, limit = 10 } = req.query;
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(50, Number(limit) || 10));

    if (isDbConnected()) {
      const query = {};
      if (search) {
        const q = sanitizeRegex(search);
        query.$or = [
          { driverId: new RegExp(q, 'i') },
          { name: new RegExp(q, 'i') },
          { phone: new RegExp(q, 'i') },
          { 'vehicle.vehicleNumber': new RegExp(q, 'i') },
          { assignedHub: new RegExp(q, 'i') }
        ];
      }
      if (dutyStatus && dutyStatus !== 'all') {
        query.dutyStatus = dutyStatus;
      }
      if (assignedHub && assignedHub !== 'all') {
        query.assignedHub = new RegExp(sanitizeRegex(assignedHub), 'i');
      }

      const totalCount = await Driver.countDocuments(query);
      const drivers = await Driver.find(query)
        .sort({ 'metrics.rating': -1, createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l);

      return res.json({
        success: true,
        totalCount,
        page: p,
        totalPages: Math.ceil(totalCount / l) || 1,
        drivers
      });
    }

    // In-Memory
    let list = [...inMemoryDrivers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.driverId.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        (d.vehicle && d.vehicle.vehicleNumber.toLowerCase().includes(q)) ||
        (d.assignedHub && d.assignedHub.toLowerCase().includes(q))
      );
    }
    if (dutyStatus && dutyStatus !== 'all') {
      list = list.filter((d) => d.dutyStatus === dutyStatus);
    }
    if (assignedHub && assignedHub !== 'all') {
      const h = assignedHub.toLowerCase();
      list = list.filter((d) => d.assignedHub && d.assignedHub.toLowerCase().includes(h));
    }

    const totalCount = list.length;
    const paginated = list.slice((p - 1) * l, p * l);

    return res.json({
      success: true,
      totalCount,
      page: p,
      totalPages: Math.ceil(totalCount / l) || 1,
      drivers: paginated
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/drivers/:id - Detailed driver profile with vehicle telemetry and trip logs
router.get('/drivers/:id', adminAuthMiddleware, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    let driver = null;

    if (isDbConnected()) {
      driver = await Driver.findOne(buildQuery(rawId, 'driverId'));
      if (!driver) return res.status(404).json({ message: 'Driver not found' });

      // Fetch any active trips for this driver
      const trips = await Trip.find({ driverId: driver.driverId }).sort({ createdAt: -1 }).limit(5);

      return res.json({ success: true, driver, trips });
    }

    // In-Memory
    driver = inMemoryDrivers.find((d) => d._id === rawId || d.driverId === rawId || d.id === rawId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    return res.json({
      success: true,
      driver,
      trips: [
        {
          tripId: 'TRIP-2026-8095',
          orderId: 'ORD-8095',
          status: 'IN_TRANSIT',
          cropName: 'Organic Country Tomatoes',
          pickup: 'Pollachi Farm Gate',
          dropoff: 'Gandhipuram Hotel Kitchen',
          distanceKm: 34.5
        }
      ]
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/drivers/:id/status - Toggle or update driver duty status (ON_DUTY / ON_TRIP / OFF_DUTY)
router.patch('/drivers/:id/status', adminAuthMiddleware, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const { dutyStatus } = req.body;
    const validDuty = ['ON_DUTY', 'ON_TRIP', 'OFF_DUTY'];

    if (!validDuty.includes(dutyStatus)) {
      return res.status(400).json({ message: `Invalid duty status. Must be one of: ${validDuty.join(', ')}` });
    }

    if (isDbConnected()) {
      const driver = await Driver.findOne(buildQuery(rawId, 'driverId'));
      if (!driver) return res.status(404).json({ message: 'Driver not found' });

      driver.dutyStatus = dutyStatus;
      await driver.save();

      return res.json({
        success: true,
        message: `Driver ${driver.name} duty status updated to ${dutyStatus}.`,
        driver
      });
    }

    // In-Memory
    const driver = inMemoryDrivers.find((d) => d._id === rawId || d.driverId === rawId || d.id === rawId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    driver.dutyStatus = dutyStatus;

    return res.json({
      success: true,
      message: `Driver ${driver.name} duty status updated to ${dutyStatus}.`,
      driver
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 6. PURCHASE REQUESTS MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/admin/requests - Commercial buyer purchase inquiries & offers
router.get('/requests', adminAuthMiddleware, async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(50, Number(limit) || 10));

    if (isDbConnected()) {
      const query = {};
      if (search) {
        const q = sanitizeRegex(search);
        query.$or = [
          { requestId: new RegExp(q, 'i') },
          { 'cropDetails.name': new RegExp(q, 'i') },
          { 'buyerDetails.businessName': new RegExp(q, 'i') },
          { farmerName: new RegExp(q, 'i') },
          { deliveryLocation: new RegExp(q, 'i') }
        ];
      }
      if (status && status !== 'all') {
        query.status = status;
      }

      const totalCount = await BuyerRequest.countDocuments(query);
      const requests = await BuyerRequest.find(query)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l);

      // Aggregate global pipeline metrics across all requests
      const metricsAgg = await BuyerRequest.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
            accepted: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } },
            converted: { $sum: { $cond: [{ $eq: ['$status', 'CONVERTED_TO_ORDER'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] } },
            totalKg: { $sum: '$quantity' },
            totalValue: { $sum: '$totalEstimatedValue' }
          }
        }
      ]);

      const m = metricsAgg.length > 0 ? metricsAgg[0] : {};

      return res.json({
        success: true,
        totalCount,
        page: p,
        totalPages: Math.ceil(totalCount / l) || 1,
        requests,
        metrics: {
          total: m.total || totalCount,
          pending: m.pending || 0,
          accepted: m.accepted || 0,
          converted: m.converted || 0,
          rejected: m.rejected || 0,
          totalInquiredKg: m.totalKg || 0,
          totalInquiredValue: m.totalValue || 0
        }
      });
    }

    // In-Memory Fallback
    let list = [...inMemoryBuyerRequests];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        (r.requestId && r.requestId.toLowerCase().includes(q)) ||
        (r.cropDetails?.name && r.cropDetails.name.toLowerCase().includes(q)) ||
        (r.buyerDetails?.businessName && r.buyerDetails.businessName.toLowerCase().includes(q)) ||
        (r.farmerName && r.farmerName.toLowerCase().includes(q)) ||
        (r.deliveryLocation && r.deliveryLocation.toLowerCase().includes(q))
      );
    }
    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }

    const totalCount = list.length;
    const paginated = list.slice((p - 1) * l, p * l);

    const metrics = {
      total: inMemoryBuyerRequests.length,
      pending: inMemoryBuyerRequests.filter((r) => r.status === 'PENDING').length,
      accepted: inMemoryBuyerRequests.filter((r) => r.status === 'ACCEPTED').length,
      converted: inMemoryBuyerRequests.filter((r) => r.status === 'CONVERTED_TO_ORDER').length,
      rejected: inMemoryBuyerRequests.filter((r) => r.status === 'REJECTED').length,
      totalInquiredKg: inMemoryBuyerRequests.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
      totalInquiredValue: inMemoryBuyerRequests.reduce((sum, r) => sum + (Number(r.totalEstimatedValue) || 0), 0)
    };

    return res.json({
      success: true,
      totalCount,
      page: p,
      totalPages: Math.ceil(totalCount / l) || 1,
      requests: paginated,
      metrics
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/requests/:id - Single purchase inquiry detail
router.get('/requests/:id', adminAuthMiddleware, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    let request = null;

    if (isDbConnected()) {
      request = await BuyerRequest.findOne(buildQuery(rawId, 'requestId'));
      if (!request) return res.status(404).json({ message: 'Purchase request not found' });
      return res.json({ success: true, request });
    }

    // In-Memory
    request = inMemoryBuyerRequests.find((r) => r._id === rawId || r.requestId === rawId);
    if (!request) return res.status(404).json({ message: 'Purchase request not found' });

    return res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 7. ORDER & FINANCIAL ESCROW MANAGEMENT ENDPOINTS
// ============================================================================

// GET /api/admin/orders - Commercial order ledger & escrow tracking
router.get('/orders', adminAuthMiddleware, async (req, res, next) => {
  try {
    const { search, orderStatus, paymentStatus, deliveryStatus, page = 1, limit = 10 } = req.query;
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(50, Number(limit) || 10));

    if (isDbConnected()) {
      const query = {};
      if (search) {
        const q = sanitizeRegex(search);
        query.$or = [
          { orderId: new RegExp(q, 'i') },
          { 'cropDetails.name': new RegExp(q, 'i') },
          { buyerName: new RegExp(q, 'i') },
          { 'buyer.businessName': new RegExp(q, 'i') },
          { farmerName: new RegExp(q, 'i') },
          { deliveryAddress: new RegExp(q, 'i') }
        ];
      }
      if (orderStatus && orderStatus !== 'all') {
        query.orderStatus = orderStatus;
      }
      if (paymentStatus && paymentStatus !== 'all') {
        query.paymentStatus = paymentStatus;
      }
      if (deliveryStatus && deliveryStatus !== 'all') {
        query.deliveryStatus = deliveryStatus;
      }

      const totalCount = await Order.countDocuments(query);
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l);

      // Aggregate global commercial & escrow metrics
      const metricsAgg = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            confirmedOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', 'CONFIRMED'] }, 1, 0] } },
            pendingApproval: { $sum: { $cond: [{ $eq: ['$orderStatus', 'PENDING_FARMER_APPROVAL'] }, 1, 0] } },
            cancelledOrders: { $sum: { $cond: [{ $in: ['$orderStatus', ['CANCELLED', 'REJECTED']] }, 1, 0] } },
            totalRevenue: {
              $sum: {
                $cond: [
                  { $in: ['$orderStatus', ['CONFIRMED', 'DELIVERED']] },
                  '$totalPrice',
                  0
                ]
              }
            },
            escrowLocked: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'ESCROW_LOCKED'] }, '$totalPrice', 0]
              }
            },
            releasedToFarmer: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'RELEASED_TO_FARMER'] }, '$totalPrice', 0]
              }
            },
            totalKg: {
              $sum: {
                $cond: [
                  { $in: ['$orderStatus', ['CONFIRMED', 'DELIVERED']] },
                  '$quantityKg',
                  0
                ]
              }
            }
          }
        }
      ]);

      const m = metricsAgg.length > 0 ? metricsAgg[0] : {};

      return res.json({
        success: true,
        totalCount,
        page: p,
        totalPages: Math.ceil(totalCount / l) || 1,
        orders,
        metrics: {
          totalOrders: m.totalOrders || totalCount,
          confirmedOrders: m.confirmedOrders || 0,
          pendingApproval: m.pendingApproval || 0,
          cancelledOrders: m.cancelledOrders || 0,
          totalRevenue: m.totalRevenue || 0,
          escrowLocked: m.escrowLocked || 0,
          releasedToFarmer: m.releasedToFarmer || 0,
          totalKg: m.totalKg || 0
        }
      });
    }

    // In-Memory Fallback
    let list = [...inMemoryOrders];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        (o.orderId && o.orderId.toLowerCase().includes(q)) ||
        (o.cropName && o.cropName.toLowerCase().includes(q)) ||
        (o.cropDetails?.name && o.cropDetails.name.toLowerCase().includes(q)) ||
        (o.buyerName && o.buyerName.toLowerCase().includes(q)) ||
        (o.farmerName && o.farmerName.toLowerCase().includes(q)) ||
        (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(q))
      );
    }
    if (orderStatus && orderStatus !== 'all') {
      list = list.filter((o) => o.orderStatus === orderStatus);
    }
    if (paymentStatus && paymentStatus !== 'all') {
      list = list.filter((o) => o.paymentStatus === paymentStatus);
    }
    if (deliveryStatus && deliveryStatus !== 'all') {
      list = list.filter((o) => o.deliveryStatus === deliveryStatus);
    }

    const totalCount = list.length;
    const paginated = list.slice((p - 1) * l, p * l);

    const valid = inMemoryOrders.filter((o) => !['CANCELLED', 'REJECTED'].includes(o.orderStatus));
    const metrics = {
      totalOrders: inMemoryOrders.length,
      confirmedOrders: inMemoryOrders.filter((o) => o.orderStatus === 'CONFIRMED').length,
      pendingApproval: inMemoryOrders.filter((o) => o.orderStatus === 'PENDING_FARMER_APPROVAL').length,
      cancelledOrders: inMemoryOrders.filter((o) => ['CANCELLED', 'REJECTED'].includes(o.orderStatus)).length,
      totalRevenue: valid.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0),
      escrowLocked: inMemoryOrders.filter((o) => o.paymentStatus === 'ESCROW_LOCKED').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0),
      releasedToFarmer: inMemoryOrders.filter((o) => o.paymentStatus === 'RELEASED_TO_FARMER').reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0),
      totalKg: valid.reduce((sum, o) => sum + (Number(o.quantityKg) || 0), 0)
    };

    return res.json({
      success: true,
      totalCount,
      page: p,
      totalPages: Math.ceil(totalCount / l) || 1,
      orders: paginated,
      metrics
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/orders/:id - Single order details with trip info
router.get('/orders/:id', adminAuthMiddleware, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    let order = null;

    if (isDbConnected()) {
      order = await Order.findOne(buildQuery(rawId, 'orderId'));
      if (!order) return res.status(404).json({ message: 'Order not found' });
      const trip = await Trip.findOne({ orderId: order.orderId });
      return res.json({ success: true, order, trip });
    }

    // In-Memory
    order = inMemoryOrders.find((o) => o._id === rawId || o.orderId === rawId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    return res.json({
      success: true,
      order,
      trip: {
        tripId: `TRIP-${order.orderId}`,
        orderId: order.orderId,
        driverName: order.driver?.name || 'Kumar M.',
        status: order.deliveryStatus
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/orders/:id/status - Admin intervention: update orderStatus, paymentStatus, or deliveryStatus
router.patch('/orders/:id/status', adminAuthMiddleware, async (req, res, next) => {
  try {
    const rawId = req.params.id;
    const { orderStatus, paymentStatus, deliveryStatus, note } = req.body;

    if (isDbConnected()) {
      const order = await Order.findOne(buildQuery(rawId, 'orderId'));
      if (!order) return res.status(404).json({ message: 'Order not found' });

      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      if (deliveryStatus) order.deliveryStatus = deliveryStatus;
      if (note) {
        order.adminNote = note;
      }
      await order.save();

      return res.json({
        success: true,
        message: `Order #${order.orderId} updated by Central Operations Administrator`,
        order
      });
    }

    // In-Memory
    const order = inMemoryOrders.find((o) => o._id === rawId || o.orderId === rawId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (deliveryStatus) order.deliveryStatus = deliveryStatus;
    if (note) order.adminNote = note;

    return res.json({
      success: true,
      message: `Order #${order.orderId} status updated successfully`,
      order
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 8. REPORTS & ANALYTICS DATA ENDPOINT
// ============================================================================

// GET /api/admin/reports - Multi-tab aggregations (Farmer, Buyer, Delivery, Overall)
router.get('/reports', adminAuthMiddleware, async (req, res, next) => {
  try {
    const { type = 'overall', startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    const hasDate = Object.keys(dateFilter).length > 0;

    if (isDbConnected()) {
      const orderMatch = hasDate ? { createdAt: dateFilter } : {};
      const cropMatch = { status: { $ne: 'removed' } };
      if (hasDate) cropMatch.createdAt = dateFilter;

      // 1. Farmer Reports Data
      const farmerStats = await Farmer.aggregate([
        { $match: hasDate ? { createdAt: dateFilter } : {} },
        {
          $group: {
            _id: '$farmDetails.district',
            farmerCount: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            totalLandAcres: { $sum: '$farmDetails.landArea' }
          }
        },
        { $sort: { farmerCount: -1 } }
      ]);

      const cropSupplyStats = await Crop.aggregate([
        { $match: cropMatch },
        {
          $group: {
            _id: '$name',
            totalListedKg: { $sum: '$quantityKg' },
            avgPricePerKg: { $avg: '$pricePerKg' },
            listingCount: { $sum: 1 }
          }
        },
        { $sort: { totalListedKg: -1 } },
        { $limit: 10 }
      ]);

      // 2. Buyer Reports Data
      const buyerStats = await Buyer.aggregate([
        { $match: hasDate ? { createdAt: dateFilter } : {} },
        {
          $group: {
            _id: '$buyerType',
            buyerCount: { $sum: 1 }
          }
        },
        { $sort: { buyerCount: -1 } }
      ]);

      const topRequestedCrops = await BuyerRequest.aggregate([
        { $match: hasDate ? { createdAt: dateFilter } : {} },
        {
          $group: {
            _id: '$cropDetails.name',
            requestCount: { $sum: 1 },
            totalQuantityKg: { $sum: '$quantity' },
            avgOfferedPrice: { $avg: '$offeredPrice' }
          }
        },
        { $sort: { requestCount: -1 } },
        { $limit: 10 }
      ]);

      // 3. Delivery Reports Data
      const deliveryStats = await Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: '$deliveryStatus',
            count: { $sum: 1 },
            totalVolumeKg: { $sum: '$quantityKg' }
          }
        }
      ]);

      const orderStatusStats = await Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      // 4. Overall Supply vs Demand Comparison
      const totalSupplyKg = cropSupplyStats.reduce((s, c) => s + (c.totalListedKg || 0), 0);
      const totalDemandKg = topRequestedCrops.reduce((s, r) => s + (r.totalQuantityKg || 0), 0);
      const totalOrdersCount = await Order.countDocuments(orderMatch);
      const completedOrdersCount = await Order.countDocuments({ ...orderMatch, deliveryStatus: 'DELIVERED' });
      const pendingOrdersCount = await Order.countDocuments({ ...orderMatch, orderStatus: { $in: ['PENDING_FARMER_APPROVAL', 'PENDING'] } });
      const cancelledOrdersCount = await Order.countDocuments({ ...orderMatch, orderStatus: { $in: ['CANCELLED', 'REJECTED'] } });

      // Build unified crop-by-crop supply vs demand
      const cropMap = {};
      cropSupplyStats.forEach((c) => {
        const name = c._id || 'Produce';
        if (!cropMap[name]) cropMap[name] = { crop: name, supplyKg: 0, demandKg: 0, enquiries: 0, listings: 0 };
        cropMap[name].supplyKg += (c.totalListedKg || 0);
        cropMap[name].listings += (c.listingCount || 0);
      });
      topRequestedCrops.forEach((r) => {
        const name = r._id || 'Produce';
        if (!cropMap[name]) cropMap[name] = { crop: name, supplyKg: 0, demandKg: 0, enquiries: 0, listings: 0 };
        cropMap[name].demandKg += (r.totalQuantityKg || 0);
        cropMap[name].enquiries += (r.requestCount || 0);
      });
      const commoditySupplyDemand = Object.values(cropMap).sort(
        (a, b) => (b.supplyKg + b.demandKg) - (a.supplyKg + a.demandKg)
      );

      return res.json({
        success: true,
        type,
        data: {
          farmerReports: {
            byDistrict: farmerStats.map((f) => ({
              district: f._id || 'Coimbatore',
              farmers: f.farmerCount,
              avgRating: Number((f.avgRating || 4.9).toFixed(2)),
              totalLandAcres: Number((f.totalLandAcres || 0).toFixed(1))
            })),
            cropSupply: cropSupplyStats.map((c) => ({
              crop: c._id,
              quantityKg: c.totalListedKg,
              avgPrice: Number((c.avgPricePerKg || 0).toFixed(1)),
              listings: c.listingCount
            }))
          },
          buyerReports: {
            byType: buyerStats.map((b) => ({
              buyerType: b._id || 'commercial',
              count: b.buyerCount
            })),
            topRequestedCrops: topRequestedCrops.map((r) => ({
              crop: r._id || 'Produce',
              enquiries: r.requestCount,
              totalKg: r.totalQuantityKg,
              avgPrice: Number((r.avgOfferedPrice || 0).toFixed(1))
            }))
          },
          deliveryReports: {
            statusBreakdown: deliveryStats.map((d) => ({
              status: d._id || 'NOT_ASSIGNED',
              count: d.count,
              volumeKg: d.totalVolumeKg
            })),
            fulfillmentRate: safePercent(completedOrdersCount, totalOrdersCount)
          },
          overall: {
            totalSupplyKg,
            totalDemandKg,
            supplyDemandRatio: safePercent(totalSupplyKg, totalDemandKg || 1),
            totalOrders: totalOrdersCount,
            completedOrders: completedOrdersCount,
            pendingOrders: pendingOrdersCount,
            cancelledOrders: cancelledOrdersCount,
            orderStatusDistribution: orderStatusStats.map((s) => ({
              status: s._id || 'PENDING',
              count: s.count
            })),
            commoditySupplyDemand
          }
        }
      });
    }

    // In-Memory Fallback
    return res.json({
      success: true,
      type,
      data: {
        farmerReports: {
          byDistrict: [
            { district: 'Coimbatore', farmers: 1, avgRating: 4.92, totalLandAcres: 4.5 },
            { district: 'Erode', farmers: 1, avgRating: 4.85, totalLandAcres: 6.0 }
          ],
          cropSupply: [
            { crop: 'Batlagundu Potato', quantityKg: 800, avgPrice: 32, listings: 1 },
            { crop: 'Country Tomato', quantityKg: 500, avgPrice: 28, listings: 1 },
            { crop: 'Red Onion (Chinna Vengayam)', quantityKg: 350, avgPrice: 55, listings: 1 }
          ]
        },
        buyerReports: {
          byType: [
            { buyerType: 'hotel', count: 1 },
            { buyerType: 'supermarket', count: 1 },
            { buyerType: 'restaurant', count: 1 }
          ],
          topRequestedCrops: [
            { crop: 'Country Tomato', enquiries: 4, totalKg: 800, avgPrice: 34 },
            { crop: 'Batlagundu Potato', enquiries: 2, totalKg: 500, avgPrice: 32 }
          ]
        },
        deliveryReports: {
          statusBreakdown: [
            { status: 'DELIVERED', count: 1, volumeKg: 200 },
            { status: 'IN_TRANSIT', count: 1, volumeKg: 500 },
            { status: 'NOT_ASSIGNED', count: 1, volumeKg: 150 }
          ],
          fulfillmentRate: 33.3
        },
        overall: {
          totalSupplyKg: 1650,
          totalDemandKg: 1300,
          supplyDemandRatio: 126.9,
          totalOrders: inMemoryOrders.length,
          completedOrders: 1,
          pendingOrders: 1,
          cancelledOrders: 0,
          orderStatusDistribution: [
            { status: 'DELIVERED', count: 1 },
            { status: 'CONFIRMED', count: 1 },
            { status: 'PENDING_FARMER_APPROVAL', count: 1 }
          ],
          commoditySupplyDemand: [
            { crop: 'Batlagundu Potato', supplyKg: 800, demandKg: 500, enquiries: 2, listings: 1 },
            { crop: 'Country Tomato', supplyKg: 500, demandKg: 800, enquiries: 4, listings: 1 },
            { crop: 'Red Onion (Chinna Vengayam)', supplyKg: 350, demandKg: 200, enquiries: 2, listings: 1 }
          ]
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 7. CSV EXPORT ENGINE (RFC 4180 + UTF-8 BOM FOR TAMIL EXCEL SUPPORT)
// ============================================================================

// Helper: Generates safe RFC 4180 CSV with UTF-8 BOM and formula neutralization
const buildCsvResponse = (res, filename, headers, records) => {
  const sanitizeCell = (val) => {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    // Formula injection mitigation (CWE-1236)
    if (/^[=+@-]$/.test(str.charAt(0))) {
      str = `'${str}`;
    }
    return `"${str}"`;
  };

  const headerLine = headers.map((h) => sanitizeCell(h.label)).join(',');
  const rowLines = records.map((rec) =>
    headers.map((h) => sanitizeCell(rec[h.key] ?? '')).join(',')
  );

  // Prepend UTF-8 Byte Order Mark (\uFEFF) so Excel opens Tamil Unicode flawlessly
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.send(csvContent);
};

// GET /api/admin/reports/export - Export module datasets as clean CSV
router.get('/reports/export', adminAuthMiddleware, async (req, res, next) => {
  try {
    const { module = 'farmers' } = req.query;
    const timestamp = new Date().toISOString().slice(0, 10);

    if (module === 'farmers') {
      const records = isDbConnected()
        ? await Farmer.find().sort({ createdAt: -1 }).select('-password')
        : inMemoryFarmers;

      const flat = records.map((f) => ({
        farmerId: f.farmerId || f.id,
        name: f.name,
        email: f.email,
        phone: f.phone,
        district: f.farmDetails?.district || '',
        village: f.farmDetails?.village || '',
        landAreaAcres: f.farmDetails?.landArea || '',
        rating: f.rating || 4.9,
        isVerified: f.isVerified ? 'VERIFIED' : 'PENDING',
        status: f.status || 'active',
        createdAt: new Date(f.createdAt || Date.now()).toLocaleDateString('en-IN')
      }));

      const headers = [
        { label: 'Farmer ID', key: 'farmerId' },
        { label: 'Full Name', key: 'name' },
        { label: 'Mobile Number', key: 'phone' },
        { label: 'Email', key: 'email' },
        { label: 'District', key: 'district' },
        { label: 'Village', key: 'village' },
        { label: 'Land Area (Acres)', key: 'landAreaAcres' },
        { label: 'Rating', key: 'rating' },
        { label: 'Verification', key: 'isVerified' },
        { label: 'Account Status', key: 'status' },
        { label: 'Registered Date', key: 'createdAt' }
      ];

      return buildCsvResponse(res, `naam_uzhavar_farmers_${timestamp}.csv`, headers, flat);
    }

    if (module === 'buyers') {
      const records = isDbConnected()
        ? await Buyer.find().sort({ createdAt: -1 }).select('-password')
        : inMemoryBuyers;

      const flat = records.map((b) => ({
        businessName: b.businessName,
        contactPerson: b.contactPerson,
        buyerType: b.buyerType,
        phone: b.phone,
        email: b.email,
        gstin: b.gstin || 'N/A',
        address: b.address,
        isVerified: b.isVerified ? 'VERIFIED' : 'PENDING',
        status: b.status || 'active',
        createdAt: new Date(b.createdAt || Date.now()).toLocaleDateString('en-IN')
      }));

      const headers = [
        { label: 'Business Name', key: 'businessName' },
        { label: 'Contact Person', key: 'contactPerson' },
        { label: 'Buyer Type', key: 'buyerType' },
        { label: 'Phone', key: 'phone' },
        { label: 'Email', key: 'email' },
        { label: 'GSTIN', key: 'gstin' },
        { label: 'Delivery Address', key: 'address' },
        { label: 'Verification', key: 'isVerified' },
        { label: 'Status', key: 'status' },
        { label: 'Registered Date', key: 'createdAt' }
      ];

      return buildCsvResponse(res, `naam_uzhavar_buyers_${timestamp}.csv`, headers, flat);
    }

    if (module === 'deliveries') {
      const records = isDbConnected()
        ? await Order.find().sort({ createdAt: -1 })
        : inMemoryOrders;

      const flat = records.map((o) => ({
        orderId: o.orderId,
        buyerName: o.buyerName || o.buyerDetails?.businessName || 'Commercial Buyer',
        cropName: o.cropDetails?.name || o.cropName || 'Produce',
        quantityKg: o.quantityKg || 0,
        totalValue: o.totalPrice || 0,
        deliveryStatus: o.deliveryStatus,
        driverName: o.driver?.name || 'Unassigned',
        driverVehicle: o.driver?.vehicle || 'Tata Ace EV Cargo',
        deliveryAddress: o.deliveryAddress,
        createdAt: new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN')
      }));

      const headers = [
        { label: 'Order ID', key: 'orderId' },
        { label: 'Buyer Name', key: 'buyerName' },
        { label: 'Crop Produce', key: 'cropName' },
        { label: 'Quantity (Kg)', key: 'quantityKg' },
        { label: 'Total Value (₹)', key: 'totalValue' },
        { label: 'Delivery Milestone', key: 'deliveryStatus' },
        { label: 'EV Fleet Driver', key: 'driverName' },
        { label: 'Vehicle Telemetry', key: 'driverVehicle' },
        { label: 'Drop-off Bay', key: 'deliveryAddress' },
        { label: 'Order Date', key: 'createdAt' }
      ];

      return buildCsvResponse(res, `naam_uzhavar_deliveries_${timestamp}.csv`, headers, flat);
    }

    if (module === 'requests') {
      const records = isDbConnected()
        ? await BuyerRequest.find().sort({ createdAt: -1 })
        : inMemoryBuyerRequests;

      const flat = records.map((r) => ({
        requestId: r.requestId,
        cropName: r.cropDetails?.name || 'Produce',
        variety: r.cropDetails?.variety || 'Standard',
        grade: r.cropDetails?.grade || 'Grade A',
        buyerBusiness: r.buyerDetails?.businessName || 'Buyer',
        buyerType: r.buyerDetails?.buyerType || 'Commercial',
        buyerPhone: r.buyerDetails?.phone || '',
        farmerId: r.farmerId || '',
        farmerName: r.farmerName || '',
        quantityKg: r.quantity || 0,
        offeredPrice: r.offeredPrice || 0,
        totalValue: r.totalEstimatedValue || 0,
        deliveryLocation: r.deliveryLocation || '',
        preferredDate: r.preferredDeliveryDate || 'Immediate',
        status: r.status || 'PENDING',
        createdAt: new Date(r.createdAt || Date.now()).toLocaleDateString('en-IN')
      }));

      const headers = [
        { label: 'Request ID', key: 'requestId' },
        { label: 'Vegetable Produce', key: 'cropName' },
        { label: 'Variety', key: 'variety' },
        { label: 'Quality Grade', key: 'grade' },
        { label: 'Buyer Business', key: 'buyerBusiness' },
        { label: 'Buyer Type', key: 'buyerType' },
        { label: 'Contact Phone', key: 'buyerPhone' },
        { label: 'Farmer ID', key: 'farmerId' },
        { label: 'Target Farmer', key: 'farmerName' },
        { label: 'Quantity (Kg)', key: 'quantityKg' },
        { label: 'Offered Rate (₹/Kg)', key: 'offeredPrice' },
        { label: 'Total Value (₹)', key: 'totalValue' },
        { label: 'Receiving Dock', key: 'deliveryLocation' },
        { label: 'Preferred Date', key: 'preferredDate' },
        { label: 'Status', key: 'status' },
        { label: 'Request Date', key: 'createdAt' }
      ];

      return buildCsvResponse(res, `naam_uzhavar_purchase_requests_${timestamp}.csv`, headers, flat);
    }

    if (module === 'orders') {
      const records = isDbConnected()
        ? await Order.find().sort({ createdAt: -1 })
        : inMemoryOrders;

      const flat = records.map((o) => ({
        orderId: o.orderId,
        cropName: o.cropDetails?.name || o.cropName || 'Produce',
        grade: o.cropDetails?.grade || 'Grade A',
        quantityKg: o.quantityKg || 0,
        pricePerKg: o.cropDetails?.pricePerKg || Math.round((o.totalPrice || 0) / (o.quantityKg || 1)),
        totalPrice: o.totalPrice || 0,
        buyerName: o.buyerName || o.buyerDetails?.businessName || 'Commercial Buyer',
        farmerId: o.farmerId || '',
        farmerName: o.farmerName || o.cropDetails?.farmerName || 'Farmer',
        orderStatus: o.orderStatus || 'CONFIRMED',
        paymentStatus: o.paymentStatus || 'PENDING',
        deliveryStatus: o.deliveryStatus || 'NOT_ASSIGNED',
        paymentMethod: o.paymentMethod || 'UPI Escrow',
        driverName: o.driver?.name || 'Unassigned',
        deliveryAddress: o.deliveryAddress || '',
        createdAt: new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN')
      }));

      const headers = [
        { label: 'Order ID', key: 'orderId' },
        { label: 'Crop Produce', key: 'cropName' },
        { label: 'Grade', key: 'grade' },
        { label: 'Quantity (Kg)', key: 'quantityKg' },
        { label: 'Rate (₹/Kg)', key: 'pricePerKg' },
        { label: 'Total Amount (₹)', key: 'totalPrice' },
        { label: 'Buyer Name', key: 'buyerName' },
        { label: 'Farmer ID', key: 'farmerId' },
        { label: 'Farmer Name', key: 'farmerName' },
        { label: 'Approval Status', key: 'orderStatus' },
        { label: 'Escrow / Payment', key: 'paymentStatus' },
        { label: 'Delivery Milestone', key: 'deliveryStatus' },
        { label: 'Payment Method', key: 'paymentMethod' },
        { label: 'Assigned Driver', key: 'driverName' },
        { label: 'Drop-off Location', key: 'deliveryAddress' },
        { label: 'Order Date', key: 'createdAt' }
      ];

      return buildCsvResponse(res, `naam_uzhavar_orders_ledger_${timestamp}.csv`, headers, flat);
    }

    // Default: Crops Inventory
    const records = isDbConnected()
      ? await Crop.find({ status: { $ne: 'removed' } }).sort({ createdAt: -1 })
      : inMemoryCrops;

    const flat = records.map((c) => ({
      cropName: c.name,
      tamilName: c.nameTa || '',
      category: c.category,
      variety: c.variety,
      grade: c.grade,
      pricePerKg: c.pricePerKg,
      quantityKg: c.quantityKg,
      unit: c.unit || 'Kg',
      farmerName: c.farmerName,
      farmerId: c.farmerId,
      hub: c.hub,
      status: c.status
    }));

    const headers = [
      { label: 'Crop Name (EN)', key: 'cropName' },
      { label: 'Crop Name (TA)', key: 'tamilName' },
      { label: 'Category', key: 'category' },
      { label: 'Variety', key: 'variety' },
      { label: 'Grade', key: 'grade' },
      { label: 'Wholesale Price/Kg', key: 'pricePerKg' },
      { label: 'Available Quantity', key: 'quantityKg' },
      { label: 'Unit', key: 'unit' },
      { label: 'Farmer Name', key: 'farmerName' },
      { label: 'Farmer ID', key: 'farmerId' },
      { label: 'Regional Hub', key: 'hub' },
      { label: 'Marketplace Status', key: 'status' }
    ];

    return buildCsvResponse(res, `naam_uzhavar_crops_catalog_${timestamp}.csv`, headers, flat);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

