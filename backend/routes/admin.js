const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const Order = require("../models/Order");
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
  status: order.status,
  bookedAt: order.booked_at
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
    const orders = await getConfirmedOrders();
    const rows = orders.map(formatOrder);

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
        uniqueCoaches: coachSummary.length
      },
      coachSummary,
      orders: rows
    });
  } catch (err) {
    console.error("Admin summary error:", err);
    res.status(500).json({ message: "Failed to load admin summary" });
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
