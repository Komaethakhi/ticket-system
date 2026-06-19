const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const Order = require("../models/Order");
const User = require("../models/User");
const { buildOrderWhatsAppLink } = require("../utils/whatsapp");
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

const normalizeMobileNumber = (number) => String(number || "").replace(/\D/g, "");

const isValidMobileNumber = (number) => {
  if (!number) {
    return true;
  }

  return number.length >= 10 && number.length <= 15;
};

const buildCoachGreetingMessage = (coach) =>
  [
    `Vanakkam ${coach.coachId},`,
    "Welcome to Herbalife Training Portal.",
    "Your Herbalife ID is active for event ticket booking.",
    "Please login, choose your event, and complete payment to confirm your ticket."
  ].join("\n");

const buildCoachGreetingLink = (coach) => {
  if (!coach.mobileNumber) {
    return "";
  }

  const number = coach.mobileNumber.startsWith("91")
    ? coach.mobileNumber
    : `91${coach.mobileNumber}`;

  return `https://wa.me/${number}?text=${encodeURIComponent(buildCoachGreetingMessage(coach))}`;
};

const formatCoachContact = (coach) => ({
  id: coach._id,
  coachId: coach.coachId,
  mobileNumber: coach.mobileNumber || "",
  greetingLink: buildCoachGreetingLink(coach),
  createdAt: coach.createdAt,
  updatedAt: coach.updatedAt
});

const parseCoachContactEntry = (entry) => {
  const text = String(entry || "").trim().toUpperCase();
  const coachMatch = text.match(/(?=[A-Z0-9]*[A-Z])[A-Z0-9]{9,10}/);

  if (!coachMatch) {
    return {
      coachId: "",
      mobileNumber: "",
      raw: text
    };
  }

  const coachId = coachMatch[0];
  const mobileNumber = normalizeMobileNumber(text.replace(coachId, ""));

  return {
    coachId,
    mobileNumber,
    raw: text
  };
};

const getConfirmedOrders = () =>
  Order.find({ status: "CONFIRMED" })
    .populate("userId", "coachId mobileNumber")
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
  transactionId: order.transaction_id || "",
  whatsappNumber: order.whatsapp_number || order.userId?.mobileNumber || "",
  whatsappLink: buildOrderWhatsAppLink(order),
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
    const [orders, coaches] = await Promise.all([
      getConfirmedOrders(),
      User.find().select("coachId mobileNumber createdAt updatedAt").sort({ coachId: 1 })
    ]);
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
        uniqueCoaches: coachSummary.length,
        registeredCoachIds: coaches.length,
        coachContacts: coaches.filter((coach) => coach.mobileNumber).length,
        missingCoachContacts: coaches.filter((coach) => !coach.mobileNumber).length
      },
      coachSummary,
      coachContacts: coaches.map(formatCoachContact),
      orders: rows
    });
  } catch (err) {
    console.error("Admin summary error:", err);
    res.status(500).json({ message: "Failed to load admin summary" });
  }
});

router.post("/coach-ids", adminAuthMiddleware, async (req, res) => {
  try {
    const rawCoachIds = Array.isArray(req.body.coachIds)
      ? req.body.coachIds
      : String(req.body.coachIds || "").split(/\n+/);

    const parsedEntries = rawCoachIds
      .map(parseCoachContactEntry)
      .filter((entry) => entry.raw);
    const seenCoachIds = new Set();
    const duplicateCoachIds = [];
    const uniqueEntries = [];

    parsedEntries.forEach((entry) => {
      if (seenCoachIds.has(entry.coachId)) {
        duplicateCoachIds.push(entry.coachId || entry.raw);
        return;
      }

      if (entry.coachId) {
        seenCoachIds.add(entry.coachId);
      }
      uniqueEntries.push(entry);
    });

    const invalidCoachIds = uniqueEntries.filter(
      (entry) => !/^(?=[A-Z0-9]*[A-Z])[A-Z0-9]{9,10}$/.test(entry.coachId)
    ).map((entry) => entry.raw);
    const invalidMobileNumbers = uniqueEntries.filter(
      (entry) => entry.coachId && !entry.mobileNumber
    ).map((entry) => `${entry.coachId}: mobile number required`);
    const malformedMobileNumbers = uniqueEntries.filter(
      (entry) => entry.coachId && entry.mobileNumber && !isValidMobileNumber(entry.mobileNumber)
    ).map((entry) => `${entry.coachId}: ${entry.mobileNumber}`);
    const validEntries = uniqueEntries.filter(
      (entry) => /^(?=[A-Z0-9]*[A-Z])[A-Z0-9]{9,10}$/.test(entry.coachId) && entry.mobileNumber && isValidMobileNumber(entry.mobileNumber)
    );
    const validCoachIds = validEntries.map((entry) => entry.coachId);

    if (validCoachIds.length === 0) {
      return res.status(400).json({
        message: "Enter at least one valid 9 or 10 character Herbalife ID",
        added: [],
        skipped: duplicateCoachIds,
        duplicate: duplicateCoachIds,
        existing: [],
        updated: [],
        invalid: [...invalidCoachIds, ...invalidMobileNumbers, ...malformedMobileNumbers]
      });
    }

    const existingUsers = await User.find({
      coachId: { $in: validCoachIds }
    }).select("coachId");
    const existingCoachIds = new Set(existingUsers.map((user) => user.coachId));
    const newCoachIds = validCoachIds.filter(
      (coachId) => !existingCoachIds.has(coachId)
    );
    const mobileByCoachId = new Map(
      validEntries.map((entry) => [entry.coachId, entry.mobileNumber])
    );

    if (newCoachIds.length > 0) {
      await User.insertMany(
        newCoachIds.map((coachId) => ({
          coachId,
          mobileNumber: mobileByCoachId.get(coachId)
        }))
      );
    }

    const updateEntries = validEntries.filter(
      (entry) => existingCoachIds.has(entry.coachId) && entry.mobileNumber
    );

    if (updateEntries.length > 0) {
      await Promise.all(updateEntries.map((entry) =>
        User.updateOne(
          { coachId: entry.coachId },
          { $set: { mobileNumber: entry.mobileNumber } }
        )
      ));
    }

    res.status(201).json({
      success: true,
      added: newCoachIds,
      skipped: [...Array.from(existingCoachIds), ...duplicateCoachIds],
      duplicate: duplicateCoachIds,
      existing: Array.from(existingCoachIds),
      updated: updateEntries.map((entry) => entry.coachId),
      invalid: [...invalidCoachIds, ...invalidMobileNumbers, ...malformedMobileNumbers]
    });
  } catch (err) {
    console.error("Add coach IDs error:", err);
    res.status(500).json({ message: "Failed to add coach IDs" });
  }
});

router.put("/coaches/:id/contact", adminAuthMiddleware, async (req, res) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.mobileNumber);

    if (!isValidMobileNumber(mobileNumber)) {
      return res.status(400).json({ message: "Enter a valid mobile number" });
    }

    const coach = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { mobileNumber } },
      { new: true, runValidators: true }
    ).select("coachId mobileNumber createdAt updatedAt");

    if (!coach) {
      return res.status(404).json({ message: "Coach ID not found" });
    }

    res.json({
      success: true,
      coach: formatCoachContact(coach)
    });
  } catch (err) {
    console.error("Update coach contact error:", err);
    res.status(500).json({ message: "Failed to update coach contact" });
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
