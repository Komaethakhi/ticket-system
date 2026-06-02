const express = require("express");
const QRCode = require("qrcode");
const router = express.Router();

const Event = require("../models/Event");
const Order = require("../models/Order");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

const PAYMENT_UPI_ID = process.env.PAYMENT_UPI_ID || "your-upi-id@bank";
const PAYMENT_PAYEE_NAME = process.env.PAYMENT_PAYEE_NAME || "Herbalife Training Portal";

const buildUpiLink = ({ amount, orderId }) => {
  const params = new URLSearchParams({
    pa: PAYMENT_UPI_ID,
    pn: PAYMENT_PAYEE_NAME,
    am: String(amount),
    cu: "INR",
    tn: `Ticket order ${orderId}`
  });

  return `upi://pay?${params.toString()}`;
};

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
      payment_method: "UPI_QR",
      status: "PENDING"
    });

    const upiLink = buildUpiLink({ amount, orderId: order._id });
    const qrCode = await QRCode.toDataURL(upiLink);

    res.json({
      success: true,
      orderId: order._id,
      amount,
      quantity: ticketCount,
      payment: {
        method: "UPI_QR",
        upiId: PAYMENT_UPI_ID,
        payeeName: PAYMENT_PAYEE_NAME,
        upiLink,
        qrCode
      },
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

router.post("/submit-payment", authMiddleware, async (req, res) => {
  const { orderId, transactionId } = req.body;
  const normalizedTransactionId = String(transactionId || "").trim().toUpperCase();

  if (!orderId || !normalizedTransactionId || normalizedTransactionId.length < 6) {
    return res.status(400).json({ message: "Valid transaction ID is required" });
  }

  try {
    const duplicate = await Order.findOne({
      transaction_id: normalizedTransactionId,
      _id: { $ne: orderId }
    });

    if (duplicate) {
      return res.status(409).json({ message: "This transaction ID is already submitted" });
    }

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.userId
    })
      .populate("eventId")
      .populate("userId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "CONFIRMED") {
      return res.status(400).json({ message: "This order is already confirmed" });
    }

    order.payment_id = normalizedTransactionId;
    order.transaction_id = normalizedTransactionId;
    order.payment_method = "UPI_QR";
    order.status = "PENDING_VERIFICATION";
    order.submitted_at = new Date();
    await order.save();

    res.json({
      success: true,
      message: "Payment submitted for admin verification",
      order
    });
  } catch (err) {
    console.error("Submit payment error:", err);
    res.status(500).json({ message: "Payment submission failed" });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.userId,
      status: { $in: ["PENDING_VERIFICATION", "CONFIRMED", "REJECTED"] }
    })
      .populate("eventId")
      .sort({ booked_at: -1 });

    res.json(orders);
  } catch (err) {
    console.error("My orders error:", err);
    res.status(500).json({ message: "Failed to load tickets" });
  }
});

module.exports = router;
