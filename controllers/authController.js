const bcrypt = require('bcrypt');
const Joi = require('joi');
const User = require('../models/User');
const { generateToken } = require('../utils/token');
const asyncHandler = require('../utils/asyncHandler');

const registerSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('member', 'trainer', 'admin').optional().default('member'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required(),
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists',
      errorCode: 'EMAIL_EXISTS',
    });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
  });

  const token = generateToken(user._id, user.role);

  const userObj = user.toObject();
  delete userObj.passwordHash;

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userObj,
      token,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
      errorCode: 'INVALID_CREDENTIALS',
    });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
      errorCode: 'INVALID_CREDENTIALS',
    });
  }

  const token = generateToken(user._id, user.role);

  const userObj = user.toObject();
  delete userObj.passwordHash;

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userObj,
      token,
    },
  });
});

module.exports = {
  registerSchema,
  loginSchema,
  register,
  login,
};
