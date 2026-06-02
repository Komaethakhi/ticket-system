const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const Order = require("../models/Order");
const User = require("../models/User");
const sendOrderMail = require("../utils/email");
const { JWT_SECRET } = require("../middleware/auth");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const getConfirmedOrders = () =>
  Order.find({ status: "CONFIRMED" })
    .populate("userId", "coachId")
    .populate("eventId", "title date location ticket_price")
    .sort({ booked_at: -1 });

const getPendingOrders = () =>
  Order.find({ status: "PENDING_VERIFICATION" })
    .populate("userId", "coachId")
    .populate("eventId", "title date location ticket_price")
    .sort({ submitted_at: -1, booked_at: -1 });

const formatOrder = (order) => ({
  orderId: order._id,
  coachId: order.userId?.coachId || "Unknown",
  eventTitle: order.eventId?.title || "Unknown event",
  eventDate: order.eventId?.date || "",
  location: order.eventId?.location || "",
  ticketPrice: order.eventId?.ticket_price || 0,
  quantity: order.quantity,
  amount: order.amount,
  paymentId: order.payment_id || "",
  transactionId: order.transaction_id || "",
  paymentMethod: order.payment_method || "",
  status: order.status,
  bookedAt: order.booked_at,
  submittedAt: order.submitted_at,
  verifiedAt: order.verified_at,
  adminNote: order.admin_note || ""
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const token = jwt.sign(
    { role: "admin", username: ADMIN_USERNAME },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ success: true, token, username: ADMIN_USERNAME });
});

router.get("/summary", adminAuthMiddleware, async (req, res) => {
  try {
    const [orders, pendingOrders, registeredCoachCount] = await Promise.all([
      getConfirmedOrders(),
      getPendingOrders(),
      User.countDocuments()
    ]);
    const rows = orders.map(formatOrder);
    const pendingRows = pendingOrders.map(formatOrder);

    const coachMap = new Map();
    rows.forEach((row) => {
      const current = coachMap.get(row.coachId) || {
        coachId: row.coachId,
        totalTickets: 0,
        totalAmount: 0,
        orderCount: 0
      };

      current.totalTickets += row.quantity;
      current.totalAmount += row.amount;
      current.orderCount += 1;
      coachMap.set(row.coachId, current);
    });

    const coachSummary = Array.from(coachMap.values()).sort(
      (a, b) => b.totalTickets - a.totalTickets
    );

    res.json({
      totals: {
        totalTicketsSold: rows.reduce((sum, row) => sum + row.quantity, 0),
        totalRevenue: rows.reduce((sum, row) => sum + row.amount, 0),
        totalOrders: rows.length,
        pendingVerifications: pendingRows.length,
        uniqueCoaches: coachSummary.length,
        registeredCoachIds: registeredCoachCount
      },
      coachSummary,
      orders: rows,
      pendingOrders: pendingRows
    });
  } catch (err) {
    console.error("Admin summary error:", err);
    res.status(500).json({ message: "Failed to load admin summary" });
  }
});

router.post("/orders/:id/approve", adminAuthMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("eventId")
      .populate("userId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "PENDING_VERIFICATION") {
      return res.status(400).json({ message: "Only pending payments can be approved" });
    }

    order.status = "CONFIRMED";
    order.verified_at = new Date();
    order.admin_note = req.body.note || "";
    await order.save();

    if (order.userId.email) {
      await sendOrderMail(order.userId.email, order, order.eventId);
    }

    res.json({ success: true, order: formatOrder(order) });
  } catch (err) {
    console.error("Approve payment error:", err);
    res.status(500).json({ message: "Failed to approve payment" });
  }
});

router.post("/orders/:id/reject", adminAuthMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("eventId")
      .populate("userId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "PENDING_VERIFICATION") {
      return res.status(400).json({ message: "Only pending payments can be rejected" });
    }

    order.status = "REJECTED";
    order.verified_at = new Date();
    order.admin_note = req.body.note || "Payment could not be verified";
    await order.save();

    res.json({ success: true, order: formatOrder(order) });
  } catch (err) {
    console.error("Reject payment error:", err);
    res.status(500).json({ message: "Failed to reject payment" });
  }
});

router.post("/coach-ids", adminAuthMiddleware, async (req, res) => {
  try {
    const rawCoachIds = Array.isArray(req.body.coachIds)
      ? req.body.coachIds
      : String(req.body.coachIds || "").split(/[\s,;]+/);

    const uniqueCoachIds = Array.from(
      new Set(
        rawCoachIds
          .map((coachId) => String(coachId || "").trim().toUpperCase())
          .filter(Boolean)
      )
    );

    const invalidCoachIds = uniqueCoachIds.filter(
      (coachId) => !/^[A-Z0-9]{9,10}$/.test(coachId)
    );
    const validCoachIds = uniqueCoachIds.filter(
      (coachId) => /^[A-Z0-9]{9,10}$/.test(coachId)
    );

    if (validCoachIds.length === 0) {
      return res.status(400).json({
        message: "Enter at least one valid 9 or 10 character Herbalife ID",
        added: [],
        skipped: [],
        invalid: invalidCoachIds
      });
    }

    const existingUsers = await User.find({
      coachId: { $in: validCoachIds }
    }).select("coachId");
    const existingCoachIds = new Set(existingUsers.map((user) => user.coachId));
    const newCoachIds = validCoachIds.filter(
      (coachId) => !existingCoachIds.has(coachId)
    );

    if (newCoachIds.length > 0) {
      await User.insertMany(newCoachIds.map((coachId) => ({ coachId })));
    }

    res.status(201).json({
      success: true,
      added: newCoachIds,
      skipped: Array.from(existingCoachIds),
      invalid: invalidCoachIds
    });
  } catch (err) {
    console.error("Add coach IDs error:", err);
    res.status(500).json({ message: "Failed to add coach IDs" });
  }
});

router.get("/orders/export", adminAuthMiddleware, async (req, res) => {
  try {
    const orders = await getConfirmedOrders();
    const rows = orders.map(formatOrder);

    const headers = [
      "Order ID",
      "Herbalife ID",
      "Training",
      "Date",
      "Location",
      "Ticket Price",
      "Quantity",
      "Amount",
      "Payment ID",
      "Status",
      "Booked At"
    ];

    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.orderId,
          row.coachId,
          row.eventTitle,
          row.eventDate,
          row.location,
          row.ticketPrice,
          row.quantity,
          row.amount,
          row.paymentId,
          row.status,
          row.bookedAt ? new Date(row.bookedAt).toISOString() : ""
        ]
          .map(escapeCsv)
          .join(",")
      )
    ];

    const fileName = `ticket-orders-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(csvRows.join("\n"));
  } catch (err) {
    console.error("Admin export error:", err);
    res.status(500).json({ message: "Failed to export orders" });
  }
});

module.exports = router;
