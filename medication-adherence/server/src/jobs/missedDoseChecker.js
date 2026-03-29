const Queue = require('bull');
const Dose = require('../models/Dose');
const User = require('../models/User');
const { sendMissedDoseSMS } = require('../utils/twilio');
const { sendMissedDoseAlert } = require('../utils/email');
const { sendMissedDosePush } = require('../utils/push');

const missedDoseQueue = new Queue('missed dose checks', process.env.REDIS_URL);

missedDoseQueue.process(async (job) => {
  console.log('Running missed dose check...');

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

  const doses = await Dose.find({
    scheduledTime: { $gte: fourHoursAgo, $lte: twoHoursAgo },
    status: 'pending',
    alerted: false
  }).populate('medicationId').populate('userId');

  console.log(`Found ${doses.length} missed doses to alert`);

  for (const dose of doses) {
    const patient = dose.userId;
    const medication = dose.medicationId;

    dose.status = 'missed';
    await dose.save();

    let guardian = null;
    if (patient.guardianId) {
      guardian = await User.findById(patient.guardianId);
    }

    if (guardian) {
      if (guardian.phone) {
        try {
          await sendMissedDoseSMS(guardian.phone, {
            patientName: patient.name,
            medicationName: medication.name,
            scheduledTime: dose.scheduledTime
          });
          console.log(`SMS sent to ${guardian.phone}`);
        } catch (error) {
          console.error('Twilio error:', error);
        }
      }

      try {
        await sendMissedDoseAlert(guardian.email, {
          patientName: patient.name,
          medicationName: medication.name,
          dosage: medication.dosage,
          scheduledTime: dose.scheduledTime
        });
        console.log(`Email sent to ${guardian.email}`);
      } catch (error) {
        console.error('Email error:', error);
      }

      if (guardian.pushSubscriptions && guardian.pushSubscriptions.length) {
        for (const subscription of guardian.pushSubscriptions) {
          try {
            await sendMissedDosePush(subscription, {
              patientName: patient.name,
              medicationName: medication.name,
              scheduledTime: dose.scheduledTime
            });
          } catch (error) {
            console.error('Push error:', error);
          }
        }
      }
    }

    dose.alerted = true;
    await dose.save();
  }
});

const cron = require('node-cron');
cron.schedule('* * * * *', async () => {
  try {
    await missedDoseQueue.add({});
  } catch (error) {
    console.error('Error adding job to queue:', error);
  }
});

console.log('Missed dose checker initialized');

module.exports = missedDoseQueue;