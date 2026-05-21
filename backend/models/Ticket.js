const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coach",
      required: true
    },
    trainingId: {
      type: String, // 👈 IMPORTANT (string dhaan)
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    bookedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
