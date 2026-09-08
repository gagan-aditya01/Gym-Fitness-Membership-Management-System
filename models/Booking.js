const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassSession',
      required: [true, 'Class ID is required'],
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member ID is required'],
    },
    status: {
      type: String,
      enum: ['confirmed', 'waitlisted', 'cancelled'],
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to optimize queries and prevent duplicate active bookings
bookingSchema.index({ classId: 1, memberId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
