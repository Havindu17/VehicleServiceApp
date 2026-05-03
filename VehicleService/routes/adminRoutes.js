const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Garage  = require('../models/Garage');
const Booking = require('../models/Booking');
const Feedback= require('../models/Feedback');
const auth    = require('../middleware/authMiddleware');

// Garages
router.get('/garages', auth, async (req,res) => {
  try { res.json(await Garage.find().populate('ownerId','name email phone')); }
  catch(e){ res.status(500).json({message:e.message}); }
});
router.patch('/garages/:id', auth, async (req,res) => {
  try { res.json(await Garage.findByIdAndUpdate(req.params.id, req.body, {new:true})); }
  catch(e){ res.status(500).json({message:e.message}); }
});

// Users
router.get('/users', auth, async (req,res) => {
  try { res.json(await User.find().select('-password')); }
  catch(e){ res.status(500).json({message:e.message}); }
});
router.patch('/users/:id', auth, async (req,res) => {
  try { res.json(await User.findByIdAndUpdate(req.params.id, req.body, {new:true})); }
  catch(e){ res.status(500).json({message:e.message}); }
});

// Bookings
router.get('/bookings', auth, async (req,res) => {
  try { res.json(await Booking.find().populate('customerId','name').populate('garageId','name')); }
  catch(e){ res.status(500).json({message:e.message}); }
});

// Feedback / Reviews
router.get('/reviews', auth, async (req,res) => {
  try { res.json(await Feedback.find().populate('customerId','name').populate('garageId','name')); }
  catch(e){ res.status(500).json({message:e.message}); }
});
router.delete('/reviews/:id', auth, async (req,res) => {
  try { await Feedback.findByIdAndDelete(req.params.id); res.json({message:'Deleted'}); }
  catch(e){ res.status(500).json({message:e.message}); }
});

module.exports = router;
