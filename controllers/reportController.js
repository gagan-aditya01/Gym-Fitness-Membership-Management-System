const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Membership = require('../models/Membership');
const MembershipPlan = require('../models/MembershipPlan');
const Booking = require('../models/Booking');
const ClassSession = require('../models/ClassSession');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc GET /api/admin/reports/attendance
 * @access Admin
 * Aggregates attendance counts by day and type.
 * Optional query params: from (ISO date), to (ISO date)
 */
const attendanceReport = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.from || req.query.to) {
    match.date = {};
    if (req.query.from) match.date.$gte = new Date(req.query.from);
    if (req.query.to) match.date.$lte = new Date(req.query.to);
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          type: '$type',
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id.day',
        type: '$_id.type',
        count: 1,
      },
    },
    { $sort: { date: -1 } },
  ];

  const results = await Attendance.aggregate(pipeline);
  res.status(200).json({ success: true, data: results });
});

/**
 * @desc GET /api/admin/reports/membership-plans
 * @access Admin
 * Returns count of active memberships per plan, sorted descending.
 */
const membershipPlanPopularity = asyncHandler(async (req, res) => {
  const pipeline = [
    { $match: { status: 'active' } },
    {
      $group: {
        _id: '$planId',
        activeCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'membershipplans', // collection name (lowercase plural)
        localField: '_id',
        foreignField: '_id',
        as: 'plan',
      },
    },
    { $unwind: '$plan' },
    {
      $project: {
        _id: 0,
        planId: '$_id',
        planName: '$plan.name',
        activeCount: 1,
      },
    },
    { $sort: { activeCount: -1 } },
  ];

  const results = await Membership.aggregate(pipeline);
  res.status(200).json({ success: true, data: results });
});

/**
 * @desc GET /api/admin/reports/renewals
 * @access Admin
 * Lists active memberships whose endDate is within the next 7 days.
 */
const upcomingRenewals = asyncHandler(async (req, res) => {
  const now = new Date();
  const inSevenDays = new Date();
  inSevenDays.setDate(now.getDate() + 7);

  const memberships = await Membership.find({
    status: 'active',
    endDate: { $gte: now, $lte: inSevenDays },
  })
    .populate('memberId', 'name email')
    .populate('planId', 'name');

  res.status(200).json({ success: true, data: memberships });
});

/**
 * @desc GET /api/admin/reports/classes
 * @access Admin
 * Provides per‑class booking statistics.
 * Optional query: ?status=scheduled|completed|cancelled etc. (filters on ClassSession.status)
 */
const classBookingStats = asyncHandler(async (req, res) => {
  const match = {};
  if (req.query.status) {
    match.status = req.query.status;
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'classId',
        as: 'bookings',
      },
    },
    {
      $addFields: {
        bookedCount: { $size: { $filter: { input: '$bookings', cond: { $eq: ['$$this.status', 'confirmed'] } } } },
        waitlistedCount: { $size: { $filter: { input: '$bookings', cond: { $eq: ['$$this.status', 'waitlisted'] } } } },
      },
    },
    {
      $lookup: {
        from: 'trainers',
        localField: 'trainerId',
        foreignField: '_id',
        as: 'trainer',
      },
    },
    { $unwind: { path: '$trainer', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        title: 1,
        schedule: 1,
        capacity: 1,
        bookedCount: 1,
        waitlistedCount: 1,
        trainer: { name: '$trainer.name', email: '$trainer.email' },
      },
    },
    { $sort: { schedule: 1 } },
  ];

  const results = await ClassSession.aggregate(pipeline);
  res.status(200).json({ success: true, data: results });
});

module.exports = {
  attendanceReport,
  membershipPlanPopularity,
  upcomingRenewals,
  classBookingStats,
};
