import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import './Auth.css';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [resending, setResending] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirm) {
            toast.error('Passwords do not match');
            return;
        }
        if (form.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/register', {
                name: form.name,
                email: form.email,
                password: form.password
            });
            setRegisteredEmail(form.email);
            setRegistered(true);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            const { data } = await api.post('/auth/resend-verification', { email: registeredEmail });
            toast.success(data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend email');
        } finally {
            setResending(false);
        }
    };

    // ── Success screen ──
    if (registered) {
        return (
            <div className="auth-page">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>📧</div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>Check your inbox!</h1>
                    <p className="auth-subtitle" style={{ marginBottom: '1.25rem' }}>
                        We sent a verification link to
                    </p>
                    <div className="email-highlight">{registeredEmail}</div>
                    <p style={{ color: '#888', fontSize: '0.85rem', margin: '1.25rem 0' }}>
                        Click the link in that email to verify your account, then come back to log in.
                        The link expires in <strong>24 hours</strong>.
                    </p>

                    <div className="info-banner success" style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
                        ✅ Account created successfully! One step left — verify your email.
                    </div>

                    <Link to="/login" className="btn-primary" style={{ display: 'block', marginBottom: '0.75rem' }}>
                        Go to Login →
                    </Link>

                    <p style={{ color: '#aaa', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                        Didn't receive the email?
                    </p>
                    <button
                        className="btn-resend"
                        onClick={handleResend}
                        disabled={resending}
                    >
                        {resending ? 'Sending…' : '↻ Resend Verification Email'}
                    </button>
                </div>
            </div>
        );
    }

    // ── Registration form ──
    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>🍕 Create Account</h1>
                <p className="auth-subtitle">Join us and start building your perfect pizza</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={handleChange}
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Min. 6 characters"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirm">Confirm Password</label>
                        <input
                            id="confirm"
                            type="password"
                            name="confirm"
                            placeholder="Repeat your password"
                            value={form.confirm}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
