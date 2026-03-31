const express = require("express");
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getTaskById,
  getUserTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");

// All task routes are protected
router.use(authMiddleware);

router.post("/", createTask);              // POST   /api/tasks
router.get("/", getAllTasks);              // GET    /api/tasks
router.get("/user-tasks", getUserTasks);   // GET    /api/tasks/user-tasks  ← assigned to me
router.get("/:id", getTaskById);           // GET    /api/tasks/:id
router.put("/:id", updateTask);            // PUT    /api/tasks/:id
router.delete("/:id", deleteTask);         // DELETE /api/tasks/:id

module.exports = router;
