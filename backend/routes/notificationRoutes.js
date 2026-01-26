const express = require("express");
const router = express.Router();
const { getNotifications, getUserNotifications } = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware=require("../middleware/adminMiddleware");

// All notification routes are protected
router.get("/admin", authMiddleware, adminMiddleware, getNotifications);
router.get("/user", authMiddleware, getUserNotifications);

module.exports = router;