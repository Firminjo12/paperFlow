const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const verifyJWT = require('../middleware/authMiddleware');

router.get('/', reviewController.getReviews);
router.post('/', verifyJWT, reviewController.postReview);
router.get('/stats', reviewController.getStats);

module.exports = router;
