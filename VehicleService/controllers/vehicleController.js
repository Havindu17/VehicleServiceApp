const Vehicle = require('../models/Vehicle');

// ── Create Vehicle ─────────────────────────────────────────────────────────
exports.createVehicle = async (req, res) => {
  try {
    const {
      make, model, year, licensePlate, color, vehicleType, fuelType,
      mileage, notes,
      insuranceCompany, insurancePolicyNo, insuranceExpiry,
      revenueLicenseNo, revenueLicenseExpiry,
      lastServiceDate, nextServiceDate, nextServiceMileage,
    } = req.body;

    const vehicle = await Vehicle.create({
      customer: req.body.customerId ?? req.user.id,
      make, model, year, licensePlate, color, vehicleType, fuelType,
      mileage, notes,
      insuranceCompany, insurancePolicyNo,
      insuranceExpiry:      insuranceExpiry      || null,
      revenueLicenseNo,
      revenueLicenseExpiry: revenueLicenseExpiry || null,
      lastServiceDate:      lastServiceDate      || null,
      nextServiceDate:      nextServiceDate      || null,
      nextServiceMileage,
      imageUrl: req.file ? req.file.path : null,
    });

    const populated = await vehicle.populate('customer', 'name email phone');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get All Vehicles ───────────────────────────────────────────────────────
exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get Single Vehicle ─────────────────────────────────────────────────────
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('customer', 'name email phone');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update Vehicle ─────────────────────────────────────────────────────────
// FIX: 'new: true' deprecated → use 'returnDocument: after'
exports.updateVehicle = async (req, res) => {
  try {
    const updateData = {
      make:                 req.body.make,
      model:                req.body.model,
      year:                 req.body.year,
      licensePlate:         req.body.licensePlate,
      color:                req.body.color,
      vehicleType:          req.body.vehicleType,
      fuelType:             req.body.fuelType,
      mileage:              req.body.mileage,
      notes:                req.body.notes,
      insuranceCompany:     req.body.insuranceCompany,
      insurancePolicyNo:    req.body.insurancePolicyNo,
      insuranceExpiry:      req.body.insuranceExpiry      || null,
      revenueLicenseNo:     req.body.revenueLicenseNo,
      revenueLicenseExpiry: req.body.revenueLicenseExpiry || null,
      lastServiceDate:      req.body.lastServiceDate      || null,
      nextServiceDate:      req.body.nextServiceDate      || null,
      nextServiceMileage:   req.body.nextServiceMileage,
    };

    if (req.body.customerId) updateData.customer = req.body.customerId;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        returnDocument: 'after', // ✅ Fixed: replaces deprecated { new: true }
        runValidators: true,
      }
    ).populate('customer', 'name email phone');

    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── Delete Vehicle ─────────────────────────────────────────────────────────
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted successfully ✅' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Upload Vehicle Image ───────────────────────────────────────────────────
exports.uploadVehicleImage = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (req.file) {
      vehicle.imageUrl = req.file.path;
      await vehicle.save();
    }
    res.json({ imageUrl: vehicle.imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Delete Vehicle Image ───────────────────────────────────────────────────
exports.deleteVehicleImage = async (req, res) => {
  try {
    await Vehicle.findByIdAndUpdate(req.params.id, { $unset: { imageUrl: '' } });
    res.json({ message: 'Image removed ✅' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};