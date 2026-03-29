const express = require('express');
const router = express.Router();
const {
  getTodayDoses,
  getDosesByDate,
  scanDose,
  getAdherenceStats,
  getDetailedAdherenceStats
} = require('../controllers/doseController');
const { protect } = require('../middleware/auth');

router.get('/today', protect, getTodayDoses);
router.get('/date/:date', protect, getDosesByDate);
router.get('/stats', protect, getAdherenceStats);
router.get('/stats/detailed', protect, getDetailedAdherenceStats);
router.post('/scan/:id', protect, scanDose);

module.exports = router;