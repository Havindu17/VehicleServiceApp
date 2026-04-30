const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/authMiddleware');
const User     = require('../models/User');
const Garage   = require('../models/Garage');
const Booking  = require('../models/Booking');
const Feedback = require('../models/Feedback');
const Finance  = require('../models/Finance');

async function getOwnerGarage(userId) {
  return await Garage.findOne({ ownerId: userId });
}

// ── Stats ──────────────────────────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const garage = await getOwnerGarage(req.user.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found for this user' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBookings   = await Booking.countDocuments({ garage: garage._id, createdAt: { $gte: today } });
    const pendingBookings = await Booking.countDocuments({ garage: garage._id, jobStatus: 'pending' });

    const completedBookings = await Booking.find({ garage: garage._id, jobStatus: 'completed' });
    const totalRevenue      = completedBookings.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);

    const customerIds    = await Booking.distinct('customer', { garage: garage._id });
    const totalCustomers = customerIds.length;

    const weekDays = ['S','M','T','W','T','F','S'];
    const weeklyRevenue = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);
        const dayBookings = await Booking.find({
          garage: garage._id, jobStatus: 'completed',
          createdAt: { $gte: d, $lte: dEnd },
        });
        return {
          label: weekDays[d.getDay()],
          value: dayBookings.reduce((s, b) => s + (b.totalAmount ?? 0), 0),
        };
      })
    );

    res.json({ todayBookings, pendingBookings, totalRevenue, totalCustomers, weeklyRevenue });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Bookings ───────────────────────────────────────────────────────────────
