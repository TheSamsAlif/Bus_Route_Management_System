const express = require('express');
const router = express.Router();
const { Route, getDb } = require('../../database/mockDb');

function populateRoute(route, db) {
  const buses = (route.buses || []).map(bId => db.buses.find(b => b._id === bId)).filter(Boolean);
  const operatorIds = [...new Set(buses.map(b => b.operator).filter(Boolean))];
  const operators = operatorIds.map(oid => db.operators.find(o => o._id === oid)).filter(Boolean);
  return { ...route, buses, operators };
}

function partialMatch(text, query) {
  if (!text || !query) return false;
  return text.toLowerCase().includes(query.toLowerCase()) ||
         text.toLowerCase().replace(/[\u0980-\u09FF]/g, '').includes(query.toLowerCase().replace(/[\u0980-\u09FF]/g, '')) ||
         query.split(' ').some(q => text.toLowerCase().includes(q));
}

function findTransitRoutes(from, to, db) {
  const fromRoutes = db.routes.filter(r => r.isActive !== false && (partialMatch(r.from, from) || r.busStops.some(s => partialMatch(s.name, from))));
  const toRoutes = db.routes.filter(r => r.isActive !== false && (partialMatch(r.to, to) || r.busStops.some(s => partialMatch(s.name, to))));
  const transits = [];
  for (const f of fromRoutes) {
    for (const t of toRoutes) {
      if (f._id === t._id) continue;
      const commonStops = f.busStops.filter(fs => t.busStops.some(ts => ts.name === fs.name));
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
        r.busStops.some(s => partialMatch(s.name, q))
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

    const f = from.toLowerCase(), t = to.toLowerCase();

    // Strict match: from == from AND to == to (or reversed)
    let directMatches = results.filter(r => {
      const fromMatch = partialMatch(r.from, from) && partialMatch(r.to, to);
      const reversed = partialMatch(r.from, to) && partialMatch(r.to, from);
      return fromMatch || reversed;
    });

    // Broader match: if strict fails, try stop-based matching
    if (directMatches.length === 0) {
      directMatches = results.filter(r => {
        const startsWithFrom = partialMatch(r.from, from) || r.busStops.slice(0, Math.ceil(r.busStops.length / 2)).some(s => partialMatch(s.name, from));
        const endsWithTo = partialMatch(r.to, to) || r.busStops.slice(Math.floor(r.busStops.length / 2)).some(s => partialMatch(s.name, to));
        const reversed = (partialMatch(r.from, to) || r.busStops.slice(0, Math.ceil(r.busStops.length / 2)).some(s => partialMatch(s.name, to))) &&
                         (partialMatch(r.to, from) || r.busStops.slice(Math.floor(r.busStops.length / 2)).some(s => partialMatch(s.name, from)));
        return (startsWithFrom && endsWithTo) || reversed;
      });
    }

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
    const stops = db.stops
      .filter(s => s.isActive !== false && (s.name.toLowerCase().includes(query) || (s.bn || '').toLowerCase().includes(query)))
      .slice(0, 8);
    const routeStops = [...new Set(db.routes.filter(r => r.isActive !== false).flatMap(r => r.busStops.map(s => s.name)))];
    const matchedRouteStops = routeStops.filter(s => s.toLowerCase().includes(query)).slice(0, 5);
    const suggestions = [...new Set([...stops.map(s => s.name), ...matchedRouteStops])].slice(0, 10);
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
