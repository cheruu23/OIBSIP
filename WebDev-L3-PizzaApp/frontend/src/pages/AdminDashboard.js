import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import './AdminDashboard.css';

const ORDER_STATUSES = ['Order Received', 'In Kitchen', 'Sent to Delivery'];

const STATUS_COLORS = {
    'Order Received':   { color: '#d69e2e', bg: '#fffff0', border: '#f6e05e' },
    'In Kitchen':       { color: '#dd6b20', bg: '#fffaf0', border: '#fbd38d' },
    'Sent to Delivery': { color: '#38a169', bg: '#f0fff4', border: '#9ae6b4' }
};

const formatDate = (iso) =>
    new Date(iso).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderModal({ order, onClose }) {
    if (!order) return null;
    const sc = STATUS_COLORS[order.orderStatus] || STATUS_COLORS['Order Received'];

    return (
        <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Order details">
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Order #{order._id.slice(-8).toUpperCase()}</h2>
                    <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="modal-body">
                    <div className="modal-meta">
                        <div className="modal-meta-row">
                            <span>Customer</span>
                            <strong>{order.user?.name || 'N/A'}</strong>
                        </div>
                        <div className="modal-meta-row">
                            <span>Email</span>
                            <strong>{order.user?.email || '—'}</strong>
                        </div>
                        <div className="modal-meta-row">
                            <span>Date</span>
                            <strong>{formatDate(order.createdAt)}</strong>
                        </div>
                        <div className="modal-meta-row">
                            <span>Payment</span>
                            <strong className={order.paymentStatus === 'Completed' ? 'text-green' : 'text-orange'}>
                                {order.paymentStatus}
                            </strong>
                        </div>
                        <div className="modal-meta-row">
                            <span>Status</span>
                            <span
                                className="inline-badge"
                                style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                            >
                                {order.orderStatus}
                            </span>
                        </div>
                        <div className="modal-meta-row total-row">
                            <span>Total</span>
                            <strong className="text-red">₹{order.totalAmount}</strong>
                        </div>
                    </div>

                    <h4 className="pizzas-heading">
                        🍕 {order.pizzas.length} Pizza{order.pizzas.length > 1 ? 's' : ''}
                    </h4>
                    {order.pizzas.map((pizza, i) => (
                        <div key={i} className="modal-pizza">
                            <span className="modal-pizza-num">Pizza #{i + 1}</span>
                            <div className="modal-pizza-tags">
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
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [activeTab, setActiveTab]         = useState('orders');
    const [orders, setOrders]               = useState([]);
    const [inventory, setInventory]         = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingInv, setLoadingInv]       = useState(true);
    const [editQty, setEditQty]             = useState({});
    const [savingQty, setSavingQty]         = useState({});
    const [updatingOrder, setUpdatingOrder] = useState({});
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter]   = useState('All');
    const [searchQuery, setSearchQuery]     = useState('');

    const fetchOrders = useCallback(async () => {
        setLoadingOrders(true);
        try {
            const { data } = await api.get('/admin/orders');
            setOrders(data);
        } catch {
            toast.error('Failed to load orders');
        } finally {
            setLoadingOrders(false);
        }
    }, []);

    const fetchInventory = useCallback(async () => {
        setLoadingInv(true);
        try {
            const { data } = await api.get('/admin/inventory');
            setInventory(data);
        } catch {
            toast.error('Failed to load inventory');
        } finally {
            setLoadingInv(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        fetchInventory();
    }, [fetchOrders, fetchInventory]);

    // Status change with confirmation
    const handleStatusChange = async (orderId, newStatus, currentStatus) => {
        if (newStatus === currentStatus) return;
        if (!window.confirm(`Change status to "${newStatus}"?`)) return;

        setUpdatingOrder(prev => ({ ...prev, [orderId]: true }));
        try {
            await api.put(`/admin/orders/${orderId}/status`, { orderStatus: newStatus });
            setOrders(prev =>
                prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o)
            );
            // Also update in modal if open
            if (selectedOrder?._id === orderId) {
                setSelectedOrder(prev => ({ ...prev, orderStatus: newStatus }));
            }
            toast.success(`Order moved to "${newStatus}"`);
        } catch {
            toast.error('Failed to update order status');
        } finally {
            setUpdatingOrder(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const handleQtyChange = (itemId, value) =>
        setEditQty(prev => ({ ...prev, [itemId]: value }));

    const handleQtySave = async (item) => {
        const newQty = parseInt(editQty[item._id], 10);
        if (isNaN(newQty) || newQty < 0) {
            toast.error('Enter a valid quantity (0 or more)');
            return;
        }
        setSavingQty(prev => ({ ...prev, [item._id]: true }));
        try {
            await api.put(`/admin/inventory/${item._id}`, { quantity: newQty });
            setInventory(prev =>
                prev.map(i => i._id === item._id ? { ...i, quantity: newQty } : i)
            );
            setEditQty(prev => { const n = { ...prev }; delete n[item._id]; return n; });
            toast.success(`${item.itemName} → ${newQty} units`);
        } catch {
            toast.error('Failed to update inventory');
        } finally {
            setSavingQty(prev => ({ ...prev, [item._id]: false }));
        }
    };

    // Derived stats
    const totalRevenue = orders
        .filter(o => o.paymentStatus === 'Completed')
        .reduce((s, o) => s + o.totalAmount, 0);

    const lowStockItems = inventory.filter(i => i.quantity <= i.minThreshold);

    // Filtered orders
    const filteredOrders = orders.filter(o => {
        const matchStatus = statusFilter === 'All' || o.orderStatus === statusFilter;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q
            || o._id.toLowerCase().includes(q)
            || o.user?.name?.toLowerCase().includes(q)
            || o.user?.email?.toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    const groupedInventory = inventory.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});
    const categoryLabels = {
        base: '🍞 Bases', sauce: '🍅 Sauces',
        cheese: '🧀 Cheeses', veggie: '🥦 Veggies'
    };

    return (
        <div className="admin-page">
            {selectedOrder && (
                <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            )}

            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1>🛡️ Admin Dashboard</h1>
                        <p className="admin-subtitle">Manage orders and inventory</p>
                    </div>
                    <button className="btn-refresh" onClick={() => { fetchOrders(); fetchInventory(); }}>
                        ↻ Refresh
                    </button>
                </div>

                {lowStockItems.length > 0 && (
                    <div className="low-stock-alert" role="alert">
                        ⚠️ {lowStockItems.length} ingredient{lowStockItems.length > 1 ? 's' : ''} running low on stock —{' '}
                        <button className="alert-link" onClick={() => setActiveTab('inventory')}>
                            View Inventory
                        </button>
                    </div>
                )}

                {/* Stats bar */}
                <div className="stats-bar">
                    {[
                        { num: orders.length,                                         label: 'Total Orders',    icon: '📦' },
                        { num: orders.filter(o => o.orderStatus === 'Order Received').length, label: 'New',    icon: '📋' },
                        { num: orders.filter(o => o.orderStatus === 'In Kitchen').length,     label: 'Kitchen', icon: '👨‍🍳' },
                        { num: `₹${totalRevenue.toLocaleString('en-IN')}`,            label: 'Revenue',         icon: '💰' }
                    ].map(({ num, label, icon }) => (
                        <div className="stat-card" key={label}>
                            <span className="stat-icon">{icon}</span>
                            <span className="stat-num">{num}</span>
                            <span className="stat-label">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="admin-tabs" role="tablist">
                    {['orders', 'inventory'].map(tab => (
                        <button
                            key={tab}
                            role="tab"
                            aria-selected={activeTab === tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'orders'
                                ? `📦 Orders (${orders.length})`
                                : <>🏪 Inventory{lowStockItems.length > 0 && <span className="tab-badge">{lowStockItems.length}</span>}</>
                            }
                        </button>
                    ))}
                </div>

                {/* ── Orders Tab ── */}
                {activeTab === 'orders' && (
                    <div className="tab-content">
                        {/* Filters */}
                        <div className="orders-toolbar">
                            <input
                                type="text"
                                placeholder="Search by name, email or order ID…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input"
                                aria-label="Search orders"
                            />
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="filter-select"
                                aria-label="Filter by status"
                            >
                                <option value="All">All Statuses</option>
                                {ORDER_STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        {loadingOrders ? (
                            <div className="tab-loading"><div className="loading-spinner" /></div>
                        ) : filteredOrders.length === 0 ? (
                            <p className="tab-empty">
                                {orders.length === 0 ? 'No orders yet.' : 'No orders match your filters.'}
                            </p>
                        ) : (
                            <div className="orders-table-wrap">
                                <table className="admin-table" aria-label="All orders">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Pizzas</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map(order => {
                                            const sc = STATUS_COLORS[order.orderStatus] || STATUS_COLORS['Order Received'];
                                            return (
                                                <tr key={order._id}>
                                                    <td>
                                                        <code className="order-id-cell">
                                                            #{order._id.slice(-8).toUpperCase()}
                                                        </code>
                                                    </td>
                                                    <td>
                                                        <div className="customer-cell">
                                                            <strong>{order.user?.name || 'N/A'}</strong>
                                                            <small>{order.user?.email || ''}</small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="pizza-count-badge">
                                                            {order.pizzas.length}×🍕
                                                        </span>
                                                    </td>
                                                    <td><strong className="amount-cell">₹{order.totalAmount}</strong></td>
                                                    <td><small className="date-cell">{formatDate(order.createdAt)}</small></td>
                                                    <td>
                                                        <select
                                                            value={order.orderStatus}
                                                            onChange={e => handleStatusChange(order._id, e.target.value, order.orderStatus)}
                                                            disabled={updatingOrder[order._id]}
                                                            className="status-select"
                                                            style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}
                                                            aria-label={`Status for order ${order._id.slice(-8)}`}
                                                        >
                                                            {ORDER_STATUSES.map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="view-btn"
                                                            onClick={() => setSelectedOrder(order)}
                                                            aria-label={`View details for order ${order._id.slice(-8)}`}
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <p className="results-count">
                                    Showing {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Inventory Tab ── */}
                {activeTab === 'inventory' && (
                    <div className="tab-content">
                        {loadingInv ? (
                            <div className="tab-loading"><div className="loading-spinner" /></div>
                        ) : (
                            <div className="inventory-sections">
                                {Object.entries(categoryLabels).map(([cat, label]) => {
                                    const items = groupedInventory[cat] || [];
                                    if (items.length === 0) return null;
                                    return (
                                        <div key={cat} className="inventory-group">
                                            <h3 className="inventory-group-title">{label}</h3>
                                            <div className="inventory-grid">
                                                {items.map(item => {
                                                    const isLow = item.quantity <= item.minThreshold;
                                                    const isDirty = editQty[item._id] !== undefined;
                                                    const displayVal = isDirty ? editQty[item._id] : item.quantity;

                                                    return (
                                                        <div
                                                            key={item._id}
                                                            className={`inventory-card ${isLow ? 'low-stock' : ''}`}
                                                        >
                                                            <div className="inv-name">
                                                                {item.itemName}
                                                                {isLow && <span className="low-badge">Low</span>}
                                                            </div>
                                                            <div className="inv-qty-row">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={displayVal}
                                                                    onChange={e => handleQtyChange(item._id, e.target.value)}
                                                                    className="qty-input"
                                                                    aria-label={`Quantity for ${item.itemName}`}
                                                                />
                                                                <span className="inv-unit">units</span>
                                                                {isDirty && (
                                                                    <button
                                                                        className="save-btn"
                                                                        onClick={() => handleQtySave(item)}
                                                                        disabled={savingQty[item._id]}
                                                                    >
                                                                        {savingQty[item._id] ? '…' : 'Save'}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="inv-threshold">
                                                                Min: {item.minThreshold} units
                                                            </div>
                                                            {/* Stock bar */}
                                                            <div className="stock-bar-wrap" title={`${item.quantity} units`}>
                                                                <div
                                                                    className="stock-bar-fill"
                                                                    style={{
                                                                        width: `${Math.min(100, (item.quantity / Math.max(item.quantity, 100)) * 100)}%`,
                                                                        background: isLow ? '#e53e3e' : '#48bb78'
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
