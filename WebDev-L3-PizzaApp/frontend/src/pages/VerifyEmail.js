import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';

export default function VerifyEmail() {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const { data } = await api.get(`/auth/verify-email/${token}`);
                setMessage(data.message);
                setStatus('success');
            } catch (err) {
                setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
                setStatus('error');
            }
        };
        verify();
    }, [token]);

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                {status === 'loading' && (
                    <>
                        <h1>🔄 Verifying…</h1>
                        <p className="auth-subtitle">Please wait while we verify your email.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <h1>✅ Email Verified!</h1>
                        <div className="info-banner success" style={{ marginTop: '1rem' }}>{message}</div>
                        <Link to="/login" className="btn-primary" style={{ display: 'block', marginTop: '1.5rem' }}>
                            Go to Login
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h1>❌ Verification Failed</h1>
                        <div className="info-banner error" style={{ marginTop: '1rem' }}>{message}</div>
                        <Link to="/register" className="btn-primary" style={{ display: 'block', marginTop: '1.5rem' }}>
                            Register Again
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
