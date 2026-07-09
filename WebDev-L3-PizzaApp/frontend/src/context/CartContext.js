import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

// Price config mirrors what the Pizza model uses
const PRICING = {
    base: { 'Thin Crust': 0, 'Thick Crust': 30, 'Cheese Burst': 60, 'Whole Wheat': 20 },
    sauce: { 'Tomato': 0, 'Pesto': 20, 'White Sauce': 20, 'BBQ': 30 },
    cheese: { 'Mozzarella': 0, 'Cheddar': 30, 'Parmesan': 40, 'Vegan Cheese': 50 },
    veggie: { default: 15 } // per veggie topping
};

export const calculatePizzaPrice = (pizza) => {
    let price = 250; // base price
    price += PRICING.base[pizza.base] || 0;
    price += PRICING.sauce[pizza.sauce] || 0;
    price += PRICING.cheese[pizza.cheese] || 0;
    price += (pizza.vegetables?.length || 0) * (PRICING.veggie.default);
    return price;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (pizza) => {
        const price = calculatePizzaPrice(pizza);
        setCartItems(prev => [...prev, { ...pizza, price, cartId: Date.now() }]);
    };

    const removeFromCart = (cartId) => {
        setCartItems(prev => prev.filter(item => item.cartId !== cartId));
    };

    const clearCart = () => setCartItems([]);

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, totalAmount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
