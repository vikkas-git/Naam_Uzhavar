// What this file does: Seed mock data for crops, hub consignments, active orders, and chat messages.

/**
 * Seed data for Buyer Feature: Today's Hub Fresh Produce & Consignments
 */

export const INITIAL_CROPS = [
  // ==========================================
  // 1. TOMATO (தக்காளி)
  // ==========================================
  {
    id: 'crop-tomato-01',
    name: 'Country Tomato',
    tamilName: 'நாட்டு தக்காளி',
    category: 'vegetables',
    grade: 'Grade A',
    gradeDesc: 'Firm, uniform size, certified fresh table harvest',
    pricePerKg: 32,
    availableKg: 500,
    minOrderKg: 50,
    location: 'Dindigul Central',
    hubName: 'Dindigul Central',
    hubCode: 'DGL-LOC-01',
    distanceKm: 12,
    harvestTime: 'Today, 04:30 AM',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'Ravi Kumar',
      farmerId: 'FMR-TN-4821',
      village: 'Siluvathur, Dindigul',
      phone: '+91 98421 78210',
      rating: 4.9,
      totalHarvests: 142
    },
    popular: true
  },
  {
    id: 'crop-tomato-b-16',
    name: 'Oddanchatram Fresh Salad Tomatoes',
    tamilName: 'சாலட் தக்காளி (கிரேடு B)',
    category: 'vegetables',
    grade: 'Grade B',
    gradeDesc: 'Medium size, rich red color, ideal for restaurants & daily culinary use',
    pricePerKg: 27,
    availableKg: 650,
    minOrderKg: 50,
    location: 'Oddanchatram',
    hubName: 'Oddanchatram',
    hubCode: 'DGL-LOC-02',
    distanceKm: 28,
    harvestTime: 'Today, 05:00 AM',
    image: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'P. Murugesan',
      farmerId: 'FMR-TN-3104',
      village: 'Oddanchatram, Dindigul',
      phone: '+91 94432 89123',
      rating: 4.88,
      totalHarvests: 104
    },
    popular: true
  },
  {
    id: 'crop-tomato-c-11',
    name: 'Farm Bulk Gravy Tomatoes',
    tamilName: 'நாட்டு தக்காளி (கிரேடு C)',
    category: 'vegetables',
    grade: 'Grade C',
    gradeDesc: 'Ripe, juicy, high pulp ideal for restaurant curries & sambar',
    pricePerKg: 20,
    availableKg: 750,
    minOrderKg: 50,
    location: 'Dindigul Central',
    hubName: 'Dindigul Central',
    hubCode: 'DGL-LOC-01',
    distanceKm: 14,
    harvestTime: 'Today, 05:15 AM',
    image: 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'M. Chinnasamy',
      farmerId: 'FMR-TN-4190',
      village: 'Reddiarchatram, Dindigul',
      phone: '+91 97892 44109',
      rating: 4.88,
      totalHarvests: 110
    },
    popular: true
  },

  // ==========================================
  // 2. ONION (வெங்காயம்)
  // ==========================================
  {
    id: 'crop-onion-02',
    name: 'Small Shallots (Chinna Vengayam)',
    tamilName: 'சின்ன வெங்காயம்',
    category: 'vegetables',
    grade: 'Grade A',
    gradeDesc: 'Sun-cured, pungent, dry skin, certified export grade',
    pricePerKg: 58,
    availableKg: 400,
    minOrderKg: 50,
    location: 'Oddanchatram',
    hubName: 'Oddanchatram',
    hubCode: 'DGL-LOC-02',
    distanceKm: 28,
    harvestTime: 'Today, 05:00 AM',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'P. Murugesan',
      farmerId: 'FMR-TN-3104',
      village: 'Oddanchatram, Dindigul',
      phone: '+91 94432 89123',
      rating: 4.8,
      totalHarvests: 98
    },
    popular: true
  },
  {
    id: 'crop-onion-ab-19',
    name: 'Palani Farm Red Onions Lot',
    tamilName: 'பெரிய வெங்காயம் (கிரேடு B)',
    category: 'vegetables',
    grade: 'Grade B',
    gradeDesc: 'Hand-graded combination of salad shallots and bulk hotel onions',
    pricePerKg: 38,
    availableKg: 700,
    minOrderKg: 60,
    location: 'Palani',
    hubName: 'Palani',
    hubCode: 'DGL-LOC-04',
    distanceKm: 38,
    harvestTime: 'Yesterday, 05:30 PM',
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'M. Ramasamy',
      farmerId: 'FMR-TN-1940',
      village: 'Ayakudi, Palani, Dindigul',
      phone: '+91 97891 66543',
      rating: 4.75,
      totalHarvests: 90
    },
    popular: false
  },
  {
    id: 'crop-bellary-c-14',
    name: 'Commercial Bellary Onions',
    tamilName: 'பெரிய வெங்காயம் (கிரேடு C)',
    category: 'vegetables',
    grade: 'Grade C',
    gradeDesc: 'Large utility size, ideal for bulk hotel chopping and frying',
    pricePerKg: 26,
    availableKg: 950,
    minOrderKg: 80,
    location: 'Oddanchatram',
    hubName: 'Oddanchatram',
    hubCode: 'DGL-LOC-02',
    distanceKm: 28,
    harvestTime: 'Yesterday, 06:00 PM',
    image: 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'V. Ramanathan',
      farmerId: 'FMR-TN-3882',
      village: 'Oddanchatram, Dindigul',
      phone: '+91 97894 12390',
      rating: 4.82,
      totalHarvests: 140
    },
    popular: false
  },

  // ==========================================
  // 3. POTATO (உருளைக்கிழங்கு)
  // ==========================================
  {
    id: 'crop-potato-a-23',
    name: 'Kodaikanal Golden Hill Potatoes',
    tamilName: 'கொடைக்கானல் உருளைக்கிழங்கு (கிரேடு A)',
    category: 'vegetables',
    grade: 'Grade A',
    gradeDesc: 'Smooth skin, unblemished, crisp high-altitude sweet harvest',
    pricePerKg: 36,
    availableKg: 620,
    minOrderKg: 40,
    location: 'Kodaikanal',
    hubName: 'Kodaikanal',
    hubCode: 'DGL-LOC-03',
    distanceKm: 45,
    harvestTime: 'Today, 04:45 AM',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'K. Selvam',
      farmerId: 'FMR-TN-5529',
      village: 'Poombarai, Kodaikanal, Dindigul',
      phone: '+91 98428 33412',
      rating: 4.95,
      totalHarvests: 215
    },
    popular: true
  },
  {
    id: 'crop-potato-04',
    name: 'Palani Fresh Potatoes',
    tamilName: 'உருளைக்கிழங்கு (கிரேடு B)',
    category: 'vegetables',
    grade: 'Grade B',
    gradeDesc: 'Medium size, ideal for gravies & fries',
    pricePerKg: 28,
    availableKg: 800,
    minOrderKg: 100,
    location: 'Palani',
    hubName: 'Palani',
    hubCode: 'DGL-LOC-04',
    distanceKm: 38,
    harvestTime: 'Yesterday, 05:00 PM',
    image: 'https://images.unsplash.com/photo-1508313880080-c4bef0730395?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'M. Ramasamy',
      farmerId: 'FMR-TN-1940',
      village: 'Ayakudi, Palani, Dindigul',
      phone: '+91 97891 66543',
      rating: 4.7,
      totalHarvests: 85
    },
    popular: false
  },
  {
    id: 'crop-potato-c-24',
    name: 'Batlagundu Commercial Gravy Potatoes',
    tamilName: 'உருளைக்கிழங்கு (கிரேடு C)',
    category: 'vegetables',
    grade: 'Grade C',
    gradeDesc: 'High-starch commercial utility grade, ideal for bulk hotel curries & samosa fillings',
    pricePerKg: 22,
    availableKg: 850,
    minOrderKg: 60,
    location: 'Batlagundu',
    hubName: 'Batlagundu',
    hubCode: 'DGL-LOC-07',
    distanceKm: 32,
    harvestTime: 'Today, 06:10 AM',
    image: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'T. Meenakshi',
      farmerId: 'FMR-TN-7734',
      village: 'Batlagundu, Dindigul',
      phone: '+91 98422 45678',
      rating: 4.92,
      totalHarvests: 98
    },
    popular: false
  },

  // ==========================================
  // 4. CARROT (கேரட்)
  // ==========================================
  {
    id: 'crop-carrot-ac-17',
    name: 'Kodaikanal Sweet Crisp Carrots',
    tamilName: 'மலை கேரட் (கிரேடு A)',
    category: 'vegetables',
    grade: 'Grade A',
    gradeDesc: 'Crisp, washed, high sweetness mountain harvest',
    pricePerKg: 34,
    availableKg: 520,
    minOrderKg: 40,
    location: 'Kodaikanal',
    hubName: 'Kodaikanal',
    hubCode: 'DGL-LOC-03',
    distanceKm: 45,
    harvestTime: 'Today, 04:30 AM',
    image: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'K. Selvam',
      farmerId: 'FMR-TN-5529',
      village: 'Poombarai, Kodaikanal, Dindigul',
      phone: '+91 98428 33412',
      rating: 4.95,
      totalHarvests: 215
    },
    popular: true
  },
  {
    id: 'crop-carrot-03',
    name: 'Hill Country Carrots',
    tamilName: 'நாட்டு கேரட் (கிரேடு B)',
    category: 'vegetables',
    grade: 'Grade B',
    gradeDesc: 'Crisp, washed, sweet salad & culinary grade',
    pricePerKg: 30,
    availableKg: 350,
    minOrderKg: 40,
    location: 'Kodaikanal',
    hubName: 'Kodaikanal',
    hubCode: 'DGL-LOC-03',
    distanceKm: 45,
    harvestTime: 'Today, 04:00 AM',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'K. Selvam',
      farmerId: 'FMR-TN-5529',
      village: 'Poombarai, Kodaikanal, Dindigul',
      phone: '+91 98428 33412',
      rating: 4.95,
      totalHarvests: 210
    },
    popular: false
  },
  {
    id: 'crop-carrot-c-15',
    name: 'Batlagundu Commercial Table Carrots',
    tamilName: 'சமையல் கேரட் (கிரேடு C)',
    category: 'vegetables',
    grade: 'Grade C',
    gradeDesc: 'Fresh culinary grade for bulk sambar, fried rice & restaurant preparation',
    pricePerKg: 24,
    availableKg: 600,
    minOrderKg: 50,
    location: 'Batlagundu',
    hubName: 'Batlagundu',
    hubCode: 'DGL-LOC-07',
    distanceKm: 32,
    harvestTime: 'Today, 05:20 AM',
    image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=600&auto=format&fit=crop&q=80',
    farmer: {
      name: 'T. Meenakshi',
      farmerId: 'FMR-TN-7734',
      village: 'Batlagundu, Dindigul',
      phone: '+91 98422 45678',
      rating: 4.92,
      totalHarvests: 95
    },
    popular: false
  }
];

