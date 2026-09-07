const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createPlanSchema,
  updatePlanSchema,
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} = require('../controllers/membershipPlanController');

// All membership plan routes require authentication
router.use(verifyToken);

router
  .route('/')
  .get(getPlans)
  .post(requireRole('admin'), validate(createPlanSchema), createPlan);

router
  .route('/:id')
  .get(getPlanById)
  .put(requireRole('admin'), validate(updatePlanSchema), updatePlan)
  .delete(requireRole('admin'), deletePlan);

module.exports = router;
