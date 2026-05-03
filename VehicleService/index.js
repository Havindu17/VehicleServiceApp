const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => { console.log(req.method, req.url); next(); });

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/garage', require('./routes/garageRoutes'));
app.use('/api/invoice', require('./routes/invoiceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => res.json({ message: 'API Running!' }));

mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 30000, connectTimeoutMS: 30000, socketTimeoutMS: 45000 })
  .then(() => { console.log('MongoDB Connected'); const PORT = process.env.PORT || 5000; app.listen(PORT, () => console.log('Server running on port ' + PORT)); })
  .catch(err => { console.error('MongoDB Error:', err); process.exit(1); });
