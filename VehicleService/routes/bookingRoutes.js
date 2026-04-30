const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { 
    createBooking, 
    getAllBookings, 
    getBookingById, 
    updateBooking, 
    deleteBooking,
    getBookingsByGarage,  // ✅ Garage owner's bookings
    getMyBookings         // ✅ Customer's own bookings
} = require('../controllers/bookingController');

// ✅ Customer - Create a booking
router.post('/', protect, createBooking);

// ✅ Customer - View their own bookings
router.get('/my', protect, getMyBookings);

// ✅ Garage Owner - View their garage's bookings
router.get('/garage/mybookings', protect, getBookingsByGarage);

// ✅ Admin - View all bookings
router.get('/', protect, getAllBookings);

// ✅ Single booking
router.get('/:id', protect, getBookingById);

// ✅ Update booking status (garage updates: Confirmed/Completed/Cancelled)
router.put('/:id', protect, updateBooking);

// ✅ Delete booking
router.delete('/:id', protect, deleteBooking);

module.exports = router;