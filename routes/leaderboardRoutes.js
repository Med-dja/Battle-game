const express = require('express');
const {
  getGlobalLeaderboard,
  getWeeklyLeaderboard,
  getDailyLeaderboard,
  getPlayerHistory
} = require('../controllers/leaderboardController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/global', getGlobalLeaderboard);
router.get('/weekly', getWeeklyLeaderboard);
router.get('/daily', getDailyLeaderboard);
router.get('/history', protect, getPlayerHistory);

module.exports = router;
