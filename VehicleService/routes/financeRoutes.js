const express = require('express');
const router  = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createFinance,
  getAllFinances,
  getFinanceById,
  updateFinance,
  deleteFinance,
  getGarageFinance,
  saveInvoice,
} = require('../controllers/financeController');

// ── Specific routes FIRST (before /:id) ───────────────────────────────────
router.get('/garage/finance',   protect, getGarageFinance);
router.post('/garage/invoice',  protect, saveInvoice);

// ── Generic CRUD ───────────────────────────────────────────────────────────
router.post('/',      protect, createFinance);
router.get('/',       protect, getAllFinances);
router.get('/:id',    protect, getFinanceById);
router.put('/:id',    protect, updateFinance);
router.delete('/:id', protect, deleteFinance);

module.exports = router;