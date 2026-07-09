import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('pizzaUser') || 'null');
    if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

// Global 401 handler — expired token silently logs out and redirects
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('pizzaUser');
            // Avoid circular import — dispatch a custom event instead
            window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(error);
    }
);

export default api;
