const mongoose = require('mongoose');

const garageSchema = new mongoose.Schema({
  ownerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: true },
  email:    { type: String },
  phone:    { type: String },
  address:  { type: String },

  // ── NEW Professional Fields ────────────────────────────────
  about:          { type: String },
  businessRegNo:  { type: String },
  profilePhoto:   { type: String },  // base64 or URL
  services:       [{ type: String }],

  workingHours: {
    Monday:    { open: String, close: String, closed: { type: Boolean, default: false } },
    Tuesday:   { open: String, close: String, closed: { type: Boolean, default: false } },
    Wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    Thursday:  { open: String, close: String, closed: { type: Boolean, default: false } },
    Friday:    { open: String, close: String, closed: { type: Boolean, default: false } },
    Saturday:  { open: String, close: String, closed: { type: Boolean, default: false } },
    Sunday:    { open: String, close: String, closed: { type: Boolean, default: true  } },
  },

  // GeoJSON for location (MongoDB geospatial)
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },  // [longitude, latitude]
  },

  rating:   { type: Number, default: 0 },
  distance: { type: Number },

}, { timestamps: true });

// ── Geospatial index ──────────────────────────────────────────────────────
garageSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Garage', garageSchema);