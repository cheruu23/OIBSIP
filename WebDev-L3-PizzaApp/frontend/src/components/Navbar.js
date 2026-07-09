import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => setMenuOpen(false);

    const handleLogout = () => {
        closeMenu();
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
            <Link to="/" className="navbar-brand" onClick={closeMenu}>
                🍕 PizzaApp
            </Link>

            {/* Hamburger (mobile) */}
            <button
                className={`hamburger ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen(o => !o)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls="navbar-menu"
            >
                <span /><span /><span />
            </button>

            {/* Links */}
            <div
                id="navbar-menu"
                className={`navbar-links ${menuOpen ? 'mobile-open' : ''}`}
            >
                {!user && (
                    <>
                        <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                            Login
                        </NavLink>
                        <NavLink to="/register" className={({ isActive }) => isActive ? 'nav-btn-register' : 'nav-btn-register'} onClick={closeMenu}>
                            Register
                        </NavLink>
                    </>
                )}

                {user?.role === 'user' && (
                    <>
                        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                            Home
                        </NavLink>
                        <NavLink to="/build" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                            Build Pizza
                        </NavLink>

                        <NavLink to="/cart" className={({ isActive }) => `cart-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                            Cart
                            {cartItems.length > 0 && (
                                <span className="cart-badge" aria-label={`${cartItems.length} items`}>
                                    {cartItems.length}
                                </span>
                            )}
                        </NavLink>

                        <NavLink to="/my-orders" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                            My Orders
                        </NavLink>

                        <span className="navbar-divider" aria-hidden="true" />
                        <span className="navbar-user">Hi, {user.name.split(' ')[0]} 👋</span>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </>
                )}

                {user?.role === 'admin' && (
                    <>
                        <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>
                            Dashboard
                        </NavLink>
                        <span className="navbar-divider" aria-hidden="true" />
                        <span className="navbar-user admin-tag">🛡️ {user.name.split(' ')[0]}</span>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </>
                )}
            </div>
        </nav>
    );
}
