const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  submitTask,
  getSubmissions,
  getMySubmissions,
  getSubmissionsByUser,
  updateSubmissionStatus,
} = require("../controllers/submissionController");

// POST /api/submissions/submit-task   → Submit a task
router.post("/submit-task", authMiddleware, submitTask);

// PUT  /api/submissions/update-status → Admin: Approve / Reject / Review
router.put("/update-status", authMiddleware, updateSubmissionStatus);

// GET  /api/submissions               → Get all submissions
router.get("/", authMiddleware, getSubmissions);

// GET  /api/submissions/my            → Get my submissions (must be before /:userId)
router.get("/my", authMiddleware, getMySubmissions);

// GET  /api/submissions/:userId       → Get submissions by a specific user
router.get("/:userId", authMiddleware, getSubmissionsByUser);

module.exports = router;
