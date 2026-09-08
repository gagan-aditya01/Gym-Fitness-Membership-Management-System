const mongoose = require('mongoose');

const trainerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      default: '',
    },
    yearsExperience: {
      type: Number,
      default: 0,
      min: [0, 'Years of experience cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TrainerProfile', trainerProfileSchema);
