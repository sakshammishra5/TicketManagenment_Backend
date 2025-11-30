const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const { getProfileDetail } = require("../controller/profile.controller");
const router = express.Router();

router.get("/getProfile",verifyToken,getProfileDetail)

module.exports = router