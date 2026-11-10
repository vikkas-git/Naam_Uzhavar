// routes/crops.js - Public produce catalog and consignment listings
// Viva Note: Anyone can query current farm produce without an account; filters match regional hubs and grades.
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Crop = require('../models/Crop');

const FALLBACK_CROPS = [
  {
    _id: 'crop-tomato-01',
    name: 'Country Tomato',
    nameTa: 'நாட்டு தக்காளி',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Hybrid Tomato',
    farmingMethod: 'Natural',
    pricePerKg: 28,
    quantityKg: 500,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Pollachi Hub',
    distanceKm: 12,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    _id: 'crop-onion-01',
    name: 'Dindigul Red Onion',
    nameTa: 'திண்டுக்கல் வெங்காயம்',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Small Shallot',
    farmingMethod: 'Organic',
    pricePerKg: 55,
    quantityKg: 350,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Oddanchatram Hub',
    distanceKm: 28,
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    _id: 'crop-potato-01',
    name: 'Nilgiris Mountain Potato',
    nameTa: 'நீலகிரி உருளைக்கிழங்கு',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Kufri Jyoti',
    farmingMethod: 'Natural',
    pricePerKg: 36,
    quantityKg: 800,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Ooty / Mettupalayam Hub',
    distanceKm: 45,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    _id: 'crop-carrot-01',
    name: 'Ooty Country Carrot',
    nameTa: 'ஊட்டி நாட்டு கேரட்',
    category: 'vegetables',
    grade: 'Grade A',
    variety: 'Hill Country Sweet',
    farmingMethod: 'Natural',
    pricePerKg: 42,
    quantityKg: 400,
    unit: 'Kg',
    farmerId: 'FMR-TN-2026-01',
    farmerName: 'Ramesh Kumar',
    hub: 'Mettupalayam Hub',
    distanceKm: 42,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
    status: 'active'
  }
];

// GET /api/crops - List all available crops with optional filtering
// Query params: ?search=tomato&category=vegetables&grade=Grade A
router.get('/', async (req, res, _next) => {
  try {
    const { search, category, grade } = req.query;
    const filter = {};

    // Filter by produce category or specific vegetable type
    if (category && category !== 'all') {
      const lowerCat = String(category).toLowerCase();
      if (['tomato', 'onion', 'potato', 'carrot'].includes(lowerCat)) {
        const catRegex = new RegExp(lowerCat, 'i');
        filter.$or = [
          { name: catRegex },
          { nameTa: catRegex }
        ];
      } else {
        filter.category = category;
      }
    }

    // Filter by quality grade
    if (grade && grade !== 'all') {
      if (grade === 'grade_a' || grade === 'Grade A') {
        filter.grade = 'Grade A';
      } else if (grade === 'grade_b' || grade === 'Grade B') {
        filter.grade = 'Grade B';
      } else if (grade === 'grade_c' || grade === 'Grade C') {
        filter.grade = 'Grade C';
      } else {
        filter.grade = grade;
      }
    }

    // Keyword search across English name, Tamil name, hub, and farmer name
    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { name: regex },
        { nameTa: regex },
        { hub: regex },
        { farmerName: regex }
      ];
    }

    let crops = [];
    if (mongoose.connection.readyState === 1) {
      crops = await Crop.find(filter).sort({ createdAt: -1 });
    }

    if (!crops || crops.length === 0) {
      // In-memory fallback
      crops = FALLBACK_CROPS.filter((c) => {
        if (category && category !== 'all') {
          const lCat = category.toLowerCase();
          if (!c.name.toLowerCase().includes(lCat) && c.category.toLowerCase() !== lCat) {
            return false;
          }
        }
        if (grade && grade !== 'all') {
          if (c.grade.toLowerCase() !== grade.toLowerCase()) return false;
        }
        if (search && search.trim()) {
          const q = search.trim().toLowerCase();
          const match =
            c.name.toLowerCase().includes(q) ||
            (c.nameTa && c.nameTa.includes(q)) ||
            (c.hub && c.hub.toLowerCase().includes(q)) ||
            (c.farmerName && c.farmerName.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      });
    }

    // Deduplicate: Never return multiple identical produce listings for the same crop type & grade
    const deduplicated = [];
    const seenCropKeys = new Set();
    for (const c of crops) {
      const name = String(c.name || c.nameTa || '').toLowerCase();
      let type = '';
      if (name.includes('tomato') || name.includes('தக்காளி')) type = 'tomato';
      else if (name.includes('onion') || name.includes('shallot') || name.includes('vengayam') || name.includes('வெங்காயம்') || name.includes('bellary')) type = 'onion';
      else if (name.includes('potato') || name.includes('urulai') || name.includes('உருளை')) type = 'potato';
      else if (name.includes('carrot') || name.includes('கேரட்') || name.includes('karat')) type = 'carrot';

      if (!type) continue;
      const grade = String(c.grade || 'Grade A').toLowerCase().trim();
      const key = `${type}_${grade}`;
      if (!seenCropKeys.has(key)) {
        seenCropKeys.add(key);
        deduplicated.push(c);
      }
    }

    // Ensure all 4 staples are present
    if (!category || category === 'all') {
      for (const fallback of FALLBACK_CROPS) {
        const name = fallback.name.toLowerCase();
        let type = '';
        if (name.includes('tomato')) type = 'tomato';
        else if (name.includes('onion')) type = 'onion';
        else if (name.includes('potato')) type = 'potato';
        else if (name.includes('carrot')) type = 'carrot';

        const key = `${type}_${fallback.grade.toLowerCase().trim()}`;
        if (!seenCropKeys.has(key)) {
          seenCropKeys.add(key);
          deduplicated.push(fallback);
        }
      }
    }

    return res.json({
      count: deduplicated.length,
      crops: deduplicated
    });
  } catch {
    return res.json({
      count: FALLBACK_CROPS.length,
      crops: FALLBACK_CROPS
    });
  }
});

module.exports = router;
