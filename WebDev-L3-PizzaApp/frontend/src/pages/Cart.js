import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import './Cart.css';

export default function Cart() {
    const { cartItems, removeFromCart, clearCart, totalAmount } = useCart();
    const navigate = useNavigate();
    const [paying, setPaying] = useState(false);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const existing = document.getElementById('razorpay-sdk');
            if (existing) { resolve(true); return; }
            const script = document.createElement('script');
            script.id = 'razorpay-sdk';
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        setPaying(true);

        try {
            const sdkLoaded = await loadRazorpayScript();
            if (!sdkLoaded) {
                toast.error('Payment gateway failed to load. Check your connection.');
                setPaying(false);
                return;
            }

            // Step 1: Create Razorpay order on backend — FIXED: capture the response
            const { data: razorpayOrder } = await api.post('/orders/checkout', { totalAmount });

            const user = JSON.parse(localStorage.getItem('pizzaUser') || 'null');

            // Step 2: Open Razorpay payment modal
            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'PizzaApp 🍕',
                description: `${cartItems.length} custom pizza${cartItems.length > 1 ? 's' : ''}`,
                order_id: razorpayOrder.id,
                handler: async (paymentResponse) => {
                    try {
                        // Step 3: Verify payment and place order
                        const pizzasPayload = cartItems.map(({ name, base, sauce, cheese, vegetables }) => ({
                            name, base, sauce, cheese, vegetables: vegetables || []
                        }));

                        await api.post('/orders/verify', {
                            pizzas: pizzasPayload,
                            totalAmount,
                            razorpayOrderId: paymentResponse.razorpay_order_id,
                            razorpayPaymentId: paymentResponse.razorpay_payment_id
                        });

                        clearCart();
                        toast.success('Order placed successfully! 🎉');
                        navigate('/my-orders');
                    } catch (err) {
                        toast.error(err.response?.data?.message || 'Order confirmation failed. Contact support.');
                        setPaying(false);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || ''
                },
                theme: { color: '#e53e3e' },
                modal: {
                    ondismiss: () => {
                        setPaying(false);
                        toast('Payment cancelled', { icon: 'ℹ️' });
                    }
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', (response) => {
                toast.error(`Payment failed: ${response.error.description}`);
                setPaying(false);
            });

            rzp.open();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to initiate checkout');
            setPaying(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="cart-page">
                <div className="cart-empty">
                    <div className="empty-icon">🍕</div>
                    <h2>Your cart is empty</h2>
                    <p>Build your perfect pizza and add it here!</p>
                    <Link to="/build" className="btn-build">Start Building</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="cart-container">
                <h1>🛒 Your Cart</h1>
                <p className="cart-subtitle">
                    {cartItems.length} pizza{cartItems.length > 1 ? 's' : ''} ready to order
                </p>

                <div className="cart-items">
                    {cartItems.map((item, index) => (
                        <div key={item.cartId} className="cart-item">
                            <div className="cart-item-header">
                                <span className="cart-item-num">🍕 Pizza #{index + 1}</span>
                                <span className="cart-item-price">₹{item.price}</span>
                            </div>
                            <div className="cart-item-details">
                                <span>🍞 {item.base}</span>
                                <span>🍅 {item.sauce}</span>
                                <span>🧀 {item.cheese}</span>
                                {item.vegetables?.length > 0
                                    ? item.vegetables.map(v => (
                                        <span key={v}>🥦 {v}</span>
                                    ))
                                    : <span className="no-veggies">No veggies</span>
                                }
                            </div>
                            <button
                                className="cart-remove"
                                onClick={() => removeFromCart(item.cartId)}
                                aria-label={`Remove pizza ${index + 1}`}
                                disabled={paying}
                            >
                                ✕ Remove
                            </button>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <div className="summary-row">
                        <span>Subtotal ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})</span>
                        <strong>₹{totalAmount}</strong>
                    </div>
                    <div className="summary-row delivery">
                        <span>Delivery</span>
                        <strong className="free">🎉 FREE</strong>
                    </div>
                    <div className="summary-row taxes">
                        <span>Taxes & Fees</span>
                        <strong className="included">Included</strong>
                    </div>
                    <div className="summary-total">
                        <span>Total</span>
                        <strong>₹{totalAmount}</strong>
                    </div>
                </div>

                <div className="cart-note">
                    <span>🔒 Secure payment via Razorpay</span>
                </div>

                <div className="cart-actions">
                    <Link to="/build" className="btn-add-more" tabIndex={paying ? -1 : 0}>
                        + Add More
                    </Link>
                    <button
                        className="btn-checkout"
                        onClick={handleCheckout}
                        disabled={paying}
                    >
                        {paying
                            ? <><span className="spinner" /> Processing…</>
                            : `Pay ₹${totalAmount}`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
