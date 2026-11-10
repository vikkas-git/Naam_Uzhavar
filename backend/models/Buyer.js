// models/Buyer.js - Schema for commercial buyer accounts (Hotels, Supermarkets, Kitchens)
// Viva Note: Stores registered buyer business credentials. Passwords are never stored in plain text.
const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, 'Business or shop name is required'],
      trim: true
    },
    contactPerson: {
      type: String,
      trim: true,
      default: ''
    },
    buyerType: {
      type: String,
      trim: true,
      default: 'hotel'
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true
    },
    gstin: {
      type: String,
      default: '',
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Commercial delivery address is required'],
      trim: true
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Buyer', buyerSchema);
