import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useCart, calculatePizzaPrice } from '../context/CartContext';
import './PizzaBuilder.css';

const STEPS = ['Base', 'Sauce', 'Cheese', 'Veggies', 'Review'];

const STEP_KEYS  = ['bases', 'sauces', 'cheeses', 'vegetables'];
const STEP_FIELD = ['base', 'sauce', 'cheese', 'vegetables'];
const STEP_ICON  = ['🍞', '🍅', '🧀', '🥦'];
const STEP_HINT  = [
    'Choose your crust — this is the foundation of your pizza.',
    'Pick a sauce to spread across your base.',
    'Select the cheese that melts on top.',
    'Add veggies for extra flavour. You can choose multiple!'
];

const EMPTY_PIZZA = { name: 'Custom Pizza', base: '', sauce: '', cheese: '', vegetables: [] };

export default function PizzaBuilder() {
    const { addToCart, cartItems } = useCart();
    const navigate = useNavigate();

    const [ingredients, setIngredients] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [step, setStep] = useState(0);
    const [pizza, setPizza] = useState(EMPTY_PIZZA);
    const [added, setAdded] = useState(false); // guard against double-add

    const fetchIngredients = useCallback(async () => {
        setLoading(true);
        setFetchError(false);
        try {
            const { data } = await api.get('/pizzas/ingredients');
            setIngredients(data);
        } catch {
            setFetchError(true);
            toast.error('Failed to load ingredients. Check your connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchIngredients(); }, [fetchIngredients]);

    const resetPizza = () => {
        setPizza(EMPTY_PIZZA);
        setStep(0);
        setAdded(false);
    };

    const selectSingle = (field, value) =>
        setPizza(prev => ({ ...prev, [field]: value }));

    const toggleVeggie = (name) =>
        setPizza(prev => ({
            ...prev,
            vegetables: prev.vegetables.includes(name)
                ? prev.vegetables.filter(v => v !== name)
                : [...prev.vegetables, name]
        }));

    const canNext = () => {
        if (step === 0) return !!pizza.base;
        if (step === 1) return !!pizza.sauce;
        if (step === 2) return !!pizza.cheese;
        return true;
    };

    const handleAddToCart = () => {
        if (added) return;
        setAdded(true);
        addToCart(pizza);
        toast.success('Pizza added to cart! 🍕');
        resetPizza();
    };

    const handleGoToCart = () => {
        if (added) { navigate('/cart'); return; }
        setAdded(true);
        addToCart(pizza);
        navigate('/cart');
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="builder-page">
                <div className="builder-loading">
                    <div className="loading-spinner" />
                    <p>Loading ingredients…</p>
                </div>
            </div>
        );
    }

    /* ── Error ── */
    if (fetchError) {
        return (
            <div className="builder-page">
                <div className="builder-loading">
                    <p>⚠️ Failed to load ingredients.</p>
                    <button className="nav-btn next" onClick={fetchIngredients} style={{ marginTop: '1rem' }}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const currentItems = step < 4 ? (ingredients?.[STEP_KEYS[step]] || []) : [];
    const previewPrice = calculatePizzaPrice(pizza);

    return (
        <div className="builder-page">
            <div className="builder-container">
                <div className="builder-top">
                    <div>
                        <h1>🍕 Build Your Pizza</h1>
                        <p className="builder-subtitle">Customize every layer, your way</p>
                    </div>
                    {cartItems.length > 0 && (
                        <button
                            className="cart-pill"
                            onClick={() => navigate('/cart')}
                            aria-label="View cart"
                        >
                            🛒 {cartItems.length} in cart
                        </button>
                    )}
                </div>

                {/* Step indicator */}
                <div className="step-indicator" role="tablist" aria-label="Build steps">
                    {STEPS.map((label, i) => (
                        <button
                            key={label}
                            role="tab"
                            aria-selected={step === i}
                            className={`step-dot ${step === i ? 'active' : ''} ${i < step ? 'done' : ''}`}
                            onClick={() => i < step && setStep(i)}
                            disabled={i > step}
                            aria-label={`Step ${i + 1}: ${label}`}
                        >
                            <span className="step-num">{i < step ? '✓' : i + 1}</span>
                            <span className="step-label">{label}</span>
                        </button>
                    ))}
                </div>

                {/* Step content */}
                <div className="builder-card">
                    {step < 4 && (
                        <>
                            <div className="step-header">
                                <h2 className="step-title">
                                    {STEP_ICON[step]}{' '}
                                    {step === 0 && 'Choose your base'}
                                    {step === 1 && 'Pick a sauce'}
                                    {step === 2 && 'Select your cheese'}
                                    {step === 3 && 'Add veggies (optional)'}
                                </h2>
                                <p className="step-hint">{STEP_HINT[step]}</p>
                            </div>

                            {currentItems.length === 0 ? (
                                <div className="empty-ingredients">
                                    <span>😔</span>
                                    <p>No {STEPS[step].toLowerCase()} options in stock right now.</p>
                                </div>
                            ) : (
                                <div className="options-grid">
                                    {currentItems.map(item => {
                                        const isSelected = step === 3
                                            ? pizza.vegetables.includes(item.itemName)
                                            : pizza[STEP_FIELD[step]] === item.itemName;
                                        const isLow = item.quantity <= item.minThreshold;

                                        return (
                                            <button
                                                key={item._id}
                                                className={`option-card ${isSelected ? 'selected' : ''}`}
                                                onClick={() =>
                                                    step === 3
                                                        ? toggleVeggie(item.itemName)
                                                        : selectSingle(STEP_FIELD[step], item.itemName)
                                                }
                                                aria-pressed={isSelected}
                                            >
                                                <span className="option-icon">{STEP_ICON[step]}</span>
                                                <span className="option-name">{item.itemName}</span>
                                                {isLow && (
                                                    <span className="low-stock-tag" title="Low in stock">
                                                        Low
                                                    </span>
                                                )}
                                                {isSelected && (
                                                    <span className="option-check" aria-hidden="true">✓</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* Review step */}
                    {step === 4 && (
                        <div className="review-section">
                            <h2 className="step-title">✅ Review your pizza</h2>
                            <p className="step-hint">Looks good? Add to cart or go back to edit.</p>

                            <div className="review-pizza">
                                {[
                                    { label: 'Base',   icon: '🍞', value: pizza.base },
                                    { label: 'Sauce',  icon: '🍅', value: pizza.sauce },
                                    { label: 'Cheese', icon: '🧀', value: pizza.cheese },
                                    {
                                        label: 'Veggies', icon: '🥦',
                                        value: pizza.vegetables.length > 0
                                            ? pizza.vegetables.join(', ')
                                            : 'None'
                                    }
                                ].map(({ label, icon, value }) => (
                                    <div className="review-row" key={label}>
                                        <span>{icon} {label}</span>
                                        <strong className={value === 'None' ? 'muted' : ''}>{value}</strong>
                                    </div>
                                ))}
                                <div className="review-row price-row">
                                    <span>💰 Price</span>
                                    <strong className="price">₹{previewPrice}</strong>
                                </div>
                            </div>

                            <div className="review-actions">
                                <button className="btn-secondary" onClick={handleAddToCart}>
                                    Add to Cart & Build Another
                                </button>
                                <button className="btn-primary-large" onClick={handleGoToCart}>
                                    Add to Cart & Checkout →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="builder-nav">
                    <button
                        className="nav-btn back"
                        onClick={() => step === 0 ? null : setStep(s => s - 1)}
                        disabled={step === 0}
                    >
                        ← Back
                    </button>

                    <span className="price-preview">₹{previewPrice}</span>

                    {step < 4 ? (
                        <button
                            className="nav-btn next"
                            onClick={() => setStep(s => s + 1)}
                            disabled={!canNext()}
                        >
                            {step === 3 ? 'Review →' : 'Next →'}
                        </button>
                    ) : (
                        /* on review step, the back btn is shown but "next" area is empty */
                        <span />
                    )}
                </div>
            </div>
        </div>
    );
}
