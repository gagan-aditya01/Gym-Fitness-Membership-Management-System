const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const ClassSession = require('../models/ClassSession');
const asyncHandler = require('../utils/asyncHandler');

const bookClass = asyncHandler(async (req, res) => {
  const classId = req.params.id;
  const memberId = req.user.userId;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(404).json({
      success: false,
      message: 'Class session not found',
      errorCode: 'NOT_FOUND',
    });
  }

  // 1. Check if class exists and status is 'scheduled'
  const targetClass = await ClassSession.findById(classId);
  if (!targetClass || targetClass.status !== 'scheduled') {
    return res.status(404).json({
      success: false,
      message: 'Class session not found or unavailable for booking',
      errorCode: 'NOT_FOUND',
    });
  }

  // 2. Reject duplicate active/waitlisted bookings
  const existingBooking = await Booking.findOne({
    classId,
    memberId,
    status: { $in: ['confirmed', 'waitlisted'] },
  });

  if (existingBooking) {
    return res.status(409).json({
      success: false,
      message: 'You already have an active or waitlisted booking for this class',
      errorCode: 'DUPLICATE_BOOKING',
    });
  }

  // 3. Atomic capacity check and increment
  // Atomically increment bookedCount if bookedCount < capacity
  const updatedClass = await ClassSession.findOneAndUpdate(
    {
      _id: classId,
      status: 'scheduled',
      $expr: { $lt: ['$bookedCount', '$capacity'] },
    },
    { $inc: { bookedCount: 1 } },
    { new: true }
  );

  let bookingStatus = 'confirmed';
  if (!updatedClass) {
    // Capacity reached -> create waitlisted booking
    bookingStatus = 'waitlisted';
  }

  const booking = await Booking.create({
    classId,
    memberId,
    status: bookingStatus,
  });

  const populated = await Booking.findById(booking._id)
    .populate({
      path: 'classId',
      select: 'title schedule durationMinutes capacity bookedCount status',
      populate: { path: 'trainerId', select: 'name email' },
    });

  return res.status(201).json({
    success: true,
    message: bookingStatus === 'confirmed' ? 'Class booked successfully' : 'Class is full. Added to waitlist',
    data: populated,
  });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found',
      errorCode: 'NOT_FOUND',
    });
  }

  if (req.user.role !== 'admin' && booking.memberId.toString() !== req.user.userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only cancel your own bookings',
      errorCode: 'FORBIDDEN',
    });
  }

  if (booking.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Booking is already cancelled',
      errorCode: 'ALREADY_CANCELLED',
    });
  }

  const previousStatus = booking.status;
  booking.status = 'cancelled';
  await booking.save();

  if (previousStatus === 'confirmed') {
    // Decrement bookedCount
    await ClassSession.findByIdAndUpdate(booking.classId, { $inc: { bookedCount: -1 } });

    // Auto-promote oldest waitlisted booking if present
    const oldestWaitlisted = await Booking.findOne({
      classId: booking.classId,
      status: 'waitlisted',
    }).sort({ createdAt: 1 });

    if (oldestWaitlisted) {
      oldestWaitlisted.status = 'confirmed';
      await oldestWaitlisted.save();
      await ClassSession.findByIdAndUpdate(booking.classId, { $inc: { bookedCount: 1 } });
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: booking,
  });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const memberId = req.user.userId;

  const bookings = await Booking.find({ memberId })
    .populate({
      path: 'classId',
      select: 'title schedule durationMinutes capacity bookedCount status',
      populate: { path: 'trainerId', select: 'name email' },
    })
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: bookings,
  });
});

const getClassBookings = asyncHandler(async (req, res) => {
  const classId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(404).json({
      success: false,
      message: 'Class session not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const classSession = await ClassSession.findById(classId);
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
      message: 'Forbidden: You can only view bookings for your own classes',
      errorCode: 'FORBIDDEN',
    });
  }

  const bookings = await Booking.find({ classId })
    .populate('memberId', 'name email role')
    .sort({ createdAt: 1 });

  const grouped = {
    confirmed: bookings.filter((b) => b.status === 'confirmed'),
    waitlisted: bookings.filter((b) => b.status === 'waitlisted'),
    cancelled: bookings.filter((b) => b.status === 'cancelled'),
  };

  return res.status(200).json({
    success: true,
    data: {
      class: {
        _id: classSession._id,
        title: classSession.title,
        schedule: classSession.schedule,
        capacity: classSession.capacity,
        bookedCount: classSession.bookedCount,
      },
      bookings: grouped,
      total: bookings.length,
    },
  });
});

module.exports = {
  bookClass,
  cancelBooking,
  getMyBookings,
  getClassBookings,
};
