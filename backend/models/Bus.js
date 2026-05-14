const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  name: { type: String, required: true },
  operator: { type: String },
  type: { 
    type: String, 
    enum: ['ac', 'non_ac', 'sleeper', 'semi_sleeper', 'counter'],
    default: 'non_ac'
  },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  fare: { type: Number, required: true },
  seatCapacity: { type: Number, default: 40 },
  departureTime: { type: String },
  arrivalTime: { type: String },
  amenities: [{ type: String }],
  image: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bus', busSchema);