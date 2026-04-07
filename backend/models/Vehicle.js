const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number },
  licensePlate: { type: String, required: true, unique: true },
  pricePerDay: { type: Number, required: true },
  depositAmount: { type: Number, default: 0 },
  description: { type: String },
  images: [{ type: String }],
  specs: {
    engine: { type: String },
    fuelType: { type: String },
    transmission: { type: String }
  },
  status: { type: String, enum: ['AVAILABLE', 'RENTING', 'HIDDEN'], default: 'AVAILABLE' },
  avgRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
