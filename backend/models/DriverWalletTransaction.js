// models/DriverWalletTransaction.js - Ledger for driver trip payouts and UPI bank withdrawals
// Viva Note: Records transparent financial transactions, maintaining audit trails for driver earnings and instant escrow payouts.
const mongoose = require('mongoose');

const driverWalletTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    driverId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    tripId: {
      type: String,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ['TRIP_PAYOUT', 'UPI_WITHDRAWAL', 'BONUS', 'INCENTIVE'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be at least ₹1']
    },
    balanceAfter: {
      type: Number,
      default: 0
    },
    upiId: {
      type: String,
      trim: true
    },
    bankRef: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'PENDING', 'FAILED'],
      default: 'COMPLETED'
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const DriverWalletTransaction =
  mongoose.models.DriverWalletTransaction ||
  mongoose.model('DriverWalletTransaction', driverWalletTransactionSchema);

module.exports = DriverWalletTransaction;

