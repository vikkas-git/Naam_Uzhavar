// models/BuyerRequest.js - Schema for commercial buyer crop purchase enquiries & requests
// Viva Note: Bridges buyer procurement requests with farmer harvest inventories.
const mongoose = require('mongoose');

const buyerRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop'
    },
    cropDetails: {
      name: { type: String, required: true },
      nameTa: { type: String, default: '' },
      category: { type: String, default: 'vegetables' },
      variety: { type: String, default: 'Hybrid Tomato' },
      grade: { type: String, default: 'Grade A' },
      image: { type: String, default: '' }
    },
    buyer: {
      type: mongoose.Schema.Types.Mixed
    },
    buyerDetails: {
      businessName: { type: String, required: true },
      contactPerson: { type: String, default: 'Procurement Manager' },
      buyerType: { type: String, default: 'Hotel & Restaurant' },
      phone: { type: String, default: '+91 98401 23456' },
      email: { type: String, default: 'procurement@hotel.com' },
      location: { type: String, default: 'Coimbatore Commercial Hub' },
      avatar: { type: String, default: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80' },
      verified: { type: Boolean, default: true }
    },
    farmerId: {
      type: String,
      default: 'FMR-TN-2026-01',
      index: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer'
    },
    farmerName: {
      type: String,
      default: 'Ramesh Kumar'
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    unit: {
      type: String,
      default: 'Kg'
    },
    offeredPrice: {
      type: Number,
      required: true
    },
    totalEstimatedValue: {
      type: Number,
      required: true
    },
    preferredDeliveryDate: {
      type: String,
      default: ''
    },
    deliveryLocation: {
      type: String,
      default: 'Central Receiving Dock, Bypass Road'
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CONVERTED_TO_ORDER', 'EXPIRED'],
      default: 'PENDING',
      index: true
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    orderId: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('BuyerRequest', buyerRequestSchema);

