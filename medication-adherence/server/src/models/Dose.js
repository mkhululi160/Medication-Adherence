const mongoose = require('mongoose');

const doseSchema = new mongoose.Schema({
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  takenTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'taken', 'missed', 'skipped'],
    default: 'pending'
  },
  alerted: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Auto-delete old doses after 90 days
doseSchema.index({ scheduledTime: 1 }, { expireAfterSeconds: 7776000 });

// Index for missed dose queries
doseSchema.index({ scheduledTime: 1, status: 1, alerted: 1 });

module.exports = mongoose.model('Dose', doseSchema);