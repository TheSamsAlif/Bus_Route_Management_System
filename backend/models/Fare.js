const mongoose = require('mongoose');

const fareSchema = new mongoose.Schema({
  category: { type: String, required: true },
  busType: { type: String, required: true },
  baseFare: { type: Number, required: true },
  perKmRate: { type: Number, required: true },
  peakHourMultiplier: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Fare', fareSchema);