const express = require('express');
const router = express.Router();
const {
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication
} = require('../controllers/medicationController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getMedications)
  .post(protect, createMedication);

router.route('/:id')
  .put(protect, updateMedication)
  .delete(protect, deleteMedication);

module.exports = router;