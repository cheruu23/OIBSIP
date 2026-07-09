// backend/config/cron.js
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Inventory = require('../models/Inventory');

// Configure your email transporter wrapper
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Requires a secure Google App Password, not your raw email pass
    }
});

const initScheduledJobs = () => {
    // Schedule task execution patterns (This standard string matches: Once every day at midnight)
    // For fast local testing, you can shift this expression string to "*/10 * * * * *" to run every 10 seconds!
    cron.schedule('0 0 * * *', async () => {
        console.log('🤖 Running scheduled automated raw material stock diagnostic scans...');
        
        try {
            // Find items where current remaining quantity drops below threshold requirements
            const lowStockItems = await Inventory.find({ $expr: { $lt: ["$quantity", "$minThreshold"] } });

            if (lowStockItems.length > 0) {
                let alertDetails = lowStockItems.map(item => `- ${item.itemName}: Only ${item.quantity} units left! (Limit: ${item.minThreshold})`).join('\n');

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: process.env.EMAIL_USER, // Alerts dispatch straight back to the administrator address
                    subject: '🚨 CRITICAL ALERT: Pizza App Low Stock Warning',
                    text: `Hello Administrator,\n\nThe backend tracking script noticed critical inventory drops below configurable thresholds:\n\n${alertDetails}\n\nPlease update supply limits immediately inside your controller dashboard.`
                };

                await transporter.sendMail(mailOptions);
                console.log('✉️ Automated low-stock warning dispatched to administrator.');
            }
        } catch (error) {
            console.error('❌ Scheduled tracking job routine failed:', error.message);
        }
    });
};

module.exports = initScheduledJobs;