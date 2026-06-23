const express = require("express");
const router = express.Router();

const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Event = require("../models/Event");


router.post("/book", async (req, res) => {
  try {
    const { coachId, eventId, quantity } = req.body;

    if (!coachId || !eventId || !quantity) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // optional validation
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }


    const ticket = await Ticket.create({
      coachId,
      eventId,
      quantity
    });

    res.json({
      message: "Booking successful",
      ticket
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Booking failed" });
  }
});

module.exports = router;
