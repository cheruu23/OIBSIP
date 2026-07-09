import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart, calculatePizzaPrice } from '../context/CartContext';
import './Dashboard.css';

// Preset menu pizzas seeded via scripts/seedInventory — matched to Pizza model
const PRESET_PIZZAS = [
    {
        id: 'margherita',
        name: 'Margherita',
        description: 'A classic. Tomato marinara, fresh mozzarella, basil.',
        base: 'Thin Crust',
        sauce: 'Tomato Marinara',
        cheese: 'Mozzarella',
        vegetables: [],
        emoji: '🍕',
        tag: 'Classic'
    },
    {
        id: 'bbq-crunch',
        name: 'BBQ Crunch',
        description: 'Smoky barbecue sauce, cheddar, caramelised onions & peppers.',
        base: 'Thick Crust',
        sauce: 'Barbecue',
        cheese: 'Cheddar',
        vegetables: ['Onions', 'Bell Peppers'],
        emoji: '🔥',
        tag: 'Popular'
    },
    {
        id: 'veggie-fiesta',
        name: 'Veggie Fiesta',
        description: 'White garlic sauce, gouda, loaded with fresh garden veggies.',
        base: 'Whole Wheat',
        sauce: 'White Garlic',
        cheese: 'Gouda',
        vegetables: ['Mushrooms', 'Spinach', 'Tomatoes', 'Black Olives'],
        emoji: '🥗',
        tag: 'Healthy'
    },
    {
        id: 'pesto-dream',
        name: 'Pesto Dream',
        description: 'Basil pesto, parmesan, mushrooms, and sweet corn.',
        base: 'Thin Crust',
        sauce: 'Pesto',
        cheese: 'Parmesan',
        vegetables: ['Mushrooms', 'Corn'],
        emoji: '🌿',
        tag: 'Chef\'s Pick'
    },
    {
        id: 'spicy-arrabbiata',
        name: 'Spicy Volcano',
        description: 'Fiery arrabbiata, mozzarella, jalapeños, and onions. Not for the faint-hearted!',
        base: 'Cheese Burst',
        sauce: 'Spicy Arrabbiata',
        cheese: 'Mozzarella',
        vegetables: ['Jalapeños', 'Onions'],
        emoji: '🌋',
        tag: 'Spicy'
    },
    {
        id: 'vegan-delight',
        name: 'Vegan Delight',
        description: 'Plant-based cheese on a gluten-free base with a rainbow of veggies.',
        base: 'Gluten Free',
        sauce: 'Tomato Marinara',
        cheese: 'Vegan Cheese',
        vegetables: ['Bell Peppers', 'Spinach', 'Black Olives', 'Mushrooms'],
        emoji: '🌱',
        tag: 'Vegan'
    }
];

const TAG_COLORS = {
    'Classic':      { color: '#2c7a7b', bg: '#e6fffa' },
    'Popular':      { color: '#c05621', bg: '#fffaf0' },
    'Healthy':      { color: '#276749', bg: '#f0fff4' },
    "Chef's Pick":  { color: '#553c9a', bg: '#faf5ff' },
    'Spicy':        { color: '#c53030', bg: '#fff5f5' },
    'Vegan':        { color: '#2f855a', bg: '#f0fff4' }
};

