// routes/orders.js - Commercial produce orders and EV dispatch management
// Viva Note: Order creation is handled server-side to guarantee price integrity (totalPrice = crop.pricePerKg * quantityKg),
// validate harvest stock, and manage approval and delivery lifecycles.
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order');
const Crop = require('../models/Crop');
const mongoose = require('mongoose');
const Buyer = require('../models/Buyer');
const BuyerRequest = require('../models/BuyerRequest');

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

// All order routes require valid authentication
router.use(authMiddleware);

// Sample EV Cargo fleet vehicles across Tamil Nadu for dispatch assignment
const EV_FLEET = [
  { name: 'Kumar M.', vehicle: 'Tata Ace EV Cargo (TN 57 AB 1234)', phone: '+91 94432 11098' },
  { name: 'S. Arumugam', vehicle: 'Mahindra Zor Grand EV (TN 45 EF 5678)', phone: '+91 98423 44556' },
  { name: 'V. Prakash', vehicle: 'Piaggio Ape E-Xtra (TN 43 CD 9012)', phone: '+91 97890 88990' }
];

// Helper to generate unique order ID: NU-YYYY-XXXXX (e.g. NU-2026-48192)
const generateOrderId = async () => {
  const year = new Date().getFullYear();
  let uniqueId = '';
  let exists = true;

  while (exists) {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    uniqueId = `NU-${year}-${randomDigits}`;
    const found = await Order.findOne({ orderId: uniqueId });
    if (!found) exists = false;
  }

  return uniqueId;
};

