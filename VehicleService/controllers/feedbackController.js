const Feedback = require('../models/Feedback');

exports.createFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.create({ user: req.user.id, ...req.body });
        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find().populate('user', 'name email');
        res.json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFeedbackById = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        res.json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
        res.json({ message: 'Feedback deleted successfully ✅' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};