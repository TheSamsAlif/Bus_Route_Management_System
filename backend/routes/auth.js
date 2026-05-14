const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, getDb } = require('../../database/mockDb');
const JWT_SECRET = 'gontoboddh_bd_secret_2024';

router.post('/register', async (req, res) => {
  try {
    const { username, name, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username & password required' });

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ success: false, message: 'Username already taken' });

    const db = getDb();
    const newUser = {
      _id: crypto.randomBytes(12).toString('hex'),
      username,
      name: name || username,
      email: username + '@bd.com',
      password: password + '_hashed',
      role: 'user',
      language: 'bn',
      darkMode: false,
      favorites: [],
      searchHistory: [],
      createdAt: new Date()
    };
    db.users.push(newUser);

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      success: true, message: 'Registration successful',
      token,
      user: { id: newUser._id, username: newUser.username, name: newUser.name, role: newUser.role }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username & password required' });

    const db = getDb();
    const user = db.users.find(u => u.username?.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const isMatch = password + '_hashed' === user.password;
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true, message: 'Login successful',
      token,
      user: { id: user._id, username: user.username, name: user.name, role: user.role }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.users.find(u => u._id === decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { password, ...data } = user;
    res.json({ success: true, user: data });
  } catch (err) { res.status(401).json({ success: false, message: 'Invalid token' }); }
});

module.exports = router;
