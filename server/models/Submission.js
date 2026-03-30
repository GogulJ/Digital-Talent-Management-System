const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submissionLink: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Submitted", "Reviewed", "Approved", "Rejected"],
      default: "Submitted",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
