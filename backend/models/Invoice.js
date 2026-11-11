// models/Invoice.js - Schema for commercial tax and settlement invoices
// Viva Note: Permanent immutable invoice snapshot generated upon successful order delivery.
// Recorded in the 'invoices' collection in MongoDB for auditable commercial procurement accounting.

const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
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
    buyer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true
    },
    buyerName: {
      type: String,
      default: ''
    },
    farmerId: {
      type: String,
      default: '',
      index: true
    },
    cropName: {
      type: String,
      required: true
    },
    tamilCropName: {
      type: String,
      default: ''
    },
    grade: {
      type: String,
      default: 'Grade A'
    },
    quantityKg: {
      type: Number,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'CANCELLED'],
      default: 'PAID',
      index: true
    },
    paymentMethod: {
      type: String,
      default: 'UPI / Commercial Bank Transfer'
    },
    transactionRef: {
      type: String,
      default: ''
    },
    hub: {
      type: String,
      default: 'Dindigul Central Hub'
    },
    farmer: {
      name: { type: String, default: 'Tamil Nadu Producer' },
      phone: { type: String, default: '+91 94432 78190' },
      location: { type: String, default: 'Pollachi Hub' }
    },
    invoiceDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Invoice', invoiceSchema);

