// What this file does: Seed mock and synthetic demonstration data for the Farmer Module.
// Follows realistic Tamil Nadu agro-climatic zones, commercial produce lots, and verified buyers.

export const INITIAL_FARMER_PROFILE = {
  farmerId: 'FMR-TN-2026-01',
  name: 'Ramesh Kumar',
  email: 'ramesh.kumar@naamuzhavar.com',
  phone: '+91 94432 78190',
  avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80',
  rating: 4.92,
  totalHarvests: 54,
  isVerified: true,
  role: 'farmer',
  // Section 1: Farm / Land Address
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
  // Section 2: Residential / Personal Address
  residentialDetails: {
    address: '12/4, South Thottam Street, Kinathukadavu',
    village: 'Pollachi',
    taluk: 'Pollachi Taluk',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '642001',
    sameAsFarm: false
  },
  // Section 3: Direct Bank Details (masked by default)
  bankDetails: {
    accountHolderName: 'Ramesh Kumar',
    bankName: 'State Bank of India',
    accountNumber: '30495821034',
    ifscCode: 'SBIN0001248',
    branchName: 'Pollachi Bazaar Branch',
    accountType: 'Savings'
  }
};

export const INITIAL_FARMER_CROPS = [
  {
    id: 'crop-fmr-01',
    name: 'Country Tomato',
    tamilName: 'நாட்டு தக்காளி',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Hybrid Tomato',
    farmingMethod: 'Natural',
    pricePerKg: 28,
    availableKg: 500,
    unit: 'Kg',
    priceUnit: 'per Kg',
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
    },
    createdAt: '2026-10-30T06:00:00.000Z'
  },
  {
    id: 'crop-fmr-02',
    name: 'Dindigul Red Onion',
    tamilName: 'திண்டுக்கல் வெங்காயம்',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Small Shallot (Chinna Vengayam)',
    farmingMethod: 'Organic',
    pricePerKg: 55,
    availableKg: 350,
    unit: 'Kg',
    priceUnit: 'per Kg',
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
    },
    createdAt: '2026-10-29T10:00:00.000Z'
  },
  {
    id: 'crop-fmr-03',
    name: 'Batlagundu Potato',
    tamilName: 'பட்லகுண்டு உருளைக்கிழங்கு',
    category: 'tubers',
    grade: 'Grade A',
    variety: 'Kufri Jyoti Table',
    farmingMethod: 'Natural',
    pricePerKg: 32,
    availableKg: 450,
    unit: 'Kg',
    priceUnit: 'per Kg',
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
    },
    createdAt: '2026-10-31T04:00:00.000Z'
  },
  {
    id: 'crop-fmr-04',
    name: 'Ooty Country Carrot',
    tamilName: 'ஊட்டி மலை கேரட்',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Kuroda Sweet',
    farmingMethod: 'Conventional',
    pricePerKg: 42,
    availableKg: 300,
    unit: 'Kg',
    priceUnit: 'per Kg',
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
    },
    createdAt: '2026-10-28T08:00:00.000Z'
  }
];

export const FIVE_DISTINCT_BUYERS = [
  {
    businessName: 'Grand Palace Luxury Dining',
    contactPerson: 'Mr. S. Rajesh (Procurement Head)',
    buyerType: 'Hotel & Commercial Kitchen',
    phone: '+91 98401 23456',
    email: 'procurement@grandpalace.in',
    location: 'Bypass Road, Madurai - 625016',
    address: 'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80',
    verified: true
  },
  {
    businessName: 'Sri Lakshmi Hotels',
    contactPerson: 'M. Senthil Nathan',
    buyerType: 'Hotel & Restaurant Chain',
    phone: '+91 98421 22345',
    email: 'procurement@srilakshmihotels.com',
    location: 'Gandhipuram, Coimbatore',
    address: 'Sri Lakshmi Hotels Kitchen Gate 1, Gandhipuram, Coimbatore',
    avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=80',
    verified: true
  },
  {
    businessName: 'Green Basket Supermarket',
    contactPerson: 'K. Priya (Procurement)',
    buyerType: 'Retail Supermarket Chain',
    phone: '+91 94432 99881',
    email: 'orders@greenbasket.in',
    location: 'RS Puram, Coimbatore',
    address: 'Green Basket Warehouse Bay 3, RS Puram, Coimbatore',
    avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
    verified: true
  },
  {
    businessName: 'Annapoorna Hospitality',
    contactPerson: 'R. Sundaram (F&B Director)',
    buyerType: 'Heritage Restaurant & Catering',
    phone: '+91 98433 11220',
    email: 'sundaram@annapoorna.in',
    location: 'R.S. Puram, Coimbatore',
    address: 'Annapoorna Central Kitchen, 75 East Arokiasamy Rd, R.S. Puram, Coimbatore',
    avatar: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&auto=format&fit=crop&q=80',
    verified: true
  },
  {
    businessName: 'Fresh Mart Wholesale',
    contactPerson: 'R. Venkatesh (Wholesale Lead)',
    buyerType: 'Wholesale Produce Distributor',
    phone: '+91 97892 44109',
    email: 'procure@freshmart.com',
    location: 'Singanallur, Coimbatore',
    address: 'Singanallur Wholesale Yard, Coimbatore',
    avatar: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80',
    verified: true
  }
];

