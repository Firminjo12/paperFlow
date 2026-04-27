const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyJWT = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.get('/me', verifyJWT, authController.getMe);
router.put('/profile', verifyJWT, authController.updateProfile);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
