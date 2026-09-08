const mongoose = require('mongoose');

const classSessionSchema = new mongoose.Schema(
  {
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Trainer ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Class title is required'],
      trim: true,
    },
    schedule: {
      type: Date,
      required: [true, 'Schedule date & time is required'],
    },
    durationMinutes: {
      type: Number,
      default: 60,
      min: [15, 'Duration must be at least 15 minutes'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ClassSession', classSessionSchema);
