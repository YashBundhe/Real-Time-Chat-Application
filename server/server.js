require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { socketAuth } = require("./middleware/auth");
const socketHandler = require("./config/socket");
const errorHandler = require("./middleware/errorHandler");

// ── Route Imports ─────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const roomRoutes = require("./routes/roomRoutes");
const messageRoutes = require("./routes/messageRoutes");

// ── Initialize App ────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app); // Wrap express in HTTP server for Socket.IO

// ── Socket.IO Setup ───────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000, // 60s before considering client disconnected
});

// Authenticate every socket connection before allowing events
io.use(socketAuth);

// Register all socket event listeners
socketHandler(io);

// ── Express Middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Chat API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ── Global Error Handler (MUST be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Connect DB & Start Server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📡 Socket.IO listening for connections\n`);
  });
};

startServer();

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server gracefully...");
  httpServer.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});

module.exports = { app, httpServer }; // Export for testing
