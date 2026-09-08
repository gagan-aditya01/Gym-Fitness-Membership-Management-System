const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createClassSchema,
  updateClassSchema,
  createClass,
  getClasses,
  getClassById,
  updateClass,
  cancelClass,
} = require('../controllers/classController');
const { bookClass, getClassBookings } = require('../controllers/bookingController');

router.use(verifyToken);

router
  .route('/')
  .get(getClasses)
  .post(requireRole('trainer', 'admin'), validate(createClassSchema), createClass);

router
  .route('/:id')
  .get(getClassById)
  .put(requireRole('trainer', 'admin'), validate(updateClassSchema), updateClass);

router.patch('/:id/cancel', requireRole('trainer', 'admin'), cancelClass);

// Booking routes nested under class
router.post('/:id/book', requireRole('member'), bookClass);
router.get('/:id/bookings', requireRole('trainer', 'admin'), getClassBookings);

module.exports = router;
