const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { attendanceReport, membershipPlanPopularity, upcomingRenewals, classBookingStats } = require('../controllers/reportController');

router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/attendance', attendanceReport);
router.get('/membership-plans', membershipPlanPopularity);
router.get('/renewals', upcomingRenewals);
router.get('/classes', classBookingStats);

module.exports = router;
