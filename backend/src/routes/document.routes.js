const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const verifyJWT = require('../middleware/authMiddleware');

router.get('/history', verifyJWT, documentController.getHistory);
router.post('/log', verifyJWT, documentController.logDocument);

module.exports = router;
