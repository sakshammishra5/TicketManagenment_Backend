const express = require("express");
const {getDashboardStats } = require("../controller/analyticsController");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();


// GET /api/analytics/reply-time
router.get("/dashboard",verifyToken, getDashboardStats);

module.exports = router;