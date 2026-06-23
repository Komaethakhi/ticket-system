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

  payment_method: {
    type: String,
    enum: ["UPI_QR"],
    default: "UPI_QR"
  },

  transaction_id: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true,
    unique: true
  },
  payment_screenshot: {
    type: String
  },

  payment_screenshot_name: {
    type: String,
    trim: true
  },

  payment_screenshot_type: {
    type: String,
    trim: true
  },

  whatsapp_number: {
    type: String,
    trim: true
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
    enum: ["PENDING", "PAYMENT_SUBMITTED", "CONFIRMED", "CANCELLED", "USED"],
    default: "PENDING"
  },

  submitted_at: {
    type: Date
  },

  verified_at: {
    type: Date
  },

  admin_note: {
    type: String,
    trim: true
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
