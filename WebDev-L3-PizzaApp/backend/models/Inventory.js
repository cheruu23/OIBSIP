// backend/models/Inventory.js
const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    itemName: { type: String, required: true, unique: true }, // e.g., "Thin Crust", "Mozzarella"
    category: { 
        type: String, 
        required: true, 
        enum: ['base', 'sauce', 'cheese', 'veggie'] 
    },
    quantity: { type: Number, required: true, default: 100 }, // Track total units
    minThreshold: { type: Number, default: 20 } // Threshold for automated cron alerts
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);