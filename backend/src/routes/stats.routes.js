const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const verifyJWT = require('../middleware/authMiddleware');

router.get('/me', verifyJWT, statsController.getMyStats);
router.get('/global', verifyJWT, statsController.getGlobalStats);

module.exports = router;
