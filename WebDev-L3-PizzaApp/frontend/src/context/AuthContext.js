import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('pizzaUser')) || null;
        } catch {
            return null;
        }
    });

    const login = (userData) => {
        localStorage.setItem('pizzaUser', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = useCallback(() => {
        localStorage.removeItem('pizzaUser');
        setUser(null);
    }, []);

    // Listen for 401 events from the axios interceptor (expired token)
    useEffect(() => {
        window.addEventListener('auth:logout', logout);
        return () => window.removeEventListener('auth:logout', logout);
    }, [logout]);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
