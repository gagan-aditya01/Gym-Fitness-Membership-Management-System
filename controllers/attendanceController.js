const Joi = require('joi');
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Membership = require('../models/Membership');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');

// ─── Joi validation schemas ───────────────────────────────────────────────────

const checkinSchema = Joi.object({
  type: Joi.string().valid('gym_visit', 'class_checkin').required(),
  classId: Joi.string().when('type', {
    is: 'class_checkin',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
});

// ─── POST /api/attendance/checkin ─────────────────────────────────────────────

const checkIn = asyncHandler(async (req, res) => {
  const memberId = req.user.userId;
  const { type, classId } = req.body;

  if (type === 'gym_visit') {
    // Business rule: member must have an active, non-expired membership
    const activeMembership = await Membership.findOne({
      memberId,
      status: 'active',
      endDate: { $gt: new Date() },
    });

    if (!activeMembership) {
      return res.status(409).json({
        success: false,
        message: 'No active membership found. Please purchase a membership to check in.',
        errorCode: 'NO_ACTIVE_MEMBERSHIP',
      });
    }

    const attendance = await Attendance.create({ memberId, type, date: new Date() });

    return res.status(201).json({
      success: true,
      message: 'Gym visit checked in successfully',
      data: attendance,
    });
  }

  // type === 'class_checkin'
  if (!classId) {
    return res.status(400).json({
      success: false,
      message: 'classId is required for class check-in',
      errorCode: 'VALIDATION_ERROR',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(404).json({
      success: false,
      message: 'Class session not found',
      errorCode: 'NOT_FOUND',
    });
  }

  // Member must have a "confirmed" booking for the class
  const confirmedBooking = await Booking.findOne({
    classId,
    memberId,
    status: 'confirmed',
  });

  if (!confirmedBooking) {
    return res.status(409).json({
      success: false,
      message: 'No confirmed booking found for this class. You must have a confirmed booking to check in.',
      errorCode: 'NO_CONFIRMED_BOOKING',
    });
  }

  const attendance = await Attendance.create({
    memberId,
    type,
    classId,
    date: new Date(),
  });

  const populated = await Attendance.findById(attendance._id)
    .populate('classId', 'title schedule durationMinutes');

  return res.status(201).json({
    success: true,
    message: 'Class check-in successful',
    data: populated,
  });
});

// ─── GET /api/attendance/me ───────────────────────────────────────────────────

const getMyAttendance = asyncHandler(async (req, res) => {
  const memberId = req.user.userId;

  const records = await Attendance.find({ memberId })
    .populate('classId', 'title schedule durationMinutes')
    .sort({ date: -1 });

  return res.status(200).json({
    success: true,
    data: records,
  });
});

// ─── GET /api/attendance (admin) ─────────────────────────────────────────────

const getAllAttendance = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.memberId) {
    if (!mongoose.Types.ObjectId.isValid(req.query.memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid memberId query parameter',
        errorCode: 'VALIDATION_ERROR',
      });
    }
    filter.memberId = req.query.memberId;
  }

  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) {
      filter.date.$gte = new Date(req.query.from);
    }
    if (req.query.to) {
      filter.date.$lte = new Date(req.query.to);
    }
  }

  const records = await Attendance.find(filter)
    .populate('memberId', 'name email')
    .populate('classId', 'title schedule')
    .sort({ date: -1 });

  return res.status(200).json({
    success: true,
    data: records,
  });
});

module.exports = {
  checkinSchema,
  checkIn,
  getMyAttendance,
  getAllAttendance,
};
