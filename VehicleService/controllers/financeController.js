const Finance = require('../models/Finance');

exports.createFinance = async (req, res) => {
    try {
        const finance = await Finance.create(req.body);
        res.status(201).json(finance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllFinances = async (req, res) => {
    try {
        const finances = await Finance.find().populate('booking');
        res.json(finances);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFinanceById = async (req, res) => {
    try {
        const finance = await Finance.findById(req.params.id);
        if (!finance) return res.status(404).json({ message: 'Finance not found' });
        res.json(finance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateFinance = async (req, res) => {
    try {
        const finance = await Finance.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!finance) return res.status(404).json({ message: 'Finance not found' });
        res.json(finance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteFinance = async (req, res) => {
    try {
        const finance = await Finance.findByIdAndDelete(req.params.id);
        if (!finance) return res.status(404).json({ message: 'Finance not found' });
        res.json({ message: 'Finance deleted successfully ✅' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};