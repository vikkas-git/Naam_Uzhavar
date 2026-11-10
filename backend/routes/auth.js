// routes/auth.js - Authentication routes for Commercial Buyers and Agricultural Farmers
// Viva Note: Uses bcryptjs to salt and hash passwords and jsonwebtoken for stateless auth across roles.
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Buyer = require('../models/Buyer');
const Farmer = require('../models/Farmer');
const authMiddleware = require('../middleware/auth');

// Helper to generate a 7-day JWT token for Buyer
const generateBuyerToken = (buyerId) => {
  return jwt.sign(
    { id: buyerId, role: 'buyer' },
    process.env.JWT_SECRET || 'naam_uzhavar_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// Helper to generate a 7-day JWT token for Farmer
const generateFarmerToken = (farmerId, extraPayload = {}) => {
  return jwt.sign(
    { id: farmerId, farmerId, role: 'farmer', ...extraPayload },
    process.env.JWT_SECRET || 'naam_uzhavar_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// In-memory fallback buyers store for resilience during testing/offline database
const inMemoryBuyers = [
  {
    _id: 'buyer_demo_01',
    businessName: 'Grand Palace Luxury Dining',
    contactPerson: 'Mr. S. Rajesh (Procurement Head)',
    email: 'demo@naamuzhavar.com',
    phone: '+91 98401 23456',
    buyerType: 'hotel',
    gstin: '33AAAAA0000A1Z5',
    address: 'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80'
  },
  {
    _id: 'buyer_demo_02',
    businessName: 'Hotel Saravana Bhavan',
    contactPerson: 'Vimal Kumar',
    email: 'hotel.saravana@gmail.com',
    phone: '+91 98401 23456',
    buyerType: 'restaurant',
    address: '14/2 Anna Salai, Chennai - 600002'
  }
];

// In-memory fallback farmers store for resilience during testing/offline database
const inMemoryFarmers = [
  {
    farmerId: 'FMR-TN-2026-01',
    name: 'Ramesh Kumar',
    email: 'farmer@naamuzhavar.com',
    phone: '+91 94432 78190',
    avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80',
    rating: 4.92,
    totalHarvests: 54,
    isVerified: true,
    role: 'farmer',
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
      accountNumber: '••••••••1034',
      ifscCode: 'SBIN0001248',
      branchName: 'Pollachi Bazaar Branch',
      accountType: 'Savings'
    }
  }
];

// Helper to derive a clean human contact person name from email or fallback
const deriveContactPerson = (email, fallbackBusinessName) => {
  if (email && email.includes('@')) {
    const raw = email.split('@')[0].replace(/\d+/g, '').replace(/[._-]/g, ' ').trim();
    if (raw.toLowerCase() === 'vimalku' || raw.toLowerCase() === 'vimal') {
      return 'Vimal Kumar';
    }
    if (raw.length >= 2) {
      return raw
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }
  return fallbackBusinessName || 'Procurement Partner';
};

// ============================================================================
// BUYER AUTHENTICATION ROUTES
// ============================================================================

// POST /api/auth/register - Register a new commercial buyer
router.post('/register', async (req, res, next) => {
  try {
    const {
      businessName,
      shopName,
      contactPerson,
      name,
      fullName,
      buyerType,
      email,
      password,
      phone,
      gstin,
      address,
      avatar
    } = req.body;

    const resolvedBusiness = (businessName || shopName || '').trim();
    const resolvedContact = (contactPerson || name || fullName || deriveContactPerson(email, resolvedBusiness)).trim();

    // 1. Basic validation
    if (!resolvedBusiness || !email || !password || !phone || !address) {
      return res.status(400).json({ message: 'Please provide businessName, email, password, phone, and address.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // 2. Check if buyer already exists
    try {
      const existingBuyer = await Buyer.findOne({ email: email.toLowerCase().trim() });
      if (existingBuyer) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }
    } catch {
      // ignore if db offline
    }

    // 3. Hash the password with bcrypt (cost factor 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create buyer document
    let newBuyer = null;
    try {
      newBuyer = await Buyer.create({
        businessName: resolvedBusiness,
        contactPerson: resolvedContact,
        buyerType: buyerType || 'hotel',
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone.trim(),
        gstin: gstin ? gstin.trim() : '',
        address: address.trim(),
        avatar: avatar || undefined
      });
    } catch {
      newBuyer = {
        _id: `buyer_${Date.now()}`,
        businessName: resolvedBusiness,
        contactPerson: resolvedContact,
        buyerType: buyerType || 'hotel',
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        gstin: gstin ? gstin.trim() : '',
        address: address.trim(),
        avatar: avatar || undefined
      };
      inMemoryBuyers.unshift({
        ...newBuyer,
        password: hashedPassword
      });
    }

    // 5. Generate JWT and respond without password field
    const token = generateBuyerToken(newBuyer._id);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      buyer: {
        id: newBuyer._id,
        businessName: newBuyer.businessName,
        shopName: newBuyer.businessName,
        contactPerson: newBuyer.contactPerson || resolvedContact,
        name: newBuyer.contactPerson || resolvedContact,
        fullName: newBuyer.contactPerson || resolvedContact,
        buyerType: newBuyer.buyerType || 'hotel',
        email: newBuyer.email,
        phone: newBuyer.phone,
        gstin: newBuyer.gstin,
        address: newBuyer.address,
        avatar: newBuyer.avatar
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login - Log in with email/phone and password
router.post('/login', async (req, res, next) => {
  try {
    const { email, identifier, password } = req.body;
    const loginId = (identifier || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/Phone and password are required.' });
    }

    const digits = loginId.replace(/\D/g, '');
    const searchConditions = [{ email: loginId.toLowerCase() }, { phone: loginId }];
    if (digits.length >= 10) {
      searchConditions.push({ phone: { $regex: digits.slice(-10) } });
    }

    // Find buyer by email or phone
    let buyer = null;
    try {
      buyer = await Buyer.findOne({ $or: searchConditions });
    } catch {
      buyer = null;
    }

    if (!buyer) {
      buyer = inMemoryBuyers.find(
        (b) =>
          b.email.toLowerCase() === loginId.toLowerCase() ||
          (digits.length >= 10 && b.phone.replace(/\D/g, '').endsWith(digits.slice(-10)))
      );
    }

    if (!buyer) {
      return res.status(401).json({ message: 'Invalid credentials. No account found with these details.' });
    }

    // Compare passwords with bcrypt or allow authorized demo logins
    let isMatch = false;
    if (buyer.password) {
      isMatch = await bcrypt.compare(password, buyer.password);
    }
    const isDemoBuyer =
      loginId.toLowerCase() === 'demo@naamuzhavar.com' ||
      loginId.toLowerCase() === 'hotel.saravana@gmail.com' ||
      buyer._id === 'buyer_demo_01' ||
      buyer._id === 'buyer_demo_02';
    const isDemoPassword =
      password === 'demo1234' ||
      (loginId.toLowerCase().includes('saravana') && password === 'saravana123');
    if (!isMatch && isDemoBuyer && isDemoPassword) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    // Issue JWT token
    const token = generateBuyerToken(buyer._id);

    const resolvedContact =
      (buyer.contactPerson && buyer.contactPerson.trim() && buyer.contactPerson.trim() !== buyer.businessName)
        ? buyer.contactPerson.trim()
        : deriveContactPerson(buyer.email, buyer.businessName);

    return res.json({
      message: 'Login successful',
      token,
      buyer: {
        id: buyer._id,
        businessName: buyer.businessName,
        shopName: buyer.businessName,
        contactPerson: resolvedContact,
        name: resolvedContact,
        fullName: resolvedContact,
        buyerType: buyer.buyerType || 'hotel',
        email: buyer.email,
        phone: buyer.phone,
        gstin: buyer.gstin,
        address: buyer.address,
        avatar: buyer.avatar
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// FARMER AUTHENTICATION ROUTES
// ============================================================================

// Core Farmer registration logic
const handleFarmerRegistration = async (req, res, next) => {
  try {
    const { name, phone, email, password, confirmPassword, farmAddress, avatar, pattaNo, pattaNumber } = req.body;

    const resolvedName = (name || '').trim();
    const resolvedPhone = (phone || '').trim();
    const resolvedEmail = (email || '').toLowerCase().trim();
    const resolvedAddress = (farmAddress || '').trim();
    const resolvedPatta = (pattaNo || pattaNumber || '').trim();
    const resolvedAvatar = avatar || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80';

    // 1. Mandatory field presence validation
    if (!resolvedName || !resolvedPhone || !resolvedEmail || !password || !resolvedAddress) {
      return res.status(400).json({
        message: 'All fields (Full Name, Mobile Number, Email, Password, and Farm Address) are required.'
      });
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resolvedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    // 3. Mobile number validation (10 digits)
    const digitsOnly = resolvedPhone.replace(/\D/g, '');
    const cleanPhoneDigits = digitsOnly.startsWith('91') && digitsOnly.length === 12
      ? digitsOnly.slice(2)
      : digitsOnly;

    if (cleanPhoneDigits.length !== 10) {
      return res.status(400).json({ message: 'Mobile number must be a valid 10-digit phone number.' });
    }

    // 4. Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Confirm password does not match password.' });
    }

    // 5. Secure Password Hashing with bcryptjs (cost factor 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const farmerIdNum = Math.floor(1000 + Math.random() * 9000);
    const farmerId = `FMR-TN-2026-${farmerIdNum}`;
    const formattedPhone = `+91 ${cleanPhoneDigits.slice(0, 5)} ${cleanPhoneDigits.slice(5)}`;

    // 6. Check existing registration and update password/details if already registered
    const searchConditions = [
      { email: resolvedEmail },
      { phone: { $regex: cleanPhoneDigits } }
    ];

    try {
      const existingFarmer = await Farmer.findOne({ $or: searchConditions });
      if (existingFarmer) {
        existingFarmer.password = hashedPassword;
        existingFarmer.name = resolvedName;
        existingFarmer.phone = formattedPhone;
        if (existingFarmer.farmDetails) {
          existingFarmer.farmDetails.landAddress = resolvedAddress;
          existingFarmer.farmDetails.pattaNumber = resolvedPatta;
        }
        await existingFarmer.save();

        const token = generateFarmerToken(existingFarmer.farmerId || existingFarmer._id, {
          name: resolvedName,
          email: resolvedEmail,
          phone: formattedPhone
        });
        return res.status(200).json({
          message: 'Farmer account registration updated successfully! Please log in.',
          token,
          farmer: {
            farmerId: existingFarmer.farmerId || farmerId,
            name: resolvedName,
            email: resolvedEmail,
            phone: formattedPhone,
            role: 'farmer'
          }
        });
      }
    } catch {
      // In-memory fallback check
    }

    const memIndex = inMemoryFarmers.findIndex(
      (f) =>
        f.email.toLowerCase() === resolvedEmail ||
        f.phone.replace(/\D/g, '').endsWith(cleanPhoneDigits)
    );
    if (memIndex !== -1) {
      inMemoryFarmers[memIndex].password = hashedPassword;
      inMemoryFarmers[memIndex].name = resolvedName;
      inMemoryFarmers[memIndex].phone = formattedPhone;
      inMemoryFarmers[memIndex].avatar = resolvedAvatar;
      inMemoryFarmers[memIndex].pattaNo = resolvedPatta;
      const token = generateFarmerToken(inMemoryFarmers[memIndex].farmerId, {
        name: resolvedName,
        email: resolvedEmail,
        phone: formattedPhone
      });
      return res.status(200).json({
        message: 'Farmer account registration updated successfully! Please log in.',
        token,
        farmer: {
          farmerId: inMemoryFarmers[memIndex].farmerId,
          name: resolvedName,
          email: resolvedEmail,
          phone: formattedPhone,
          role: 'farmer'
        }
      });
    }

    const newFarmerPayload = {
      farmerId,
      name: resolvedName,
      email: resolvedEmail,
      phone: formattedPhone,
      password: hashedPassword,
      role: 'farmer',
      isVerified: true,
      rating: 5.0,
      totalHarvests: 0,
      avatar: resolvedAvatar,
      photo: resolvedAvatar,
      pattaNo: resolvedPatta,
      pattaNumber: resolvedPatta,
      farmDetails: {
        farmName: `${resolvedName}'s Natural Farm`,
        landOwnerName: resolvedName,
        landAddress: resolvedAddress,
        pattaNumber: resolvedPatta,
        village: 'Tamil Nadu',
        taluk: 'Agricultural Taluk',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642001',
        landArea: 4.0,
        landAreaUnit: 'Acres',
        gpsCoordinates: '10.9982° N, 76.9634° E'
      },
      residentialDetails: {
        address: resolvedAddress,
        village: 'Tamil Nadu',
        district: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: '642001',
        sameAsFarm: true
      },
      bankDetails: {
        accountHolderName: resolvedName,
        bankName: 'State Bank of India',
        accountNumber: '••••••••1034',
        ifscCode: 'SBIN0001248',
        branchName: 'Main Rural Branch',
        accountType: 'Savings'
      }
    };

    let createdFarmer = null;
    try {
      createdFarmer = await Farmer.create(newFarmerPayload);
    } catch {
      createdFarmer = null;
    }

    inMemoryFarmers.unshift({
      ...newFarmerPayload,
      _id: createdFarmer ? createdFarmer._id : `farmer_mem_${Date.now()}`
    });

    const token = generateFarmerToken(farmerId, {
      name: resolvedName,
      email: resolvedEmail,
      phone: formattedPhone
    });

    return res.status(201).json({
      message: 'Farmer registration successful! Please log in to your account.',
      token,
      farmer: {
        farmerId,
        name: resolvedName,
        email: resolvedEmail,
        phone: formattedPhone,
        role: 'farmer'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Core Farmer login logic
const handleFarmerLogin = async (req, res, next) => {
  try {
    const { email, identifier, phone, password } = req.body;
    const loginId = (identifier || email || phone || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Mobile/Email and password are required.' });
    }

    const digits = loginId.replace(/\D/g, '');
    const cleanDigits = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
    const searchConditions = [{ email: loginId.toLowerCase() }];
    if (cleanDigits.length >= 10) {
      searchConditions.push({ phone: { $regex: cleanDigits.slice(-10) } });
    }

    let farmer = null;
    try {
      farmer = await Farmer.findOne({ $or: searchConditions });
    } catch {
      farmer = null;
    }

    if (!farmer) {
      farmer = inMemoryFarmers.find(
        (f) =>
          f.email.toLowerCase() === loginId.toLowerCase() ||
          (cleanDigits.length >= 10 && f.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10)))
      );
    }

    const isDemoAccount =
      loginId.toLowerCase() === 'farmer@naamuzhavar.com' ||
      loginId.toLowerCase() === 'ramesh.kumar@naamuzhavar.com' ||
      cleanDigits.endsWith('78190');
    const isDemoPassword = password === 'farmer1234' || password === 'demo1234' || password === '4821';
    const isDemoAuth = isDemoAccount && isDemoPassword;

    let passwordValid = false;
    if (farmer && farmer.password) {
      passwordValid = await bcrypt.compare(password, farmer.password);
    }

    // Allow recognized demo farmer only with the authorized demo password
    if (!passwordValid && isDemoAuth) {
      passwordValid = true;
    }

    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect mobile/email or password.' });
    }

    const farmerId = farmer ? farmer.farmerId || farmer._id : 'FMR-TN-2026-01';

    const farmerData = farmer && typeof farmer.toObject === 'function' ? farmer.toObject() : (farmer || {
      farmerId: 'FMR-TN-2026-01',
      name: 'Ramesh Kumar',
      email: 'ramesh.kumar@naamuzhavar.com',
      phone: '+91 94432 78190',
      avatar: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80',
      rating: 4.92,
      totalHarvests: 54,
      isVerified: true,
      role: 'farmer',
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
        accountNumber: '••••••••1034',
        ifscCode: 'SBIN0001248',
        branchName: 'Pollachi Bazaar Branch',
        accountType: 'Savings'
      }
    });

    const token = generateFarmerToken(farmerId, {
      name: farmerData.name,
      email: farmerData.email,
      phone: farmerData.phone
    });

    delete farmerData.password;

    return res.json({
      message: 'Farmer login successful',
      token,
      farmer: {
        ...farmerData,
        role: 'farmer'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mount Farmer routes under /api/auth/farmer/*
router.post('/farmer/register', handleFarmerRegistration);
router.post('/farmer/login', handleFarmerLogin);

// Current Farmer auth check
router.get('/farmer/me', authMiddleware, async (req, res) => {
  const farmerId = req.farmerId || req.user.id || 'FMR-TN-2026-01';
  let farmer = null;
  try {
    const isObjId = typeof req.user.id === 'string' && /^[0-9a-fA-F]{24}$/.test(req.user.id);
    const query = isObjId ? { $or: [{ farmerId }, { _id: req.user.id }] } : { farmerId };
    farmer = await Farmer.findOne(query);
  } catch {
    farmer = null;
  }
  if (!farmer) {
    farmer = inMemoryFarmers.find((f) => f.farmerId === farmerId) || inMemoryFarmers[0];
  }
  const clean = farmer && typeof farmer.toObject === 'function' ? farmer.toObject() : { ...farmer };
  delete clean.password;
  return res.json({ farmer: clean });
});

// Shared session endpoint
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'farmer') {
      const farmerId = req.farmerId || req.user.id || 'FMR-TN-2026-01';
      let farmer = null;
      try {
        const isObjId = typeof req.user.id === 'string' && /^[0-9a-fA-F]{24}$/.test(req.user.id);
        const query = isObjId ? { $or: [{ farmerId }, { _id: req.user.id }] } : { farmerId };
        farmer = await Farmer.findOne(query);
      } catch {
        farmer = null;
      }
      if (!farmer) {
        farmer = inMemoryFarmers.find((f) => f.farmerId === farmerId) || inMemoryFarmers[0];
      }
      const clean = farmer && typeof farmer.toObject === 'function' ? farmer.toObject() : { ...farmer };
      delete clean.password;
      return res.json({ role: 'farmer', farmer: clean });
    }

    // Default: Buyer
    let buyer = null;
    const isIdHex = typeof req.buyer.id === 'string' && /^[0-9a-fA-F]{24}$/.test(req.buyer.id);
    if (isIdHex) {
      buyer = await Buyer.findById(req.buyer.id).select('-password');
    }
    if (!buyer && req.buyer.email) {
      buyer = await Buyer.findOne({ email: req.buyer.email.toLowerCase().trim() }).select('-password');
    }
    if (!buyer) {
      buyer = (await Buyer.findOne({ email: 'demo@naamuzhavar.com' }).select('-password')) ||
              (await Buyer.findOne({}).select('-password')) ||
              inMemoryBuyers.find((b) => b._id === req.buyer.id) ||
              inMemoryBuyers[0];
    }
    const cleanBuyer = buyer && typeof buyer.toObject === 'function' ? buyer.toObject() : { ...buyer };
    delete cleanBuyer.password;
    return res.json({ role: 'buyer', buyer: cleanBuyer });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
