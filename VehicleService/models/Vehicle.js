const mongoose = require('mongoose');

const serviceHistorySchema = new mongoose.Schema({
  description: { type: String, trim: true },
  cost:        { type: Number, default: 0 },
  date:        { type: Date, default: Date.now },
}, { _id: true });

const vehicleSchema = new mongoose.Schema(
  {
    // ── Core ──────────────────────────────────────────────────────────────────
    customer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    make:         { type: String, required: true, trim: true },
    model:        { type: String, required: true, trim: true },
    year:         { type: Number },
    licensePlate: { type: String, required: true, trim: true, uppercase: true },
    color:        { type: String, trim: true },
    vehicleType:  {
      type:    String,
      enum:    ['Car', 'Van', 'Bus', 'Truck', 'Motorcycle', 'SUV'],
      default: 'Car',
    },
    fuelType: {
      type:    String,
      enum:    ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
      default: 'Petrol',
    },
    mileage:  { type: Number },
    imageUrl: { type: String },
    notes:    { type: String, trim: true },

    // ── Insurance ─────────────────────────────────────────────────────────────
    insuranceCompany:  { type: String, trim: true },
    insurancePolicyNo: { type: String, trim: true },
    insuranceExpiry:   { type: Date },

    // ── Revenue License ───────────────────────────────────────────────────────
    revenueLicenseNo:     { type: String, trim: true },
    revenueLicenseExpiry: { type: Date },

    // ── Maintenance ───────────────────────────────────────────────────────────
    lastServiceDate:    { type: Date },
    nextServiceDate:    { type: Date },
    nextServiceMileage: { type: Number },

    // ── Service History (revenue tracking) ───────────────────────────────────
    serviceHistory: [serviceHistorySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);