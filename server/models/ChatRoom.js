const mongoose = require("mongoose");

/**
 * ChatRoom Schema
 * Supports both direct (1-on-1) and group chat rooms.
 * Participants array holds references to User documents.
 */
const chatRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Room name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: "",
    },
    roomType: {
      type: String,
      enum: ["direct", "group"],
      default: "group",
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Validation: Direct rooms need exactly 2 participants ──────────────────────
chatRoomSchema.pre("save", function (next) {
  if (this.roomType === "direct" && this.participants.length !== 2) {
    return next(new Error("Direct rooms must have exactly 2 participants"));
  }
  if (this.roomType === "group" && !this.name) {
    return next(new Error("Group rooms must have a name"));
  }
  next();
});

// ─── Index for participant-based queries ───────────────────────────────────────
chatRoomSchema.index({ participants: 1 });

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
