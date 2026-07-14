import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

// Names must exactly match seedInventory.js itemName values
const PRICING = {
    base: {
        'Thin Crust':   0,
        'Thick Crust':  30,
        'Cheese Burst': 60,
        'Whole Wheat':  20,
        'Gluten Free':  40
    },
    sauce: {
        'Tomato Marinara':   0,
        'Pesto':             20,
        'Barbecue':          30,
        'White Garlic':      20,
        'Spicy Arrabbiata':  25
    },
    cheese: {
        'Mozzarella':  0,
        'Cheddar':     30,
        'Parmesan':    40,
        'Gouda':       35,
        'Vegan Cheese': 50
    },
    veggie: { perItem: 15 }
};

export const calculatePizzaPrice = (pizza) => {
    let price = 250; // base price
    price += PRICING.base[pizza.base]   || 0;
    price += PRICING.sauce[pizza.sauce] || 0;
    price += PRICING.cheese[pizza.cheese] || 0;
    price += (pizza.vegetables?.length || 0) * PRICING.veggie.perItem;
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
