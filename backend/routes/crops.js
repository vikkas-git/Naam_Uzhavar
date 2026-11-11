// routes/crops.js - Public produce catalog and consignment listings
// Viva Note: Anyone can query current farm produce without an account; filters match regional hubs, categories, and grades.
// Backed directly by the permanent 'crops' collection in MongoDB.

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Crop = require('../models/Crop');

// GET /api/crops - List all available crops with optional filtering
// Query params: ?search=tomato&category=vegetables&grade=Grade A
router.get('/', async (req, res, next) => {
  try {
    const { search, category, grade, hub } = req.query;
    const filter = {
      status: { $ne: 'removed' }
    };

    // Filter by produce category or keyword
    if (category && category !== 'all') {
      const lowerCat = String(category).toLowerCase().trim();
      const catRegex = new RegExp(lowerCat, 'i');
      filter.$or = [
        { category: lowerCat },
        { name: catRegex },
        { nameTa: catRegex }
      ];
    }

    // Filter by quality grade
    if (grade && grade !== 'all') {
      const normGrade = grade.toLowerCase().replace(/_/g, ' ');
      if (normGrade.includes('grade a')) {
        filter.grade = 'Grade A';
      } else if (normGrade.includes('grade b')) {
        filter.grade = 'Grade B';
      } else if (normGrade.includes('grade c')) {
        filter.grade = 'Grade C';
      } else {
        filter.grade = grade;
      }
    }

    // Filter by regional hub
    if (hub && hub !== 'all') {
      filter.hub = new RegExp(hub.trim(), 'i');
    }

    // Keyword search across English name, Tamil name, hub, variety, and farmer name
    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      const searchConditions = [
        { name: regex },
        { nameTa: regex },
        { hub: regex },
        { variety: regex },
        { farmerName: regex }
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    let crops = [];
    if (mongoose.connection.readyState === 1) {
      crops = await Crop.find(filter).sort({ createdAt: -1 });
    }

    // Deduplicate: Keep one listing per unique (name + variety + grade) to maintain a clean marketplace
    const deduplicated = [];
    const seenCropKeys = new Set();

    for (const c of crops) {
      const nameKey = String(c.name || c.nameTa || '').toLowerCase().trim();
      const varietyKey = String(c.variety || '').toLowerCase().trim();
      const gradeKey = String(c.grade || 'Grade A').toLowerCase().trim();
      const key = `${nameKey}_${varietyKey}_${gradeKey}`;

      if (!seenCropKeys.has(key)) {
        seenCropKeys.add(key);
        deduplicated.push(c);
      }
    }

    return res.json({
      count: deduplicated.length,
      crops: deduplicated
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crops/:id - Retrieve single crop listing details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    let crop = null;

    if (mongoose.connection.readyState === 1) {
      if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
        crop = await Crop.findById(id);
      } else {
        crop = await Crop.findOne({
          $or: [{ _id: id }, { name: new RegExp(id.replace(/-/g, ' '), 'i') }]
        });
      }
    }

    if (!crop) {
      return res.status(404).json({ message: 'Crop listing not found.' });
    }

    return res.json({ success: true, crop });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