// POST /api/orders - Create a new direct produce order
router.post('/', async (req, res, next) => {
  try {
    const {
      cropId,
      quantityKg,
      deliveryAddress,
      preferredDeliveryDate,
      notes,
      paymentMethod,
      transactionRef,
      utrNumber
    } = req.body;

    // 1. Validate inputs
    if (!cropId) {
      return res.status(400).json({ message: 'Crop ID is required.' });
    }

    const qty = Number(quantityKg);
    if (!qty || qty <= 0 || isNaN(qty)) {
      return res.status(400).json({ message: 'Quantity must be a positive number in kg.' });
    }

    // 2. Fetch crop from database
    let crop = null;
    if (typeof cropId === 'string' && cropId.match(/^[0-9a-fA-F]{24}$/)) {
      crop = await Crop.findById(cropId);
    } else {
      // Fallback for mock IDs like "crop-tomato-01"
      const cleanName = String(cropId).replace(/^crop-/, '').split('-')[0];
      crop = await Crop.findOne({ name: new RegExp(cleanName, 'i') });
      if (!crop) {
        crop = await Crop.findOne({});
      }
    }

    if (!crop) {
      return res.status(404).json({ message: 'Crop listing not found.' });
    }

    // 3. Verify sufficient harvest inventory
    if (qty > crop.quantityKg) {
      return res.status(400).json({
        message: `Requested ${qty} kg exceeds currently available stock of ${crop.quantityKg} kg.`
      });
    }

    // 4. Resolve delivery address from request or buyer profile
    let address = deliveryAddress;
    if (!address) {
      let buyer = null;
      if (isObjectId(req.buyer?.id)) {
        buyer = await Buyer.findById(req.buyer.id);
      } else if (req.buyer?.email) {
        buyer = await Buyer.findOne({ email: req.buyer.email.toLowerCase().trim() });
      } else {
        buyer = await Buyer.findOne({ email: 'demo@naamuzhavar.com' });
      }
      address = buyer ? buyer.address : 'Madurai Commercial Kitchen Gate 2';
    }

    // 5. Server calculates order total and generates orderId
    const totalPrice = crop.pricePerKg * qty;
    const orderId = await generateOrderId();

    // 6. Assign EV driver from fleet
    const assignedDriver = EV_FLEET[Math.floor(Math.random() * EV_FLEET.length)];
    const deliveryPin = `${Math.floor(1000 + Math.random() * 9000)}`;

    // 7. Create order document with PENDING_FARMER_APPROVAL & NOT_ASSIGNED
    const resolvedFarmerId = crop.farmerId || 'FMR-TN-2026-01';
    const newOrder = await Order.create({
      orderId,
      buyer: req.buyer.id,
      crop: crop._id,
      farmerId: resolvedFarmerId,
      cropDetails: {
        name: crop.name,
        nameTa: crop.nameTa || '',
        grade: crop.grade,
        image: crop.image,
        pricePerKg: crop.pricePerKg,
        farmerName: crop.farmerName,
        hub: crop.hub
      },
      quantityKg: qty,
      totalPrice,
      orderStatus: 'PENDING_FARMER_APPROVAL',
      deliveryStatus: 'NOT_ASSIGNED',
      status: 'PENDING_FARMER_APPROVAL',
      driver: {
        ...assignedDriver,
        deliveryPin
      },
      deliveryAddress: address,
      preferredDeliveryDate: preferredDeliveryDate || '',
      notes: notes || '',
      paymentStatus: 'PENDING',
      paymentMethod: paymentMethod || 'UPI (Google Pay)',
      transactionRef: transactionRef || `TXN-UPI-${Math.floor(100000 + Math.random() * 900000)}`,
      utrNumber: utrNumber || `UTR-SBIN-2026-${Math.floor(10000 + Math.random() * 90000)}`
    });

    // Populate crop details before responding
    await newOrder.populate('crop');

    // 8. Auto-create matching BuyerRequest for Farmer Module visibility
    try {
      const reqSeq = Math.floor(10000 + Math.random() * 90000);
      const requestId = `REQ-${new Date().getFullYear()}-${reqSeq}`;
      let buyerRecord = null;
      if (isObjectId(req.buyer?.id)) {
        buyerRecord = await Buyer.findById(req.buyer.id);
      } else if (req.buyer?.email) {
        buyerRecord = await Buyer.findOne({ email: req.buyer.email.toLowerCase().trim() });
      }
      if (!buyerRecord) {
        buyerRecord = await Buyer.findOne({ email: 'demo@naamuzhavar.com' });
      }

      const buyerBusinessName =
        buyerRecord?.shopName ||
        buyerRecord?.businessName ||
        req.buyer?.businessName ||
        req.buyer?.shopName ||
        'Grand Palace Luxury Dining';
      const buyerContact =
        buyerRecord?.contactPerson ||
        buyerRecord?.name ||
        req.buyer?.contactPerson ||
        req.buyer?.name ||
        'Procurement Partner';
      const buyerType =
        buyerRecord?.buyerType ||
        req.buyer?.buyerType ||
        'Hotel & Commercial Kitchen';
      const buyerPhone =
        buyerRecord?.phone ||
        req.buyer?.phone ||
        '+91 98401 23456';
      const buyerEmail =
        buyerRecord?.email ||
        req.buyer?.email ||
        'procurement@grandpalace.in';
      const buyerAvatar =
        buyerRecord?.avatar ||
        buyerRecord?.photo ||
        req.buyer?.avatar ||
        'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&auto=format&fit=crop&q=80';

      const createdBuyerReq = await BuyerRequest.create({
        requestId,
        crop: crop._id,
        cropDetails: {
          name: crop.name,
          nameTa: crop.nameTa || '',
          category: crop.category || 'vegetables',
          variety: crop.variety || 'Hybrid Harvest',
          grade: crop.grade || 'Grade A',
          image: crop.image || '',
          pricePerKg: crop.pricePerKg
        },
        buyer: req.buyer.id,
        buyerDetails: {
          businessName: buyerBusinessName,
          contactPerson: buyerContact,
          buyerType: buyerType,
          phone: buyerPhone,
          email: buyerEmail,
          location: address,
          address: address,
          avatar: buyerAvatar,
          verified: true
        },
        farmerId: resolvedFarmerId,
        farmerName: crop.farmerName || 'Ramesh Kumar',
        quantity: qty,
        unit: 'Kg',
        offeredPrice: crop.pricePerKg,
        totalEstimatedValue: totalPrice,
        preferredDeliveryDate: preferredDeliveryDate || '',
        deliveryLocation: address,
        notes: notes || '',
      paymentStatus: 'PENDING',
      paymentMethod: paymentMethod || 'UPI (Google Pay)',
      transactionRef: transactionRef || `TXN-UPI-${Math.floor(100000 + Math.random() * 900000)}`,
      utrNumber: utrNumber || `UTR-SBIN-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        status: 'PENDING',
        orderId: newOrder.orderId
      });

      // Synchronize in-memory farmer store
      try {
        const farmerRouter = require('./farmer');
        if (typeof farmerRouter.addInMemoryBuyerRequest === 'function') {
          farmerRouter.addInMemoryBuyerRequest(createdBuyerReq.toObject ? createdBuyerReq.toObject() : createdBuyerReq);
        }
        if (typeof farmerRouter.addInMemoryOrder === 'function') {
          farmerRouter.addInMemoryOrder(newOrder.toObject ? newOrder.toObject() : newOrder);
        }
      } catch {}
    } catch (requestErr) {
      console.warn('Notice: Could not automatically create BuyerRequest alongside Order:', requestErr.message);
    }

    return res.status(201).json({
      message: 'Order created successfully. Pending farmer approval.',
      order: newOrder
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders - Get all orders placed by the authenticated buyer
router.get('/', async (req, res, next) => {
  try {
    const buyerIds = await resolveBuyerIds(req.buyer.id);
    const orders = await Order.find({ buyer: { $in: buyerIds } })
      .populate('crop')
      .sort({ createdAt: -1 });

    return res.json({
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id - Get a single order by orderId or Mongo _id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      $and: [
        { buyer: { $in: await resolveBuyerIds(req.buyer.id) } },
        { $or: [{ orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] }
      ]
    }).populate('crop');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    return res.json({ order });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/simulate-farmer - Demo simulation for farmer approval / rejection
router.patch('/:id/simulate-farmer', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'APPROVE' | 'REJECT'

    const order = await Order.findOne({
      $and: [
        { buyer: { $in: await resolveBuyerIds(req.buyer.id) } },
        { $or: [{ orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] }
      ]
    }).populate('crop');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.orderStatus !== 'PENDING_FARMER_APPROVAL') {
      return res.status(400).json({
        message: `Order status is currently "${order.orderStatus}". Only pending orders can be approved or rejected.`
      });
    }

    if (action === 'APPROVE') {
      order.orderStatus = 'CONFIRMED';
      order.status = 'CONFIRMED';

      // Deduct purchased quantity from available crop inventory
      if (order.crop) {
        order.crop.quantityKg = Math.max(0, order.crop.quantityKg - order.quantityKg);
        await order.crop.save();
      }

      await order.save();
      return res.json({
        message: 'Demo: Farmer approved the order.',
        order
      });
    } else if (action === 'REJECT') {
      order.orderStatus = 'REJECTED';
      order.status = 'REJECTED';
      order.deliveryStatus = 'NOT_ASSIGNED';
      await order.save();
      return res.json({
        message: 'Demo: Farmer rejected the order.',
        order
      });
    } else {
      return res.status(400).json({ message: 'Invalid action. Must be APPROVE or REJECT.' });
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/simulate-delivery-arrangement - Demo delivery arrangement
router.patch('/:id/simulate-delivery-arrangement', async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      $and: [
        { buyer: { $in: await resolveBuyerIds(req.buyer.id) } },
        { $or: [{ orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] }
      ]
    }).populate('crop');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.orderStatus !== 'CONFIRMED') {
      return res.status(400).json({
        message: `Cannot arrange delivery for order with status "${order.orderStatus}". Order must be CONFIRMED first.`
      });
    }

    order.deliveryStatus = 'READY_FOR_PICKUP';
    order.status = 'READY_FOR_PICKUP';
    await order.save();

    return res.json({
      message: 'Demo: Delivery arranged. Ready for pickup.',
      order
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/simulate-delivery-step - Demo advancing delivery stages sequentially
router.patch('/:id/simulate-delivery-step', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetStatus } = req.body;

    const order = await Order.findOne({
      $and: [
        { buyer: { $in: await resolveBuyerIds(req.buyer.id) } },
        { $or: [{ orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] }
      ]
    }).populate('crop');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.orderStatus !== 'CONFIRMED') {
      return res.status(400).json({
        message: `Cannot advance delivery for order with status "${order.orderStatus}".`
      });
    }

    // Sequential delivery progression:
    // READY_FOR_PICKUP -> PICKED_UP -> IN_TRANSIT -> DELIVERED
    const transitions = {
      'READY_FOR_PICKUP': 'PICKED_UP',
      'PICKED_UP': 'IN_TRANSIT',
      'IN_TRANSIT': 'DELIVERED'
    };

    const nextAllowed = transitions[order.deliveryStatus];

    if (!nextAllowed) {
      return res.status(400).json({
        message: `Order delivery is already at final stage (${order.deliveryStatus}). Cannot advance further.`,
        order
      });
    }

    if (targetStatus && targetStatus !== nextAllowed) {
      return res.status(400).json({
        message: `Invalid sequential transition from "${order.deliveryStatus}" to "${targetStatus}". Next stage must be "${nextAllowed}".`
      });
    }

    order.deliveryStatus = nextAllowed;
    order.status = nextAllowed;
    await order.save();

    return res.json({
      message: `Demo: Delivery status advanced to "${nextAllowed}".`,
      order
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/status - Legacy sequential advance route (retained for backward compatibility)
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      $and: [
        { buyer: { $in: await resolveBuyerIds(req.buyer.id) } },
        { $or: [{ orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] }
      ]
    }).populate('crop');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const stages = ['confirmed', 'preparing', 'assigned', 'on_the_way', 'delivered'];
    const currentIndex = stages.indexOf(order.status);

    if (currentIndex === -1 || currentIndex >= stages.length - 1) {
      return res.status(400).json({
        message: `Order is already at final stage (${order.status}). Cannot advance further.`,
        order
      });
    }

    const nextStatus = stages[currentIndex + 1];
    order.status = nextStatus;
    if (nextStatus === 'delivered') order.deliveryStatus = 'DELIVERED';
    else if (nextStatus === 'on_the_way') order.deliveryStatus = 'IN_TRANSIT';
    else if (nextStatus === 'assigned' || nextStatus === 'preparing') order.deliveryStatus = 'PICKED_UP';
    await order.save();

    return res.json({
      message: `Order status advanced to "${nextStatus}" for demonstration.`,
      order
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/:orderId/pay - Simulate demo payment for order or invoice
router.post('/:orderId/pay', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, transactionRef, utrNumber } = req.body;

    const query = isObjectId(orderId) ? { _id: orderId } : { orderId };
    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    order.paymentStatus = 'PAID';
    order.paymentMethod = paymentMethod || 'UPI (Google Pay)';
    order.transactionRef = transactionRef || `TXN-UPI-${Math.floor(100000 + Math.random() * 900000)}`;
    order.utrNumber = utrNumber || `UTR-SBIN-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date().toISOString(),
      note: `Payment completed via ${order.paymentMethod}. Ref: ${order.transactionRef}`
    });

    await order.save();

    return res.json({
      success: true,
      message: 'Demo payment recorded successfully.',
      order
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
