const Joi = require('joi');
const mongoose = require('mongoose');
const Membership = require('../models/Membership');
const MembershipPlan = require('../models/MembershipPlan');
const asyncHandler = require('../utils/asyncHandler');
const { updateExpiredMemberships } = require('../utils/membershipUtils');

const createMembershipSchema = Joi.object({
  planId: Joi.string().required(),
});

const createMembership = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const memberId = req.user.userId;

  // Auto-expire outdated active memberships for this member
  await updateExpiredMemberships({ memberId });

  // Check if member currently has an active membership
  const existingActive = await Membership.findOne({
    memberId,
    status: 'active',
    endDate: { $gt: new Date() },
  });

  if (existingActive) {
    return res.status(409).json({
      success: false,
      message: 'Member already has an active membership',
      errorCode: 'ACTIVE_MEMBERSHIP_EXISTS',
    });
  }

  // Find plan
  if (!mongoose.Types.ObjectId.isValid(planId)) {
    return res.status(404).json({
      success: false,
      message: 'Membership plan not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const plan = await MembershipPlan.findById(planId);
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Membership plan not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + plan.durationMonths);

  const membership = await Membership.create({
    memberId,
    planId: plan._id,
    startDate,
    endDate,
    status: 'active',
  });

  const populated = await Membership.findById(membership._id).populate('planId', 'name durationMonths price');

  return res.status(201).json({
    success: true,
    message: 'Membership purchased successfully',
    data: populated,
  });
});

const getMyMemberships = asyncHandler(async (req, res) => {
  const memberId = req.user.userId;

  // Auto-expire outdated active memberships
  await updateExpiredMemberships({ memberId });

  const memberships = await Membership.find({ memberId })
    .populate('planId', 'name durationMonths price')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: memberships,
  });
});

const getAllMemberships = asyncHandler(async (req, res) => {
  await updateExpiredMemberships();

  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const memberships = await Membership.find(filter)
    .populate('memberId', 'name email role')
    .populate('planId', 'name durationMonths price')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: memberships,
  });
});

const cancelMembership = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Membership not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const membership = await Membership.findById(id);
  if (!membership) {
    return res.status(404).json({
      success: false,
      message: 'Membership not found',
      errorCode: 'NOT_FOUND',
    });
  }

  // Check permission: member (own record only) or admin
  if (req.user.role !== 'admin' && membership.memberId.toString() !== req.user.userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Cannot cancel another member\'s membership',
      errorCode: 'FORBIDDEN',
    });
  }

  membership.status = 'cancelled';
  await membership.save();

  return res.status(200).json({
    success: true,
    message: 'Membership cancelled successfully',
    data: membership,
  });
});

module.exports = {
  createMembershipSchema,
  createMembership,
  getMyMemberships,
  getAllMemberships,
  cancelMembership,
};
