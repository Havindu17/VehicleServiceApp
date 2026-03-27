const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);