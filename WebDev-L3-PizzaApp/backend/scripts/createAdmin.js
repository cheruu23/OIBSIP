// backend/scripts/createAdmin.js
// Run with: node scripts/createAdmin.js
// Creates a default admin account
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@pizzaapp.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        const existing = await User.findOne({ email: adminEmail });
        if (existing) {
            console.log(`Admin already exists: ${adminEmail}`);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(adminPassword, salt);

        await User.create({
            name: 'Admin',
            email: adminEmail,
            password: hashed,
            role: 'admin',
            isVerified: true
        });

        console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

createAdmin();
