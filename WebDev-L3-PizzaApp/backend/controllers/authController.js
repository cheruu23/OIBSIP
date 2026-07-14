// backend/controllers/authController.js
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// --- Email Transporter ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- Helper: Generate JWT ---
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user (sends verification email)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'user',
            isVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires
        });

        // Send verification email — required to complete registration
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
        await transporter.sendMail({
            from: `"🍕 PizzaApp" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🍕 PizzaApp — Verify Your Email',
            html: `
            <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #fee2e2">
              <h2 style="color:#e53e3e;margin-bottom:8px">🍕 Welcome to PizzaApp!</h2>
              <p style="color:#444;margin-bottom:24px">Hi <strong>${name}</strong>, thanks for signing up! Click below to verify your email address and activate your account.</p>
              <a href="${verifyUrl}" style="display:inline-block;background:#e53e3e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
                ✅ Verify My Email
              </a>
              <p style="color:#aaa;font-size:13px;margin-top:24px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
            </div>`
        });

        res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });
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

// @desc    Admin-only login (separate portal)
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

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Return success anyway to prevent email enumeration
            return res.json({ message: 'If that email is registered, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: '🍕 PizzaApp — Password Reset Request',
                html: `<h2>Password Reset</h2>
                       <p>You requested a password reset. Click below:</p>
                       <a href="${resetUrl}" style="background:#e53e3e;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Reset Password</a>
                       <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`
            });
        } catch (emailError) {
            console.error('⚠️ Reset email failed:', emailError.message);
        }

        res.json({ message: 'If that email is registered, a reset link has been sent.' });
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

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful. You can now log in.' });
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

        // Generate fresh token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
        await transporter.sendMail({
            from: `"🍕 PizzaApp" <${process.env.EMAIL_USER}>`,
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

        res.json({ message: 'Verification email resent! Check your inbox.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, verifyEmail, loginUser, adminLogin, forgotPassword, resetPassword, resendVerification };
