const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  register,
  login,
} = require('../controllers/authController');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

module.exports = router;
