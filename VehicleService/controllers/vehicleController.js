const Vehicle = require('../models/Vehicle');

// Create Vehicle
exports.createVehicle = async (req, res) => {
    try {
        const { make, model, year, licensePlate, color, vehicleType } = req.body;
        const vehicle = await Vehicle.create({
            owner: req.user.id,
            make, model, year, licensePlate, color, vehicleType,
            image: req.file ? req.file.path : null
        });
        res.status(201).json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get All Vehicles
exports.getAllVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find().populate('owner', 'name email');
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Single Vehicle
exports.getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'name email');
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Vehicle
exports.updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete Vehicle
exports.deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        res.json({ message: 'Vehicle deleted successfully ✅' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};