const express = require('express');
const router = express.Router();
const { Fare, getDb } = require('../../database/mockDb');

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const db = getDb();
    let results = db.fares.filter(f => f.isActive !== false);
    if (category) results = results.filter(f => f.category === category);
    res.json({ success: true, fares: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/calculate', async (req, res) => {
  try {
    const { distance, category = 'dhaka_city', busType = 'non_ac', seatCount = 52, toll = 0, isStudent = false } = req.body;
    const db = getDb();
    const dist = parseFloat(distance);
    if (!dist || dist <= 0) return res.status(400).json({ success: false, message: 'Valid distance required' });

    // 1. Base fare rule
    let fareRule = db.fares.find(f => f.category === category && f.busType === busType && f.isActive !== false);
    if (!fareRule) {
      fareRule = db.fares.find(f => f.category === category && f.busType === 'non_ac' && f.isActive !== false);
    }
    if (!fareRule) {
      fareRule = { perKmRate: 2.53, minFare: 10, peakHourMultiplier: 1.15 };
    }

    // 2. Base calculation: distance * perKmRate
    let distanceCharge = dist * fareRule.perKmRate;
    let fare = distanceCharge;

    // 3. Seat count adjustment (for intercity/long_route, standard seat = 52)
    let seatMultiplier = 1;
    if ((category === 'intercity' || category === 'long_route') && seatCount < 52) {
      const ratio = (52 - seatCount) / 12;
      seatMultiplier = 1 + Math.min(ratio, 0.3);
      fare *= seatMultiplier;
    }

    // 4. Minimum fare check
    const isMinibus = busType === 'counter' || seatCount <= 25;
    const minFare = isMinibus ? 8 : (fareRule.minFare || 10);
    if (fare < minFare) fare = minFare;

    // 5. Add toll
    const tollAmount = parseFloat(toll) || 0;
    fare += tollAmount;

    // 6. Peak hour multiplier
    const hour = new Date().getHours();
    const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
    let peakCharge = 0;
    if (isPeakHour) {
      const beforePeak = fare;
      fare *= fareRule.peakHourMultiplier || 1.15;
      peakCharge = fare - beforePeak;
    }

    // 7. Student discount (50% of total fare)
    let studentDiscount = 0;
    if (isStudent) {
      studentDiscount = fare * 0.5;
      fare -= studentDiscount;
    }

    res.json({
      success: true,
      fare: Math.round(fare),
      breakdown: {
        baseRate: fareRule.perKmRate,
        distanceCharge: Math.round(distanceCharge),
        seatAdjustment: seatMultiplier !== 1 ? Math.round(distanceCharge * (seatMultiplier - 1)) : 0,
        seatMultiplier: Math.round(seatMultiplier * 100) / 100,
        tollAmount: Math.round(tollAmount),
        peakHourCharge: isPeakHour ? Math.round(peakCharge) : 0,
        studentDiscount: isStudent ? Math.round(studentDiscount) : 0,
        total: Math.round(fare)
      },
      isPeakHour,
      isStudent,
      minFare
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const fare = new Fare(req.body);
    await fare.save();
    res.status(201).json({ success: true, fare });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const fare = new Fare(null);
    const db = getDb();
    const idx = db.fares.findIndex(f => f._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Fare rule not found' });
    Object.assign(db.fares[idx], req.body);
    res.json({ success: true, fare: db.fares[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;