const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const Booking = require('../models/Booking');
const Garage = require('../models/Garage');
const Vehicle = require('../models/Vehicle');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id, { name, phone, address }, { new: true }
    ).select('-password');
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/bookings', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 }).limit(parseInt(req.query.limit) || 50);
    res.json(bookings);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/bookings', protect, async (req, res) => {
  try {
    const { garageId, serviceId, vehicleId, date, time, notes } = req.body;
    const garage = await Garage.findById(garageId);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    let resolvedVehicle = vehicleId;
    if (!resolvedVehicle) {
      const vehicle = await Vehicle.findOne({ owner: req.user.id });
      resolvedVehicle = vehicle ? vehicle._id : null;
    }
    const service = garage.services?.find(s => s._id.toString() === serviceId);
    const booking = await Booking.create({
      user: req.user.id, vehicle: resolvedVehicle, service: serviceId,
      garageId, serviceName: service?.name || '',
      bookingDate: new Date(date), time: time || '', notes: notes || '', status: 'Pending',
    });
    res.status(201).json(booking);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/garages', protect, async (req, res) => {
  try {
    const garages = await Garage.find().limit(parseInt(req.query.limit) || 50);
    res.json(garages);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/garages/:id', protect, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) return res.status(404).json({ message: 'Garage not found' });
    res.json(garage);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/garages/:id/services', protect, async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id);
    res.json(garage?.services ?? []);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/garages/:id/reviews', protect, async (req, res) => {
  try {
    const feedback = await Feedback.find({ garageId: req.params.id })
      .sort({ createdAt: -1 }).limit(5);
    res.json(feedback);
  } catch (e) { res.json([]); }
});

router.get('/vehicles', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user.id });
    res.json(vehicles);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/vehicles', protect, async (req, res) => {
  try {
    const { make, model, year, licensePlate, color, vehicleType } = req.body;
    const vehicle = await Vehicle.create({
      owner: req.user.id, make, model,
      year: parseInt(year) || new Date().getFullYear(),
      licensePlate, color: color || '', vehicleType: vehicleType || 'Car',
    });
    res.status(201).json(vehicle);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/vehicles/:id', protect, async (req, res) => {
  try {
    await Vehicle.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    res.json({ message: 'Vehicle deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/reviews', protect, async (req, res) => {
  try {
    const { garageId, rating, comment } = req.body;
    const feedback = await Feedback.create({
      user: req.user.id,
      garageId,
      rating,
      comment: comment || '',
    });
    res.status(201).json(feedback);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/my-reviews', protect, async (req, res) => {
  try {
    const reviews = await Feedback.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
