const express  = require('express');
const router   = express.Router();
const Vehicle  = require('../models/Vehicle');
const User     = require('../models/User');
const protect  = require('../middleware/authMiddleware');

// ── New fields helper ──────────────────────────────────────────────────────
function vehicleFields(body) {
  return {
    make:                 body.make,
    model:                body.model,
    year:                 body.year,
    licensePlate:         body.licensePlate,
    color:                body.color,
    vehicleType:          body.vehicleType,
    fuelType:             body.fuelType,
    mileage:              body.mileage,
    notes:                body.notes,
    // Insurance
    insuranceCompany:     body.insuranceCompany,
    insurancePolicyNo:    body.insurancePolicyNo,
    insuranceExpiry:      body.insuranceExpiry   || null,
    // Revenue License
    revenueLicenseNo:     body.revenueLicenseNo,
    revenueLicenseExpiry: body.revenueLicenseExpiry || null,
    // Maintenance
    lastServiceDate:      body.lastServiceDate   || null,
    nextServiceDate:      body.nextServiceDate   || null,
    nextServiceMileage:   body.nextServiceMileage,
  };
}

// ── GET /customers (MUST be before /:id) ──────────────────────────────────
router.get('/customers', protect, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('name email');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET all vehicles ───────────────────────────────────────────────────────
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

// ── GET single vehicle ─────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('customer', 'name email phone');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST create ────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const vehicle = new Vehicle({
      customer: req.body.customerId ?? req.user.id,
      ...vehicleFields(req.body),
    });
    await vehicle.save();
    const populated = await vehicle.populate('customer', 'name email phone');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT update ─────────────────────────────────────────────────────────────
// FIX: 'new: true' deprecated → use 'returnDocument: after'
router.put('/:id', protect, async (req, res) => {
  try {
    const update = vehicleFields(req.body);
    if (req.body.customerId) update.customer = req.body.customerId;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      {
        returnDocument: 'after', // ✅ Fixed: replaces deprecated { new: true }
        runValidators: true,
      }
    ).populate('customer', 'name email phone');

    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── DELETE ─────────────────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted successfully ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST image upload ──────────────────────────────────────────────────────
router.post('/:id/image', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (req.file) {
      vehicle.imageUrl = req.file.path;
      await vehicle.save();
    }
    res.json({ imageUrl: vehicle.imageUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE image ───────────────────────────────────────────────────────────
router.delete('/:id/image', protect, async (req, res) => {
  try {
    await Vehicle.findByIdAndUpdate(req.params.id, { $unset: { imageUrl: '' } });
    res.json({ message: 'Image removed ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;