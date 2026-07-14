// backend/scripts/seedInventory.js
// Run with: node scripts/seedInventory.js
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');

const inventoryItems = [
    // Bases (5 options)
    { itemName: 'Thin Crust', category: 'base', quantity: 100, minThreshold: 20 },
    { itemName: 'Thick Crust', category: 'base', quantity: 100, minThreshold: 20 },
    { itemName: 'Cheese Burst', category: 'base', quantity: 100, minThreshold: 20 },
    { itemName: 'Whole Wheat', category: 'base', quantity: 100, minThreshold: 20 },
    { itemName: 'Gluten Free', category: 'base', quantity: 100, minThreshold: 20 },

    // Sauces (5 options)
    { itemName: 'Tomato Marinara', category: 'sauce', quantity: 100, minThreshold: 20 },
    { itemName: 'Pesto', category: 'sauce', quantity: 100, minThreshold: 20 },
    { itemName: 'Barbecue', category: 'sauce', quantity: 100, minThreshold: 20 },
    { itemName: 'White Garlic', category: 'sauce', quantity: 100, minThreshold: 20 },
    { itemName: 'Spicy Arrabbiata', category: 'sauce', quantity: 100, minThreshold: 20 },

    // Cheeses
    { itemName: 'Mozzarella', category: 'cheese', quantity: 100, minThreshold: 20 },
    { itemName: 'Cheddar', category: 'cheese', quantity: 100, minThreshold: 20 },
    { itemName: 'Parmesan', category: 'cheese', quantity: 100, minThreshold: 20 },
    { itemName: 'Gouda', category: 'cheese', quantity: 100, minThreshold: 20 },
    { itemName: 'Vegan Cheese', category: 'cheese', quantity: 100, minThreshold: 20 },

    // Vegetables
    { itemName: 'Bell Peppers', category: 'veggie', quantity: 100, minThreshold: 20 },
    { itemName: 'Mushrooms', category: 'veggie', quantity: 100, minThreshold: 20 },
    { itemName: 'Black Olives', category: 'veggie', quantity: 100, minThreshold: 20 },
    { itemName: 'Onions', category: 'veggie', quantity: 100, minThreshold: 20 },
    { itemName: 'Tomatoes', category: 'veggie', quantity: 100, minThreshold: 20 },
    { itemName: 'Spinach', category: 'veggie', quantity: 100, minThreshold: 20 },
    { itemName: 'Corn', category: 'veggie', quantity: 100, minThreshold: 20 },
    { itemName: 'Jalapeños', category: 'veggie', quantity: 100, minThreshold: 20 },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Upsert each item (won't duplicate if run again)
        for (const item of inventoryItems) {
            await Inventory.findOneAndUpdate(
                { itemName: item.itemName },
                item,
                { upsert: true, returnDocument: 'after' }
            );
        }
        console.log('✅ Inventory seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
}

seed();
