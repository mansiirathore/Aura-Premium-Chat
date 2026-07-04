const express = require('express');
const router = express.Router();
const { accessChat, fetchChats, deleteChat } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);
router.delete('/', protect, deleteChat);

module.exports = router;
