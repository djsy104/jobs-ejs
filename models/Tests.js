const mongoose = require("mongoose");
const TestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Test name must be provided."],
      maxlength: 30,
    },

    type: {
      type: String,
      required: [true, "Test type must be provided."],
      maxlength: 15,
    },

    status: {
      type: String,
      enum: ["Upcoming", "In Review", "Completed"],
      default: "Upcoming",
    },

    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide user"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Test", TestSchema);
