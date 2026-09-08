const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getMemberDashboard } = require('../controllers/dashboardController');

router.use(verifyToken);

// Member: aggregated self-service dashboard
router.get('/me', requireRole('member'), getMemberDashboard);

module.exports = router;
