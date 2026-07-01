const express = require("express");
const router = express.Router();
const { register, login, getMe, logout, getAllUsers } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// ── Public routes ────────────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);

// ── Protected routes (require valid JWT) ─────────────────────────────────────
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.get("/users", protect, getAllUsers);

module.exports = router;
