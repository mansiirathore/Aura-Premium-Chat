const express = require('express');
const router = express.Router();
const { accessChat, fetchChats, deleteChat, fetchChatRequests, acceptChat, declineChat } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);
router.delete('/', protect, deleteChat);
router.get('/requests', protect, fetchChatRequests);
router.put('/accept', protect, acceptChat);
router.put('/decline', protect, declineChat);

module.exports = router;
