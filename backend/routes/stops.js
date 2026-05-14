const express = require('express');
const router = express.Router();
const { getDb } = require('../../database/mockDb');

router.get('/', async (req, res) => {
  try {
    const { area, city, search } = req.query;
    const db = getDb();
    let results = db.stops.filter(s => s.isActive !== false);
    if (area) results = results.filter(s => s.area?.toLowerCase() === area.toLowerCase());
    if (city) results = results.filter(s => s.city?.toLowerCase() === city.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(s => s.name?.toLowerCase().includes(q) || s.bn?.toLowerCase().includes(q) || s.area?.toLowerCase().includes(q));
    }
    res.json({ success: true, stops: results, total: results.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 3 } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required' });
    const db = getDb();
    const stops = db.stops.filter(s => s.isActive !== false && s.lat && s.lng).filter(s => {
      const dist = Math.sqrt(Math.pow(s.lat - parseFloat(lat), 2) + Math.pow(s.lng - parseFloat(lng), 2)) * 111;
      return dist <= parseFloat(radius);
    });
    res.json({ success: true, stops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const stop = db.stops.find(s => s._id === req.params.id);
    if (!stop) return res.status(404).json({ success: false, message: 'Stop not found' });
    const routes = db.routes.filter(r => r.isActive !== false && r.busStops.some(bs => bs.name === stop.name)).map(r => ({
      ...r, buses: (r.buses || []).map(bId => db.buses.find(b => b._id === bId)).filter(Boolean)
    }));
    res.json({ success: true, stop, routes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
