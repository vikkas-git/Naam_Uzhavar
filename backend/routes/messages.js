// routes/messages.js - Direct communications between buyer, hub coordinator, and EV driver
// Viva Note: Messages are scoped to the authenticated buyer; buyers can only view and post in their own thread.
// Resilient against string demo IDs ('buyer_demo_01') and Mongoose ObjectIds without CastErrors.
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
const Message = require('../models/Message');
const Buyer = require('../models/Buyer');

router.use(authMiddleware);

const isObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
const isDbConnected = () => mongoose.connection.readyState === 1;

const resolveBuyerIds = async (buyerId) => {
  const ids = [buyerId];
  if (!isObjectId(buyerId) && isDbConnected()) {
    try {
      const demoBuyer = await Buyer.findOne({ email: 'demo@naamuzhavar.com' });
      if (demoBuyer) {
        ids.push(demoBuyer._id);
        ids.push(demoBuyer._id.toString());
      }
    } catch {}
  }
  return ids;
};

// GET /api/messages - List all messages in this buyer's thread
router.get('/', async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.json({ count: 0, messages: [] });
    }

    const buyerIds = await resolveBuyerIds(req.buyer.id);
    const rawMessages = await Message.find({ buyer: { $in: buyerIds } }).sort({ createdAt: 1 });

    const messages = rawMessages.map((m) => {
      const timeStr = new Date(m.createdAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      return {
        id: m._id.toString(),
        sender: m.sender === 'buyer' ? 'Procurement Team' : m.sender === 'driver' ? 'Driver Kumar M.' : 'Hub Dispatcher',
        role: m.sender === 'buyer' ? 'Commercial Buyer' : m.sender === 'driver' ? 'EV Cargo Driver' : 'Central Hub',
        time: timeStr,
        text: m.text,
        isBuyer: m.sender === 'buyer',
        isDriver: m.sender === 'driver'
      };
    });

    return res.json({
      count: messages.length,
      messages
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/messages - Send a message from the authenticated buyer
router.post('/', async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text cannot be empty.' });
    }

    const timeStr = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (!isDbConnected()) {
      return res.status(201).json({
        message: 'Message sent successfully (offline mode)',
        data: {
          id: `msg_${Date.now()}`,
          sender: 'Procurement Team',
          role: 'Commercial Buyer',
          time: timeStr,
          text: text.trim(),
          isBuyer: true,
          isDriver: false
        }
      });
    }

    const newMessage = await Message.create({
      buyer: req.buyer.id,
      sender: 'buyer',
      text: text.trim()
    });

    return res.status(201).json({
      message: 'Message sent successfully',
      data: {
        id: newMessage._id.toString(),
        sender: 'Procurement Team',
        role: 'Commercial Buyer',
        time: timeStr,
        text: newMessage.text,
        isBuyer: true,
        isDriver: false
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
