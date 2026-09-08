const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  cancelBooking,
  getMyBookings,
} = require('../controllers/bookingController');

router.use(verifyToken);

router.get('/me', requireRole('member'), getMyBookings);
router.patch('/:id/cancel', requireRole('member', 'admin'), cancelBooking);

module.exports = router;
