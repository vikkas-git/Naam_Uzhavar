// models/Message.js - Schema for buyer communication with hub managers and delivery drivers
// Viva Note: Stores direct communications for dispatch coordination.
// Accepts both standard ObjectId references and demo session IDs (e.g. buyer_demo_01).
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    sender: {
      type: String,
      enum: ['buyer', 'hub', 'driver'],
      required: true
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Message', messageSchema);
