const express  = require('express');
const router   = express.Router();
const Vehicle  = require('../models/Vehicle');
const User     = require('../models/User');
const protect  = require('../middleware/authMiddleware');

// ✅ /customers MUST be before /:id
router.get('/customers', protect, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('name email');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all vehicles
router.get('/', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create
router.post('/', protect, async (req, res) => {
  try {
    const { customerId, make, model, year, licensePlate, color, vehicleType } = req.body;
    const vehicle = new Vehicle({
      customer: customerId,
      make, model, year, licensePlate, color, vehicleType,
    });
    await vehicle.save();
    const populated = await vehicle.populate('customer', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update
router.put('/:id', protect, async (req, res) => {
  try {
    const { customerId, make, model, year, licensePlate, color, vehicleType } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { customer: customerId, make, model, year, licensePlate, color, vehicleType },
      { new: true }
    ).populate('customer', 'name email');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;