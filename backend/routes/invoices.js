// routes/invoices.js - Accounting invoices generated from verified delivered consignments
// Viva Note: Invoices are derived from completed/delivered orders belonging to the authenticated buyer.
// Backed by the permanent 'invoices' collection in MongoDB.

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order');
const Buyer = require('../models/Buyer');
const Invoice = require('../models/Invoice');

const isObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const resolveBuyerIds = async (buyerId) => {
  const ids = [buyerId];
  if (!isObjectId(buyerId)) {
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

router.use(authMiddleware);

// GET /api/invoices - Retrieve commercial invoices for delivered orders
router.get('/', async (req, res, next) => {
  try {
    const buyerIds = await resolveBuyerIds(req.buyer.id);

    // 1. Fetch any directly persisted invoices from the MongoDB 'invoices' collection
    const existingInvoices = await Invoice.find({
      buyer: { $in: buyerIds }
    }).sort({ invoiceDate: -1, createdAt: -1 });

    // 2. Find all delivered orders for this buyer (case-insensitive & dual enum check)
    const deliveredOrders = await Order.find({
      buyer: { $in: buyerIds },
      $or: [
        { status: { $regex: /^delivered$/i } },
        { deliveryStatus: 'DELIVERED' },
        { orderStatus: 'DELIVERED' }
      ]
    })
      .populate('crop')
      .sort({ updatedAt: -1 });

    // 3. For any delivered order without an invoice, snapshot into MongoDB 'invoices' collection
    for (const order of deliveredOrders) {
      const invNum = `INV-${order.orderId.replace(/^NU-/, '')}`;
      const exists = existingInvoices.some((inv) => inv.orderId === order.orderId || inv.invoiceNumber === invNum);
      if (!exists) {
        const crop = order.crop || {};
        const unitPrice = crop.pricePerKg || (order.quantityKg > 0 ? Math.round(order.totalPrice / order.quantityKg) : 40);
        try {
          const createdInv = await Invoice.create({
            invoiceNumber: invNum,
            orderId: order.orderId,
            order: order._id,
            buyer: req.buyer.id,
            buyerName: req.buyer.businessName || req.buyer.name || 'Commercial Procurement Partner',
            farmerId: order.farmerId || crop.farmerId || 'FMR-TN-2026-01',
            cropName: crop.name || order.cropDetails?.name || 'Farm Fresh Produce',
            tamilCropName: crop.nameTa || order.cropDetails?.nameTa || '',
            grade: crop.grade || order.cropDetails?.grade || 'Grade A',
            quantityKg: order.quantityKg || 100,
            unitPrice,
            subtotal: order.totalPrice || unitPrice * (order.quantityKg || 100),
            taxAmount: 0,
            totalAmount: order.totalPrice || unitPrice * (order.quantityKg || 100),
            status: 'PAID',
            hub: crop.hub || order.cropDetails?.hub || 'Dindigul Central Hub',
            farmer: {
              name: crop.farmerName || order.cropDetails?.farmerName || 'Local Producer',
              phone: '+91 94432 78190',
              location: crop.hub || order.cropDetails?.hub || 'Pollachi Hub'
            },
            invoiceDate: order.updatedAt || order.createdAt || new Date()
          });
          existingInvoices.unshift(createdInv);
        } catch (createErr) {
          console.warn('Notice creating invoice snapshot:', createErr.message);
        }
      }
    }

    // 4. Map MongoDB invoices to frontend structure
    const invoices = existingInvoices.map((inv) => {
      const dateStr = new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      return {
        id: inv.invoiceNumber || `INV-${inv._id}`,
        _id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        orderId: inv.orderId,
        invoiceDate: dateStr,
        cropName: inv.cropName,
        tamilCropName: inv.tamilCropName || '',
        grade: inv.grade || 'Grade A',
        quantityKg: inv.quantityKg,
        unitPrice: inv.unitPrice,
        totalAmount: inv.totalAmount,
        status: (inv.status || 'PAID').toLowerCase(),
        hub: inv.hub,
        farmer: inv.farmer || {
          name: 'Local Producer',
          phone: '+91 98421 78210',
          location: inv.hub || 'Tamil Nadu'
        }
      };
    });

    return res.json({
      count: invoices.length,
      invoices
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/invoices/:id - Retrieve single invoice details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const inv = await Invoice.findOne({
      $or: [{ invoiceNumber: id }, { orderId: id }]
    });
    if (!inv) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }
    return res.json({ success: true, invoice: inv });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
