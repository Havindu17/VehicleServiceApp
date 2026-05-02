const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    description: { type: String, default: '' },
    price:       { type: Number, default: 0 },
    duration:    { type: Number, default: 0 },
    category:    { type: String, default: '' },
}, { _id: true });

const garageSchema = new mongoose.Schema({
    ownerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:     { type: String, required: true },
    email:    { type: String },
    phone:    { type: String },
    address:  { type: String },
    about:          { type: String },
    businessRegNo:  { type: String },
    profilePhoto:   { type: String },
    services: [serviceSchema],
    workingHours: {
        Monday:    { open: String, close: String, closed: { type: Boolean, default: false } },
        Tuesday:   { open: String, close: String, closed: { type: Boolean, default: false } },
        Wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
        Thursday:  { open: String, close: String, closed: { type: Boolean, default: false } },
        Friday:    { open: String, close: String, closed: { type: Boolean, default: false } },
        Saturday:  { open: String, close: String, closed: { type: Boolean, default: false } },
        Sunday:    { open: String, close: String, closed: { type: Boolean, default: true  } },
    },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
    },
    rating:   { type: Number, default: 0 },
    distance: { type: Number },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
}, { timestamps: true });

garageSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Garage', garageSchema);