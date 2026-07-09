// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect standard user routes
const protect = async (req, res, next) => {
    let token;

    // Check if token exists in the Authorization header (Format: Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Split "Bearer TOKEN_STRING" to extract just the token
            token = req.headers.authorization.split(' ')[1];

            // Verify token using our secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user data from DB (excluding password) and attach it to the request object
            req.user = await User.findById(decoded.id).select('-password');
            
            next(); // Move to the next function/controller
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Middleware to protect Admin-only endpoints
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin authorization required.' });
    }
};

module.exports = { protect, adminOnly };