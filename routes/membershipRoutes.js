const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createMembershipSchema,
  createMembership,
  getMyMemberships,
  getAllMemberships,
  cancelMembership,
} = require('../controllers/membershipController');

router.use(verifyToken);

router.post('/', requireRole('member'), validate(createMembershipSchema), createMembership);
router.get('/me', requireRole('member'), getMyMemberships);
router.get('/', requireRole('admin'), getAllMemberships);
router.patch('/:id/cancel', requireRole('member', 'admin'), cancelMembership);

module.exports = router;
