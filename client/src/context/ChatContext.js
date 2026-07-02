import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef,
} from "react";
import { roomsAPI, messagesAPI, authAPI } from "../services/api";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);       // Messages for active room
  const [users, setUsers] = useState([]);             // All other users
  const [typingUsers, setTypingUsers] = useState({}); // { roomId: [{ userId, name }] }
  const [onlineUsers, setOnlineUsers] = useState({}); // { userId: bool }
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [notifications, setNotifications] = useState([]); // Unread badges
  const activeRoomRef = useRef(null);

  // Keep ref in sync with state (for use inside socket closures)
  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  // ── Fetch rooms & users on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    fetchRooms();
    fetchUsers();
  }, [user]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await roomsAPI.getRooms();
      setRooms(res.data.rooms);
    } catch (err) {
      console.error("Failed to fetch rooms:", err.message);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authAPI.getUsers();
      setUsers(res.data.users);
      // Seed online map from users list
      const map = {};
      res.data.users.forEach((u) => { map[u._id] = u.isOnline; });
      setOnlineUsers(map);
    } catch (err) {
      console.error("Failed to fetch users:", err.message);
    }
  };

  // ── Fetch messages when active room changes ─────────────────────────────────
  useEffect(() => {
    if (!activeRoom) return;
    fetchMessages(activeRoom._id);
    // Clear notification badge for this room
    setNotifications((prev) => prev.filter((n) => n.roomId !== activeRoom._id));
  }, [activeRoom]);

  const fetchMessages = async (roomId, page = 1) => {
    setLoadingMessages(true);
    try {
      const res = await messagesAPI.getMessages(roomId, page);
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Failed to fetch messages:", err.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  // ── Socket event listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Join active room whenever socket reconnects or room changes
    if (activeRoom) socket.emit("joinRoom", activeRoom._id);

    // New message received
    const handleReceiveMessage = (msg) => {
      const currentRoom = activeRoomRef.current;
      if (currentRoom && msg.roomId === currentRoom._id) {
        setMessages((prev) => [...prev, msg]);
      } else {
        // Add notification badge for other rooms
        setNotifications((prev) => {
          const exists = prev.find((n) => n.roomId === msg.roomId);
          if (exists) {
            return prev.map((n) =>
              n.roomId === msg.roomId ? { ...n, count: n.count + 1 } : n
            );
          }
          return [...prev, { roomId: msg.roomId, count: 1 }];
        });
      }
      // Update room's lastMessage in sidebar
      setRooms((prev) =>
        prev.map((r) =>
          r._id === msg.roomId ? { ...r, lastMessage: msg, updatedAt: msg.createdAt } : r
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    // Typing events
    const handleUserTyping = ({ userId, name, roomId }) => {
      setTypingUsers((prev) => {
        const roomTypers = prev[roomId] || [];
        if (roomTypers.find((u) => u.userId === userId)) return prev;
        return { ...prev, [roomId]: [...roomTypers, { userId, name }] };
      });
    };

    const handleUserStopTyping = ({ userId, roomId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [roomId]: (prev[roomId] || []).filter((u) => u.userId !== userId),
      }));
    };

    // Online/offline presence
    const handleUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: true }));
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isOnline: true } : u))
      );
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: false }));
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isOnline: false, lastSeen } : u))
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStopTyping", handleUserStopTyping);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStopTyping", handleUserStopTyping);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
    };
  }, [socket, activeRoom]);

  // ── Select a room ───────────────────────────────────────────────────────────
  const selectRoom = useCallback((room) => {
    if (activeRoomRef.current?._id === room._id) return;
    if (socket && activeRoomRef.current) {
      socket.emit("leaveRoom", activeRoomRef.current._id);
    }
    setMessages([]);
    setActiveRoom(room);
    if (socket) socket.emit("joinRoom", room._id);
  }, [socket]);

  // ── Send message via socket ─────────────────────────────────────────────────
  const sendMessage = useCallback((content) => {
    if (!socket || !activeRoom || !content.trim()) return;
    socket.emit("sendMessage", { roomId: activeRoom._id, content: content.trim() });
  }, [socket, activeRoom]);

  // ── Typing indicators ───────────────────────────────────────────────────────
  const emitTyping = useCallback(() => {
    if (socket && activeRoom) socket.emit("typing", { roomId: activeRoom._id });
  }, [socket, activeRoom]);

  const emitStopTyping = useCallback(() => {
    if (socket && activeRoom) socket.emit("stopTyping", { roomId: activeRoom._id });
  }, [socket, activeRoom]);

  // ── Create group room ───────────────────────────────────────────────────────
  const createRoom = useCallback(async (name, description, participants) => {
    try {
      const res = await roomsAPI.createRoom({ name, description, participants });
      const newRoom = res.data.room;
      setRooms((prev) => [newRoom, ...prev]);
      selectRoom(newRoom);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Failed to create room." };
    }
  }, [selectRoom]);

  // ── Open direct message with a user ────────────────────────────────────────
  const openDirectMessage = useCallback(async (userId) => {
    try {
      const res = await roomsAPI.createDirectRoom(userId);
      const room = res.data.room;
      setRooms((prev) => {
        const exists = prev.find((r) => r._id === room._id);
        return exists ? prev : [room, ...prev];
      });
      selectRoom(room);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Failed to open DM." };
    }
  }, [selectRoom]);

  // ── Get typing users for active room ────────────────────────────────────────
  const activeTypers = activeRoom ? (typingUsers[activeRoom._id] || []) : [];

  return (
    <ChatContext.Provider value={{
      rooms, activeRoom, messages, users,
      typingUsers: activeTypers, onlineUsers, notifications,
      loadingRooms, loadingMessages,
      selectRoom, sendMessage, createRoom, openDirectMessage,
      emitTyping, emitStopTyping, fetchRooms,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};

export default ChatContext;
