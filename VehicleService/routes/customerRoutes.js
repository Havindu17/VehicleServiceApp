const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/authMiddleware');
const User     = require('../models/User');
const Garage   = require('../models/Garage');
const Booking  = require('../models/Booking');
const Feedback = require('../models/Feedback');
const Vehicle  = require('../models/Vehicle');

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

// GET /customer/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      name:    user.name    ?? '',
      email:   user.email   ?? '',
      phone:   user.phone   ?? '',
      address: user.address ?? '',
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /customer/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, address },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GARAGES
// ─────────────────────────────────────────────────────────────────────────────

// GET /customer/garages  — list all garages
router.get('/garages', auth, async (req, res) => {
  try {
    const limit   = parseInt(req.query.limit) || 50;
    const garages = await Garage.find({ isActive: { $ne: false } })
      .limit(limit)
      .select('name address phone rating about services');
    res.json(garages.map(g => ({
      _id:      g._id,
      name:     g.name     ?? '',
      address:  g.address  ?? '',
      phone:    g.phone    ?? '',
      rating:   g.rating   ?? 0,
      about:    g.about    ?? '',
      distance: null,   // add geo-query later if needed
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /customer/garages/:garageId  — single garage detail
router.get('/garages/:garageId', auth, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    res.json(garage);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /customer/garages/:garageId/services
router.get('/garages/:garageId/services', auth, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.garageId).select('services');
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    res.json(garage.services ?? []);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS  ← ✅ THIS WAS MISSING (caused the 404)
// ─────────────────────────────────────────────────────────────────────────────

// GET /customer/bookings  — service history + active bookings
router.get('/bookings', auth, async (req, res) => {
  try {
    const limit    = parseInt(req.query.limit) || 50;
    const bookings = await Booking.find({ customer: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('garage', 'name');

    res.json(bookings.map(b => ({
      _id:          b._id,
      garageName:   b.garage?.name ?? 'Unknown Garage',
      service:      b.service      ?? '',
      vehicle:      b.vehicle
        ? `${b.vehicle.make ?? ''} ${b.vehicle.model ?? ''}`.trim() || null
        : null,
      date:  b.scheduledAt
        ? b.scheduledAt.toISOString().split('T')[0]
        : '',
      time:  b.scheduledAt
        ? b.scheduledAt.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true,
          })
        : '',
      status:        b.jobStatus      ?? 'pending',
      price:         b.totalAmount    ?? 0,
      feedbackGiven: b.feedbackGiven  ?? false,
      notes:         b.customerNotes  ?? '',
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /customer/bookings  — create booking
router.post('/bookings', auth, async (req, res) => {
  try {
    const { garageId, serviceId, vehicleId, date, time, notes } = req.body;

    if (!garageId || !serviceId || !date || !time) {
      return res.status(400).json({ message: 'garageId, serviceId, date and time are required' });
    }

    const garage = await Garage.findById(garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const service = garage.services?.id(serviceId);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Build scheduledAt from date + time string
    const scheduledAt = new Date(`${date} ${time}`);
    if (isNaN(scheduledAt)) return res.status(400).json({ message: 'Invalid date/time' });

    // Optionally attach vehicle info
    let vehicleData = null;
    if (vehicleId) {
      const v = await Vehicle.findOne({ _id: vehicleId, customer: req.user.id });
      if (v) {
        vehicleData = {
          make:         v.make,
          model:        v.model,
          licensePlate: v.licensePlate,
          color:        v.color,
          vehicleType:  v.vehicleType,
        };
      }
    }

    const booking = await Booking.create({
      customer:      req.user.id,
      garage:        garageId,
      service:       service.name,
      totalAmount:   service.price ?? 0,
      scheduledAt,
      customerNotes: notes ?? '',
      jobStatus:     'pending',
      vehicle:       vehicleData,
    });

    res.status(201).json({ message: 'Booking created ✅', bookingId: booking._id });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLES
// ─────────────────────────────────────────────────────────────────────────────

// GET /customer/vehicles
router.get('/vehicles', auth, async (req, res) => {
  try {
    // Try Vehicle collection first; fall back to user-embedded vehicles
    let vehicles = [];
    try {
      vehicles = await Vehicle.find({ customer: req.user.id });
    } catch {
      const user = await User.findById(req.user.id);
      vehicles = user?.vehicles ?? [];
    }
    res.json(vehicles);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /customer/vehicles
router.post('/vehicles', auth, async (req, res) => {
  try {
    const { make, model, year, licensePlate, color, vehicleType } = req.body;
    if (!make || !model || !licensePlate) {
      return res.status(400).json({ message: 'make, model and licensePlate are required' });
    }
    const vehicle = await Vehicle.create({
      customer: req.user.id,
      make, model, year, licensePlate, color,
      vehicleType: vehicleType ?? 'Car',
    });
    res.status(201).json(vehicle);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /customer/vehicles/:id
router.delete('/vehicles/:id', auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({
      _id:      req.params.id,
      customer: req.user.id,
    });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted ✅' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS / FEEDBACK
// ─────────────────────────────────────────────────────────────────────────────

// GET /customer/my-reviews
router.get('/my-reviews', auth, async (req, res) => {
  try {
    const reviews = await Feedback.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('garageId', 'name');
    res.json(reviews.map(r => ({
      _id:        r._id,
      garageName: r.garageId?.name ?? 'Unknown',
      rating:     r.rating,
      comment:    r.comment ?? '',
      createdAt:  r.createdAt,
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /customer/visited-garages  — garages where customer has a completed booking
router.get('/visited-garages', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      customer:  req.user.id,
      jobStatus: 'completed',
    }).populate('garage', 'name');

    // Deduplicate by garage id
    const seen = new Set();
    const garages = [];
    for (const b of bookings) {
      if (b.garage && !seen.has(String(b.garage._id))) {
        seen.add(String(b.garage._id));
        garages.push({ _id: b.garage._id, name: b.garage.name });
      }
    }
    res.json(garages);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /customer/reviews
router.post('/reviews', auth, async (req, res) => {
  try {
    const { garageId, rating, comment } = req.body;
    if (!garageId || !rating) {
      return res.status(400).json({ message: 'garageId and rating are required' });
    }

    // Check customer actually visited this garage
    const visited = await Booking.findOne({
      customer:  req.user.id,
      garage:    garageId,
      jobStatus: 'completed',
    });
    if (!visited) {
      return res.status(403).json({ message: 'You can only review garages you have visited' });
    }

    // Prevent duplicate reviews
    const existing = await Feedback.findOne({ user: req.user.id, garageId });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this garage' });
    }

    const review = await Feedback.create({
      user:     req.user.id,
      garageId,
      rating:   Number(rating),
      comment:  comment ?? '',
    });

    // Update garage average rating
    const allReviews = await Feedback.find({ garageId });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Garage.findByIdAndUpdate(garageId, { rating: parseFloat(avg.toFixed(1)) });

    res.status(201).json({ message: 'Review submitted ✅', review });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;