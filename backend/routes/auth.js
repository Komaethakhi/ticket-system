const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware, JWT_SECRET } = require("../middleware/auth");

const ADMIN_COACH_ID = (process.env.ADMIN_COACH_ID || "W1C937193").toUpperCase();

router.post("/login", async (req, res) => {
  try {
    const { coachId } = req.body;
    const normalizedCoachId = String(coachId || "").trim().toUpperCase();

    if (!/^[A-Z0-9]{8,10}$/.test(normalizedCoachId)) {
      return res.status(400).json({ message: "Invalid Herbalife ID" });
    }

    let user = await User.findOne({ coachId: normalizedCoachId });

    if (!user) {
      return res.status(401).json({ message: "Herbalife ID not found" });
    }

    const role = user.coachId === ADMIN_COACH_ID ? "admin" : "coach";
    const token = jwt.sign(
      { userId: user._id, coachId: user.coachId, role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      userId: user._id,
      coachId: user.coachId,
      role
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  res.json({
    success: true,
    userId: req.user.userId,
    coachId: req.user.coachId,
    role: req.user.role || "coach"
  });
});

module.exports = router;
