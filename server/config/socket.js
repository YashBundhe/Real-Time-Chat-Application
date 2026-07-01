const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");

/**
 * Socket.IO Event Handler
 * Called once per authenticated socket connection.
 *
 * Events handled:
 *  ➜ joinRoom       — Join a chat room
 *  ➜ leaveRoom      — Leave a chat room
 *  ➜ sendMessage    — Broadcast a message to a room
 *  ➜ typing         — Broadcast typing indicator
 *  ➜ stopTyping     — Broadcast stop typing
 *  ➜ disconnect     — Mark user offline
 */
const socketHandler = (io) => {
  // Map to track userId → socketId for online presence
  const onlineUsers = new Map();

  io.on("connection", async (socket) => {
    const user = socket.user; // Attached by socketAuth middleware
    console.log(`🔌 Connected: ${user.name} (${socket.id})`);

    try {
      // ── Mark user as online ──────────────────────────────────────────────────
      await User.findByIdAndUpdate(user._id, {
        isOnline: true,
        socketId: socket.id,
        lastSeen: Date.now(),
      });

      onlineUsers.set(user._id.toString(), socket.id);

      // Broadcast to ALL clients that this user is now online
      io.emit("userOnline", {
        userId: user._id,
        name: user.name,
        isOnline: true,
      });

      // ── Join Room ────────────────────────────────────────────────────────────
      socket.on("joinRoom", async (roomId) => {
        try {
          // Verify membership before allowing join
          const room = await ChatRoom.findOne({
            _id: roomId,
            participants: user._id,
          });

          if (!room) {
            socket.emit("error", { message: "Room not found or access denied." });
            return;
          }

          socket.join(roomId);
          console.log(`📥 ${user.name} joined room: ${roomId}`);

          // Notify others in the room
          socket.to(roomId).emit("userJoined", {
            userId: user._id,
            name: user.name,
            roomId,
          });
        } catch (err) {
          console.error("joinRoom error:", err.message);
          socket.emit("error", { message: "Failed to join room." });
        }
      });

      // ── Leave Room ───────────────────────────────────────────────────────────
      socket.on("leaveRoom", (roomId) => {
        socket.leave(roomId);
        console.log(`📤 ${user.name} left room: ${roomId}`);

        socket.to(roomId).emit("userLeft", {
          userId: user._id,
          name: user.name,
          roomId,
        });
      });

      // ── Send Message ─────────────────────────────────────────────────────────
      socket.on("sendMessage", async (data) => {
        try {
          const { roomId, content } = data;

          if (!roomId || !content?.trim()) {
            socket.emit("error", { message: "roomId and content are required." });
            return;
          }

          // Verify the user is still a participant
          const room = await ChatRoom.findOne({
            _id: roomId,
            participants: user._id,
          });

          if (!room) {
            socket.emit("error", { message: "Room not found or access denied." });
            return;
          }

          // Persist message to MongoDB
          const message = await Message.create({
            sender: user._id,
            content: content.trim(),
            roomId,
          });

          // Update room's lastMessage
          await ChatRoom.findByIdAndUpdate(roomId, { lastMessage: message._id });

          // Populate sender details before broadcasting
          const populated = await message.populate("sender", "name email avatar");

          // Emit to ALL users in the room (including sender for confirmation)
          io.to(roomId).emit("receiveMessage", populated);
        } catch (err) {
          console.error("sendMessage error:", err.message);
          socket.emit("error", { message: "Failed to send message." });
        }
      });

      // ── Typing Indicator ─────────────────────────────────────────────────────
      socket.on("typing", ({ roomId }) => {
        // Broadcast to room EXCEPT the sender
        socket.to(roomId).emit("userTyping", {
          userId: user._id,
          name: user.name,
          roomId,
        });
      });

      socket.on("stopTyping", ({ roomId }) => {
        socket.to(roomId).emit("userStopTyping", {
          userId: user._id,
          roomId,
        });
      });

      // ── Disconnect ───────────────────────────────────────────────────────────
      socket.on("disconnect", async () => {
        console.log(`🔌 Disconnected: ${user.name} (${socket.id})`);

        try {
          await User.findByIdAndUpdate(user._id, {
            isOnline: false,
            socketId: null,
            lastSeen: Date.now(),
          });

          onlineUsers.delete(user._id.toString());

          // Notify all clients that this user went offline
          io.emit("userOffline", {
            userId: user._id,
            name: user.name,
            isOnline: false,
            lastSeen: new Date(),
          });
        } catch (err) {
          console.error("disconnect handler error:", err.message);
        }
      });
    } catch (err) {
      console.error("Socket connection error:", err.message);
      socket.disconnect();
    }
  });
};

module.exports = socketHandler;
