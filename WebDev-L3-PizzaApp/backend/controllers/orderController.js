// backend/controllers/orderController.js
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');

// Initialize Razorpay client wrapper
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log('Razorpay KEY_ID loaded:', process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.slice(0,15) + '...' : 'MISSING');

// @desc    Step 1: Initialize an order session with Razorpay gateway
// @route   POST /api/orders/checkout
const initializeCheckout = async (req, res) => {
    const { totalAmount } = req.body; // Incoming raw price from client calculations

    try {
        const options = {
            amount: totalAmount * 100, // Razorpay processes values in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);
        res.status(201).json(razorpayOrder);
    } catch (error) {
        console.error('Razorpay error:', JSON.stringify(error));
        res.status(500).json({ 
            message: 'Razorpay session init failed', 
            error: error.message,
            detail: error.error || error.description || JSON.stringify(error)
        });
    }
};

// @desc    Step 2: Confirm successful transaction and deduct inventory stock
// @route   POST /api/orders/verify
const verifyAndPlaceOrder = async (req, res) => {
    const { pizzas, totalAmount, razorpayOrderId, razorpayPaymentId } = req.body;

    try {
        // 1. Create and save the order inside MongoDB
        const newOrder = await Order.create({
            user: req.user._id, // Set via protect middleware context
            pizzas,
            totalAmount,
            razorpayOrderId,
            razorpayPaymentId,
            paymentStatus: 'Completed' // Flagged as complete for test-mode success callbacks
        });

        // 2. Core Automation: Deduct raw items from the Inventory collection
        for (const pizza of pizzas) {
            const ingredientsToDeduct = [pizza.base, pizza.sauce, pizza.cheese, ...pizza.vegetables];

            for (const itemName of ingredientsToDeduct) {
                if (itemName) {
                    await Inventory.findOneAndUpdate(
                        { itemName: itemName },
                        { $inc: { quantity: -1 } } // Decrement existing quantity by exactly one unit per pizza item
                    );
                }
            }
        }

        res.status(201).json({ message: 'Order processed successfully!', order: newOrder });
    } catch (error) {
        res.status(500).json({ message: 'Error locking down transaction pipelines', error: error.message });
    }
};

// @desc    Get logged in user order tracking list
// @route   GET /api/orders/my-orders
const getUserOrders = async (req, res) => {
    try {
        const history = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { initializeCheckout, verifyAndPlaceOrder, getUserOrders };