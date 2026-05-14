const express = require('express');
const router = express.Router();
const { getDb } = require('../../database/mockDb');

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const now = new Date();
    const announcements = db.announcements
      .filter(a => a.isActive !== false)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;