// models/Driver.js - Schema for Naam Uzhavar EV Fleet Logistics Drivers
// Viva Note: Models driver identity, assigned commercial EV vehicle telemetry, driving license, and earnings wallet.
const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      default: 'DRV-TN-2026-08',
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Driver full name is required'],
      trim: true,
      default: 'Kumar M.'
    },
    tamilName: {
      type: String,
      default: 'குமார் எம்.',
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Driver contact mobile number is required'],
      trim: true,
      default: '+91 94432 11098'
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: 'kumar.logistics@naamuzhavar.com'
    },
    password: {
      type: String,
      default: '1234'
    },
    pin: {
      type: String,
      default: '1234'
    },
    role: {
      type: String,
      default: 'driver'
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&auto=format&fit=crop&q=80'
    },
    assignedHub: {
      type: String,
      default: 'Dindigul Central Hub',
      trim: true
    },
    operatingZone: {
      type: String,
      default: 'Coimbatore - Dindigul - Madurai Corridor',
      trim: true
    },
    dutyStatus: {
      type: String,
      enum: ['ON_DUTY', 'ON_TRIP', 'OFF_DUTY'],
      default: 'ON_DUTY',
      index: true
    },
    // EV Commercial Vehicle Telemetry
    vehicle: {
      model: { type: String, default: 'Tata Ace EV Cargo' },
      vehicleNumber: { type: String, default: 'TN 57 AB 1234', trim: true },
      type: { type: String, default: 'Zero-Emission EV Light Commercial Vehicle (LCV)' },
      batteryCapacityKwh: { type: Number, default: 21.3 },
      currentBatteryPct: { type: Number, default: 82, min: 0, max: 100 },
      estimatedRangeKm: { type: Number, default: 68 },
      maxPayloadKg: { type: Number, default: 600 },
      healthPct: { type: Number, default: 98, min: 0, max: 100 },
      chargingStatus: {
        type: String,
        enum: ['CHARGING', 'DISCHARGING', 'IDLE'],
        default: 'DISCHARGING'
      }
    },
    // Commercial Driving License & Verification
    license: {
      licenseNumber: { type: String, default: 'TN-57-2020-008912', trim: true },
      validUntil: { type: String, default: '2028-09-30' },
      verified: { type: Boolean, default: true },
      badge: { type: String, default: 'Green Logistics Pro' }
    },
    // Financial Wallet & Instant Payout Info
    wallet: {
      balance: { type: Number, default: 4250, min: 0 },
      todayEarnings: { type: Number, default: 1424, min: 0 },
      totalWithdrawn: { type: Number, default: 0, min: 0 },
      upiId: { type: String, default: 'kumar.logistics@okhdfcbank', trim: true }
    },
    // Performance Metrics
    metrics: {
      rating: { type: Number, default: 4.92, min: 1, max: 5 },
      totalDispatches: { type: Number, default: 148 },
      onTimeRatePct: { type: Number, default: 99.1 },
      totalDistanceKm: { type: Number, default: 4820 },
      co2SavedKg: { type: Number, default: 1240 }
    }
  },
  {
    timestamps: true
  }
);

// Method to verify 4-digit PIN or password
driverSchema.methods.matchPin = function (enteredPin) {
  return this.pin === enteredPin || this.password === enteredPin;
};

const Driver = mongoose.models.Driver || mongoose.model('Driver', driverSchema);

module.exports = Driver;

