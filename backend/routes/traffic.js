const express = require('express');
const router = express.Router();
const { getDb } = require('../../database/mockDb');

function getTrafficStatus(area) {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;
  const dayType = isWeekend ? 'weekend' : 'weekday';

  if (hour >= 7 && hour <= 10) return { status: 'high', label: 'উচ্চ', emoji: '🔴', period: 'সকাল' };
  if (hour >= 17 && hour <= 20) return { status: 'very_high', label: 'অতি উচ্চ', emoji: '🔴', period: 'সন্ধ্যা' };
  if ((hour >= 11 && hour <= 16) || (hour >= 21 && hour <= 23)) return { status: 'medium', label: 'মাঝারি', emoji: '🟡', period: 'দুপুর' };
  return { status: 'low', label: 'কম', emoji: '🟢', period: 'রাত' };
}

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const data = db.traffic_data.filter(t => t.isActive !== false);
    const enriched = data.map(t => {
      const current = getTrafficStatus(t.area);
      return { ...t, currentStatus: current.status, label: current.label, emoji: current.emoji, period: current.period };
    });
    res.json({ success: true, traffic: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/area/:area', async (req, res) => {
  try {
    const db = getDb();
    const data = db.traffic_data.find(t => t.isActive !== false && t.area === req.params.area);
    if (!data) return res.status(404).json({ success: false, message: 'Area not found' });
    const current = getTrafficStatus(data.area);
    const affectedRoutes = db.routes.filter(r => r.isActive !== false && (
      r.busStops.some(s => s.name.includes(data.area)) ||
      r.from?.includes(data.area) || r.to?.includes(data.area)
    ));
    res.json({ success: true, traffic: { ...data, currentStatus: current, label: current.label, emoji: current.emoji }, affectedRoutes: affectedRoutes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const crypto = require('crypto');
    const db = getDb();
    const t = { _id: crypto.randomBytes(12).toString('hex'), ...req.body, lastUpdated: new Date(), isActive: true };
    db.traffic_data.push(t);
    res.status(201).json({ success: true, traffic: t });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
