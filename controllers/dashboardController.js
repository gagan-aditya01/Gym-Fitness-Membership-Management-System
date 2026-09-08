const Membership = require('../models/Membership');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const WorkoutNote = require('../models/WorkoutNote');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/dashboard/me ────────────────────────────────────────────────────

const getMemberDashboard = asyncHandler(async (req, res) => {
  const memberId = req.user.userId;
  const now = new Date();

  const [activeMembership, upcomingBookings, recentAttendance, recentNotes] =
    await Promise.all([
      // 1. Current active membership with plan details
      Membership.findOne({
        memberId,
        status: 'active',
        endDate: { $gt: now },
      }).populate('planId', 'name durationMonths price'),

      // 2. Upcoming confirmed class bookings (schedule in the future)
      Booking.find({ memberId, status: 'confirmed' })
        .populate({
          path: 'classId',
          match: { schedule: { $gte: now } },
          select: 'title schedule durationMinutes capacity status',
          populate: { path: 'trainerId', select: 'name email' },
        })
        .sort({ createdAt: -1 }),

      // 3. Recent attendance — last 10 records
      Attendance.find({ memberId })
        .populate('classId', 'title schedule')
        .sort({ date: -1 })
        .limit(10),

      // 4. Recent workout notes — last 5 records
      WorkoutNote.find({ memberId })
        .populate('trainerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

  // Filter out bookings where the populated classId was null (past classes filtered by match)
  const filteredBookings = upcomingBookings.filter((b) => b.classId !== null);

  return res.status(200).json({
    success: true,
    data: {
      activeMembership,
      upcomingBookings: filteredBookings,
      recentAttendance,
      recentWorkoutNotes: recentNotes,
    },
  });
});

module.exports = {
  getMemberDashboard,
};
