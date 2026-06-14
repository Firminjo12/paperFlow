const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const verifyJWT = require('../middleware/authMiddleware');

router.get('/', reviewController.getReviews);
router.post('/', verifyJWT, reviewController.postReview);
router.get('/stats', reviewController.getStats);

// Routes de modération réservées à l'admin
const adminMiddleware = require('../middleware/adminMiddleware');
router.patch('/:id/status', verifyJWT, adminMiddleware, reviewController.updateStatus);
router.delete('/:id', verifyJWT, adminMiddleware, reviewController.deleteReview);

module.exports = router;
