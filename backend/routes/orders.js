const crypto = require("crypto");
const express = require("express");
const Razorpay = require("razorpay");
const router = express.Router();

const Event = require("../models/Event");
const Order = require("../models/Order");
const User = require("../models/User");
const sendOrderMail = require("../utils/email");
const { authMiddleware } = require("../middleware/auth");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

router.post("/create", authMiddleware, async (req, res) => {
  const { eventId, quantity = 1 } = req.body;
  const ticketCount = Number(quantity);

  if (!eventId || !Number.isInteger(ticketCount) || ticketCount < 1) {
    return res.status(400).json({ message: "Valid eventId and quantity are required" });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const amount = event.ticket_price * ticketCount;
    const order = await Order.create({
      userId: user._id,
      eventId: event._id,
      amount,
      quantity: ticketCount,
      status: "PENDING"
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `ORD_${order._id}`
    });

    order.razorpay_order_id = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY,
      orderId: order._id,
      razorpayOrder,
      event: {
        title: event.title,
        ticket_price: event.ticket_price,
        location: event.location,
        date: event.date
      }
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Order creation failed" });
  }
});

router.post("/success", authMiddleware, async (req, res) => {
  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Payment verification details are required" });
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.userId,
      razorpay_order_id
    })
      .populate("eventId")
      .populate("userId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;
    order.status = "CONFIRMED";
    await order.save();

    if (order.userId.email) {
      await sendOrderMail(order.userId.email, order, order.eventId);
    }

    res.json({
      success: true,
      message: "Payment successful",
      order
    });
  } catch (err) {
    console.error("Payment success error:", err);
    res.status(500).json({ message: "Payment confirmation failed" });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId, status: "CONFIRMED" })
      .populate("eventId")
      .sort({ booked_at: -1 });

    res.json(orders);
  } catch (err) {
    console.error("My orders error:", err);
    res.status(500).json({ message: "Failed to load tickets" });
  }
});

module.exports = router;
