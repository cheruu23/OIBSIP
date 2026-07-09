// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { initializeCheckout, verifyAndPlaceOrder, getUserOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/checkout', protect, initializeCheckout);
router.post('/verify', protect, verifyAndPlaceOrder);
router.get('/my-orders', protect, getUserOrders);

module.exports = router;