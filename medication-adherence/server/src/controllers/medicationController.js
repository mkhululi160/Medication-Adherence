const Medication = require('../models/Medication');
const Dose = require('../models/Dose');
const mongoose = require('mongoose');

// Helper function to generate doses
const generateDoses = async (medication) => {
  const doses = [];
  const startDate = new Date(medication.startDate);
  const endDate = medication.endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();

    medication.schedule.forEach(scheduleItem => {
      if (scheduleItem.daysOfWeek.includes(dayOfWeek)) {
        const [hours, minutes] = scheduleItem.time.split(':');
        const scheduledTime = new Date(currentDate);
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        doses.push({
          medicationId: medication._id,
          userId: medication.userId,
          scheduledTime
        });
      }
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (doses.length > 0) {
    await Dose.insertMany(doses);
  }
};

// @desc    Get all medications for user
// @route   GET /api/medications
// @access  Private
exports.getMedications = async (req, res) => {
  try {
    const medications = await Medication.find({
      userId: req.user.id,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json(medications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create medication
// @route   POST /api/medications
// @access  Private
exports.createMedication = async (req, res) => {
  try {
    const { name, dosage, instructions, schedule, startDate, endDate } = req.body;

    const medication = await Medication.create({
      name,
      dosage,
      instructions,
      schedule,
      startDate,
      endDate,
      userId: req.user.id
    });

    await generateDoses(medication);

    res.status(201).json(medication);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update medication
// @route   PUT /api/medications/:id
// @access  Private
exports.updateMedication = async (req, res) => {
  try {
    let medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    if (medication.userId.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    medication = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (req.body.schedule) {
      await Dose.deleteMany({ medicationId: medication._id });
      await generateDoses(medication);
    }

    res.json(medication);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete medication
// @route   DELETE /api/medications/:id
// @access  Private
exports.deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    if (medication.userId.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await medication.deleteOne();
    await Dose.deleteMany({ medicationId: req.params.id });

    res.json({ success: true, message: 'Medication deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};