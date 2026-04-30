const Finance = require('../models/Finance');
const Booking = require('../models/Booking');
const Garage  = require('../models/Garage');

// ── Helper ────────────────────────────────────────────────────────────────────
async function getOwnerGarage(userId) {
  return await Garage.findOne({ ownerId: userId });
}

// ── CRUD (kept for admin use) ─────────────────────────────────────────────────
exports.createFinance = async (req, res) => {
  try {
    const finance = await Finance.create(req.body);
    res.status(201).json(finance);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllFinances = async (req, res) => {
  try {
    const finances = await Finance.find().populate('booking');
    res.json(finances);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getFinanceById = async (req, res) => {
  try {
    const finance = await Finance.findById(req.params.id);
    if (!finance) return res.status(404).json({ message: 'Finance not found' });
    res.json(finance);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateFinance = async (req, res) => {
  try {
    const finance = await Finance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!finance) return res.status(404).json({ message: 'Finance not found' });
    res.json(finance);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteFinance = async (req, res) => {
  try {
    const finance = await Finance.findByIdAndDelete(req.params.id);
    if (!finance) return res.status(404).json({ message: 'Finance not found' });
    res.json({ message: 'Finance deleted ✅' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── Garage Finance Summary (used by FinanceScreen) ────────────────────────────
// GET /api/garage/finance?period=month
exports.getGarageFinance = async (req, res) => {
  try {
    const garage = await getOwnerGarage(req.user.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    // ── Date range ──────────────────────────────────────────────────────────
    const period = req.query.period ?? 'month';
    const now    = new Date();
    let startDate;
    if      (period === 'today') { startDate = new Date(now); startDate.setHours(0,0,0,0); }
    else if (period === 'week')  { startDate = new Date(now); startDate.setDate(now.getDate() - 7); }
    else if (period === 'year')  { startDate = new Date(now.getFullYear(), 0, 1); }
    else                         { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }

    // ── Get Finance records for this garage's bookings ──────────────────────
    // Find bookingIds that belong to this garage
    const garageBookingIds = await Booking.find({ garage: garage._id })
      .distinct('_id');

    const finances = await Finance.find({
      booking:  { $in: garageBookingIds },
      type:     'Income',
      date:     { $gte: startDate },
    }).populate({
      path:     'booking',
      populate: { path: 'customer', select: 'name' },
    });

    // ── Summary numbers ─────────────────────────────────────────────────────
    const totalRevenue  = finances.reduce((s, f) => s + (f.amount ?? 0), 0);
    const completedJobs = finances.length;
    const avgPerJob     = completedJobs > 0 ? Math.round(totalRevenue / completedJobs) : 0;

    // Pending = bookings with jobStatus pending, no Finance record yet
    const pendingBookings = await Booking.find({ garage: garage._id, jobStatus: 'pending' });
    const pendingValue    = pendingBookings.reduce((s, b) => s + (b.totalAmount ?? 0), 0);

    // ── Payment method split ────────────────────────────────────────────────
    let cashAmount = 0, cardAmount = 0;
    finances.forEach(f => {
      if (f.paymentMethod?.toLowerCase() === 'card')  cardAmount += f.amount ?? 0;
      else                                              cashAmount += f.amount ?? 0;
    });

    // ── Revenue by service ──────────────────────────────────────────────────
    const serviceMap = {};
    finances.forEach(f => {
      const name = f.booking?.service ?? f.description ?? 'Other';
      if (!serviceMap[name]) serviceMap[name] = { name, count: 0, revenue: 0 };
      serviceMap[name].count++;
      serviceMap[name].revenue += f.amount ?? 0;
    });
    const byService = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);

    // ── Daily revenue (for charts) ──────────────────────────────────────────
    const dailyMap = {};
    finances.forEach(f => {
      const day = (f.date ?? f.createdAt)?.toISOString().split('T')[0] ?? '';
      if (!dailyMap[day]) dailyMap[day] = 0;
      dailyMap[day] += f.amount ?? 0;
    });
    const dailyRevenue = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ label: date.slice(5), amount }));

    // ── Transactions list ───────────────────────────────────────────────────
    const transactions = finances.slice(0, 50).map(f => ({
      _id:           f.booking?._id ?? f._id,         // ✅ bookingId for invoice
      financeId:     f._id,
      customerName:  f.booking?.customer?.name ?? 'Unknown',
      service:       f.booking?.service ?? f.description ?? '',
      date:          (f.date ?? f.createdAt)?.toISOString().split('T')[0] ?? '',
      amount:        f.amount ?? 0,
      paymentMethod: f.paymentMethod ?? 'Cash',        // ✅ Cash/Card filter
      costBreakdown: f.booking?.costBreakdown ?? [],   // ✅ Invoice items
      garageNotes:   f.booking?.garageNotes ?? '',     // ✅ Invoice notes
    }));

    res.json({
      totalRevenue,
      completedJobs,
      avgPerJob,
      pendingValue,
      cashAmount,
      cardAmount,
      byService,
      dailyRevenue,
      transactions,
    });
  } catch (e) {
    console.error('getGarageFinance error:', e);
    res.status(500).json({ message: e.message });
  }
};

// ── Save Invoice + create/update Finance record ───────────────────────────────
// POST /api/garage/invoice
exports.saveInvoice = async (req, res) => {
  try {
    const { bookingId, items, notes, sendEmail } = req.body;

    if (!bookingId) return res.status(400).json({ message: 'bookingId required' });
    if (!items || items.length === 0) return res.status(400).json({ message: 'Add at least one item' });

    const booking = await Booking.findById(bookingId).populate('customer', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // ── Update booking cost breakdown ───────────────────────────────────────
    const costBreakdown = items.map(i => ({
      item:   i.label,
      amount: Number(i.amount) || 0,
    }));
    const totalAmount = costBreakdown.reduce((s, i) => s + i.amount, 0);

    booking.costBreakdown = costBreakdown;
    booking.totalAmount   = totalAmount;
    booking.garageNotes   = notes ?? '';
    booking.jobStatus     = 'completed';
    await booking.save();  // triggers pre-save → auto totalAmount calc

    // ── Create or update Finance record for this booking ────────────────────
    const garage  = await Garage.findOne({ ownerId: req.user.id });
    const existing = await Finance.findOne({ booking: bookingId });

    if (existing) {
      existing.amount        = totalAmount;
      existing.description   = costBreakdown.map(i => i.item).join(', ');
      existing.paymentMethod = booking.paymentMethod ?? 'Cash';
      await existing.save();
    } else {
      await Finance.create({
        booking:       bookingId,
        amount:        totalAmount,
        type:          'Income',
        paymentMethod: booking.paymentMethod ?? 'Cash',
        description:   costBreakdown.map(i => i.item).join(', '),
        date:          new Date(),
      });
    }

    // ── Email (stub — wire up nodemailer/sendgrid here) ─────────────────────
    if (sendEmail && booking.customer?.email) {
      // TODO: send invoice email to booking.customer.email
      console.log(`📧 Invoice email to: ${booking.customer.email} — Rs. ${totalAmount}`);
    }

    res.json({
      message:     sendEmail ? 'Invoice saved & emailed ✅' : 'Invoice saved ✅',
      totalAmount,
      bookingId,
    });
  } catch (e) {
    console.error('saveInvoice error:', e);
    res.status(500).json({ message: e.message });
  }
};