const express = require('express');
const { checkUserPenalties, applyPenalty } = require('../controllers/penaltyController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/check', protect, checkUserPenalties);
router.post('/apply', protect, applyPenalty); // This would typically have admin middleware

module.exports = router;
