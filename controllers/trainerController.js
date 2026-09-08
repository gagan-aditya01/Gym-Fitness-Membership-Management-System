const Joi = require('joi');
const mongoose = require('mongoose');
const TrainerProfile = require('../models/TrainerProfile');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const createTrainerSchema = Joi.object({
  userId: Joi.string().optional(),
  email: Joi.string().email().optional(),
  specialization: Joi.string().trim().required(),
  bio: Joi.string().trim().optional().allow(''),
  yearsExperience: Joi.number().integer().min(0).optional(),
}).or('userId', 'email');

const updateTrainerSchema = Joi.object({
  specialization: Joi.string().trim().optional(),
  bio: Joi.string().trim().optional().allow(''),
  yearsExperience: Joi.number().integer().min(0).optional(),
}).min(1);

const createTrainer = asyncHandler(async (req, res) => {
  const { userId, email, specialization, bio, yearsExperience } = req.body;

  let user = null;
  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errorCode: 'NOT_FOUND',
      });
    }
    user = await User.findById(userId);
  } else if (email) {
    user = await User.findOne({ email: email.toLowerCase().trim() });
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found with provided credentials',
      errorCode: 'NOT_FOUND',
    });
  }

  // Promote user role to trainer if not already
  if (user.role !== 'trainer') {
    user.role = 'trainer';
    await user.save();
  }

  // Check duplicate trainer profile
  const existingProfile = await TrainerProfile.findOne({ userId: user._id });
  if (existingProfile) {
    return res.status(409).json({
      success: false,
      message: 'Trainer profile already exists for this user',
      errorCode: 'PROFILE_EXISTS',
    });
  }

  const profile = await TrainerProfile.create({
    userId: user._id,
    specialization,
    bio: bio || '',
    yearsExperience: yearsExperience || 0,
  });

  const populated = await TrainerProfile.findById(profile._id).populate('userId', 'name email role');

  return res.status(201).json({
    success: true,
    message: 'Trainer profile created successfully',
    data: populated,
  });
});

const getTrainers = asyncHandler(async (req, res) => {
  const trainers = await TrainerProfile.find()
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: trainers,
  });
});

const getTrainerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Trainer profile not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const trainer = await TrainerProfile.findById(id).populate('userId', 'name email role');
  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer profile not found',
      errorCode: 'NOT_FOUND',
    });
  }

  return res.status(200).json({
    success: true,
    data: trainer,
  });
});

const updateTrainer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Trainer profile not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const trainer = await TrainerProfile.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).populate('userId', 'name email role');

  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer profile not found',
      errorCode: 'NOT_FOUND',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Trainer profile updated successfully',
    data: trainer,
  });
});

const deleteTrainer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Trainer profile not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const trainer = await TrainerProfile.findByIdAndDelete(id);
  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer profile not found',
      errorCode: 'NOT_FOUND',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Trainer profile deleted successfully',
  });
});

module.exports = {
  createTrainerSchema,
  updateTrainerSchema,
  createTrainer,
  getTrainers,
  getTrainerById,
  updateTrainer,
  deleteTrainer,
};
