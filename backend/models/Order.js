// models/Order.js - Schema for buyer orders and live EV cargo consignments
// Viva Note: Ties a Buyer to a purchased Crop, records server-calculated total price,
// separates order approval from EV delivery milestones, and tracks farmer consignment fulfillment.
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    buyer: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true
    },
    cropDetails: {
      name: { type: String, default: '' },
      nameTa: { type: String, default: '' },
      grade: { type: String, default: 'Grade A' },
      image: { type: String, default: '' },
      pricePerKg: { type: Number, default: 0 },
      farmerName: { type: String, default: '' },
      hub: { type: String, default: '' }
    },
    quantityKg: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1 kg']
    },
    totalPrice: {
      type: Number,
      required: true
    },
    // Order Status: PENDING_FARMER_APPROVAL -> CONFIRMED (or REJECTED / CANCELLED)
    orderStatus: {
      type: String,
      enum: ['PENDING_FARMER_APPROVAL', 'CONFIRMED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING_FARMER_APPROVAL',
      index: true
    },
    // Delivery Status: NOT_ASSIGNED -> READY_FOR_PICKUP -> PICKED_UP -> IN_TRANSIT -> DELIVERED
    deliveryStatus: {
      type: String,
      enum: ['NOT_ASSIGNED', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'],
      default: 'NOT_ASSIGNED',
      index: true
    },
    // Retain legacy status field for backwards compatibility
    status: {
      type: String,
      default: 'PENDING_FARMER_APPROVAL'
    },
    driver: {
      name: { type: String, default: 'Kumar M.' },
      vehicle: { type: String, default: 'Tata Ace EV Cargo (TN 57 AB 1234)' },
      phone: { type: String, default: '+91 94432 11098' },
      deliveryPin: { type: String, default: '4892' }
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true
    },
    preferredDeliveryDate: {
      type: String,
      default: ''
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
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'ESCROW_LOCKED', 'PAID', 'RELEASED_TO_FARMER'],
      default: 'PENDING'
    },
    paymentMethod: {
      type: String,
      default: 'UPI (Google Pay)'
    },
    transactionRef: {
      type: String,
      default: ''
    },
    utrNumber: {
      type: String,
      default: ''
    },
    payoutClaimedAt: {
      type: Date
    },
    pickupDate: {
      type: String,
      default: ''
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    statusHistory: [
      {
        status: { type: String, default: '' },
        timestamp: { type: String, default: () => new Date().toISOString() },
        note: { type: String, default: '' }
      }
    ],
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
