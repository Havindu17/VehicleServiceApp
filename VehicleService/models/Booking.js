const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceEntity', required: true },
    bookingDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    notes: { type: String },
    totalAmount: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);