export const INITIAL_FARMER_REQUESTS = [
  {
    id: 'req-001',
    requestId: 'REQ-2026-42277',
    cropId: 'crop-fmr-01',
    cropName: 'Organic Country Tomatoes (Naatu Thakkali)',
    tamilCropName: 'நாட்டு தக்காளி',
    cropDetails: {
      name: 'Organic Country Tomatoes (Naatu Thakkali)',
      nameTa: 'நாட்டு தக்காளி',
      category: 'vegetables',
      variety: 'Hybrid Organic Tomato',
      grade: 'Grade A',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
    },
    buyerDetails: { ...FIVE_DISTINCT_BUYERS[0] },
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    quantity: 200,
    unit: 'Kg',
    offeredPrice: 38,
    totalEstimatedValue: 7600,
    preferredDeliveryDate: '2026-11-04',
    deliveryLocation: 'Grand Palace Kitchen Receiving Dock, Madurai',
    notes: 'Fresh table-grade red tomatoes required for banquet kitchens.',
    status: 'PENDING',
    createdAt: '2026-11-01T09:00:00.000Z'
  },
  {
    id: 'req-002',
    requestId: 'REQ-2026-78192',
    cropId: 'crop-fmr-01',
    cropName: 'Country Tomato',
    tamilCropName: 'நாட்டு தக்காளி',
    cropDetails: {
      name: 'Country Tomato',
      nameTa: 'நாட்டு தக்காளி',
      category: 'vegetables',
      variety: 'Hybrid Tomato',
      grade: 'Grade A',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
    },
    buyerDetails: { ...FIVE_DISTINCT_BUYERS[1] },
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    quantity: 200,
    unit: 'Kg',
    offeredPrice: 28,
    totalEstimatedValue: 5600,
    preferredDeliveryDate: '2026-11-03',
    deliveryLocation: 'Sri Lakshmi Hotels Kitchen Gate 1, Gandhipuram, Coimbatore',
    notes: 'Require freshly harvested red table-grade tomatoes. Morning dispatch preferred.',
    status: 'CONVERTED_TO_ORDER',
    orderId: 'ORD-8095',
    createdAt: '2026-10-31T08:30:00.000Z'
  },
  {
    id: 'req-003',
    requestId: 'REQ-2026-64301',
    cropId: 'crop-fmr-04',
    cropName: 'Ooty Country Carrot',
    tamilCropName: 'ஊட்டி மலை கேரட்',
    cropDetails: {
      name: 'Ooty Country Carrot',
      nameTa: 'ஊட்டி மலை கேரட்',
      category: 'vegetables',
      variety: 'Kuroda Sweet',
      grade: 'Grade A',
      image: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=600&auto=format&fit=crop&q=80'
    },
    buyerDetails: { ...FIVE_DISTINCT_BUYERS[2] },
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    quantity: 100,
    unit: 'Kg',
    offeredPrice: 42,
    totalEstimatedValue: 4200,
    preferredDeliveryDate: '2026-11-04',
    deliveryLocation: 'Green Basket Warehouse Bay 3, RS Puram, Coimbatore',
    notes: 'Washed and graded carrots only.',
    status: 'PENDING',
    createdAt: '2026-10-31T06:15:00.000Z'
  },
  {
    id: 'req-004',
    requestId: 'REQ-2026-38914',
    cropId: 'crop-fmr-02',
    cropName: 'Red Onion (Chinna Vengayam)',
    tamilCropName: 'சின்ன வெங்காயம்',
    cropDetails: {
      name: 'Red Onion (Chinna Vengayam)',
      nameTa: 'சின்ன வெங்காயம்',
      category: 'vegetables',
      variety: 'Bellary & Shallot Mix',
      grade: 'Grade A',
      image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80'
    },
    buyerDetails: { ...FIVE_DISTINCT_BUYERS[3] },
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    quantity: 150,
    unit: 'Kg',
    offeredPrice: 55,
    totalEstimatedValue: 8250,
    preferredDeliveryDate: '2026-11-04',
    deliveryLocation: 'Annapoorna Central Kitchen, 75 East Arokiasamy Rd, R.S. Puram, Coimbatore',
    notes: 'Quality graded dry shallots for daily restaurant operations.',
    status: 'PENDING',
    createdAt: '2026-10-30T18:00:00.000Z'
  },
  {
    id: 'req-005',
    requestId: 'REQ-2026-51209',
    cropId: 'crop-fmr-03',
    cropName: 'Batlagundu Potato',
    tamilCropName: 'பட்லகுண்டு உருளைக்கிழங்கு',
    cropDetails: {
      name: 'Batlagundu Potato',
      nameTa: 'பட்லகுண்டு உருளைக்கிழங்கு',
      category: 'tubers',
      variety: 'Kufri Jyoti Table',
      grade: 'Grade A',
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80'
    },
    buyerDetails: { ...FIVE_DISTINCT_BUYERS[4] },
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    quantity: 500,
    unit: 'Kg',
    offeredPrice: 32,
    totalEstimatedValue: 16000,
    preferredDeliveryDate: '2026-11-02',
    deliveryLocation: 'Singanallur Wholesale Yard, Coimbatore',
    notes: 'Bulk consignment for daily retail dispatch.',
    status: 'CONVERTED_TO_ORDER',
    orderId: 'ORD-4821',
    createdAt: '2026-10-30T14:00:00.000Z'
  }
];

