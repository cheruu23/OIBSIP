// backend/routes/pizzaRoutes.js
const express = require('express');
const router = express.Router();
const { getPizzaIngredients, getStandardMenu } = require('../controllers/pizzaController');
const { protect } = require('../middleware/authMiddleware');

// Public routes for user discovery and step-by-step wizard setups
router.get('/ingredients', getPizzaIngredients);
router.get('/menu', getStandardMenu);

module.exports = router;