export const INITIAL_ORDERS = [
  {
    orderId: 'NU-2026-00124',
    cropName: 'Country Tomato',
    tamilCropName: 'நாட்டு தக்காளி',
    grade: 'Grade A',
    quantityKg: 200,
    unitPrice: 32,
    totalPrice: 6400,
    orderTime: 'Today, 08:30 AM',
    orderStatus: 'CONFIRMED',
    deliveryStatus: 'IN_TRANSIT',
    status: 'in_transit', // 'confirmed' | 'preparing' | 'dispatched' | 'in_transit' | 'delivered'
    buyerName: 'Grand Palace Luxury Dining',
    deliveryAddress: 'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016',
    preferredDeliveryDate: 'Today',
    notes: 'Deliver to kitchen receiving dock gate 2.',
    location: 'Dindigul Central',
    hub: 'Dindigul Central',
    farmer: {
      name: 'Ravi Kumar',
      phone: '+91 98421 78210',
      location: 'Siluvathur, Dindigul'
    },
    driver: {
      name: 'Kumar M.',
      phone: '+91 94432 11098',
      vehicleType: 'Tata Ace EV Cargo',
      vehicleNumber: 'TN 57 AB 1234',
      rating: 4.9,
      capacityKg: 500,
      deliveryPin: '4892'
    },
    liveTracking: {
      currentStatus: 'Vehicle is on the way',
      currentLocation: 'Near Samayanallur Bypass',
      estimatedMinutes: 25,
      distanceKm: 12.4,
      lastUpdated: 'Just now',
      speedKmh: 42,
      batteryPct: 84,
      origin: 'Dindigul Central',
      destination: 'Grand Palace Hotel, Bypass Road, Madurai'
    }
  },
  {
    orderId: 'NU-2026-00119',
    cropName: 'Small Shallots (Chinna Vengayam)',
    tamilCropName: 'சின்ன வெங்காயம்',
    grade: 'Grade A',
    quantityKg: 150,
    unitPrice: 58,
    totalPrice: 8700,
    orderTime: 'Today, 06:15 AM',
    orderStatus: 'CONFIRMED',
    deliveryStatus: 'PICKED_UP',
    status: 'preparing',
    buyerName: 'Annapoorna Hospitality',
    deliveryAddress: 'Annapoorna Central Kitchen, 75 East Arokiasamy Rd, R.S. Puram, Coimbatore',
    preferredDeliveryDate: 'Today',
    notes: 'Grade A dry shallots only.',
    location: 'Oddanchatram',
    hub: 'Oddanchatram',
    farmer: {
      name: 'P. Murugesan',
      phone: '+91 94432 89123',
      location: 'Oddanchatram, Dindigul'
    },
    driver: {
      name: 'S. Arumugam',
      phone: '+91 98423 44556',
      vehicleType: 'Mahindra Zor Grand EV',
      vehicleNumber: 'TN 45 EF 5678',
      rating: 4.85,
      capacityKg: 600,
      deliveryPin: '3190'
    },
    liveTracking: {
      currentStatus: 'Quality grading completed, loading into EV vehicle',
      currentLocation: 'Oddanchatram Loading Bay 2',
      estimatedMinutes: 65,
      distanceKm: 38.2,
      lastUpdated: '5 mins ago',
      speedKmh: 0,
      batteryPct: 96,
      origin: 'Oddanchatram, Dindigul',
      destination: 'Grand Palace Hotel, Madurai'
    }
  },
  {
    orderId: 'NU-2026-00098',
    cropName: 'Hill Country Carrots',
    tamilCropName: 'மலை கேரட்',
    grade: 'Grade A',
    quantityKg: 100,
    unitPrice: 45,
    totalPrice: 4500,
    orderTime: 'Yesterday, 02:40 PM',
    orderStatus: 'CONFIRMED',
    deliveryStatus: 'DELIVERED',
    status: 'delivered',
    buyerName: 'Green Basket Supermarket',
    deliveryAddress: 'Green Basket Warehouse Bay 3, RS Puram, Coimbatore',
    preferredDeliveryDate: 'Yesterday',
    notes: '',
    location: 'Kodaikanal',
    hub: 'Kodaikanal',
    farmer: {
      name: 'K. Selvam',
      phone: '+91 98428 33412',
      location: 'Poombarai, Kodaikanal, Dindigul'
    },
    driver: {
      name: 'V. Prakash',
      phone: '+91 97890 88990',
      vehicleType: 'Tata Ace EV Cargo',
      vehicleNumber: 'TN 43 CD 9012',
      rating: 4.95,
      capacityKg: 500,
      deliveryPin: '7721'
    },
    liveTracking: {
      currentStatus: 'Delivered and Verified at Gate 2',
      currentLocation: 'Grand Palace Hotel, Madurai',
      estimatedMinutes: 0,
      distanceKm: 0,
      lastUpdated: 'Yesterday, 04:55 PM',
      speedKmh: 0,
      batteryPct: 62,
      origin: 'Kodaikanal, Dindigul',
      destination: 'Grand Palace Hotel, Madurai'
    }
  }
];

export const INITIAL_MESSAGES = [
  {
    id: 'm1',
    sender: 'Driver Kumar M.',
    role: 'EV Delivery Driver',
    time: '09:12 AM',
    text: 'Good morning sir, produce picked from Dindigul Central. Crossed Samayanallur Bypass. Expected arrival at Kitchen Gate 2 in 25 minutes.',
    isDriver: true
  },
  {
    id: 'm2',
    sender: 'Farmer Ravi Kumar',
    role: 'Tomato Grower (Siluvathur)',
    time: '08:45 AM',
    text: 'Vanakkam sir, today harvest is premium Grade A country tomatoes, crate packed carefully. Thank you for direct acceptance.',
    isDriver: false
  }
];
