// VehicleService/seed/adminSeed.js
// Run: node seed/adminSeed.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const existing = await User.findOne({ email: 'admin@autoserve.lk' });
  if (existing) {
    console.log('⚠️  Admin already exists!');
    process.exit(0);
  }

  const hashed = await bcrypt.hash('admin123', 10);
  await User.create({
    name:     'Super Admin',
    email:    'admin@autoserve.lk',
    password: hashed,
    role:     'admin',
    phone:    '0700000000',
    address:  'AutoServe HQ',
  });

  console.log('🎉 Admin created!');
  console.log('   Email:    admin@autoserve.lk');
  console.log('   Password: admin123');
  process.exit(0);
}

seedAdmin().catch(err => { console.error(err); process.exit(1); });