const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletter.controller');
const verifyJWT = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { newsletterRules, bulkNewsletterRules } = require('../middleware/validate');

router.post('/subscribe', newsletterRules, newsletterController.subscribe);
router.post('/unsubscribe', newsletterRules, newsletterController.unsubscribe);

// Route protégée pour l'admin avec validation stricte
router.post('/send-bulk', verifyJWT, adminMiddleware, bulkNewsletterRules, newsletterController.sendBulk);

module.exports = router;
