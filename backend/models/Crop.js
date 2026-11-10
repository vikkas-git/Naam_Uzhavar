// models/Crop.js - Schema for fresh farm harvest consignments available at regional hubs
// Viva Note: Represents agricultural produce directly listed from Tamil Nadu farmers for commercial buyers.
const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Crop name in English is required'],
      trim: true
    },
    nameTa: {
      type: String,
      default: '',
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required (e.g. vegetables, fruits)'],
      default: 'vegetables'
    },
    grade: {
      type: String,
      enum: ['Grade A', 'Grade B', 'Grade C'],
      default: 'Grade A'
    },
    variety: {
      type: String,
      default: 'Commercial Hybrid',
      trim: true
    },
    farmingMethod: {
      type: String,
      default: 'Natural',
      trim: true
    },
    pricePerKg: {
      type: Number,
      required: [true, 'Wholesale price per kg is required'],
      min: [1, 'Price per kg must be greater than zero']
    },
    quantityKg: {
      type: Number,
      required: [true, 'Available quantity in kg is required'],
      min: [0, 'Available quantity cannot be negative']
    },
    unit: {
      type: String,
      default: 'Kg',
      trim: true
    },
    farmerId: {
      type: String,
      default: 'FMR-TN-2026-01',
      trim: true,
      index: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer'
    },
    farmerName: {
      type: String,
      required: [true, 'Farmer name is required'],
      trim: true
    },
    hub: {
      type: String,
      required: [true, 'Regional collection hub name is required'],
      trim: true
    },
    distanceKm: {
      type: Number,
      default: 0
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
    },
    images: {
      type: [String],
      default: []
    },
    pickupDate: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'sold_out', 'pending', 'removed'],
      default: 'active',
      index: true
    },
    enquiryCount: {
      type: Number,
      default: 0
    },
    farmLocation: {
      address: { type: String, default: '' },
      village: { type: String, default: 'Pollachi' },
      taluk: { type: String, default: 'Pollachi' },
      district: { type: String, default: 'Coimbatore' },
      pincode: { type: String, default: '642001' },
      gps: { type: String, default: '' }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Crop', cropSchema);
