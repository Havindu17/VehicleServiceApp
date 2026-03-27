const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    loyaltyPoints: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);