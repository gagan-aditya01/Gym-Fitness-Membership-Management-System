const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  checkinSchema,
  checkIn,
  getMyAttendance,
  getAllAttendance,
} = require('../controllers/attendanceController');

router.use(verifyToken);

// Member: check in (gym visit or class)
router.post('/checkin', requireRole('member'), validate(checkinSchema), checkIn);

// Member: view own attendance history
router.get('/me', requireRole('member'), getMyAttendance);

// Admin: view all attendance with optional filters (?memberId=, ?from=, ?to=)
router.get('/', requireRole('admin'), getAllAttendance);

module.exports = router;
