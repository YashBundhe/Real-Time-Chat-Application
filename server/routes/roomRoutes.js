const express = require("express");
const router = express.Router();
const { getRooms, createRoom, createDirectRoom, getRoomById, deleteRoom } = require("../controllers/roomController");
const { protect } = require("../middleware/auth");

// All room routes require authentication
router.use(protect);

router.get("/", getRooms);              // GET  /api/rooms
router.post("/", createRoom);           // POST /api/rooms  (group)
router.post("/direct", createDirectRoom); // POST /api/rooms/direct
router.get("/:id", getRoomById);        // GET  /api/rooms/:id
router.delete("/:id", deleteRoom);      // DELETE /api/rooms/:id

module.exports = router;
