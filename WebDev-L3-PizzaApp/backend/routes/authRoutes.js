// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    registerUser,
    verifyEmail,
    loginUser,
    adminLogin,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

router.post('/register', registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);
router.post('/admin-login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
