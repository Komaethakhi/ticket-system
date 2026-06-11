const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const Order = require("../models/Order");
const User = require("../models/User");
const sendOrderMail = require("../utils/email");
const { JWT_SECRET } = require("../middleware/auth");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_COACH_ID = (process.env.ADMIN_COACH_ID || "W1C937193").toUpperCase();

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

const buildWhatsAppMessage = (order) =>
  [
    "Congratulations! Your order was placed successfully.",
    `Order ID: ${order._id}`,
    `Herbalife ID: ${order.userId?.coachId || "Unknown"}`,
    `Training: ${order.eventId?.title || "Unknown event"}`,
    `Date: ${order.eventId?.date || ""}`,
    `Location: ${order.eventId?.location || ""}`,
    `Tickets: ${order.quantity}`,
    `Amount: Rs. ${order.amount}`,
    `Status: ${order.status}`
  ].join("\n");

const buildWhatsAppLink = (order) => {
  if (!order.whatsapp_number) {
    return "";
  }

  const number = order.whatsapp_number.startsWith("91")
    ? order.whatsapp_number
    : `91${order.whatsapp_number}`;

  return `https://wa.me/${number}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`;
};

const parseEventEndDate = (eventDate) => {
  const match = String(eventDate || "").trim().match(/^(\d{1,2})\s+([A-Z]+)\s+(\d{4})$/i);

  if (!match) {
    return null;
  }

  const months = {
    JANUARY: 0,
    FEBRUARY: 1,
    MARCH: 2,
    APRIL: 3,
    MAY: 4,
    JUNE: 5,
    JULY: 6,
    AUGUST: 7,
    SEPTEMBER: 8,
    OCTOBER: 9,
    NOVEMBER: 10,
    DECEMBER: 11
  };
  const day = Number(match[1]);
  const month = months[match[2].toUpperCase()];
  const year = Number(match[3]);

  if (!Number.isInteger(day) || month === undefined || !Number.isInteger(year)) {
    return null;
  }

  return new Date(year, month, day, 23, 59, 59, 999);
};

const isEventOver = (eventDate) => {
  const endDate = parseEventEndDate(eventDate);
  return Boolean(endDate && endDate < new Date());
};

const getConfirmedOrders = () =>
  Order.find({ status: "CONFIRMED" })
    .populate("userId", "coachId")
    .populate("eventId", "title date location ticket_price")
    .sort({ booked_at: -1 });

const getPendingOrders = async () => {
  const pendingOrders = await Order.find({ status: "PENDING_VERIFICATION" })
    .populate("userId", "coachId")
    .populate("eventId", "title date location ticket_price")
    .sort({ submitted_at: -1, booked_at: -1 });

  const expiredPendingOrders = pendingOrders.filter((order) =>
    isEventOver(order.eventId?.date)
  );

  if (expiredPendingOrders.length > 0) {
    await Order.updateMany(
      { _id: { $in: expiredPendingOrders.map((order) => order._id) } },
      {
        $set: {
          status: "CANCELLED",
          admin_note: "Event ended before payment verification"
        }
      }
    );
  }

  return pendingOrders.filter((order) => !isEventOver(order.eventId?.date));
};

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
  whatsappNumber: order.whatsapp_number || "",
  whatsappLink: buildWhatsAppLink(order),
  paymentMethod: order.payment_method || "",
  status: order.status,
  bookedAt: order.booked_at,
  submittedAt: order.submitted_at,
  verifiedAt: order.verified_at,
  adminNote: order.admin_note || ""
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  try {
    let adminUser = await User.findOne({ coachId: ADMIN_COACH_ID });

    if (!adminUser) {
      adminUser = await User.create({ coachId: ADMIN_COACH_ID });
    }

    const token = jwt.sign(
      {
        userId: adminUser._id,
        coachId: adminUser.coachId,
        role: "admin",
        username: ADMIN_USERNAME
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      username: ADMIN_USERNAME,
      userId: adminUser._id,
      coachId: adminUser.coachId,
      role: "admin"
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Admin login failed" });
  }
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

    if (isEventOver(order.eventId?.date)) {
      order.status = "CANCELLED";
      order.admin_note = "Event ended before payment verification";
      await order.save();
      return res.status(400).json({
        code: "EVENT_OVER",
        orderId: order._id,
        message: "This event is already over. Pending payment was removed."
      });
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

    if (isEventOver(order.eventId?.date)) {
      order.status = "CANCELLED";
      order.admin_note = "Event ended before payment verification";
      await order.save();
      return res.status(400).json({
        code: "EVENT_OVER",
        orderId: order._id,
        message: "This event is already over. Pending payment was removed."
      });
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

    const normalizedCoachIds = rawCoachIds
      .map((coachId) => String(coachId || "").trim().toUpperCase())
      .filter(Boolean);
    const seenCoachIds = new Set();
    const duplicateCoachIds = [];
    const uniqueCoachIds = [];

    normalizedCoachIds.forEach((coachId) => {
      if (seenCoachIds.has(coachId)) {
        duplicateCoachIds.push(coachId);
        return;
      }

      seenCoachIds.add(coachId);
      uniqueCoachIds.push(coachId);
    });

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
        skipped: duplicateCoachIds,
        duplicate: duplicateCoachIds,
        existing: [],
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
      skipped: [...Array.from(existingCoachIds), ...duplicateCoachIds],
      duplicate: duplicateCoachIds,
      existing: Array.from(existingCoachIds),
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
      "WhatsApp Number",
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
          row.whatsappNumber,
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
