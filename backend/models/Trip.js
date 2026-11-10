// models/Trip.js - Schema for produce consignment dispatches assigned to EV fleet drivers
// Viva Note: Connects Farmer harvest locations with Buyer delivery bays, manages turn-by-turn workflow milestones, crate checklist, and 4-digit PIN verification.
const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      required: [true, 'Trip ID is required'],
      unique: true,
      trim: true,
      index: true
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    driverId: {
      type: String,
      default: 'DRV-TN-2026-08',
      trim: true,
      index: true
    },
    // Milestone status: CONFIRMED -> READY_FOR_PICKUP -> EN_ROUTE_PICKUP -> PICKED_UP -> IN_TRANSIT -> DELIVERED
    status: {
      type: String,
      enum: ['CONFIRMED', 'ASSIGNED', 'READY_FOR_PICKUP', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
      default: 'READY_FOR_PICKUP',
      index: true
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL'
    },
    tripType: {
      type: String,
      default: 'FARM_GATE_DIRECT'
    },
    // Produce specs
    cropName: {
      type: String,
      required: true,
      trim: true
    },
    tamilCropName: {
      type: String,
      trim: true,
      default: ''
    },
    cropImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
    },
    quantityKg: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1 kg']
    },
    cratesCount: {
      type: Number,
      default: 8
    },
    totalProduceValue: {
      type: Number,
      default: 0
    },
    // Origin Node: Farm Gate
    pickup: {
      farmName: { type: String, default: "Natural Farm" },
      farmerName: { type: String, default: 'Ramesh Kumar' },
      farmerPhone: { type: String, default: '+91 94432 78190' },
      address: { type: String, default: 'Farm Gate Origin' },
      village: { type: String, default: 'Pollachi' },
      district: { type: String, default: 'Coimbatore' },
      pincode: { type: String, default: '642001' },
      gps: { type: String, default: '10.6588° N, 77.0094° E' },
      timeSlot: { type: String, default: 'Morning Harvest Dispatch' }
    },
    // Destination Node: Buyer Bay
    dropoff: {
      buyerName: { type: String, default: 'Sri Lakshmi Hotels' },
      contactPerson: { type: String, default: 'M. Senthil Nathan' },
      buyerPhone: { type: String, default: '+91 98421 22345' },
      address: { type: String, default: 'Buyer Kitchen Dock' },
      location: { type: String, default: 'Gandhipuram, Coimbatore' },
      timeSlot: { type: String, default: 'Today, by 11:30 AM' }
    },
    // EV Telemetry & Route
    telemetry: {
      distanceKm: { type: Number, default: 34.5 },
      speedKmh: { type: Number, default: 42 },
      batteryPct: { type: Number, default: 82 },
      etaMinutes: { type: Number, default: 28 },
      origin: { type: String, default: 'Farm Gate' },
      destination: { type: String, default: 'Buyer Dock' }
    },
    // Handover Security PIN
    deliveryPin: {
      type: String,
      required: true,
      default: '4892',
      trim: true
    },
    // In-Cab Crate Inspection Handshake
    crateInspection: {
      countVerified: { type: Boolean, default: false },
      qualityInspected: { type: Boolean, default: false },
      tamperSealAffixed: { type: Boolean, default: false },
      inspectedAt: { type: Date }
    },
    // Distance-based Haulage Payout Formula
    haulageEarnings: {
      baseFare: { type: Number, default: 250 },
      distanceRate: { type: Number, default: 12 }, // ₹12 / km
      distanceKm: { type: Number, default: 34.5 },
      handlingBonus: { type: Number, default: 80 },
      totalEarnings: { type: Number, default: 744 },
      payoutStatus: {
        type: String,
        enum: ['ESCROW_HELD', 'PAID'],
        default: 'ESCROW_HELD'
      },
      paidAt: { type: Date }
    }
  },
  {
    timestamps: true
  }
);

const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

module.exports = Trip;

