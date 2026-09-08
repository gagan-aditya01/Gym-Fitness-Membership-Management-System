const Joi = require('joi');
const mongoose = require('mongoose');
const WorkoutNote = require('../models/WorkoutNote');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// ─── Joi validation schemas ───────────────────────────────────────────────────

const createNoteSchema = Joi.object({
  memberId: Joi.string().required(),
  note: Joi.string().min(1).required(),
});

const updateNoteSchema = Joi.object({
  note: Joi.string().min(1).required(),
});

// ─── POST /api/workout-notes ──────────────────────────────────────────────────

const createNote = asyncHandler(async (req, res) => {
  const trainerId = req.user.userId;
  const { memberId, note } = req.body;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid memberId',
      errorCode: 'VALIDATION_ERROR',
    });
  }

  // Validate that the referenced user exists and has the "member" role
  const member = await User.findById(memberId).select('role name');
  if (!member || member.role !== 'member') {
    return res.status(400).json({
      success: false,
      message: 'The specified user does not exist or is not a member',
      errorCode: 'INVALID_MEMBER',
    });
  }

  const workoutNote = await WorkoutNote.create({ memberId, trainerId, note });

  const populated = await WorkoutNote.findById(workoutNote._id)
    .populate('trainerId', 'name email')
    .populate('memberId', 'name email');

  return res.status(201).json({
    success: true,
    message: 'Workout note created successfully',
    data: populated,
  });
});

// ─── GET /api/workout-notes/me ────────────────────────────────────────────────
const getMyNotes = asyncHandler(async (req, res) => {
  const memberId = req.user.userId;
  const requesterRole = req.user.role;

  let query = {};
  if (requesterRole === 'trainer') {
    query = { trainerId: memberId };
  } else if (requesterRole === 'member') {
    query = { memberId };
  }

  const notes = await WorkoutNote.find(query)
    .populate('trainerId', 'name email')
    .populate('memberId', 'name email')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: notes,
  });
});

// ─── GET /api/workout-notes/member/:memberId ──────────────────────────────────

const getNotesByMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const requesterId = req.user.userId;
  const requesterRole = req.user.role;

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    return res.status(404).json({
      success: false,
      message: 'Member not found',
      errorCode: 'NOT_FOUND',
    });
  }

  // Access control:
  //   - admin: always allowed
  //   - member: only their own notes
  //   - trainer: only notes they wrote for that member
  if (requesterRole === 'member' && requesterId !== memberId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only view your own workout notes',
      errorCode: 'FORBIDDEN',
    });
  }

  const query = { memberId };

  // Trainers can only see notes they authored
  if (requesterRole === 'trainer') {
    query.trainerId = requesterId;
  }

  const notes = await WorkoutNote.find(query)
    .populate('trainerId', 'name email')
    .populate('memberId', 'name email')
    .sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: notes,
  });
});

// ─── PUT /api/workout-notes/:id ───────────────────────────────────────────────

const updateNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trainerId = req.user.userId;
  const { note } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Workout note not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const workoutNote = await WorkoutNote.findById(id);
  if (!workoutNote) {
    return res.status(404).json({
      success: false,
      message: 'Workout note not found',
      errorCode: 'NOT_FOUND',
    });
  }

  // Only the trainer who authored the note may update it
  if (workoutNote.trainerId.toString() !== trainerId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only edit your own workout notes',
      errorCode: 'FORBIDDEN',
    });
  }

  workoutNote.note = note;
  await workoutNote.save();

  const populated = await WorkoutNote.findById(workoutNote._id)
    .populate('trainerId', 'name email')
    .populate('memberId', 'name email');

  return res.status(200).json({
    success: true,
    message: 'Workout note updated successfully',
    data: populated,
  });
});

// ─── DELETE /api/workout-notes/:id ───────────────────────────────────────────

const deleteNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user.userId;
  const requesterRole = req.user.role;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Workout note not found',
      errorCode: 'NOT_FOUND',
    });
  }

  const workoutNote = await WorkoutNote.findById(id);
  if (!workoutNote) {
    return res.status(404).json({
      success: false,
      message: 'Workout note not found',
      errorCode: 'NOT_FOUND',
    });
  }

  // Trainer: only their own note. Admin: any note.
  if (requesterRole === 'trainer' && workoutNote.trainerId.toString() !== requesterId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only delete your own workout notes',
      errorCode: 'FORBIDDEN',
    });
  }

  await workoutNote.deleteOne();

  return res.status(200).json({
    success: true,
    message: 'Workout note deleted successfully',
  });
});

module.exports = {
  createNoteSchema,
  updateNoteSchema,
  createNote,
  getMyNotes,
  getNotesByMember,
  updateNote,
  deleteNote,
};
