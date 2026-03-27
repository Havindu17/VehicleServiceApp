const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    duration: { type: Number },
    category: { type: String, enum: ['Oil Change', 'Tire Service', 'Engine Repair', 'Body Work', 'General Service'], required: true },
    image: { type: String },
    isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ServiceEntity', serviceSchema);