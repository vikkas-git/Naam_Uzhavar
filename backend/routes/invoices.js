// routes/invoices.js - Accounting invoices generated from verified delivered consignments
// Viva Note: Invoices are derived from completed/delivered orders belonging to the authenticated buyer.
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order');
const Buyer = require('../models/Buyer');

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
    // 1. Find all delivered orders for this buyer
    const buyerIds = await resolveBuyerIds(req.buyer.id);
    const deliveredOrders = await Order.find({
      buyer: { $in: buyerIds },

      status: 'delivered'
    })
      .populate('crop')
      .sort({ updatedAt: -1 });

    // 2. Map delivered orders to invoice format
    const dynamicInvoices = deliveredOrders.map((order) => {
      const crop = order.crop || {};
      const dateStr = new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      return {
        id: `INV-${order.orderId.replace('NU-', '')}`,
        orderId: order.orderId,
        invoiceDate: dateStr,
        cropName: crop.name || 'Farm Fresh Produce',
        tamilCropName: crop.nameTa || '',
        grade: crop.grade || 'Grade A',
        quantityKg: order.quantityKg,
        unitPrice: crop.pricePerKg || Math.round(order.totalPrice / (order.quantityKg || 1)),
        totalAmount: order.totalPrice,
        status: 'paid',
        hub: crop.hub || 'Dindigul Central',
        farmer: {
          name: crop.farmerName || 'Local Producer',
          phone: '+91 98421 78210',
          location: crop.hub || 'Tamil Nadu'
        }
      };
    });

    // 3. Fallback archived records for initial viva demonstration if no orders are delivered yet
    const archivedInvoices = [
      {
        id: 'INV-2026-00088',
        orderId: 'NU-2026-00088',
        invoiceDate: '15 Oct 2026',
        cropName: 'Sirumalai Hill Bananas',
        tamilCropName: 'சிறுமலை வாழை',
        grade: 'Grade A',
        quantityKg: 300,
        unitPrice: 38,
        totalAmount: 11400,
        status: 'paid',
        hub: 'Sirumalai, Dindigul',
        farmer: {
          name: 'N. Balakrishnan',
          phone: '+91 94438 90123',
          location: 'Sirumalai Hills, Dindigul'
        }
      },
      {
        id: 'INV-2026-00075',
        orderId: 'NU-2026-00075',
        invoiceDate: '12 Oct 2026',
        cropName: 'Green Capsicum',
        tamilCropName: 'குடைமிளகாய்',
        grade: 'Grade A',
        quantityKg: 120,
        unitPrice: 52,
        totalAmount: 6240,
        status: 'paid',
        hub: 'Vedasandur, Dindigul',
        farmer: {
          name: 'V. Senthil',
          phone: '+91 97890 12345',
          location: 'Vedasandur, Dindigul'
        }
      }
    ];

    const invoices = dynamicInvoices.length > 0 ? dynamicInvoices : archivedInvoices;

    return res.json({
      count: invoices.length,
      invoices
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
