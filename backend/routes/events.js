const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const { addEffectiveTicketPrice } = require("../utils/eventPricing");

const defaultEvents = [
  {
    title: "WELLNESS SEMINAR",
    description: "HEALTH WEALTH AND REAL HAPPINESS",
    ticket_price: 500,
    location: "RAJAPALAYAM AND TIRUNELVELI",
    date: "19 JULY 2026"
  },
  {
    title: "ASSOCIATE ACADEMY",
    description: "RECOGNITIONS, SUCCESS STORY",
    ticket_price: 600,
    location: "A. K. AYYANAR NADAR MAHAL, RAJAPALAYAM",
    date: "3 JULY 2026"
  },
  {
    title: "SUPERVISOR WORKSHOP",
    description: "LET'S GROOM AND DEVELOP",
    ticket_price: 800,
    location: "SANKARANKOVIL",
    date: "4 JULY 2026"
  }
];

const legacyEventTitles = [
  "Leadership Training Level 1",
  "Advanced Business Training"
];


const addBookingStatus = (event) => {
  const eventData = addEffectiveTicketPrice(event);

  return {
    ...eventData,
    bookingOpen: eventData.bookingOpen
  };
};

const syncDefaultEvents = async () => {
  const count = await Event.countDocuments();

  if (count === 0) {
    await Event.insertMany(defaultEvents);
    return;
  }

  await Promise.all(
    defaultEvents.map(async (event, index) => {
      const existingEvent = await Event.findOne({
        title: {
          $in: [event.title, legacyEventTitles[index]].filter(Boolean)
        }
      });

      if (existingEvent) {
        await Event.findByIdAndUpdate(existingEvent._id, event);
        return;
      }

      await Event.create(event);
    })
  );
};

const seedEventsIfEmpty = async () => {
  await syncDefaultEvents();
};

router.get("/", async (req, res) => {
  try {
    await seedEventsIfEmpty();
    const events = await Event.find({
      title: { $in: defaultEvents.map((event) => event.title) }
    }).sort({ createdAt: 1 });
    res.json(events.map(addBookingStatus));
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

    res.json(addBookingStatus(event));
  } catch (err) {
    console.error("Get event error:", err);
    res.status(500).json({ message: "Failed to load event" });
  }
});

module.exports = router;
