const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createTrainerSchema,
  updateTrainerSchema,
  createTrainer,
  getTrainers,
  getTrainerById,
  updateTrainer,
  deleteTrainer,
} = require('../controllers/trainerController');

router.use(verifyToken);

router
  .route('/')
  .get(getTrainers)
  .post(requireRole('admin'), validate(createTrainerSchema), createTrainer);

router
  .route('/:id')
  .get(getTrainerById)
  .put(requireRole('admin'), validate(updateTrainerSchema), updateTrainer)
  .delete(requireRole('admin'), deleteTrainer);

module.exports = router;
