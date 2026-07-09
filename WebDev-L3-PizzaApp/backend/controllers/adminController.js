// backend/controllers/adminController.js
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');

// @desc    Get complete inventory list for admin dashboard
// @route   GET /api/admin/inventory
const getFullInventory = async (req, res) => {
    try {
        const stock = await Inventory.find({});
        res.status(200).json(stock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Manually update inventory item quantity
// @route   PUT /api/admin/inventory/:id
const updateInventoryItem = async (req, res) => {
    const { quantity } = req.body;

    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        item.quantity = quantity;
        await item.save();

        res.status(200).json({ message: 'Stock updated cleanly', item });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all active store orders across all users
// @route   GET /api/admin/orders
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order workflow execution status
// @route   PUT /api/admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
    const { orderStatus } = req.body; // e.g., 'In Kitchen' or 'Sent to Delivery'

    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order reference not found' });
        }

        order.orderStatus = orderStatus;
        await order.save();

        res.status(200).json({ message: 'Order tracking advanced successfully', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getFullInventory, updateInventoryItem, getAllOrders, updateOrderStatus };