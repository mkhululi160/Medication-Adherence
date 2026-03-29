const User = require('../models/User');
const Invite = require('../models/Invite');
const Dose = require('../models/Dose');
const crypto = require('crypto');
const { sendGuardianInvitation, sendMissedDoseAlert } = require('../utils/email');

// @desc    Invite a guardian
// @route   POST /api/guardian/invite
// @access  Private (Patient only)
exports.inviteGuardian = async (req, res) => {
  try {
    const { email } = req.body;

    const token = crypto.randomBytes(32).toString('hex');

    const invite = await Invite.create({
      patientId: req.user.id,
      guardianEmail: email,
      token
    });

    await sendGuardianInvitation(email, req.user.name, token);

    res.json({
      success: true,
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Accept guardian invitation
// @route   POST /api/guardian/accept/:token
// @access  Private (Guardian)
exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;

    const invite = await Invite.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!invite) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    if (req.user.email !== invite.guardianEmail) {
      return res.status(403).json({ error: 'This invitation is for a different email' });
    }

    const patient = await User.findById(invite.patientId);
    patient.guardianId = req.user.id;
    await patient.save();

    req.user.patients.push(patient.id);
    await req.user.save();

    invite.status = 'accepted';
    await invite.save();

    res.json({
      success: true,
      message: 'Successfully linked as guardian'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all patients for guardian
// @route   GET /api/guardian/patients
// @access  Private (Guardian)
exports.getPatients = async (req, res) => {
  try {
    const patients = await User.find({
      _id: { $in: req.user.patients }
    }).select('-password');

    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get patient adherence for guardian
// @route   GET /api/guardian/patient/:patientId/adherence
// @access  Private (Guardian)
exports.getPatientAdherence = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!req.user.patients.includes(patientId)) {
      return res.status(403).json({ error: 'Not authorized to view this patient' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const doses = await Dose.find({
      userId: patientId,
      scheduledTime: { $gte: thirtyDaysAgo }
    }).populate('medicationId');

    const total = doses.length;
    const taken = doses.filter(d => d.status === 'taken').length;
    const missed = doses.filter(d => d.status === 'missed').length;

    res.json({
      patientId,
      total,
      taken,
      missed,
      adherenceRate: total > 0 ? (taken / total) * 100 : 0,
      recentDoses: doses.slice(-10)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};