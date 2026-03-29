const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add medication name'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Please add dosage']
  },
  instructions: {
    type: String,
    default: ''
  },
  schedule: [{
    time: {
      type: String,
      required: true
    },
    daysOfWeek: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6]
    }
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reminderWindow: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Medication', medicationSchema);