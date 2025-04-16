const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  requestPasswordReset,
  resetPassword,
  logoutUser
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);
router.post('/logout', protect, logoutUser);

module.exports = router;
