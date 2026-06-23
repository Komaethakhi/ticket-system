const express = require("express");
const QRCode = require("qrcode");
const router = express.Router();

const Event = require("../models/Event");
const Order = require("../models/Order");
const User = require("../models/User");
const { sendAdminPaymentSubmittedNotification } = require("../utils/whatsapp");

const { authMiddleware } = require("../middleware/auth");

const PAYMENT_UPI_ID = process.env.PAYMENT_UPI_ID || "9842426546@axisbank";
const PAYMENT_UPI_NUMBER = process.env.PAYMENT_UPI_NUMBER || "9842426546";
const PAYMENT_PAYEE_NAME = process.env.PAYMENT_PAYEE_NAME || "ANANTH";
const MAX_PAYMENT_SCREENSHOT_LENGTH = 3000000;
const PAYMENT_SCREENSHOT_PATTERN = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

const normalizeScreenshotName = (name) => String(name || "payment-screenshot").replace(/[^\w. -]/g, "").slice(0, 80);
const getScreenshotType = (dataUrl) => {
  const match = String(dataUrl || "").match(/^data:(image\/(?:png|jpe?g|webp));base64,/i);
  return match ? match[1].toLowerCase() : "";
};

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

    if (!user.mobileNumber) {
      return res.status(400).json({
        message: "WhatsApp number is not saved for this coach ID. Please contact admin."
      });
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
        upiNumber: PAYMENT_UPI_NUMBER,
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
  const { orderId, paymentScreenshot, paymentScreenshotName } = req.body;
  const screenshotProof = String(paymentScreenshot || "").trim();

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  if (!screenshotProof) {
    return res.status(400).json({ message: "Upload the payment screenshot after payment" });
  }

  if (screenshotProof.length > MAX_PAYMENT_SCREENSHOT_LENGTH || !PAYMENT_SCREENSHOT_PATTERN.test(screenshotProof)) {
    return res.status(400).json({ message: "Upload a valid PNG, JPG, or WEBP screenshot under 2 MB" });
  }

  try {
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

    if (order.status === "PAYMENT_SUBMITTED") {
      return res.status(400).json({ message: "Payment screenshot is already submitted and waiting for admin verification" });
    }

    if (!order.userId.mobileNumber) {
      return res.status(400).json({
        message: "WhatsApp number is not saved for this coach ID. Please contact admin."
      });
    }

    order.payment_id = `SCREENSHOT-${order._id}`;
    order.transaction_id = undefined;
    order.payment_screenshot = screenshotProof;
    order.payment_screenshot_name = normalizeScreenshotName(paymentScreenshotName);
    order.payment_screenshot_type = getScreenshotType(screenshotProof);
    order.whatsapp_number = order.userId.mobileNumber;
    order.payment_method = "UPI_QR";
    order.status = "PAYMENT_SUBMITTED";
    order.submitted_at = new Date();
    order.verified_at = undefined;
    order.admin_note = "Customer submitted payment screenshot; waiting for admin verification";
    await order.save();

    let adminNotification;
    try {
      adminNotification = await sendAdminPaymentSubmittedNotification(order);
    } catch (notificationErr) {
      console.error("Admin payment notification error:", notificationErr);
      adminNotification = { sent: false, reason: "ADMIN_NOTIFICATION_FAILED" };
    }

    res.json({
      success: true,
      message: "Payment screenshot submitted. Admin will verify and approve your ticket.",
      order,
      adminNotification
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
      status: { $in: ["CONFIRMED"] }
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
