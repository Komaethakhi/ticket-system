const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  // who booked the ticket
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // which event
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  // payment related
  payment_id: {
    type: String
  },

  razorpay_order_id: {
    type: String
  },

  razorpay_signature: {
    type: String
  },

  amount: {
    type: Number,
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    default: 1
  },

  // ticket status
  status: {
    type: String,
    enum: ["PENDING", "CONFIRMED", "CANCELLED", "USED"],
    default: "PENDING"
  },

  // entry validation
  check_in: {
    type: Boolean,
    default: false
  },

  booked_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", orderSchema);
