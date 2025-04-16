const express = require('express');
const {
  getPredefinedMessages,
  sendMessage,
  getGameMessages
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/predefined', getPredefinedMessages);
router.post('/games/:gameId', protect, sendMessage);
router.get('/games/:gameId', protect, getGameMessages);

module.exports = router;
