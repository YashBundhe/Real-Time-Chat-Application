const express = require("express");
const router = express.Router();
const { getMessages, sendMessage, deleteMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

// All message routes require authentication
router.use(protect);

router.get("/:roomId", getMessages);    // GET    /api/messages/:roomId?page=1&limit=50
router.post("/", sendMessage);          // POST   /api/messages
router.delete("/:id", deleteMessage);   // DELETE /api/messages/:id

module.exports = router;
