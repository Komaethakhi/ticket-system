const express = require("express");
const QRCode = require("qrcode");
const router = express.Router();

const Event = require("../models/Event");
const Order = require("../models/Order");
const User = require("../models/User");
const sendOrderMail = require("../utils/email");
const { authMiddleware } = require("../middleware/auth");

const PAYMENT_UPI_ID = process.env.PAYMENT_UPI_ID || "9842426546@axisbank";
const PAYMENT_UPI_NUMBER = process.env.PAYMENT_UPI_NUMBER || "9842426546";
const PAYMENT_PAYEE_NAME = process.env.PAYMENT_PAYEE_NAME || "ANANTH";

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

const buildWhatsAppMessage = (order) =>
  [
    "Order confirmed.",
    `Order ID: ${order._id}`,
    `Herbalife ID: ${order.userId?.coachId || "Unknown"}`,
    `Training: ${order.eventId?.title || "Unknown event"}`,
    `Date: ${order.eventId?.date || ""}`,
    `Location: ${order.eventId?.location || ""}`,
    `Tickets: ${order.quantity}`,
    `Amount: Rs. ${order.amount}`,
    "Status: CONFIRMED"
  ].join("\n");

const normalizeWhatsAppRecipient = (number) => {
  const digits = String(number || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.startsWith("91") ? digits : `91${digits}`;
};

const buildWhatsAppLink = (order) => {
  const recipient = normalizeWhatsAppRecipient(order.whatsapp_number);

  if (!recipient) {
    return "";
  }

  return `https://wa.me/${recipient}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`;
};

const sendWhatsAppConfirmation = async (order) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = normalizeWhatsAppRecipient(order.whatsapp_number);

  if (!token || !phoneNumberId || !recipient) {
    return { sent: false, reason: "WHATSAPP_API_NOT_CONFIGURED" };
  }

  if (typeof fetch !== "function") {
    return { sent: false, reason: "FETCH_NOT_AVAILABLE" };
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipient,
      type: "text",
      text: {
        preview_url: false,
        body: buildWhatsAppMessage(order)
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp confirmation failed: ${errorText}`);
  }

  return { sent: true };
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
  const { orderId, transactionId, whatsappNumber } = req.body;
  const normalizedTransactionId = String(transactionId || "").trim().toUpperCase();
  const normalizedWhatsappNumber = String(whatsappNumber || "").replace(/\D/g, "");

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  if (normalizedWhatsappNumber && (normalizedWhatsappNumber.length < 10 || normalizedWhatsappNumber.length > 15)) {
    return res.status(400).json({ message: "Enter a valid WhatsApp number" });
  }

  try {
    if (normalizedTransactionId) {
      const duplicate = await Order.findOne({
        transaction_id: normalizedTransactionId,
        _id: { $ne: orderId }
      });

      if (duplicate) {
        return res.status(409).json({ message: "This transaction ID is already submitted" });
      }
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

    order.payment_id = normalizedTransactionId || `UPI-${order._id}`;
    order.transaction_id = normalizedTransactionId || undefined;
    order.whatsapp_number = normalizedWhatsappNumber;
    order.payment_method = "UPI_QR";
    order.status = "CONFIRMED";
    order.submitted_at = new Date();
    order.verified_at = new Date();
    order.admin_note = "Auto confirmed after customer marked UPI payment done";
    await order.save();

    if (order.userId.email) {
      await sendOrderMail(order.userId.email, order, order.eventId);
    }

    let whatsappDelivery = { sent: false, reason: "NO_WHATSAPP_NUMBER" };
    if (normalizedWhatsappNumber) {
      try {
        whatsappDelivery = await sendWhatsAppConfirmation(order);
      } catch (whatsappErr) {
        console.error("WhatsApp confirmation error:", whatsappErr);
        whatsappDelivery = { sent: false, reason: "WHATSAPP_SEND_FAILED" };
      }
    }

    res.json({
      success: true,
      message: "Payment confirmed. Your ticket is booked.",
      order,
      whatsapp: {
        ...whatsappDelivery,
        link: buildWhatsAppLink(order)
      }
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
