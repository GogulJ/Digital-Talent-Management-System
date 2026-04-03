const Submission = require("../models/Submission");

// @route   POST /api/submissions/submit-task
// @desc    Submit a task
// @access  Private
const submitTask = async (req, res) => {
  try {
    const { taskId, submissionLink } = req.body;
    const userId = req.user.id;

    if (!taskId || !submissionLink) {
      return res
        .status(400)
        .json({ msg: "taskId and submissionLink are required" });
    }

    const submission = new Submission({
      taskId,
      userId,
      submissionLink,
      status: "Submitted", // default status
    });

    await submission.save();

    res.status(201).json({
      msg: "Task submitted successfully ✅",
      submission,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @route   GET /api/submissions
// @desc    Get all submissions (admin/manager use)
// @access  Private
const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate("taskId", "title description")
      .populate("userId", "name email")
      .sort({ submittedAt: -1 });

    res.status(200).json(submissions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @route   GET /api/submissions/my
// @desc    Get submissions of the logged-in user
// @access  Private
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user.id })
      .populate("taskId", "title description dueDate")
      .sort({ submittedAt: -1 });

    res.status(200).json(submissions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @route   GET /api/submissions/:userId
// @desc    Get all submissions by a specific user (admin/manager view)
// @access  Private
const getSubmissionsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const submissions = await Submission.find({ userId })
      .populate("taskId", "title description dueDate status")
      .populate("userId", "name email")
      .sort({ submittedAt: -1 });

    res.status(200).json({
      count: submissions.length,
      submissions,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

// @route   PUT /api/submissions/update-status
// @desc    Update submission status (Admin: Approve / Reject / Reviewed)
// @access  Private
const updateSubmissionStatus = async (req, res) => {
  try {
    const { submissionId, status } = req.body;

    const ALLOWED = ["Submitted", "Reviewed", "Approved", "Rejected"];
    if (!submissionId || !status) {
      return res.status(400).json({ msg: "submissionId and status are required" });
    }
    if (!ALLOWED.includes(status)) {
      return res.status(400).json({ msg: `status must be one of: ${ALLOWED.join(", ")}` });
    }

    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      { status },
      { new: true }
    )
      .populate("taskId", "title description")
      .populate("userId", "name email");

    if (!submission) {
      return res.status(404).json({ msg: "Submission not found" });
    }

    res.status(200).json({
      msg: `Submission ${status} successfully ✅`,
      submission,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

module.exports = {
  submitTask,
  getSubmissions,
  getMySubmissions,
  getSubmissionsByUser,
  updateSubmissionStatus,
};
