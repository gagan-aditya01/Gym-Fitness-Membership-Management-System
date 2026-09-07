const Joi = require('joi');
const mongoose = require('mongoose');
const MembershipPlan = require('../models/MembershipPlan');
const asyncHandler = require('../utils/asyncHandler');

const createPlanSchema = Joi.object({
  name: Joi.string().trim().required(),
  durationMonths: Joi.number().integer().min(1).required(),
  price: Joi.number().min(0).required(),
});

const updatePlanSchema = Joi.object({
  name: Joi.string().trim().optional(),
  durationMonths: Joi.number().integer().min(1).optional(),
  price: Joi.number().min(0).optional(),
}).min(1);

const createPlan = asyncHandler(async (req, res) => {
  const { name, durationMonths, price } = req.body;

  const plan = await MembershipPlan.create({
    name,
    durationMonths,
    price,
  });

  return res.status(201).json({
    success: true,
    message: 'Membership plan created successfully',
    data: plan,
  });
});

const getPlans = asyncHandler(async (req, res) => {
  const plans = await MembershipPlan.find().sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: plans,
  });
});

const getPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Plan not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const plan = await MembershipPlan.findById(id);
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Plan not found',
      errorCode: 'NOT_FOUND',
    });
  }

  return res.status(200).json({
    success: true,
    data: plan,
  });
});

const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Plan not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const plan = await MembershipPlan.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Plan not found',
      errorCode: 'NOT_FOUND',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Membership plan updated successfully',
    data: plan,
  });
});

const deletePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Plan not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const plan = await MembershipPlan.findByIdAndDelete(id);
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Plan not found',
      errorCode: 'NOT_FOUND',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Membership plan deleted successfully',
  });
});

module.exports = {
  createPlanSchema,
  updatePlanSchema,
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
};
