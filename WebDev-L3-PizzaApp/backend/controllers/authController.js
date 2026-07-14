// backend/controllers/authController.js
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');

// --- Resend client ---
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Helpers ---
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const sendMail = async ({ to, subject, html }) => {
    try {
        await resend.emails.send({
            from: 'PizzaApp <onboarding@resend.dev>',
            to,
            subject,
            html
        });
    } catch (err) {
        console.error('⚠️ Email send failed:', err.message);
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // rounds=8: secure and ~10x faster than 10 on shared CPU (Render free tier)
        const hashedPassword = await bcrypt.hash(password, 8);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'user',
            isVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000
        });

        // Respond immediately — email fires in background
        res.status(201).json({
            message: 'Registration successful! Please check your email to verify your account.'
        });

        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
        sendMail({
            to: email,
            subject: '🍕 PizzaApp — Verify Your Email',
            html: `
            <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #fee2e2">
              <h2 style="color:#e53e3e;margin-bottom:8px">🍕 Welcome to PizzaApp!</h2>
              <p style="color:#444;margin-bottom:24px">Hi <strong>${name}</strong>, click below to verify your email and activate your account.</p>
              <a href="${verifyUrl}" style="display:inline-block;background:#e53e3e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
                ✅ Verify My Email
              </a>
              <p style="color:#aaa;font-size:13px;margin-top:24px">Link expires in 24 hours. If you didn't sign up, ignore this email.</p>
            </div>`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify email with token
// @route   GET /api/auth/verify-email/:token
const verifyEmail = async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification link.' });
        }
        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        res.json({ message: 'Email verified successfully! You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
const resendVerification = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account found with that email.' });
        if (user.isVerified) return res.status(400).json({ message: 'This account is already verified.' });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        res.json({ message: 'Verification email resent! Check your inbox.' });

        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
        sendMail({
            to: email,
            subject: '🍕 PizzaApp — New Verification Link',
            html: `
            <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #fee2e2">
              <h2 style="color:#e53e3e">🍕 New Verification Link</h2>
              <p style="color:#444">Hi <strong>${user.name}</strong>, here's your new verification link:</p>
              <a href="${verifyUrl}" style="display:inline-block;background:#e53e3e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
                ✅ Verify My Email
              </a>
              <p style="color:#aaa;font-size:13px;margin-top:24px">This link expires in 24 hours.</p>
            </div>`
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

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }
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

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: 'If that email is registered, a reset link has been sent.' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
        await user.save();

        res.json({ message: 'If that email is registered, a reset link has been sent.' });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
        sendMail({
            to: email,
            subject: '🍕 PizzaApp — Password Reset Request',
            html: `
            <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #fee2e2">
              <h2 style="color:#e53e3e">🔑 Password Reset</h2>
              <p style="color:#444">You requested a password reset. Click below:</p>
              <a href="${resetUrl}" style="display:inline-block;background:#e53e3e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
                Reset My Password
              </a>
              <p style="color:#aaa;font-size:13px;margin-top:24px">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
            </div>`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset link.' });
        }
        user.password = await bcrypt.hash(password, 8);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser, verifyEmail, resendVerification,
    loginUser, adminLogin, forgotPassword, resetPassword
};
