const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createNoteSchema,
  updateNoteSchema,
  createNote,
  getMyNotes,
  getNotesByMember,
  updateNote,
  deleteNote,
} = require('../controllers/workoutNoteController');

router.use(verifyToken);

// Current user workout notes
router.get('/me', getMyNotes);

// Trainer: create a workout note for a member
router.post('/', requireRole('trainer'), validate(createNoteSchema), createNote);

// Member (own), Trainer (notes they wrote), Admin: get notes for a member
router.get('/member/:memberId', requireRole('member', 'trainer', 'admin'), getNotesByMember);

// Trainer: update own note
router.put('/:id', requireRole('trainer'), validate(updateNoteSchema), updateNote);

// Trainer (own) or Admin: delete a note
router.delete('/:id', requireRole('trainer', 'admin'), deleteNote);

module.exports = router;
