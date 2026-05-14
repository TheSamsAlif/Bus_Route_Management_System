const express = require('express');
const router = express.Router();
const { Bus, getDb } = require('../../database/mockDb');

router.get('/', async (req, res) => {
  try {
    const { type, routeId } = req.query;
    const db = getDb();
    let results = db.buses.filter(b => b.isActive !== false);
    if (type) results = results.filter(b => b.type === type);
    if (routeId) results = results.filter(b => b.route === routeId);
    
    const buses = results.map(b => ({
      ...b,
      route: db.routes.find(r => r._id === b.route) || null
    }));
    
    res.json({ success: true, buses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const bus = db.buses.find(b => b._id === req.params.id);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
    res.json({ success: true, bus: { ...bus, route: db.routes.find(r => r._id === bus.route) || null } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const bus = new Bus(req.body);
    await bus.save();
    const db = getDb();
    if (bus.route) {
      const rt = db.routes.find(r => r._id === bus.route);
      if (rt) {
        rt.buses = rt.buses || [];
        if (!rt.buses.includes(bus._id)) rt.buses.push(bus._id);
      }
    }
    res.status(201).json({ success: true, bus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
    res.json({ success: true, bus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const idx = db.buses.findIndex(b => b._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Bus not found' });
    db.buses[idx].isActive = false;
    res.json({ success: true, message: 'Bus deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;