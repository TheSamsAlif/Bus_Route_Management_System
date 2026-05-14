const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['dhaka_city', 'intercity', 'long_route'],
    default: 'dhaka_city'
  },
  distance: { type: Number, required: true },
  estimatedTime: { type: Number },
  busStops: [{
    name: String,
    distance: Number,
    order: Number
  }],
  buses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }],
  trafficStatus: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isActive: { type: Boolean, default: true },
  searchCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

routeSchema.index({ name: 1 });
routeSchema.index({ from: 1, to: 1 });

module.exports = mongoose.model('Route', routeSchema);