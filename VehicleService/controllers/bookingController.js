const Booking = require('../models/Booking');
const Garage  = require('../models/Garage');

// ── Existing controllers (unchanged) ──────────────────────────────────────

exports.createBooking = async (req, res) => {
  try {
    // Auto set dueDate = bookingDate + 3 days if not provided
    const dueDate = req.body.dueDate
      ? new Date(req.body.dueDate)
      : (() => { const d = new Date(req.body.bookingDate || Date.now()); d.setDate(d.getDate() + 3); return d; })();

    const booking = await Booking.create({
      user: req.user.id,
      ...req.body,
      dueDate,
    });
    res.status(201).json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('vehicle')
      .populate('service')
      .populate('garageId', 'name address');
    res.json(bookings);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getBookingsByGarage = async (req, res) => {
  try {
    const garage = await Garage.findOne({ ownerId: req.user.id });
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const bookings = await Booking.find({ garageId: garage._id })
      .populate('user', 'name email phone')
      .populate('vehicle')
      .populate('service')
      .sort({ createdAt: -1 });

    // Auto-mark overdue
    for (const b of bookings) {
      if (b.checkOverdue()) await b.save();
    }

    res.json(bookings);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('garageId', 'name address phone')
      .populate('vehicle')
      .populate('service')
      .sort({ createdAt: -1 });

    for (const b of bookings) {
      if (b.checkOverdue()) await b.save();
    }

    res.json(bookings);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('vehicle')
      .populate('service')
      .populate('garageId', 'name address');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted ✅' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── NEW: Customer submits payment ─────────────────────────────────────────
// POST /customer/bookings/:id/pay
exports.submitPayment = async (req, res) => {
  try {
    const { paymentMethod, paymentNote } = req.body;
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Already paid' });
    }

    booking.paymentMethod  = paymentMethod || 'Cash';
    booking.paymentStatus  = 'PendingApproval';   // garage must accept
    booking.paidAt         = new Date();
    booking.paymentNote    = paymentNote || '';
    await booking.save();

    res.json({ message: 'Payment submitted. Waiting for garage approval.', booking });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── NEW: Garage accepts payment ───────────────────────────────────────────
// POST /garage/bookings/:id/accept-payment
exports.acceptPayment = async (req, res) => {
  try {
    const garage = await Garage.findOne({ ownerId: req.user.id });
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const booking = await Booking.findOne({ _id: req.params.id, garageId: garage._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.paymentStatus !== 'PendingApproval') {
      return res.status(400).json({ message: 'No pending payment to accept' });
    }

    booking.paymentStatus     = 'Paid';
    booking.garageAcceptedAt  = new Date();
    await booking.save();

    res.json({ message: 'Payment accepted ✅', booking });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── NEW: Customer report — all jobs + payment summary ────────────────────
// GET /customer/bookings/report
exports.getCustomerReport = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('garageId',  'name address')
      .populate('vehicle',   'make model licensePlate')
      .populate('service',   'name')
      .sort({ createdAt: -1 });

    for (const b of bookings) {
      if (b.checkOverdue()) await b.save();
    }

    const totalSpent   = bookings.filter(b => b.paymentStatus === 'Paid').reduce((s, b) => s + b.totalAmount, 0);
    const totalPending = bookings.filter(b => b.paymentStatus === 'PendingApproval').reduce((s, b) => s + b.totalAmount, 0);
    const totalOverdue = bookings.filter(b => b.paymentStatus === 'Overdue').reduce((s, b) => s + b.totalAmount, 0);
    const totalUnpaid  = bookings.filter(b => b.paymentStatus === 'Unpaid').reduce((s, b) => s + b.totalAmount, 0);

    res.json({
      bookings,
      summary: {
        totalJobs:      bookings.length,
        completedJobs:  bookings.filter(b => b.status === 'Completed').length,
        totalSpent,
        totalPending,
        totalOverdue,
        totalUnpaid,
      }
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── NEW: Garage pending payment list ─────────────────────────────────────
// GET /garage/bookings/pending-payments
exports.getPendingPayments = async (req, res) => {
  try {
    const garage = await Garage.findOne({ ownerId: req.user.id });
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const bookings = await Booking.find({
      garageId:      garage._id,
      paymentStatus: 'PendingApproval',
    })
      .populate('user',    'name email phone')
      .populate('vehicle', 'make model licensePlate')
      .populate('service', 'name')
      .sort({ paidAt: -1 });

    res.json(bookings);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── NEW: Garage → Get single customer profile + booking history ───────────
// GET /garage/customers/:customerId
exports.getCustomerDetail = async (req, res) => {
  try {
    const garage = await Garage.findOne({ ownerId: req.user.id });
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const User    = require('../models/User');
    const Vehicle = require('../models/Vehicle');

    const customer = await User.findById(req.params.customerId)
      .select('name email phone');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const bookings = await Booking.find({
      garageId: garage._id,
      customer: req.params.customerId,
    })
      .populate('vehicle')
      .sort({ createdAt: -1 });

    // Vehicles used by this customer
    const vehicles = await Vehicle.find({ owner: req.params.customerId });

    // Summary
    const totalSpent   = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0);
    const totalPending = bookings.filter(b => b.paymentStatus === 'pending_approval').reduce((s, b) => s + b.totalAmount, 0);
    const totalOverdue = bookings.filter(b => b.paymentStatus === 'overdue').reduce((s, b) => s + b.totalAmount, 0);
    const totalUnpaid  = bookings.filter(b => b.paymentStatus === 'unpaid').reduce((s, b) => s + b.totalAmount, 0);

    res.json({
      customer,
      vehicles,
      bookings,
      summary: {
        totalJobs:     bookings.length,
        completedJobs: bookings.filter(b => b.jobStatus === 'completed').length,
        totalSpent,
        totalPending,
        totalOverdue,
        totalUnpaid,
      },
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};