export const INITIAL_FARMER_ORDERS = [
  {
    id: 'ord-fmr-00',
    orderId: 'ORD-8095',
    requestId: 'REQ-2026-78192',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    buyerName: 'Sri Lakshmi Hotels',
    cropName: 'Country Tomato',
    cropDetails: {
      name: 'Country Tomato',
      nameTa: 'நாட்டு தக்காளி',
      grade: 'Grade A',
      variety: 'Hybrid Tomato',
      pricePerKg: 28,
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      hub: 'Pollachi Hub'
    },
    quantityKg: 200,
    quantity: 200,
    unit: 'Kg',
    pricePerUnit: 28,
    offeredPrice: 28,
    totalPrice: 5600,
    totalEstimatedValue: 5600,
    orderStatus: 'CONFIRMED',
    deliveryStatus: 'READY_FOR_PICKUP',
    status: 'READY_FOR_PICKUP',
    paymentStatus: 'PENDING',
    pickupDate: '2026-11-03',
    preferredDeliveryDate: '2026-11-03',
    deliveryAddress: 'Sri Lakshmi Hotels Kitchen Gate 1, Gandhipuram, Coimbatore',
    deliveryLocation: 'Sri Lakshmi Hotels Kitchen Gate 1, Gandhipuram, Coimbatore',
    buyerDetails: {
      businessName: 'Sri Lakshmi Hotels',
      contactPerson: 'M. Senthil Nathan',
      buyerType: 'Hotel & Commercial Kitchen',
      phone: '+91 98421 22345',
      email: 'procurement@srilakshmihotels.com',
      address: 'Sri Lakshmi Hotels Kitchen Gate 1, Gandhipuram, Coimbatore',
      location: 'Gandhipuram, Coimbatore',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80'
    },
    driver: {
      name: 'Kumar M.',
      vehicle: 'Tata Ace EV Cargo (TN 57 AB 1234)',
      phone: '+91 94432 11098',
      deliveryPin: '4892'
    },
    createdAt: '2026-10-31T08:30:00.000Z'
  },
  {
    id: 'ord-fmr-01',
    orderId: 'ORD-4821',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    buyerName: 'Fresh Mart Wholesale',
    cropName: 'Batlagundu Potato',
    cropDetails: {
      name: 'Batlagundu Potato',
      nameTa: 'பட்லகுண்டு உருளைக்கிழங்கு',
      grade: 'Grade A',
      variety: 'Kufri Jyoti Table',
      pricePerKg: 32,
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
      hub: 'Batlagundu Hub'
    },
    quantityKg: 500,
    unit: 'Kg',
    pricePerUnit: 32,
    totalPrice: 16000,
    orderStatus: 'CONFIRMED',
    deliveryStatus: 'READY_FOR_PICKUP',
    status: 'READY_FOR_PICKUP',
    paymentStatus: 'PENDING',
    pickupDate: '2026-11-02',
    preferredDeliveryDate: '2026-11-02',
    deliveryAddress: 'Singanallur Wholesale Yard, Coimbatore - 641005',
    buyerDetails: {
      businessName: 'Fresh Mart Wholesale',
      contactPerson: 'R. Venkatesh',
      buyerType: 'Wholesale Distributor',
      phone: '+91 98940 11223',
      email: 'procure@freshmart.com',
      address: 'Singanallur Wholesale Yard, Coimbatore - 641005',
      avatar: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&auto=format&fit=crop&q=80'
    },
    driver: {
      name: 'Kumar M.',
      vehicle: 'Tata Ace EV Cargo (TN 57 AB 1234)',
      phone: '+91 94432 11098',
      deliveryPin: '4892'
    },
    statusHistory: [
      { status: 'Order Placed', timestamp: '2026-10-30T14:00:00.000Z', note: 'Buyer submitted purchase request' },
      { status: 'Accepted by Farmer', timestamp: '2026-10-30T15:20:00.000Z', note: 'Farmer verified 500 Kg stock and accepted request' },
      { status: 'Ready for Pickup', timestamp: '2026-10-31T07:00:00.000Z', note: 'Produce packaged and staged at Pollachi farm gate' }
    ],
    notes: 'Bulk consignment for daily retail dispatch.',
    createdAt: '2026-10-30T14:00:00.000Z'
  },
  {
    id: 'ord-fmr-02',
    orderId: 'ORD-3918',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    buyerName: 'Sri Lakshmi Hotels',
    cropName: 'Country Tomato',
    cropDetails: {
      name: 'Country Tomato',
      nameTa: 'நாட்டு தக்காளி',
      grade: 'Grade A',
      variety: 'Hybrid Tomato',
      pricePerKg: 30,
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      hub: 'Pollachi Hub'
    },
    quantityKg: 300,
    unit: 'Kg',
    pricePerUnit: 30,
    totalPrice: 9000,
    orderStatus: 'CONFIRMED',
    deliveryStatus: 'DELIVERED',
    status: 'DELIVERED',
    paymentStatus: 'RELEASED_TO_FARMER',
    pickupDate: '2026-10-28',
    preferredDeliveryDate: '2026-10-28',
    deliveryAddress: 'Sri Lakshmi Hotels Kitchen Gate 1, Gandhipuram, Coimbatore',
    buyerDetails: {
      businessName: 'Sri Lakshmi Hotels',
      contactPerson: 'M. Senthil Nathan',
      buyerType: 'Hotel & Commercial Kitchen',
      phone: '+91 98421 22345',
      email: 'procurement@srilakshmihotels.com',
      address: 'Sri Lakshmi Hotels, Gandhipuram, Coimbatore',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80'
    },
    driver: {
      name: 'S. Arumugam',
      vehicle: 'Mahindra Zor Grand EV (TN 45 EF 5678)',
      phone: '+91 98423 44556',
      deliveryPin: '3190'
    },
    statusHistory: [
      { status: 'Order Placed', timestamp: '2026-10-27T08:00:00.000Z', note: 'Purchase request accepted' },
      { status: 'Dispatched', timestamp: '2026-10-28T05:30:00.000Z', note: 'EV cargo picked up consignment' },
      { status: 'Delivered', timestamp: '2026-10-28T09:15:00.000Z', note: 'Received at Coimbatore kitchen gate' }
    ],
    notes: 'Weekly commercial kitchen supply.',
    createdAt: '2026-10-27T08:00:00.000Z'
  },
  {
    id: 'ord-fmr-03',
    orderId: 'ORD-2184',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    buyerName: 'Green Basket Supermarket',
    cropName: 'Dindigul Red Onion',
    cropDetails: {
      name: 'Dindigul Red Onion',
      nameTa: 'திண்டுக்கல் வெங்காயம்',
      grade: 'Grade A',
      variety: 'Small Shallot',
      pricePerKg: 52,
      image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
      hub: 'Oddanchatram Hub'
    },
    quantityKg: 250,
    unit: 'Kg',
    pricePerUnit: 52,
    totalPrice: 13000,
    orderStatus: 'CONFIRMED',
    deliveryStatus: 'DELIVERED',
    status: 'DELIVERED',
    paymentStatus: 'RELEASED_TO_FARMER',
    pickupDate: '2026-10-22',
    preferredDeliveryDate: '2026-10-22',
    deliveryAddress: 'Green Basket Central Depot, RS Puram, Coimbatore',
    buyerDetails: {
      businessName: 'Green Basket Supermarket',
      contactPerson: 'K. Priya',
      buyerType: 'Retail Supermarket Chain',
      phone: '+91 94432 99881',
      email: 'orders@greenbasket.in',
      address: 'RS Puram, Coimbatore',
      avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80'
    },
    driver: {
      name: 'V. Prakash',
      vehicle: 'Piaggio Ape E-Xtra (TN 43 CD 9012)',
      phone: '+91 97890 88990',
      deliveryPin: '5812'
    },
    statusHistory: [
      { status: 'Delivered', timestamp: '2026-10-22T10:30:00.000Z', note: 'Quality grading confirmed and stock received' }
    ],
    notes: 'Clean dried shallots.',
    createdAt: '2026-10-21T14:20:00.000Z'
  }
];
