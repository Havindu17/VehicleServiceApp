const mongoose = require('mongoose');

const garageSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  address:  { type: String },
  phone:    { type: String },
  email:    { type: String },
  ownerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating:   { type: Number, default: 0 },
  distance: { type: String },
  services: [{ name: String, price: Number }],
}, { timestamps: true });

module.exports = mongoose.model('Garage', garageSchema);
