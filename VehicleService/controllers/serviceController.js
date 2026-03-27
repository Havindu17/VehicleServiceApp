const ServiceEntity = require('../models/ServiceEntity');

exports.createService = async (req, res) => {
    try {
        const service = await ServiceEntity.create(req.body);
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllServices = async (req, res) => {
    try {
        const services = await ServiceEntity.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getServiceById = async (req, res) => {
    try {
        const service = await ServiceEntity.findById(req.params.id);
        if (!service) return res.status(404).json({ message: 'Service not found' });
        res.json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateService = async (req, res) => {
    try {
        const service = await ServiceEntity.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!service) return res.status(404).json({ message: 'Service not found' });
        res.json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const service = await ServiceEntity.findByIdAndDelete(req.params.id);
        if (!service) return res.status(404).json({ message: 'Service not found' });
        res.json({ message: 'Service deleted successfully ✅' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};