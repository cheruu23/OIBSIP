// backend/models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    pizzas: [{
        name: { type: String, required: true },
        base: { type: String, required: true },
        sauce: { type: String, required: true },
        cheese: { type: String, required: true },
        vegetables: [{ type: String }],
        quantity: { type: Number, default: 1 }
    }],
    totalAmount: { type: Number, required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    paymentStatus: { 
        type: String, 
        enum: ['Pending', 'Completed', 'Failed'], 
        default: 'Pending' 
    },
    orderStatus: { 
        type: String, 
        enum: ['Order Received', 'In Kitchen', 'Sent to Delivery'], 
        default: 'Order Received' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);