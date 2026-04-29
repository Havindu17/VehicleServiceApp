const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceEntity' },
    garageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Garage' },
    serviceName: { type: String },
    bookingDate: { type: Date },
    time: { type: String },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    notes: { type: String },
    totalAmount: { type: Number },
}, { timestamps: true });
module.exports = mongoose.model('Booking', bookingSchema);
