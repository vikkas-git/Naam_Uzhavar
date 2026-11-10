// What this file does: Data store and mock state for Naam Uzhavar EV Delivery Fleet & Logistics Terminal.
// Connects Driver dispatch with Farmer harvests and Commercial Buyer delivery orders.

export const INITIAL_DRIVER_PROFILE = {
  driverId: 'DRV-TN-2026-08',
  name: 'Kumar M.',
  tamilName: 'குமார் எம்.',
  phone: '+91 94432 11098',
  email: 'kumar.logistics@naamuzhavar.com',
  avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&auto=format&fit=crop&q=80',
  role: 'driver',
  assignedHub: 'Dindigul Central Hub',
  operatingZone: 'Coimbatore - Dindigul - Madurai Corridor',
  status: 'ON_DUTY', // 'ON_DUTY' | 'ON_TRIP' | 'OFF_DUTY'
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
  metrics: {
    rating: 4.92,
    totalDispatches: 148,
    onTimeRatePct: 99.1,
    totalDistanceKm: 4820,
    co2SavedKg: 1240,
    todayTripsCount: 2,
    todayEarnings: 1424,
    walletBalance: 4250
  }
};

export const INITIAL_DRIVER_TRIPS = [
  {
    tripId: 'TRIP-2026-8095',
    orderId: 'ORD-8095',
    requestId: 'REQ-2026-78192',
    status: 'READY_FOR_PICKUP', // 'READY_FOR_PICKUP' | 'DRIVER_EN_ROUTE_PICKUP' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED'
    priority: 'HIGH',
    tripType: 'FARM_GATE_DIRECT',
    cropName: 'Organic Country Tomatoes (Naatu Thakkali)',
    tamilCropName: 'நாட்டு தக்காளி',
    cropImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    quantityKg: 200,
    cratesCount: 8,
    totalProduceValue: 5600,
    pickup: {
      farmName: "Ramesh Kumar's Natural Farm",
      farmerName: 'Ramesh Kumar',
      farmerPhone: '+91 94432 78190',
      address: 'SF No. 142/2, Kinathukadavu Main Road, Pollachi, Coimbatore',
      village: 'Pollachi',
      district: 'Coimbatore',
      pincode: '642001',
      gps: '10.6588° N, 77.0094° E',
      timeSlot: 'Morning Harvest Dispatch (07:00 AM - 08:30 AM)'
    },
    dropoff: {
      buyerName: 'Sri Lakshmi Hotels',
      contactPerson: 'M. Senthil Nathan',
      buyerPhone: '+91 98421 22345',
      address: 'Kitchen Gate 1, Gandhipuram, Coimbatore - 641012',
      location: 'Gandhipuram, Coimbatore',
      timeSlot: 'Today, by 11:30 AM'
    },
    telemetry: {
      distanceKm: 34.5,
      speedKmh: 42,
      batteryPct: 82,
      etaMinutes: 28,
      origin: 'Pollachi Farm Gate',
      destination: 'Gandhipuram Hotel Kitchen'
    },
    deliveryPin: '4892', // The exact secret handshake PIN matching buyer track
    haulageEarnings: {
      baseFare: 250,
      distanceRate: 12, // ₹12/km
      distanceKm: 34.5,
      handlingBonus: 80,
      totalEarnings: 744,
      payoutStatus: 'ESCROW_HELD' // 'ESCROW_HELD' | 'PAID'
    },
    createdAt: '2026-11-04T06:00:00.000Z'
  },
  {
    tripId: 'TRIP-2026-2277',
    orderId: 'ORD-2277',
    requestId: 'REQ-2026-42277',
    status: 'CONFIRMED',
    priority: 'NORMAL',
    tripType: 'HUB_TRANSFER',
    cropName: 'Red Onion (Chinna Vengayam)',
    tamilCropName: 'சின்ன வெங்காயம்',
    cropImage: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    quantityKg: 100,
    cratesCount: 5,
    totalProduceValue: 5500,
    pickup: {
      farmName: 'Oddanchatram Organic Fields',
      farmerName: 'P. Murugesan',
      farmerPhone: '+91 94432 89123',
      address: 'Oddanchatram Valley Farm, Dindigul',
      village: 'Oddanchatram',
      district: 'Dindigul',
      pincode: '624619',
      gps: '10.4856° N, 77.7472° E',
      timeSlot: 'Afternoon Route (01:30 PM - 03:00 PM)'
    },
    dropoff: {
      buyerName: 'Grand Palace Luxury Dining',
      contactPerson: 'Mr. S. Rajesh (Procurement Head)',
      buyerPhone: '+91 98401 23456',
      address: 'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016',
      location: 'Bypass Road, Madurai',
      timeSlot: 'Today, by 05:00 PM'
    },
    telemetry: {
      distanceKm: 58.0,
      speedKmh: 45,
      batteryPct: 65,
      etaMinutes: 65,
      origin: 'Oddanchatram Hub',
      destination: 'Madurai Hotel Receiving'
    },
    deliveryPin: '2277',
    haulageEarnings: {
      baseFare: 280,
      distanceRate: 12,
      distanceKm: 58.0,
      handlingBonus: 100,
      totalEarnings: 1076,
      payoutStatus: 'ESCROW_HELD'
    },
    createdAt: '2026-11-04T07:15:00.000Z'
  },
  {
    tripId: 'TRIP-2026-0098',
    orderId: 'ORD-0098',
    requestId: 'REQ-2026-00098',
    status: 'DELIVERED',
    priority: 'COMPLETED',
    tripType: 'FARM_GATE_DIRECT',
    cropName: 'Hill Country Carrots',
    tamilCropName: 'ஊட்டி மலை கேரட்',
    cropImage: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=600&auto=format&fit=crop&q=80',
    quantityKg: 100,
    cratesCount: 4,
    totalProduceValue: 4500,
    pickup: {
      farmName: 'Kodaikanal Terrace Harvests',
      farmerName: 'K. Selvam',
      farmerPhone: '+91 98428 33412',
      address: 'Poombarai Terrace, Kodaikanal, Dindigul',
      village: 'Poombarai',
      district: 'Dindigul'
    },
    dropoff: {
      buyerName: 'Green Basket Supermarket',
      contactPerson: 'K. Priya (Procurement)',
      buyerPhone: '+91 94432 99881',
      address: 'Warehouse Bay 3, RS Puram, Coimbatore',
      location: 'RS Puram, Coimbatore'
    },
    deliveryPin: '7721',
    verifiedPin: '7721',
    deliveredAt: 'Yesterday, 04:15 PM',
    haulageEarnings: {
      baseFare: 250,
      distanceRate: 12,
      distanceKm: 42.0,
      handlingBonus: 80,
      totalEarnings: 834,
      payoutStatus: 'PAID'
    },
    createdAt: '2026-11-03T11:00:00.000Z'
  }
];

export const EV_HUBS = [
  { id: 'hub-01', name: 'Dindigul Central Hub', chargers: 8, available: 3 },
  { id: 'hub-02', name: 'Oddanchatram Agri Hub', chargers: 12, available: 6 },
  { id: 'hub-03', name: 'Pollachi Gate EV Station', chargers: 6, available: 2 },
  { id: 'hub-04', name: 'Madurai Ring Logistics Hub', chargers: 10, available: 5 }
];

