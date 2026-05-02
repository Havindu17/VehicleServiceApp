const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

module.exports = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);