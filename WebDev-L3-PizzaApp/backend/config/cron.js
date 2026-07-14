// backend/config/cron.js
const cron = require('node-cron');
const { Resend } = require('resend');
const Inventory = require('../models/Inventory');

const initScheduledJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('🤖 Running scheduled low-stock scan...');
        try {
            const lowStockItems = await Inventory.find({ $expr: { $lt: ['$quantity', '$minThreshold'] } });
            if (lowStockItems.length > 0 && process.env.RESEND_API_KEY && process.env.EMAIL_USER) {
                const resend = new Resend(process.env.RESEND_API_KEY);
                const alertDetails = lowStockItems
                    .map(i => `<li><strong>${i.itemName}</strong>: ${i.quantity} units left (min: ${i.minThreshold})</li>`)
                    .join('');
                await resend.emails.send({
                    from: 'PizzaApp <onboarding@resend.dev>',
                    to: process.env.EMAIL_USER,
                    subject: '🚨 PizzaApp — Low Stock Alert',
                    html: `<h2>Low Stock Warning</h2><ul>${alertDetails}</ul><p>Please restock via the admin dashboard.</p>`
                });
                console.log('✉️ Low-stock alert sent.');
            }
        } catch (error) {
            console.error('❌ Cron job failed:', error.message);
        }
    });
};

module.exports = initScheduledJobs;