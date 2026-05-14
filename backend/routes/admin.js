const express = require('express');
const router = express.Router();
const { getDb, seedDatabase } = require('../../database/mockDb');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'gontoboddh_bd_secret_2024';

const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.users.find(u => u._id === decoded.id);
    if (user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const totalUsers = db.users.length;
    const totalRoutes = db.routes.filter(r => r.isActive !== false).length;
    const totalBuses = db.buses.filter(b => b.isActive !== false).length;
    const totalOperators = db.operators.filter(o => o.isActive !== false).length;
    const totalStops = db.stops.filter(s => s.isActive !== false).length;
    const topRoutes = db.routes.filter(r => r.isActive !== false).sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0)).slice(0, 5);
    const recentUsers = db.users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map(({ password, ...u }) => u);
    res.json({
      success: true, stats: { totalUsers, totalRoutes, totalBuses, totalOperators, totalStops, topRoutes, recentUsers }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const users = db.users.map(({ password, ...u }) => u).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Announcements
router.post('/announcements', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const a = { ...req.body, _id: crypto.randomBytes(12).toString('hex'), isActive: true, createdAt: new Date() };
    db.announcements.push(a);
    res.status(201).json({ success: true, announcement: a });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/announcements', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const announcements = [...db.announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/announcements/:id', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const idx = db.announcements.findIndex(a => a._id === req.params.id);
    if (idx > -1) db.announcements.splice(idx, 1);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Traffic alerts
router.post('/traffic', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const t = { _id: crypto.randomBytes(12).toString('hex'), ...req.body, lastUpdated: new Date(), isActive: true };
    db.traffic_data.push(t);
    res.status(201).json({ success: true, traffic: t });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk import routes
router.post('/import/routes', adminAuth, async (req, res) => {
  try {
    const { routes } = req.body;
    if (!routes || !routes.length) return res.status(400).json({ success: false, message: 'No routes data' });
    const db = getDb();
    let imported = 0;
    for (const rd of routes) {
      const routeObj = {
        _id: crypto.randomBytes(12).toString('hex'),
        name: rd.name || rd.route_name || '',
        from: rd.from || rd.start || '',
        to: rd.to || rd.end || '',
        category: rd.category || rd.cat || 'dhaka_city',
        distance: parseFloat(rd.distance || rd.dist || 0),
        estimatedTime: parseInt(rd.estimatedTime || rd.time || 0),
        busStops: (rd.stops || rd.busStops || []).map((s, i) => ({
          name: typeof s === 'string' ? s : (s.name || ''),
          order: i + 1,
          distance: s.distance || Math.round(parseFloat(rd.distance || rd.dist || 0) * (i + 1) / (rd.stops || rd.busStops || []).length)
        })),
        buses: [], trafficStatus: rd.trafficStatus || rd.traf || 'medium',
        isActive: true, searchCount: 0, createdAt: new Date()
      };
      db.routes.push(routeObj);
      imported++;
    }
    res.json({ success: true, message: `${imported} routes imported successfully`, imported });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk import buses
router.post('/import/buses', adminAuth, async (req, res) => {
  try {
    const { buses } = req.body;
    if (!buses || !buses.length) return res.status(400).json({ success: false, message: 'No buses data' });
    const db = getDb();
    let imported = 0;
    for (const bd of buses) {
      const route = db.routes.find(r => r._id === bd.route || r.name === bd.routeName);
      const bus = {
        _id: crypto.randomBytes(12).toString('hex'),
        name: bd.name || bd.bus_name || '',
        operator: bd.operator || null,
        type: bd.type || bd.bus_type || 'non_ac',
        route: route?._id || null,
        fare: parseFloat(bd.fare || bd.price || 0),
        seatCapacity: parseInt(bd.seatCapacity || bd.seats || 40),
        departureTime: bd.departureTime || bd.departure || '06:00',
        arrivalTime: bd.arrivalTime || bd.arrival || '07:00',
        amenities: bd.amenities || [],
        image: bd.image || '',
        isActive: true, createdAt: new Date()
      };
      db.buses.push(bus);
      if (route) {
        route.buses = route.buses || [];
        if (!route.buses.includes(bus._id)) route.buses.push(bus._id);
      }
      imported++;
    }
    res.json({ success: true, message: `${imported} buses imported successfully`, imported });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bus image URL update
router.put('/buses/:id/image', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const idx = db.buses.findIndex(b => b._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Bus not found' });
    db.buses[idx].image = req.body.image || '';
    res.json({ success: true, bus: db.buses[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Send notification to all users
router.post('/notify', adminAuth, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });
    const db = getDb();
    const notification = {
      _id: crypto.randomBytes(12).toString('hex'),
      title: title || 'জরুরি বিজ্ঞপ্তি',
      message,
      type: type || 'urgent',
      isGlobal: true,
      isActive: true,
      createdAt: new Date()
    };
    db.notifications.push(notification);
    // Also create an announcement
    db.announcements.push({
      _id: crypto.randomBytes(12).toString('hex'),
      title: title || 'জরুরি বিজ্ঞপ্তি',
      message,
      type: type === 'urgent' ? 'emergency' : type,
      isActive: true,
      createdAt: new Date()
    });
    res.status(201).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all notifications
router.get('/notifications', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const notifications = [...db.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete notification
router.delete('/notifications/:id', adminAuth, async (req, res) => {
  try {
    const db = getDb();
    const idx = db.notifications.findIndex(n => n._id === req.params.id);
    if (idx > -1) db.notifications.splice(idx, 1);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/seed', (req, res) => {
  seedDatabase();
  res.json({ success: true, message: 'In-Memory Database Seeded Successfully!' });
});

module.exports = router;
