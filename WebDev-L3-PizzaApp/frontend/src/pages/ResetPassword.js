import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import './Auth.css';

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ password: '', confirm: '' });
    const [loading, setLoading] = useState(false);

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
            const { data } = await api.post(`/auth/reset-password/${token}`, {
                password: form.password
            });
            toast.success(data.message);
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed — link may have expired');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>🔒 Reset Password</h1>
                <p className="auth-subtitle">Enter your new password below</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="password">New Password</label>
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
                        <label htmlFor="confirm">Confirm New Password</label>
                        <input
                            id="confirm"
                            type="password"
                            name="confirm"
                            placeholder="Repeat new password"
                            value={form.confirm}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Resetting…' : 'Reset Password'}
                    </button>
                </form>

                <p className="auth-switch">
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    );
}
