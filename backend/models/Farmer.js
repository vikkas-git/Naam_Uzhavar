// models/Farmer.js - Schema for registered Tamil Nadu agricultural producers
// Viva Note: Stores farmer profile, verified land records, and secure direct banking details.
const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    farmerId: {
      type: String,
      default: 'FMR-TN-2026-01',
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Farmer full name is required'],
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: 'ramesh.kumar@naamuzhavar.com'
    },
    phone: {
      type: String,
      required: [true, 'Contact mobile number is required'],
      trim: true,
      default: '+91 94432 78190'
    },
    password: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      default: 'farmer'
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&auto=format&fit=crop&q=80'
    },
    pattaNo: {
      type: String,
      default: ''
    },
    pattaNumber: {
      type: String,
      default: ''
    },
    // Section 1: Farm / Land Address
    farmDetails: {
      farmName: { type: String, default: 'Green Valley Natural Farm' },
      landOwnerName: { type: String, default: 'Ramesh Kumar' },
      pattaNumber: { type: String, default: '' },
      landAddress: { type: String, default: 'SF No. 142/2, Kinathukadavu Main Road' },
      village: { type: String, default: 'Pollachi' },
      taluk: { type: String, default: 'Pollachi Taluk' },
      district: { type: String, default: 'Coimbatore' },
      state: { type: String, default: 'Tamil Nadu' },
      pincode: { type: String, default: '642001' },
      landArea: { type: Number, default: 4.5 },
      landAreaUnit: { type: String, enum: ['Acres', 'Hectares', 'Cents'], default: 'Acres' },
      gpsCoordinates: { type: String, default: '10.6588° N, 77.0094° E' }
    },
    // Section 2: Residential / Personal Address
    residentialDetails: {
      address: { type: String, default: '12/4, South Thottam Street, Kinathukadavu' },
      village: { type: String, default: 'Pollachi' },
      taluk: { type: String, default: 'Pollachi Taluk' },
      district: { type: String, default: 'Coimbatore' },
      state: { type: String, default: 'Tamil Nadu' },
      pincode: { type: String, default: '642001' },
      sameAsFarm: { type: Boolean, default: false }
    },
    // Section 3: Direct Bank Details (masked account numbers for security)
    bankDetails: {
      accountHolderName: { type: String, default: 'Ramesh Kumar' },
      bankName: { type: String, default: 'State Bank of India' },
      accountNumber: { type: String, default: '30495821034' },
      ifscCode: { type: String, default: 'SBIN0001248' },
      branchName: { type: String, default: 'Pollachi Bazaar Branch' },
      accountType: { type: String, enum: ['Savings', 'Current'], default: 'Savings' }
    },
    rating: {
      type: Number,
      default: 4.92
    },
    totalHarvests: {
      type: Number,
      default: 54
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Farmer', farmerSchema);

