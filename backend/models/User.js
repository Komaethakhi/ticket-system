const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    coachId: {
      type: String,
      required: true,
      unique: true,
      minlength: 8,
      maxlength: 10,
      trim: true,
      uppercase: true
    },
    coachName: {
      type: String,
      trim: true
    },
    mobileNumber: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
