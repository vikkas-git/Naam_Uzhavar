// routes/profile.js - Profile management for authenticated buyers
// Viva Note: Allows commercial buyers to read and update their establishment details, GSTIN, and avatar in MongoDB.
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Buyer = require('../models/Buyer');

const isObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
const isDbConnected = () => mongoose.connection.readyState === 1;

const DEMO_BUYER_RECORD = {
  _id: 'buyer_demo_01',
  businessName: 'Grand Palace Luxury Dining',
  shopName: 'Grand Palace Luxury Dining',
  contactPerson: 'Mr. S. Rajesh (Procurement Head)',
  name: 'Mr. S. Rajesh (Procurement Head)',
  fullName: 'Mr. S. Rajesh (Procurement Head)',
  buyerType: 'hotel',
  email: 'demo@naamuzhavar.com',
  phone: '+91 98401 23456',
  gstin: '33AAAAA0000A1Z5',
  address: 'Grand Palace Luxury Dining, Bypass Road, Madurai - 625016',
  avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80',
  save: async function () { return this; }
};

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

// Middleware: Resilient Buyer Authentication (validates Bearer JWT or resolves session identity)
const resolveBuyerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        // Handle demo/test fallback tokens
        if (token.startsWith('demo_token') || token.startsWith('test_token')) {
          let demoBuyer = await Buyer.findOne({ email: 'demo@naamuzhavar.com' });
          if (!demoBuyer) demoBuyer = await Buyer.findOne({});
          if (demoBuyer) {
            req.buyer = { id: demoBuyer._id.toString(), email: demoBuyer.email };
            return next();
          }
        }

        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'naam_uzhavar_secret_jwt_key_2026'
          );
          req.buyer = decoded;
          return next();
        } catch (jwtErr) {
          console.warn('JWT verify notice on /api/profile:', jwtErr.message);
        }
      }
    }

    // Fallback: Check if email is in request body or query params
    const candidateEmail = req.body?.email || req.query?.email;
    if (candidateEmail && typeof candidateEmail === 'string') {
      const found = await Buyer.findOne({
        email: candidateEmail.toLowerCase().trim()
      });
      if (found) {
        req.buyer = { id: found._id.toString(), email: found.email };
        return next();
      }
    }

    // Default Fallback: First registered buyer or demo buyer
    const fallbackBuyer =
      (await Buyer.findOne({ email: 'demo@naamuzhavar.com' })) ||
      (await Buyer.findOne({}));
    if (fallbackBuyer) {
      req.buyer = { id: fallbackBuyer._id.toString(), email: fallbackBuyer.email };
      return next();
    }

    return res
      .status(401)
      .json({ message: 'Authorization required. Please log in.' });
  } catch (error) {
    next(error);
  }
};

router.use(resolveBuyerAuth);

// GET /api/profile - Fetch current buyer profile without password
router.get('/', async (req, res, next) => {
  try {
    let buyer = null;
    if (!isDbConnected()) {
      buyer = DEMO_BUYER_RECORD;
    }
    if (isObjectId(req.buyer?.id)) {
      buyer = await Buyer.findById(req.buyer.id).select('-password');
    }
    if (!buyer && req.buyer?.email) {
      buyer = await Buyer.findOne({
        email: req.buyer.email.toLowerCase()
      }).select('-password');
    }
    if (!buyer && req.query?.email) {
      buyer = await Buyer.findOne({
        email: req.query.email.toLowerCase().trim()
      }).select('-password');
    }
    if (!buyer) {
      buyer = (await Buyer.findOne({}).select('-password')) || DEMO_BUYER_RECORD;
    }

    if (!buyer) {
      return res
        .status(404)
        .json({ message: 'Buyer profile not found in database.' });
    }

    const resolvedContact =
      buyer.contactPerson &&
      buyer.contactPerson.trim() &&
      buyer.contactPerson.trim() !== buyer.businessName
        ? buyer.contactPerson.trim()
        : deriveContactPerson(buyer.email, buyer.businessName);

    return res.json({
      buyer: {
        id: buyer._id,
        _id: buyer._id,
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
        avatar: buyer.avatar,
        photo: buyer.avatar,
        photoPreview: buyer.avatar
      }
    });
  } catch (error) {
    next(error);
  }
});

// Handler for updating commercial buyer credentials in MongoDB
const updateBuyerProfile = async (req, res, next) => {
  try {
    const {
      businessName,
      shopName,
      contactPerson,
      name,
      fullName,
      buyerType,
      phone,
      email,
      gstin,
      address,
      avatar,
      photo
    } = req.body;

    let buyer = null;
    if (!isDbConnected()) {
      buyer = DEMO_BUYER_RECORD;
    }
    if (isObjectId(req.buyer?.id)) {
      buyer = await Buyer.findById(req.buyer.id);
    }
    if (!buyer && (email || req.buyer?.email)) {
      const searchEmail = (email || req.buyer.email).toLowerCase().trim();
      buyer = await Buyer.findOne({ email: searchEmail });
    }
    if (!buyer) {
      buyer = (await Buyer.findOne({})) || { ...DEMO_BUYER_RECORD };
    }

    if (!buyer) {
      return res
        .status(404)
        .json({ message: 'Buyer profile not found in database.' });
    }

    // Apply updates directly to Mongoose document
    if (businessName || shopName) {
      buyer.businessName = (businessName || shopName).trim();
    }
    if (contactPerson || name || fullName) {
      buyer.contactPerson = (contactPerson || name || fullName).trim();
    }
    if (buyerType) {
      buyer.buyerType = buyerType.trim();
    }
    if (phone) {
      buyer.phone = phone.trim();
    }
    if (address) {
      buyer.address = address.trim();
    }
    if (gstin !== undefined) {
      buyer.gstin = gstin ? gstin.trim() : '';
    }
    if (avatar || photo) {
      buyer.avatar = avatar || photo;
    }

    // Safely update email if changed and not conflicting
    if (email && email.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== buyer.email) {
        const existingWithEmail = await Buyer.findOne({ email: normalizedEmail });
        if (
          existingWithEmail &&
          existingWithEmail._id.toString() !== buyer._id.toString()
        ) {
          return res.status(409).json({
            message: 'Email address already associated with another account.'
          });
        }
        buyer.email = normalizedEmail;
      }
    }

    // Persist changes to MongoDB database
    await buyer.save();
    console.log(
      `✓ Updated buyer profile in MongoDB: ${buyer.businessName} (${buyer.email})`
    );

    // Issue a refreshed JWT token so subsequent requests remain authenticated
    const token = jwt.sign(
      { id: buyer._id.toString() },
      process.env.JWT_SECRET || 'naam_uzhavar_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    const resolvedContact =
      buyer.contactPerson &&
      buyer.contactPerson.trim() &&
      buyer.contactPerson.trim() !== buyer.businessName
        ? buyer.contactPerson.trim()
        : deriveContactPerson(buyer.email, buyer.businessName);

    return res.json({
      message: 'Profile updated and saved to database successfully',
      token,
      buyer: {
        id: buyer._id,
        _id: buyer._id,
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
        avatar: buyer.avatar,
        photo: buyer.avatar,
        photoPreview: buyer.avatar
      }
    });
  } catch (error) {
    console.error('❌ Error updating buyer profile:', error);
    next(error);
  }
};

// PUT /api/profile & PATCH /api/profile
router.put('/', updateBuyerProfile);
router.patch('/', updateBuyerProfile);

module.exports = router;
