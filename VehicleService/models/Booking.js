const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  garage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Garage',
    required: true,
  },
  vehicle: {
    make:         { type: String },
    model:        { type: String },
    year:         { type: String },
    licensePlate: { type: String },
  },
  service:     { type: String, required: true },
  description: { type: String },
  scheduledAt: { type: Date, required: true },

  // ── Job Status ───────────────────────────────────────────────
  jobStatus: {
    type:    String,
    enum:    ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },

  // ── Cost Breakdown ───────────────────────────────────────────
  costBreakdown: [
    {
      item:   { type: String },
      amount: { type: Number, default: 0 },
    },
  ],
  totalAmount: { type: Number, default: 0 },

  // ── Payment ──────────────────────────────────────────────────
  paymentStatus: {
    type:    String,
    enum:    ['unpaid', 'pending_approval', 'paid', 'overdue'],
    default: 'unpaid',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card'],
  },
  paymentSubmittedAt: { type: Date },
  paymentAcceptedAt:  { type: Date },
  dueDate:            { type: Date },

  // ── Notes ────────────────────────────────────────────────────
  garageNotes:   { type: String },
  customerNotes: { type: String },

}, { timestamps: true });

// ── Virtual: is overdue? ─────────────────────────────────────────────────
bookingSchema.virtual('isOverdue').get(function () {
  if (this.paymentStatus === 'paid') return false;
  if (!this.dueDate) return false;
  return new Date() > new Date(this.dueDate);
});

// ── Pre-save middleware ───────────────────────────────────────────────────
bookingSchema.pre('save', function (next) {
  try {
    // Auto-mark overdue
    if (
      this.paymentStatus !== 'paid' &&
      this.dueDate &&
      new Date() > new Date(this.dueDate)
    ) {
      this.paymentStatus = 'overdue';
    }

    // Auto-calc totalAmount from costBreakdown
    if (this.costBreakdown && this.costBreakdown.length > 0) {
      this.totalAmount = this.costBreakdown.reduce(
        (s, i) => s + (i.amount || 0), 0
      );
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Booking', bookingSchema);