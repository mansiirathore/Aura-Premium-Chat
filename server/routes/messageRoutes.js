const express = require('express');
const router = express.Router();
const {
  sendMessage,
  allMessages,
  editMessage,
  deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, upload.single('file'), sendMessage);
router.get('/:chatId', protect, allMessages);
router.put('/edit', protect, editMessage);
router.delete('/', protect, deleteMessage);

module.exports = router;
