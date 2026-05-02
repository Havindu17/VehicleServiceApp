const User     = require('../models/User');
const Garage   = require('../models/Garage');
const Booking  = require('../models/Booking');
const Vehicle  = require('../models/Vehicle');
const Feedback = require('../models/Feedback');

// ─── Profile ─────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id, { name, phone, address }, { new: true }
    ).select('-password');
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── Garages ──────────────────────────────────────────────────────────────────
exports.getGarages = async (req, res) => {
  try {
    const limit   = parseInt(req.query.limit) || 20;
    const garages = await Garage.find().limit(limit);
    res.json(garages);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getGarageById = async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const feedbacks   = await Feedback.find({ garageId: req.params.id });
    const reviewCount = feedbacks.length;
    const avgRating   = reviewCount
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / reviewCount : 0;

    res.json({ ...garage.toObject(), reviewCount, rating: parseFloat(avgRating.toFixed(1)) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getGarageServices = async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    res.json(garage.services ?? []);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getGarageReviews = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ garageId: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(feedbacks.map(f => ({
      _id:          f._id,
      customerName: f.user?.name ?? 'Anonymous',
      rating:       f.rating,
      comment:      f.comment,
      date:         f.createdAt?.toISOString().split('T')[0],
      service:      '',
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── Bookings ─────────────────────────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    const { garageId, serviceId, vehicleId, date, time, notes } = req.body;

    const garage = await Garage.findById(garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });

    const service = garage.services?.find(s => String(s._id) === String(serviceId));

    // date + time combine කරලා scheduledAt හදනවා
    let scheduledAt = new Date(date);
    if (time) {
      const [timePart, meridiem] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      scheduledAt.setHours(hours, minutes, 0, 0);
    }

    const booking = await Booking.create({
      customer:      req.user.id,
      garage:        garageId,       // ✅ 'garage' (model field)
      service:       service?.name ?? '',
      scheduledAt:   scheduledAt,
      totalAmount:   service?.price ?? 0,
      customerNotes: notes ?? '',
      jobStatus:     'pending',      // ✅ 'jobStatus' (model field)
    });

    res.status(201).json(booking);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyBookings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const bookings = await Booking.find({ customer: req.user.id })
      // ✅ Only populate 'garage' — model has no 'garageId' ref field
      .populate('garage', 'name address phone')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(bookings.map(b => ({
      _id:           b._id,
      garageName:    b.garage?.name  ?? '',
      garageId:      b.garage?._id   ?? '',
      garagePhone:   b.garage?.phone ?? '',
      service:       b.service       ?? '',
      vehicle:       b.vehicle
        ? `${b.vehicle.make ?? ''} ${b.vehicle.model ?? ''}`.trim() || null
        : null,
      date:          b.scheduledAt?.toISOString().split('T')[0] ?? '',
      time:          b.scheduledAt
        ? b.scheduledAt.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true,
          })
        : '',
      // ✅ jobStatus (not status)
      status:        b.jobStatus ?? 'pending',
      price:         b.totalAmount   ?? 0,
      notes:         b.customerNotes ?? '',
      feedbackGiven: b.feedbackGiven ?? false,
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── Vehicles ─────────────────────────────────────────────────────────────────
exports.getMyVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ customerId: req.user.id });
    res.json(vehicles);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.addVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create({ ...req.body, customerId: req.user.id });
    res.status(201).json(vehicle);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteVehicle = async (req, res) => {
  try {
    await Vehicle.findOneAndDelete({ _id: req.params.id, customerId: req.user.id });
    res.json({ message: 'Vehicle deleted ✅' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
exports.submitReview = async (req, res) => {
  try {
    const { garageId, rating, comment, bookingId } = req.body;

    const feedback = await Feedback.create({
      user:     req.user.id,
      garageId: garageId,
      booking:  bookingId || null,
      rating,
      comment,
    });

    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, { feedbackGiven: true });
    }

    // Garage average rating update
    const allFeedback = await Feedback.find({ garageId });
    const avg = allFeedback.reduce((s, f) => s + f.rating, 0) / allFeedback.length;
    await Garage.findByIdAndUpdate(garageId, { rating: parseFloat(avg.toFixed(1)) });

    res.status(201).json(feedback);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyReviews = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user.id })
      .populate('garageId', 'name')
      .sort({ createdAt: -1 });

    res.json(feedbacks.map(f => ({
      _id:        f._id,
      garageName: f.garageId?.name ?? '',
      rating:     f.rating,
      comment:    f.comment,
      createdAt:  f.createdAt,
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── Visited Garages ──────────────────────────────────────────────────────────
exports.getMyVisitedGarages = async (req, res) => {
  try {
    // ✅ Only query by 'customer' field (model has no 'user' field)
    const bookings = await Booking.find({ customer: req.user.id })
      .populate('garage', 'name');

    const garageMap = {};
    bookings.forEach(b => {
      if (b.garage?._id) {
        garageMap[String(b.garage._id)] = { _id: b.garage._id, name: b.garage.name };
      }
    });

    res.json(Object.values(garageMap));
  } catch (e) { res.status(500).json({ message: e.message }); }
};