const express = require('express');
const router = express.Router();
const { Route, getDb } = require('../../database/mockDb');

function populateRoute(route, db) {
  const buses = (route.buses || []).map(bId => db.buses.find(b => b._id === bId)).filter(Boolean);
  const operatorIds = [...new Set(buses.map(b => b.operator).filter(Boolean))];
  const operators = operatorIds.map(oid => db.operators.find(o => o._id === oid)).filter(Boolean);
  return { ...route, buses, operators };
}

function normalizeBn(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[()\/,\-–]/g, ' ')
    .replace(/ী/g, 'ি')
    .replace(/ূ/g, 'ু')
    .replace(/ণ/g, 'ন')
    .replace(/\s+/g, ' ')
    .trim();
}

function partialMatch(text, query) {
  if (!text || !query) return false;
  const t = text.toLowerCase().trim();
  const q = query.toLowerCase().trim();
  if (t === q || t.includes(q) || q.includes(t)) return true;
  
  const normT = normalizeBn(t);
  const normQ = normalizeBn(q);
  if (normT === normQ || normT.includes(normQ) || normQ.includes(normT)) return true;
  
  const words = normQ.split(' ').filter(w => w.length > 1);
  if (words.length > 0 && words.every(w => normT.includes(w))) return true;
  return false;
}

function routeHasStop(r, stopQuery) {
  if (partialMatch(r.from, stopQuery) || partialMatch(r.to, stopQuery) || partialMatch(r.name, stopQuery)) return true;
  if (r.fromEn && partialMatch(r.fromEn, stopQuery)) return true;
  if (r.toEn && partialMatch(r.toEn, stopQuery)) return true;
  if (r.en && partialMatch(r.en, stopQuery)) return true;
  return (r.busStops || []).some(s =>
    partialMatch(s.name, stopQuery) ||
    (s.en && partialMatch(s.en, stopQuery)) ||
    (s.displayName && partialMatch(s.displayName, stopQuery))
  );
}


function findTransitRoutes(from, to, db) {
  const fromRoutes = db.routes.filter(r => r.isActive !== false && routeHasStop(r, from));
  const toRoutes = db.routes.filter(r => r.isActive !== false && routeHasStop(r, to));
  const transits = [];
  for (const f of fromRoutes) {
    for (const t of toRoutes) {
      if (f._id === t._id) continue;
      const commonStops = (f.busStops || []).filter(fs => (t.busStops || []).some(ts => ts.name === fs.name));
      if (commonStops.length > 0) {
        transits.push({
          firstRoute: f,
          secondRoute: t,
          interchangeStop: commonStops[0].name,
          totalDistance: f.distance + t.distance,
          totalTime: (f.estimatedTime || 0) + (t.estimatedTime || 0)
        });
      }
    }
  }
  return transits.sort((a, b) => a.totalTime - b.totalTime).slice(0, 3);
}

router.get('/', async (req, res) => {
  try {
    const { category, search, popular, limit } = req.query;
    const db = getDb();
    let results = db.routes.filter(r => r.isActive !== false);

    if (category) results = results.filter(r => r.category === category);
    if (popular === 'true') results = results.sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0));
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(r =>
        partialMatch(r.name, q) || partialMatch(r.from, q) || partialMatch(r.to, q) ||
        (r.en && partialMatch(r.en, q)) ||
        (r.busStops || []).some(s => partialMatch(s.name, q) || (s.en && partialMatch(s.en, q)))
      );
    }
    if (limit) results = results.slice(0, parseInt(limit));

    const routes = results.map(r => populateRoute(r, db));
    res.json({ success: true, routes, total: routes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const idx = db.routes.findIndex(r => r._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Route not found' });

    db.routes[idx].searchCount = (db.routes[idx].searchCount || 0) + 1;
    const route = populateRoute(db.routes[idx], db);

    res.json({ success: true, route });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/search/from/:from/to/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    const db = getDb();
    const results = db.routes.filter(r => r.isActive !== false);

    // Direct matches: either endpoints or passing through both stops
    let directMatches = results.filter(r => routeHasStop(r, from) && routeHasStop(r, to));

    directMatches.forEach(r => { r.searchCount = (r.searchCount || 0) + 1; });

    let transits = [];
    if (directMatches.length === 0) {
      transits = findTransitRoutes(from, to, db);
    }

    const routes = directMatches.map(r => populateRoute(r, db));

    res.json({
      success: true,
      routes,
      totalRoutes: routes.length,
      transits: transits.map(t => ({
        firstRoute: populateRoute(t.firstRoute, db),
        secondRoute: populateRoute(t.secondRoute, db),
        interchangeStop: t.interchangeStop,
        totalDistance: t.totalDistance,
        totalTime: t.totalTime
      })),
      hasDirect: routes.length > 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/suggest/stops', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json({ success: true, suggestions: [] });
    const db = getDb();
    const query = q.toLowerCase();
    const matched = [];

    // Match stops list
    (db.stops || []).forEach(s => {
      if (s.isActive !== false) {
        if (partialMatch(s.name, query) || (s.bn && partialMatch(s.bn, query))) {
          matched.push(s.name);
        }
      }
    });

    // Match route endpoints and stops
    (db.routes || []).forEach(r => {
      if (r.isActive !== false) {
        if (partialMatch(r.from, query)) matched.push(r.from);
        if (partialMatch(r.to, query)) matched.push(r.to);
        (r.busStops || []).forEach(st => {
          if (partialMatch(st.name, query) || (st.en && partialMatch(st.en, query))) {
            matched.push(st.name);
          }
        });
      }
    });

    const suggestions = [...new Set(matched)].slice(0, 10);
    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    res.status(201).json({ success: true, route });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, route });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const idx = db.routes.findIndex(r => r._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Route not found' });
    db.routes[idx].isActive = false;
    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