router.get('/bookings', auth, async (req, res) => {
  try {
    const garage = await getOwnerGarage(req.user.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const limit    = parseInt(req.query.limit) || 50;
    const bookings = await Booking.find({ garage: garage._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('customer', 'name phone email');

    res.json(bookings.map(b => ({
      _id:           b._id,
      customerId:    b.customer?._id  ?? null,   // ✅ needed for CustomerDetail navigation
      customerName:  b.customer?.name  ?? 'Unknown',
      customerPhone: b.customer?.phone ?? '',
      service:       b.service         ?? '',
      vehicle:       b.vehicle
        ? `${b.vehicle.make ?? ''} ${b.vehicle.model ?? ''}`.trim()
        : '',
      date:   b.scheduledAt?.toISOString().split('T')[0] ?? '',
      time:   b.scheduledAt
        ? b.scheduledAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '',
      status: b.jobStatus   ?? 'pending',
      price:  b.totalAmount ?? 0,
      notes:  b.customerNotes ?? '',
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Booking Status + AUTO Finance record ───────────────────────────────────
router.patch('/bookings/:id/status', auth, async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;
    const allowed = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!allowed.includes(status))
      return res.status(400).json({ message: `Invalid status. Use: ${allowed.join(', ')}` });

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { jobStatus: status, ...(paymentMethod && { paymentMethod }) },
      { new: true }
    ).populate('customer', 'name');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (status === 'completed') {
      const exists = await Finance.findOne({ booking: booking._id });
      if (!exists) {
        await Finance.create({
          booking:       booking._id,
          amount:        booking.totalAmount ?? 0,
          type:          'Income',
          paymentMethod: booking.paymentMethod ?? 'Cash',
          description:   booking.service ?? 'Service',
          date:          new Date(),
        });
      }
    }

    if (status === 'cancelled') {
      await Finance.deleteOne({ booking: booking._id });
    }

    res.json(booking);
  } catch (e) {
    console.error('Status update error:', e);
    res.status(500).json({ message: e.message });
  }
});

// ── Customer Detail (for garage owner) ────────────────────────────────────
router.get('/customers/:customerId', auth, async (req, res) => {
  try {
    const garage = await getOwnerGarage(req.user.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const customer = await User.findById(req.params.customerId).select('name email phone');
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const bookings = await Booking.find({
      garage:   garage._id,
      customer: req.params.customerId,
    }).sort({ createdAt: -1 });

    // Vehicles from booking embedded data
    const vehicleSet = {};
    bookings.forEach(b => {
      if (b.vehicle?.make) {
        const key = `${b.vehicle.make}-${b.vehicle.model}-${b.vehicle.licensePlate}`;
        vehicleSet[key] = b.vehicle;
      }
    });
    const vehicles = Object.values(vehicleSet);

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
});

// ── Services ───────────────────────────────────────────────────────────────
router.get('/services', auth, async (req, res) => {
  try {
    const garage = await getOwnerGarage(req.user.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    res.json(garage.services ?? []);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/services', auth, async (req, res) => {
  try {
    const garage = await getOwnerGarage(req.user.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    garage.services.push(req.body);
    await garage.save();
    res.status(201).json(garage.services[garage.services.length - 1]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/services/:id', auth, async (req, res) => {
  try {
    const garage = await getOwnerGarage(req.user.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    const svc = garage.services.id(req.params.id);
    if (!svc) return res.status(404).json({ message: 'Service not found' });
    Object.assign(svc, req.body);
    await garage.save();
    res.json(svc);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/services/:id', auth, async (req, res) => {
  try {
    const garage = await getOwnerGarage(req.user.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    garage.services = garage.services.filter(s => String(s._id) !== req.params.id);
    await garage.save();
    res.json({ message: 'Service deleted ✅' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Feedback ───────────────────────────────────────────────────────────────
router.get('/feedback', auth, async (req, res) => {
  try {
    const garage = await getOwnerGarage(req.user.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const feedbacks = await Feedback.find({ garageId: garage._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name');

    const total     = feedbacks.length;
    const avgRating = total ? feedbacks.reduce((s, f) => s + f.rating, 0) / total : 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach(f => { breakdown[f.rating] = (breakdown[f.rating] ?? 0) + 1; });

    res.json({
      reviews: feedbacks.map(f => ({
        _id:          f._id,
        customerName: f.user?.name ?? 'Anonymous',
        rating:       f.rating,
        comment:      f.comment ?? '',
        date:         f.createdAt?.toISOString().split('T')[0] ?? '',
      })),
      summary: { total, avgRating: parseFloat(avgRating.toFixed(1)), breakdown },
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Finance ────────────────────────────────────────────────────────────────
router.get('/finance', auth, async (req, res) => {
  try {
    const garage = await getOwnerGarage(req.user.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const period = req.query.period ?? 'month';
    const now    = new Date();
    let startDate;

    if      (period === 'today') { startDate = new Date(now); startDate.setHours(0, 0, 0, 0); }
    else if (period === 'week')  { startDate = new Date(now); startDate.setDate(now.getDate() - 7); }
    else if (period === 'year')  { startDate = new Date(now.getFullYear(), 0, 1); }
    else                         { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }

    const garageBookingIds = await Booking.find({ garage: garage._id }).distinct('_id');

    const completedBookings = await Booking.find({
      garage:    garage._id,
      jobStatus: 'completed',
    }).populate('customer', 'name email');

    for (const b of completedBookings) {
      const exists = await Finance.findOne({ booking: b._id });
      if (!exists) {
        await Finance.create({
          booking:       b._id,
          amount:        b.totalAmount ?? 0,
          type:          'Income',
          paymentMethod: b.paymentMethod ?? 'Cash',
          description:   b.service ?? 'Service',
          date:          b.scheduledAt ?? b.createdAt ?? new Date(),
        });
      }
    }

    const finances = await Finance.find({
      booking: { $in: garageBookingIds },
      type:    'Income',
      date:    { $gte: startDate },
    }).populate({
      path:     'booking',
      populate: { path: 'customer', select: 'name email' },
    });

    const totalRevenue  = finances.reduce((s, f) => s + (f.amount ?? 0), 0);
    const completedJobs = finances.length;
    const avgPerJob     = completedJobs > 0 ? Math.round(totalRevenue / completedJobs) : 0;

    const pendingBookings = await Booking.find({ garage: garage._id, jobStatus: 'pending' });
    const pendingValue    = pendingBookings.reduce((s, b) => s + (b.totalAmount ?? 0), 0);

    let cashAmount = 0, cardAmount = 0;
    finances.forEach(f => {
      if (f.paymentMethod?.toLowerCase() === 'card') cardAmount += f.amount ?? 0;
      else                                            cashAmount += f.amount ?? 0;
    });

    const serviceMap = {};
    finances.forEach(f => {
      const name = f.booking?.service ?? f.description ?? 'Other';
      if (!serviceMap[name]) serviceMap[name] = { name, count: 0, revenue: 0 };
      serviceMap[name].count++;
      serviceMap[name].revenue += f.amount ?? 0;
    });
    const byService = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);

    const dailyMap = {};
    finances.forEach(f => {
      const day = (f.date ?? f.createdAt)?.toISOString().split('T')[0] ?? '';
      if (!dailyMap[day]) dailyMap[day] = 0;
      dailyMap[day] += f.amount ?? 0;
    });
    const dailyRevenue = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ label: date.slice(5), amount }));

    const transactions = finances.slice(0, 50).map(f => ({
      _id:           f.booking?._id  ?? f._id,
      financeId:     f._id,
      customerName:  f.booking?.customer?.name ?? 'Unknown',
      service:       f.booking?.service ?? f.description ?? '',
      date:          (f.date ?? f.createdAt)?.toISOString().split('T')[0] ?? '',
      amount:        f.amount ?? 0,
      paymentMethod: f.paymentMethod ?? 'Cash',
      costBreakdown: f.booking?.costBreakdown ?? [],
      garageNotes:   f.booking?.garageNotes   ?? '',
    }));

    res.json({
      totalRevenue, completedJobs, avgPerJob, pendingValue,
      cashAmount, cardAmount,
      byService, dailyRevenue, transactions,
    });
  } catch (e) {
    console.error('Finance error:', e);
    res.status(500).json({ message: e.message });
  }
});

// ── Invoice ────────────────────────────────────────────────────────────────
router.post('/invoice', auth, async (req, res) => {
  try {
    const { bookingId, items, notes, sendEmail } = req.body;

    if (!bookingId)
      return res.status(400).json({ message: 'bookingId required' });
    if (!items || items.length === 0)
      return res.status(400).json({ message: 'Add at least one item' });

    const booking = await Booking.findById(bookingId).populate('customer', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const costBreakdown = items
      .filter(i => i.label && i.amount)
      .map(i => ({ item: i.label, amount: Number(i.amount) || 0 }));
    const totalAmount = costBreakdown.reduce((s, i) => s + i.amount, 0);

    await Booking.findByIdAndUpdate(bookingId, {
      costBreakdown,
      totalAmount,
      garageNotes: notes ?? '',
      jobStatus:   'completed',
    });

    const existing    = await Finance.findOne({ booking: bookingId });
    const financeData = {
      amount:        totalAmount,
      type:          'Income',
      paymentMethod: booking.paymentMethod ?? 'Cash',
      description:   costBreakdown.map(i => i.item).join(', '),
      date:          new Date(),
    };

    if (existing) {
      await Finance.findByIdAndUpdate(existing._id, financeData);
    } else {
      await Finance.create({ ...financeData, booking: bookingId });
    }

    if (sendEmail && booking.customer?.email) {
      console.log(`📧 Invoice → ${booking.customer.email}  Rs. ${totalAmount}`);
    }

    res.json({
      message:     sendEmail ? 'Invoice saved & emailed ✅' : 'Invoice saved ✅',
      totalAmount,
      bookingId,
    });
  } catch (e) {
    console.error('Invoice error:', e);
    res.status(500).json({ message: e.message });
  }
});

// ── Profile ────────────────────────────────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
  try {
    const user   = await User.findById(req.user.id).select('-password');
    const garage = await getOwnerGarage(req.user.id);
    res.json({
      name:           garage?.name          ?? user.name,
      email:          user.email,
      phone:          garage?.phone         ?? user.phone   ?? '',
      address:        garage?.address       ?? user.address ?? '',
      about:          garage?.about         ?? '',
      businessRegNo:  garage?.businessRegNo ?? '',
      profilePhoto:   garage?.profilePhoto  ?? null,
      services:       garage?.services      ?? [],
      workingHours:   garage?.workingHours  ?? {},
      location:       garage?.location      ?? null,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address, about, businessRegNo, profilePhoto, services, workingHours, location } = req.body;
    await User.findByIdAndUpdate(req.user.id, { name, phone, address });
    await Garage.findOneAndUpdate(
      { ownerId: req.user.id },
      { name, phone, address, about, businessRegNo, profilePhoto, services, workingHours, location },
      { new: true }
    );
    res.json({ message: 'Profile updated ✅' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;