export default function Dashboard() {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [menuPizzas, setMenuPizzas] = useState(PRESET_PIZZAS);
    const [loadingMenu, setLoadingMenu] = useState(true);

    // Try to fetch actual pre-made pizzas from DB; fall back to hardcoded presets
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const { data } = await api.get('/pizzas/menu');
                if (data && data.length > 0) {
                    setMenuPizzas(data.map(p => ({
                        id: p._id,
                        name: p.name,
                        description: `${p.base} crust · ${p.sauce} · ${p.cheese}${p.vegetables?.length ? ' · ' + p.vegetables.join(', ') : ''}`,
                        base: p.base,
                        sauce: p.sauce,
                        cheese: p.cheese,
                        vegetables: p.vegetables || [],
                        emoji: '🍕',
                        tag: 'Menu'
                    })));
                }
                // If DB returns empty, keep PRESET_PIZZAS (they always show something)
            } catch {
                // Silently keep presets — pizza menu is display-only, not critical
            } finally {
                setLoadingMenu(false);
            }
        };
        fetchMenu();
    }, []);

    const handleQuickOrder = (pizza) => {
        const pizzaForCart = {
            name: pizza.name,
            base: pizza.base,
            sauce: pizza.sauce,
            cheese: pizza.cheese,
            vegetables: pizza.vegetables || []
        };
        addToCart(pizzaForCart);
        toast.success(`${pizza.name} added to cart! 🍕`);
    };

    const getPizzaPrice = (pizza) => calculatePizzaPrice({
        base: pizza.base,
        sauce: pizza.sauce,
        cheese: pizza.cheese,
        vegetables: pizza.vegetables || []
    });

    return (
        <div className="dashboard-page">
            {/* Hero */}
            <section className="hero">
                <div className="hero-content">
                    <h1>
                        <span className="hero-emoji">🍕</span>
                        Welcome back,{' '}
                        <span className="hero-name">{user?.name?.split(' ')[0] || 'there'}</span>!
                    </h1>
                    <p className="hero-sub">
                        Ready to build your perfect pizza? Pick from our favourites or go fully custom — your choice.
                    </p>
                    <div className="hero-actions">
                        <Link to="/build" className="btn-hero-primary">
                            🛠️ Build Custom Pizza
                        </Link>
                        <a href="#menu" className="btn-hero-secondary">
                            Browse Menu ↓
                        </a>
                    </div>
                </div>
                <div className="hero-visual" aria-hidden="true">
                    <div className="pizza-spin">🍕</div>
                </div>
            </section>

            {/* How it works */}
            <section className="how-it-works">
                <h2>How it works</h2>
                <div className="steps-row">
                    {[
                        { icon: '🛠️', title: 'Build', desc: 'Choose base, sauce, cheese & veggies in 4 easy steps' },
                        { icon: '🛒', title: 'Cart',  desc: 'Review your order before paying — add multiple pizzas' },
                        { icon: '💳', title: 'Pay',   desc: 'Secure Razorpay checkout in test mode — instant confirmation' },
                        { icon: '📦', title: 'Track', desc: 'Follow your order from kitchen to doorstep in real time' }
                    ].map(({ icon, title, desc }) => (
                        <div className="how-step" key={title}>
                            <span className="how-icon">{icon}</span>
                            <strong>{title}</strong>
                            <p>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Menu */}
            <section className="menu-section" id="menu">
                <div className="menu-header">
                    <h2>Our Menu</h2>
                    <p>Order a favourite as-is, or head to the builder to make it yours.</p>
                </div>

                {loadingMenu ? (
                    <div className="menu-loading">
                        <div className="loading-spinner" />
                    </div>
                ) : (
                    <div className="menu-grid">
                        {menuPizzas.map(pizza => {
                            const tagStyle = TAG_COLORS[pizza.tag] || { color: '#555', bg: '#f5f5f5' };
                            const price = getPizzaPrice(pizza);
                            return (
                                <div className="menu-card" key={pizza.id}>
                                    <div className="menu-card-top">
                                        <span className="menu-emoji" role="img" aria-label={pizza.name}>
                                            {pizza.emoji}
                                        </span>
                                        <span
                                            className="menu-tag"
                                            style={{ color: tagStyle.color, background: tagStyle.bg }}
                                        >
                                            {pizza.tag}
                                        </span>
                                    </div>

                                    <h3 className="menu-name">{pizza.name}</h3>
                                    <p className="menu-desc">{pizza.description}</p>

                                    {/* Ingredient pills */}
                                    <div className="menu-ingredients">
                                        <span>🍞 {pizza.base}</span>
                                        <span>🍅 {pizza.sauce}</span>
                                        <span>🧀 {pizza.cheese}</span>
                                        {pizza.vegetables?.slice(0, 3).map(v => (
                                            <span key={v}>🥦 {v}</span>
                                        ))}
                                        {pizza.vegetables?.length > 3 && (
                                            <span className="more-tag">+{pizza.vegetables.length - 3} more</span>
                                        )}
                                    </div>

                                    <div className="menu-card-footer">
                                        <span className="menu-price">₹{price}</span>
                                        <div className="menu-card-actions">
                                            <button
                                                className="btn-quick-order"
                                                onClick={() => handleQuickOrder(pizza)}
                                            >
                                                Add to Cart
                                            </button>
                                            <Link
                                                to="/build"
                                                className="btn-customize"
                                                title="Customize this pizza"
                                            >
                                                Customize
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="menu-cta">
                    <p>Don't see what you want?</p>
                    <Link to="/build" className="btn-hero-primary">
                        🛠️ Build Your Own
                    </Link>
                </div>
            </section>
        </div>
    );
}
