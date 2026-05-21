const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

const defaultEvents = [
  {
    title: "Leadership Training Level 1",
    description: "Basic leadership skills training",
    ticket_price: 500,
    location: "Chennai",
    date: "10 Jan 2026"
  },
  {
    title: "Advanced Business Training",
    description: "Advanced strategies for leaders",
    ticket_price: 1000,
    location: "Chennai",
    date: "15 Jan 2026"
  }
];

const seedEventsIfEmpty = async () => {
  const count = await Event.countDocuments();

  if (count === 0) {
    await Event.insertMany(defaultEvents);
  }
};

router.get("/", async (req, res) => {
  try {
    await seedEventsIfEmpty();
    const events = await Event.find().sort({ createdAt: 1 });
    res.json(events);
  } catch (err) {
    console.error("Get events error:", err);
    res.status(500).json({ message: "Failed to load events" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (err) {
    console.error("Get event error:", err);
    res.status(500).json({ message: "Failed to load event" });
  }
});

module.exports = router;
