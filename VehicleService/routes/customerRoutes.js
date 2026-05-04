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
      { returnDocument: 'after' }  // ✅ Fixed
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
      distance: null,
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

const normalizeService = (service, index) => {
  if (!service) return { _id: String(index), name: 'Service', price: 0, category: '', description: '', duration: null };
  if (typeof service === 'string') {
    return { _id: String(index), name: service, price: 0, category: '', description: '', duration: null };
  }
  return {
    _id: service._id?.toString?.() ?? String(index),
    name: service.name ?? 'Service',
    price: service.price ?? 0,
    category: service.category ?? '',
    description: service.description ?? '',
    duration: service.duration ?? null,
  };
};

// GET /customer/garages/:garageId  — single garage detail
router.get('/garages/:garageId', auth, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    const result = garage.toObject();
    result.services = (garage.services ?? []).map(normalizeService);
    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /customer/garages/:garageId/services
router.get('/garages/:garageId/services', auth, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.garageId).select('services');
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    res.json((garage.services ?? []).map(normalizeService));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /customer/garages/:garageId/reviews
router.get('/garages/:garageId/reviews', auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ garageId: req.params.garageId })
      .sort({ createdAt: -1 })
      .limit(12);
    res.json(feedbacks.map(f => ({
      _id:        f._id,
      rating:     f.rating,
      comment:    f.comment ?? '',
      createdAt:  f.createdAt,
      userId:     f.user,
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────

// GET /customer/bookings
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

// POST /customer/bookings
router.post('/bookings', auth, async (req, res) => {
  try {
    const {
      garageId, services, serviceId, serviceIds,
      serviceName, serviceNames, vehicleId, date, time, notes,
    } = req.body;

    if (!garageId || !date || !time) {
      return res.status(400).json({ message: 'garageId, date and time are required' });
    }

    const garage = await Garage.findById(garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const matchedServices = [];
    const normalizedGarageServices = garage.services ?? [];

    if (services && Array.isArray(services)) {
      for (const svcItem of services) {
        const itemId   = svcItem?.id ?? svcItem?._id ?? null;
        const itemName = svcItem?.name ?? '';
        let matched    = null;

        if (itemId) {
          matched = normalizedGarageServices.find((s) => {
            if (!s || typeof s === 'string') return false;
            return String(s._id) === String(itemId);
          });
        }
        if (!matched && itemName) {
          matched = normalizedGarageServices.find((s) => {
            if (!s) return false;
            if (typeof s === 'string') return s === itemName;
            return s.name === itemName;
          });
        }
        if (!matched) {
          if (!itemName && !itemId) return res.status(400).json({ message: 'Invalid service format' });
          matchedServices.push({ name: itemName || String(itemId), price: svcItem?.price ?? 0 });
          continue;
        }
        matchedServices.push(matched);
      }
    }

    if (serviceIds && Array.isArray(serviceIds) && matchedServices.length === 0) {
      for (const id of serviceIds) {
        const svc = normalizedGarageServices.find((s) => {
          if (!s || typeof s === 'string') return false;
          return String(s._id) === String(id);
        });
        if (!svc) return res.status(404).json({ message: `Service not found: ${id}` });
        matchedServices.push(svc);
      }
    }

    if (serviceNames && Array.isArray(serviceNames) && matchedServices.length === 0) {
      for (const name of serviceNames) {
        const svc = normalizedGarageServices.find((s) => {
          if (!s) return false;
          if (typeof s === 'string') return s === name;
          return s.name === name;
        });
        matchedServices.push(svc || { name, price: 0 });
      }
    }

    if (serviceId && !serviceIds && matchedServices.length === 0) {
      const svc = normalizedGarageServices.find((s) => {
        if (!s || typeof s === 'string') return false;
        return String(s._id) === String(serviceId);
      });
      if (!svc) return res.status(404).json({ message: 'Service not found' });
      matchedServices.push(svc);
    }

    if (serviceName && !serviceNames && matchedServices.length === 0) {
      const svc = normalizedGarageServices.find((s) => {
        if (!s) return false;
        if (typeof s === 'string') return s === serviceName;
        return s.name === serviceName;
      });
      matchedServices.push(svc || { name: serviceName, price: 0 });
    }

    if (matchedServices.length === 0) {
      matchedServices.push({ name: serviceName || 'Service', price: 0 });
    }

    const costBreakdown    = matchedServices.map((s) => ({
      item:   typeof s === 'string' ? s : s.name || 'Service',
      amount: typeof s === 'string' ? 0 : s.price ?? 0,
    }));
    const serviceNameFinal = costBreakdown.map((item) => item.item).join(' + ');
    const totalAmount      = costBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);

    const scheduledAt = new Date(`${date} ${time}`);
    if (isNaN(scheduledAt)) return res.status(400).json({ message: 'Invalid date/time' });

    let vehicleData = null;
    if (vehicleId) {
      const v = await Vehicle.findOne({ _id: vehicleId, customer: req.user.id });
      if (v) {
        vehicleData = {
          make: v.make, model: v.model, licensePlate: v.licensePlate,
          color: v.color, vehicleType: v.vehicleType,
        };
      }
    }

    const booking = await Booking.create({
      customer: req.user.id, garage: garageId,
      service: serviceNameFinal, costBreakdown, totalAmount,
      scheduledAt, customerNotes: notes ?? '', jobStatus: 'pending',
      vehicle: vehicleData,
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
    const {
      make, model, year, licensePlate, color, vehicleType, fuelType,
      mileage, notes,
      insuranceCompany, insurancePolicyNo, insuranceExpiry,
      revenueLicenseNo, revenueLicenseExpiry,
      lastServiceDate, nextServiceDate, nextServiceMileage,
    } = req.body;

    if (!make || !model || !licensePlate) {
      return res.status(400).json({ message: 'make, model and licensePlate are required' });
    }

    const vehicle = await Vehicle.create({
      customer: req.user.id,
      make, model, year, licensePlate, color,
      vehicleType:          vehicleType          ?? 'Car',
      fuelType:             fuelType             ?? 'Petrol',
      mileage:              mileage              ?? null,
      notes:                notes                ?? '',
      insuranceCompany:     insuranceCompany     ?? '',
      insurancePolicyNo:    insurancePolicyNo    ?? '',
      insuranceExpiry:      insuranceExpiry      || null,
      revenueLicenseNo:     revenueLicenseNo     ?? '',
      revenueLicenseExpiry: revenueLicenseExpiry || null,
      lastServiceDate:      lastServiceDate      || null,
      nextServiceDate:      nextServiceDate      || null,
      nextServiceMileage:   nextServiceMileage   ?? null,
    });
    res.status(201).json(vehicle);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT /customer/vehicles/:id  ✅ FIXED: new: true → returnDocument: 'after'
router.put('/vehicles/:id', auth, async (req, res) => {
  try {
    const {
      make, model, year, licensePlate, color, vehicleType, fuelType,
      mileage, notes,
      insuranceCompany, insurancePolicyNo, insuranceExpiry,
      revenueLicenseNo, revenueLicenseExpiry,
      lastServiceDate, nextServiceDate, nextServiceMileage,
    } = req.body;

    if (!make || !model || !licensePlate) {
      return res.status(400).json({ message: 'make, model and licensePlate are required' });
    }

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, customer: req.user.id },
      {
        make, model, color, notes,
        year:                 year                 ? parseInt(year)                 : null,
        licensePlate:         licensePlate.toUpperCase(),
        vehicleType:          vehicleType          ?? 'Car',
        fuelType:             fuelType             ?? 'Petrol',
        mileage:              mileage              ? parseInt(mileage)              : null,
        insuranceCompany:     insuranceCompany     ?? '',
        insurancePolicyNo:    insurancePolicyNo    ?? '',
        insuranceExpiry:      insuranceExpiry      || null,
        revenueLicenseNo:     revenueLicenseNo     ?? '',
        revenueLicenseExpiry: revenueLicenseExpiry || null,
        lastServiceDate:      lastServiceDate      || null,
        nextServiceDate:      nextServiceDate      || null,
        nextServiceMileage:   nextServiceMileage   ? parseInt(nextServiceMileage)   : null,
      },
      { returnDocument: 'after' }  // ✅ Fixed: was { new: true }
    );

    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
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

// GET /customer/visited-garages
router.get('/visited-garages', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      customer:  req.user.id,
      jobStatus: 'completed',
    }).populate('garage', 'name');

    const seen    = new Set();
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

    const visited = await Booking.findOne({
      customer: req.user.id, garage: garageId, jobStatus: 'completed',
    });
    if (!visited) {
      return res.status(403).json({ message: 'You can only review garages you have visited' });
    }

    const existing = await Feedback.findOne({ user: req.user.id, garageId });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this garage' });
    }

    const review = await Feedback.create({
      user: req.user.id, garageId,
      rating: Number(rating), comment: comment ?? '',
    });

    const allReviews = await Feedback.find({ garageId });
    const avg        = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await Garage.findByIdAndUpdate(garageId, { rating: parseFloat(avg.toFixed(1)) });

    res.status(201).json({ message: 'Review submitted ✅', review });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;