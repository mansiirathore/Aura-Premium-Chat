const express = require('express');
const router = express.Router();
const {
  createGroupChat,
  addToGroup,
  removeFromGroup,
  renameGroup,
  leaveOrDeleteGroup,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createGroupChat);
router.put('/add-member', protect, addToGroup);
router.put('/remove-member', protect, removeFromGroup);
router.put('/name', protect, renameGroup);
router.delete('/', protect, leaveOrDeleteGroup);

module.exports = router;
