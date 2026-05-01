const express  = require('express');
const router   = express.Router();
const Garage   = require('../models/Garage');
const User     = require('../models/User');
const protect  = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin')
        return res.status(403).json({ message: 'Admin only' });
    next();
};

// සියලුම garages list
router.get('/garages', protect, adminOnly, async (req, res) => {
    try {
        const garages = await Garage.find()
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(garages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Pending garages විතරක්
router.get('/garages/pending', protect, adminOnly, async (req, res) => {
    try {
        const garages = await Garage.find({ status: 'pending' })
            .populate('ownerId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(garages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Approve / Reject
router.patch('/garages/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const garage = await Garage.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!garage) {
            return res.status(404).json({ message: 'Garage not found' });
        }
        res.json({ message: `Garage ${status} ✅`, garage });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// සියලුම customers list
router.get('/customers', protect, adminOnly, async (req, res) => {
    try {
        const customers = await User.find({ role: 'customer' })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;