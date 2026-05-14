const express = require('express');
const cors = require('cors');
const path = require('path');
const { seedDatabase, getDb } = require('../database/mockDb');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/buses', require('./routes/buses'));
app.use('/api/fares', require('./routes/fares'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/operators', require('./routes/operators'));
app.use('/api/stops', require('./routes/stops'));
app.use('/api/traffic', require('./routes/traffic'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Gontoboddh BD API Running', developer: 'Sams Alif', database: 'In-Memory', version: '2.0.0' });
});

app.get('/api/admin/seed', (req, res) => {
  seedDatabase();
  res.json({ success: true, message: 'Database Seeded Successfully!' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

seedDatabase();

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Gontoboddh BD Server v2.0 Running on http://localhost:${PORT}`);
    console.log(`Developed by Sams Alif`);
    const _db = getDb(); console.log(`Database: In-Memory (${_db.routes.length} routes, ${_db.buses.length} buses)`);
  });
}

module.exports = app;
