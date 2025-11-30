const express = require("express");
const { registerUser, loginUser } = require("../controller/auth.controller");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser)
router.post("/verify",verifyToken)

module.exports = router