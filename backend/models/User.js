const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    coachId: {
      type: String,
      required: true,
      unique: true,
      length: 10
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);