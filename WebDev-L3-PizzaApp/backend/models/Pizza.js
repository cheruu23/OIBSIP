// backend/models/Pizza.js
const mongoose = require('mongoose');

const PizzaSchema = new mongoose.Schema({
    name: { type: String, default: 'Custom Pizza' },
    isCustom: { type: Boolean, default: true },
    base: { 
        type: String, 
        required: [true, 'Please select a pizza base'] 
    },
    sauce: { 
        type: String, 
        required: [true, 'Please select a pizza sauce'] 
    },
    cheese: { 
        type: String, 
        required: [true, 'Please select a cheese type'] 
    },
    vegetables: [{ 
        type: String // Multiple selections allowed
    }],
    price: { type: Number, required: true, default: 250 } // Base price + extra ingredients cost calculation
}, { timestamps: true });

module.exports = mongoose.model('Pizza', PizzaSchema);