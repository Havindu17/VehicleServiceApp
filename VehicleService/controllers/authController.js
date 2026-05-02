const User   = require('../models/User');
const Garage = require('../models/Garage');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// Register
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, address, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name, email,
            password: hashedPassword,
            phone, address,
            role: role || 'customer'
        });

        if (role === 'garage') {
            await Garage.create({
                name:     name,
                email:    email,
                phone:    phone   || '',
                address:  address || '',
                ownerId:  user._id,
                rating:   0,
                services: [],
                status:   'pending',
            });
        }

        res.status(201).json({ message: 'User registered successfully ✅' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Garage status check
        if (user.role === 'garage') {
            const garage = await Garage.findOne({ ownerId: user._id });
            if (!garage) {
                return res.status(400).json({ message: 'Garage not found' });
            }
            if (garage.status === 'pending') {
                return res.status(403).json({ message: 'Your garage registration is pending approval.' });
            }
            if (garage.status === 'rejected') {
                return res.status(403).json({ message: 'Your garage registration has been rejected.' });
            }
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id:    user._id,
                name:  user.name,
                email: user.email,
                role:  user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};