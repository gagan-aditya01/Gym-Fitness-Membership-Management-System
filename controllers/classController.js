const Joi = require('joi');
const mongoose = require('mongoose');
const ClassSession = require('../models/ClassSession');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const createClassSchema = Joi.object({
  title: Joi.string().trim().required(),
  schedule: Joi.date().iso().required(),
  durationMinutes: Joi.number().integer().min(15).optional().default(60),
  capacity: Joi.number().integer().min(1).required(),
  trainerId: Joi.string().optional(),
});

const updateClassSchema = Joi.object({
  title: Joi.string().trim().optional(),
  schedule: Joi.date().iso().optional(),
  durationMinutes: Joi.number().integer().min(15).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  trainerId: Joi.string().optional(),
}).min(1);

const createClass = asyncHandler(async (req, res) => {
  let trainerId;

  if (req.user.role === 'admin') {
    if (!req.body.trainerId) {
      return res.status(400).json({
        success: false,
        message: 'trainerId is required when creating a class as admin',
        errorCode: 'VALIDATION_ERROR',
      });
    }
    if (!mongoose.Types.ObjectId.isValid(req.body.trainerId)) {
      return res.status(404).json({
        success: false,
        message: 'Trainer user not found',
        errorCode: 'NOT_FOUND',
      });
    }
    const trainerUser = await User.findById(req.body.trainerId);
    if (!trainerUser || trainerUser.role !== 'trainer') {
      return res.status(400).json({
        success: false,
        message: 'Referenced user is not a trainer',
        errorCode: 'INVALID_TRAINER',
      });
    }
    trainerId = req.body.trainerId;
  } else {
    trainerId = req.user.userId;
  }

  const { title, schedule, durationMinutes, capacity } = req.body;

  const classSession = await ClassSession.create({
    trainerId,
    title,
    schedule,
    durationMinutes: durationMinutes || 60,
    capacity,
    bookedCount: 0,
    status: 'scheduled',
  });

  const populated = await ClassSession.findById(classSession._id).populate('trainerId', 'name email role');

  return res.status(201).json({
    success: true,
    message: 'Class session created successfully',
    data: populated,
  });
});

const getClasses = asyncHandler(async (req, res) => {
  const now = new Date();
  const classes = await ClassSession.find({
    schedule: { $gte: now },
    status: 'scheduled',
  })
    .populate('trainerId', 'name email role')
    .sort({ schedule: 1 });

  return res.status(200).json({
    success: true,
    data: classes,
  });
});

const getClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Class session not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const classSession = await ClassSession.findById(id).populate('trainerId', 'name email role');
  if (!classSession) {
    return res.status(404).json({
      success: false,
      message: 'Class session not found',
      errorCode: 'NOT_FOUND',
    });
  }

  return res.status(200).json({
    success: true,
    data: classSession,
  });
});

const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Class session not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const classSession = await ClassSession.findById(id);
  if (!classSession) {
    return res.status(404).json({
      success: false,
      message: 'Class session not found',
      errorCode: 'NOT_FOUND',
    });
  }

  if (req.user.role !== 'admin' && classSession.trainerId.toString() !== req.user.userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only edit your own classes',
      errorCode: 'FORBIDDEN',
    });
  }

  Object.assign(classSession, req.body);
  await classSession.save();

  const populated = await ClassSession.findById(classSession._id).populate('trainerId', 'name email role');

  return res.status(200).json({
    success: true,
    message: 'Class session updated successfully',
    data: populated,
  });
});

const cancelClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Class session not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const classSession = await ClassSession.findById(id);
  if (!classSession) {
    return res.status(404).json({
      success: false,
      message: 'Class session not found',
      errorCode: 'NOT_FOUND',
    });
  }

  if (req.user.role !== 'admin' && classSession.trainerId.toString() !== req.user.userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only cancel your own classes',
      errorCode: 'FORBIDDEN',
    });
  }

  classSession.status = 'cancelled';
  await classSession.save();

  return res.status(200).json({
    success: true,
    message: 'Class session cancelled successfully',
    data: classSession,
  });
});

module.exports = {
  createClassSchema,
  updateClassSchema,
  createClass,
  getClasses,
  getClassById,
  updateClass,
  cancelClass,
};
