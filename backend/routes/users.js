const express = require('express');
const router = express.Router();
const { User, getDb } = require('../../database/mockDb');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gontoboddh_bd_secret_2024';

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

router.get('/profile', auth, async (req, res) => {
  try {
    const db = getDb();
    const user = db.users.find(u => u._id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { password, ...userData } = user;
    userData.favorites = (userData.favorites || []).map(fId => db.routes.find(r => r._id === fId)).filter(Boolean);
    res.json({ success: true, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, profileImage, language, darkMode } = req.body;
    const db = getDb();
    const idx = db.users.findIndex(u => u._id === req.user.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });
    Object.assign(db.users[idx], { name, phone, profileImage, language, darkMode });
    const { password, ...userData } = db.users[idx];
    res.json({ success: true, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/favorites/:routeId', auth, async (req, res) => {
  try {
    const db = getDb();
    const user = db.users.find(u => u._id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.favorites = user.favorites || [];
    if (!user.favorites.includes(req.params.routeId)) user.favorites.push(req.params.routeId);
    res.json({ success: true, message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/favorites/:routeId', auth, async (req, res) => {
  try {
    const db = getDb();
    const user = db.users.find(u => u._id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.favorites = (user.favorites || []).filter(f => f !== req.params.routeId);
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/search-history', auth, async (req, res) => {
  try {
    const db = getDb();
    const user = db.users.find(u => u._id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.searchHistory = user.searchHistory || [];
    user.searchHistory.unshift({ ...req.body, date: new Date() });
    if (user.searchHistory.length > 20) user.searchHistory = user.searchHistory.slice(0, 20);
    res.json({ success: true, message: 'Saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/search-history', auth, async (req, res) => {
  try {
    const db = getDb();
    const user = db.users.find(u => u._id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, history: user.searchHistory || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get global notifications for user
router.get('/notifications', auth, async (req, res) => {
  try {
    const db = getDb();
    const notifications = (db.notifications || [])
      .filter(n => n.isGlobal && n.isActive !== false)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;