const express = require('express');
const router = express.Router();
const { getDb } = require('../../database/mockDb');

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const operators = db.operators.filter(o => o.isActive !== false);
    res.json({ success: true, operators });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const op = db.operators.find(o => o._id === req.params.id);
    if (!op) return res.status(404).json({ success: false, message: 'Operator not found' });
    const buses = db.buses.filter(b => b.operator === op._id && b.isActive !== false);
    res.json({ success: true, operator: { ...op, buses } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const crypto = require('crypto');
    const db = getDb();
    const op = { _id: crypto.randomBytes(12).toString('hex'), ...req.body, isActive: true, createdAt: new Date() };
    db.operators.push(op);
    res.status(201).json({ success: true, operator: op });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const idx = db.operators.findIndex(o => o._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Operator not found' });
    Object.assign(db.operators[idx], req.body);
    res.json({ success: true, operator: db.operators[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const idx = db.operators.findIndex(o => o._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Operator not found' });
    db.operators[idx].isActive = false;
    res.json({ success: true, message: 'Operator deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
