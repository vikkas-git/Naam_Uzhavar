// models/Admin.js - Schema for Centralized Administrator accounts
// Viva Note: Stores administrative credentials with bcrypt hashing and RBAC privileges.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true,
      default: 'Naam Uzhavar Central Administrator'
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      default: 'admin@naamuzhavar.com'
    },
    password: {
      type: String,
      required: [true, 'Password is required']
    },
    phone: {
      type: String,
      default: '+91 94432 00000',
      trim: true
    },
    role: {
      type: String,
      default: 'admin',
      enum: ['admin', 'superadmin']
    },
    avatar: {
      type: String,
      default: ''
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving if modified
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare helper
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);

