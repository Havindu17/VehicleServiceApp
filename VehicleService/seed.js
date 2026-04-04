const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Garage = require('./models/Garage');
  await Garage.deleteMany({});
  await Garage.insertMany([
    { name: 'Silva Auto Service', address: 'Colombo 03', phone: '0112345678', email: 'silva@garage.lk', rating: 4.5, distance: '1.2', services: [{name: 'Oil Change', price: 2500}, {name: 'Wheel Alignment', price: 3500}] },
    { name: 'Perera Motors', address: 'Nugegoda', phone: '0119876543', email: 'perera@motors.lk', rating: 4.2, distance: '2.5', services: [{name: 'Full Service', price: 8000}, {name: 'AC Repair', price: 5000}] },
    { name: 'City Garage', address: 'Dehiwala', phone: '0114567890', email: 'city@garage.lk', rating: 3.8, distance: '3.1', services: [{name: 'Brake Service', price: 4000}, {name: 'Battery Replace', price: 6000}] },
  ]);
  console.log('Done!');
  process.exit();
});
