const express = require('express');
const router = express.Router();
const signatureController = require('../controllers/signature.controller');
const verifyJWT = require('../middleware/authMiddleware');

router.get('/', verifyJWT, signatureController.getSignatures);
router.post('/', verifyJWT, signatureController.createSignature);
router.delete('/:id', verifyJWT, signatureController.deleteSignature);

module.exports = router;
