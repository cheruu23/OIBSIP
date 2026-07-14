// backend/controllers/authController.js
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc    Register a new user (auto-verified, no email required)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'user',
            isVerified: true  // Auto-verified — no email step
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
            message: 'Registration successful!'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });

        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Please use the admin login portal.' });
        }

        if (await bcrypt.compare(password, user.password)) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin-only login
// @route   POST /api/auth/admin-login
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, role: 'admin' });
        if (!user) return res.status(401).json({ message: 'Invalid admin credentials' });

        if (await bcrypt.compare(password, user.password)) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid admin credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forgot password (kept for future use)
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    res.json({ message: 'Password reset via email is not available. Please contact support.' });
};

// @desc    Reset password stub
// @route   POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
    res.status(400).json({ message: 'Password reset via email is not available.' });
};

// @desc    Verify email stub (kept so old links don't 404)
// @route   GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
    res.json({ message: 'Email verified successfully! You can now log in.' });
};

// @desc    Resend verification stub
// @route   POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
    res.json({ message: 'Email verification is not required. You can log in directly.' });
};

module.exports = {
    registerUser, loginUser, adminLogin,
    forgotPassword, resetPassword, verifyEmail, resendVerification
};
