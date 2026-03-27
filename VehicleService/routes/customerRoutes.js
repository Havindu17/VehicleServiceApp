const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { createCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer } = require('../controllers/customerController');

router.post('/', protect, createCustomer);
router.get('/', protect, getAllCustomers);
router.get('/:id', protect, getCustomerById);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, deleteCustomer);

module.exports = router;