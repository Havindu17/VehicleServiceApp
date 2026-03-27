const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    licensePlate: { type: String, required: true, unique: true },
    color: { type: String },
    vehicleType: {
        type: String,
        enum: ['Car', 'Van', 'Bus', 'Truck', 'Motorcycle'],
        required: true
    },
    image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);