const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const existing = await User.findOne({ role: 'admin' });
        if (existing) {
            console.log('⚠️  Admin already exists!');
            console.log('Email:', existing.email);
            process.exit();
        }

        const hashed = await bcrypt.hash('Admin@1234', 10);
        await User.create({
            name:     'Admin',
            email:    'admin@vehicleservice.com',
            password: hashed,
            role:     'admin'
        });

        console.log('✅ Admin created!');
        console.log('Email:    admin@vehicleservice.com');
        console.log('Password: Admin@1234');
        process.exit();
    })
    .catch(err => {
        console.log('Error:', err);
        process.exit();
    });
