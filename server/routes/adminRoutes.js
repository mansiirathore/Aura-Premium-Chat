const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsersList,
  toggleBanUser,
  moderateMessage,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.get('/stats', protect, admin, getStats);
router.get('/users', protect, admin, getUsersList);
router.put('/users/:id/ban', protect, admin, toggleBanUser);
router.delete('/messages/:id', protect, admin, moderateMessage);

module.exports = router;
