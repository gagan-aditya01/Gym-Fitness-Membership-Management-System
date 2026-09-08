const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['gym_visit', 'class_checkin'],
      required: [true, 'Attendance type is required'],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassSession',
      // required only when type === 'class_checkin' — enforced at controller level
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
