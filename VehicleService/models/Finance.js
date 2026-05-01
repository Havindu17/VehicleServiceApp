const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Income', 'Expense'], required: true },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'Online', 'cash', 'card', 'online'],
      default: 'Cash',
    },
    description: { type: String },
    date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Finance', financeSchema);