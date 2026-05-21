const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware, JWT_SECRET } = require("../middleware/auth");

router.post("/login", async (req, res) => {
  try {
    const { coachId } = req.body;

    if (!coachId || !/^[a-zA-Z0-9]{10}$/.test(coachId)) {
      return res.status(400).json({ message: "Invalid Herbalife ID" });
    }

    let user = await User.findOne({ coachId });

    if (!user) {
      return res.status(401).json({ message: "Herbalife ID not found" });
    }

    const token = jwt.sign(
      { userId: user._id, coachId: user.coachId },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      userId: user._id,
      coachId: user.coachId
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
    coachId: req.user.coachId
  });
});

module.exports = router;
