import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import './MyOrders.css';

const POLL_INTERVAL_MS = 15000;

const STATUSES = ['Order Received', 'In Kitchen', 'Sent to Delivery'];

const STATUS_CONFIG = {
    'Order Received':   { icon: '📋', color: '#d69e2e', bg: '#fffff0', border: '#f6e05e' },
    'In Kitchen':       { icon: '👨‍🍳', color: '#dd6b20', bg: '#fffaf0', border: '#fbd38d' },
    'Sent to Delivery': { icon: '🛵', color: '#38a169', bg: '#f0fff4', border: '#9ae6b4' }
};

const formatDate = (iso) =>
    new Date(iso).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

const hasActiveOrders = (orderList) =>
    orderList.some(o => o.orderStatus !== 'Sent to Delivery');

export default function MyOrders() {
    const [orders, setOrders]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(false);
    const [expandedId, setExpandedId]   = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isPolling, setIsPolling]     = useState(false);
    const intervalRef = useRef(null);
    const mountedRef  = useRef(true);

    const stopPolling = useCallback(() => {
        clearInterval(intervalRef.current);
        setIsPolling(false);
    }, []);

    const fetchOrders = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(false);
        try {
            const { data } = await api.get('/orders/my-orders');
            if (!mountedRef.current) return;
            setOrders(prev => {
                if (silent && prev.length > 0) {
                    data.forEach(newOrder => {
                        const old = prev.find(o => o._id === newOrder._id);
                        if (old && old.orderStatus !== newOrder.orderStatus) {
                            toast.success(
                                `Order #${newOrder._id.slice(-8).toUpperCase()} → ${newOrder.orderStatus}`,
                                { icon: '📦', duration: 5000 }
                            );
                        }
                    });
                }
                return data;
            });
            setLastUpdated(new Date());
            if (!silent && data.length > 0) {
                setExpandedId(prev => prev ?? data[0]._id);
            }
        } catch (err) {
            if (!mountedRef.current) return;
            if (!silent) setError(true);
            if (err.response?.status === 401) stopPolling();
        } finally {
            if (!mountedRef.current) return;
            if (!silent) setLoading(false);
        }
    }, [stopPolling]);

    const startPolling = useCallback(() => {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            fetchOrders(true);
        }, POLL_INTERVAL_MS);
        setIsPolling(true);
    }, [fetchOrders]);

    useEffect(() => {
        mountedRef.current = true;
        fetchOrders(false).then(() => {
            startPolling();
        });
        return () => {
            mountedRef.current = false;
            clearInterval(intervalRef.current);
        };
    }, [fetchOrders, startPolling]);

    // Stop polling when all orders delivered
    useEffect(() => {
        if (orders.length > 0 && !hasActiveOrders(orders)) {
            stopPolling();
        }
    }, [orders, stopPolling]);

    const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

    if (loading) {
        return (
            <div className="orders-page">
                <div className="orders-loading">
                    <div className="loading-spinner" />
                    <p>Loading your orders…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="orders-page">
                <div className="orders-empty">
                    <div className="empty-icon">⚠️</div>
                    <h2>Something went wrong</h2>
                    <p>We couldn't fetch your orders. Please try again.</p>
                    <button className="btn-retry" onClick={() => fetchOrders(false)}>Retry</button>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="orders-page">
                <div className="orders-empty">
                    <div className="empty-icon">🍕</div>
                    <h2>No orders yet</h2>
                    <p>Your order history will appear here once you place an order.</p>
                    <Link to="/build" className="btn-retry">Build a Pizza</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="orders-container">
                <div className="orders-header">
                    <div>
                        <h1>📦 My Orders</h1>
                        <p className="orders-subtitle">
                            {orders.length} order{orders.length > 1 ? 's' : ''} total
                        </p>
                    </div>
                    <div className="orders-header-right">
                        {isPolling && (
                            <span className="polling-badge" title="Auto-updating every 15 seconds">
                                <span className="pulse-dot" /> Live
                            </span>
                        )}
                        {lastUpdated && (
                            <span className="last-updated">
                                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <button
                            className="btn-refresh"
                            onClick={() => fetchOrders(false)}
                            aria-label="Refresh orders"
                        >
                            ↻ Refresh
                        </button>
                    </div>
                </div>

                <div className="orders-list">
                    {orders.map(order => {
                        const config = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['Order Received'];
                        const isExpanded = expandedId === order._id;
                        const currentStep = STATUSES.indexOf(order.orderStatus);

                        return (
                            <div key={order._id} className="order-card">
                                <div
                                    className="order-header"
                                    onClick={() => toggle(order._id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && toggle(order._id)}
                                    aria-expanded={isExpanded}
                                >
                                    <div className="order-meta">
                                        <span className="order-id">#{order._id.slice(-8).toUpperCase()}</span>
                                        <span className="order-date">{formatDate(order.createdAt)}</span>
                                        <span className="order-pizza-count">
                                            {order.pizzas.length} pizza{order.pizzas.length > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="order-right">
                                        <span
                                            className="order-status-badge"
                                            style={{ color: config.color, background: config.bg, borderColor: config.border }}
                                        >
                                            {config.icon} {order.orderStatus}
                                        </span>
                                        <strong className="order-amount">₹{order.totalAmount}</strong>
                                        <span className="expand-icon" aria-hidden="true">
                                            {isExpanded ? '▲' : '▼'}
                                        </span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="order-details">
                                        <div className="status-track" aria-label="Order progress">
                                            {STATUSES.map((s, i) => {
                                                const sc = STATUS_CONFIG[s];
                                                const isDone   = i <= currentStep;
                                                const isActive = i === currentStep;
                                                return (
                                                    <React.Fragment key={s}>
                                                        <div className={`track-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                                                            <div className="track-dot">{isDone ? '✓' : i + 1}</div>
                                                            <span className="track-label">{sc.icon} {s}</span>
                                                        </div>
                                                        {i < STATUSES.length - 1 && (
                                                            <div className={`track-connector ${i < currentStep ? 'done' : ''}`} />
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>

                                        <div className="pizza-list">
                                            <h4>What you ordered</h4>
                                            {order.pizzas.map((pizza, idx) => (
                                                <div key={idx} className="pizza-summary">
                                                    <span className="pizza-num">🍕 Pizza #{idx + 1}</span>
                                                    <div className="pizza-tags">
                                                        <span>🍞 {pizza.base}</span>
                                                        <span>🍅 {pizza.sauce}</span>
                                                        <span>🧀 {pizza.cheese}</span>
                                                        {pizza.vegetables?.length > 0
                                                            ? pizza.vegetables.map(v => <span key={v}>🥦 {v}</span>)
                                                            : <span className="tag-muted">No veggies</span>
                                                        }
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="order-footer">
                                            <span className={`payment-badge ${order.paymentStatus === 'Completed' ? 'paid' : 'pending'}`}>
                                                {order.paymentStatus === 'Completed' ? '✓ Paid' : order.paymentStatus}
                                            </span>
                                            <span className="order-id-full">Order ID: {order._id}</span>
                                            <Link to="/build" className="btn-reorder">+ Reorder</Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
