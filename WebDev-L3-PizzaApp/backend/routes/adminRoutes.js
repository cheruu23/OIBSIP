// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { getFullInventory, updateInventoryItem, getAllOrders, updateOrderStatus } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Force all routes in this file to pass through authentication and admin check gates
router.use(protect);
router.use(adminOnly);

router.get('/inventory', getFullInventory);
router.put('/inventory/:id', updateInventoryItem);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;