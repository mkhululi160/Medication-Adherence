const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  guardianEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invite', inviteSchema);