const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { createFeedback, getAllFeedbacks, getFeedbackById, updateFeedback, deleteFeedback } = require('../controllers/feedbackController');

router.post('/', protect, createFeedback);
router.get('/', protect, getAllFeedbacks);
router.get('/:id', protect, getFeedbackById);
router.put('/:id', protect, updateFeedback);
router.delete('/:id', protect, deleteFeedback);

module.exports = router;