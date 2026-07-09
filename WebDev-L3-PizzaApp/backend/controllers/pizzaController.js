// backend/controllers/pizzaController.js
const Inventory = require('../models/Inventory');
const Pizza = require('../models/Pizza');

// @desc    Get all available pizza components grouped by category for the step-by-step wizard
// @route   GET /api/pizzas/ingredients
const getPizzaIngredients = async (req, res) => {
    try {
        // Find items that have a quantity greater than zero
        const availableStock = await Inventory.find({ quantity: { $gt: 0 } });

        // Organize into structured categories for the step-by-step UI builder
        const configurationWizard = {
            bases: availableStock.filter(item => item.category === 'base'),
            sauces: availableStock.filter(item => item.category === 'sauce'),
            cheeses: availableStock.filter(item => item.category === 'cheese'),
            vegetables: availableStock.filter(item => item.category === 'veggie')
        };

        res.status(200).json(configurationWizard);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving configuration items', error: error.message });
    }
};

// @desc    Get standard pre-made menu pizza varieties
// @route   GET /api/pizzas/menu
const getStandardMenu = async (req, res) => {
    try {
        const standardPizzas = await Pizza.find({ isCustom: false });
        res.status(200).json(standardPizzas);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving menu items', error: error.message });
    }
};

module.exports = { getPizzaIngredients, getStandardMenu };