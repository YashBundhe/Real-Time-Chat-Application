const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");

/**
 * @desc    Get all rooms the current user is a participant of
 * @route   GET /api/rooms
 * @access  Private
 */
const getRooms = async (req, res, next) => {
  try {
    const rooms = await ChatRoom.find({ participants: req.user._id })
      .populate("participants", "name email avatar isOnline lastSeen")
      .populate("admin", "name email")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name" },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: rooms.length, rooms });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new group chat room
 * @route   POST /api/rooms
 * @access  Private
 */
const createRoom = async (req, res, next) => {
  try {
    const { name, description, participants } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Room name is required.",
      });
    }

    // Always include the creator in participants
    const allParticipants = [
      ...new Set([req.user._id.toString(), ...(participants || [])]),
    ];

    const room = await ChatRoom.create({
      name,
      description,
      roomType: "group",
      participants: allParticipants,
      admin: req.user._id,
    });

    const populated = await room.populate(
      "participants",
      "name email avatar isOnline"
    );

    res.status(201).json({ success: true, room: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or fetch a direct (1-on-1) chat room
 * @route   POST /api/rooms/direct
 * @access  Private
 */
const createDirectRoom = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Target user ID is required.",
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot create a room with yourself.",
      });
    }

    // Check if a direct room already exists between these two users
    const existing = await ChatRoom.findOne({
      roomType: "direct",
      participants: { $all: [req.user._id, userId], $size: 2 },
    }).populate("participants", "name email avatar isOnline lastSeen");

    if (existing) {
      return res.status(200).json({ success: true, room: existing });
    }

    // Create new direct room
    const room = await ChatRoom.create({
      roomType: "direct",
      participants: [req.user._id, userId],
    });

    const populated = await room.populate(
      "participants",
      "name email avatar isOnline lastSeen"
    );

    res.status(201).json({ success: true, room: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single room by ID
 * @route   GET /api/rooms/:id
 * @access  Private
 */
const getRoomById = async (req, res, next) => {
  try {
    const room = await ChatRoom.findById(req.params.id)
      .populate("participants", "name email avatar isOnline lastSeen")
      .populate("admin", "name email");

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }

    // Verify the requesting user is a participant
    const isMember = room.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this room.",
      });
    }

    res.status(200).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a room (admin only)
 * @route   DELETE /api/rooms/:id
 * @access  Private
 */
const deleteRoom = async (req, res, next) => {
  try {
    const room = await ChatRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }

    if (room.admin?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the room admin can delete this room.",
      });
    }

    // Delete all messages in the room as well
    await Message.deleteMany({ roomId: room._id });
    await room.deleteOne();

    res.status(200).json({ success: true, message: "Room deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRooms, createRoom, createDirectRoom, getRoomById, deleteRoom };
