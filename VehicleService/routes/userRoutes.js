const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getProfile
} = require('../controllers/userController');

// Protected Routes
router.get('/profile', protect, getProfile);
router.get('/', protect, getAllUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

module.exports = router;