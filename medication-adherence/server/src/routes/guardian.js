const express = require('express');
const router = express.Router();
const {
  inviteGuardian,
  acceptInvite,
  getPatients,
  getPatientAdherence
} = require('../controllers/guardianController');
const { protect, authorize } = require('../middleware/auth');

router.post('/invite', protect, authorize('patient'), inviteGuardian);
router.post('/accept/:token', protect, authorize('guardian'), acceptInvite);
router.get('/patients', protect, authorize('guardian'), getPatients);
router.get('/patient/:patientId/adherence', protect, authorize('guardian'), getPatientAdherence);

module.exports = router;