const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { sendOrderEmail } = require('../utils/email');
const { generateQR } = require('../utils/qr');

// Get all orders
router.get('/orders', async (req, res) => {
    const orders = await Order.find().populate('user').populate('event');
    res.json(orders);
});

// Approve order
router.post('/approve/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user').populate('event');
        if(!order) return res.status(404).send('Order not found');

        order.order_status = 'Ticket Issued';
        order.ticket_id = `TICKET-${order._id}`;
        order.qr_code = await generateQR(order.ticket_id);
        await order.save();

        sendOrderEmail(order.user.email, order._id, order.amount, 'Ticket Issued');
        res.json({ success: true, message: 'Order approved & ticket issued' });
    } catch(err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Reject order
router.post('/reject/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user');
        if(!order) return res.status(404).send('Order not found');

        order.order_status = 'Rejected';
        await order.save();

        sendOrderEmail(order.user.email, order._id, order.amount, 'Rejected');
        res.json({ success: true, message: 'Order rejected' });
    } catch(err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
