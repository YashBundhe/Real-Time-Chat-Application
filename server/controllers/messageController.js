const Message = require("../models/Message");
const ChatRoom = require("../models/ChatRoom");

/**
 * @desc    Get paginated messages for a room
 * @route   GET /api/messages/:roomId
 * @access  Private
 * @query   page (default 1), limit (default 50)
 */
const getMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Verify the user is a participant in this room
    const room = await ChatRoom.findOne({
      _id: roomId,
      participants: req.user._id,
    });

    if (!room) {
      return res.status(403).json({
        success: false,
        message: "Room not found or you are not a participant.",
      });
    }

    const [messages, total] = await Promise.all([
      Message.find({ roomId, isDeleted: false })
        .populate("sender", "name email avatar")
        .sort({ createdAt: -1 }) // Newest first (client reverses for display)
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ roomId, isDeleted: false }),
    ]);

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // Return oldest-first for UI rendering
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message to a room (REST fallback; Socket.IO is primary)
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { roomId, content } = req.body;

    if (!roomId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "roomId and content are required.",
      });
    }

    // Ensure user is in the room
    const room = await ChatRoom.findOne({
      _id: roomId,
      participants: req.user._id,
    });

    if (!room) {
      return res.status(403).json({
        success: false,
        message: "Room not found or you are not a participant.",
      });
    }

    const message = await Message.create({
      sender: req.user._id,
      content: content.trim(),
      roomId,
    });

    // Update room's lastMessage pointer
    await ChatRoom.findByIdAndUpdate(roomId, { lastMessage: message._id });

    const populated = await message.populate("sender", "name email avatar");

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft-delete a message (only sender can delete)
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages.",
      });
    }

    message.isDeleted = true;
    message.content = "This message was deleted.";
    await message.save();

    res.status(200).json({ success: true, message: "Message deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMessages, sendMessage, deleteMessage };
