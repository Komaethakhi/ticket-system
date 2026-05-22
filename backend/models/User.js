const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    coachId: {
      type: String,
      required: true,
      unique: true,
      minlength: 9,
      maxlength: 10,
      trim: true,
      uppercase: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
