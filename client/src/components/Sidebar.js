import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useSocket } from "../context/SocketContext";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const {
    rooms, users, activeRoom, notifications, onlineUsers,
    selectRoom, openDirectMessage, createRoom, loadingRooms,
  } = useChat();

  const [activeTab, setActiveTab] = useState("rooms"); // "rooms" | "users"
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDesc, setNewRoomDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const getLastMessagePreview = (room) => {
    if (!room.lastMessage) return "No messages yet";
    const senderName =
      room.lastMessage.sender?._id === user?._id
        ? "You"
        : room.lastMessage.sender?.name || "";
    const text = room.lastMessage.content?.slice(0, 40) || "";
    return senderName ? `${senderName}: ${text}` : text;
  };

  const getRoomDisplayName = (room) => {
    if (room.roomType === "direct") {
      const other = room.participants?.find((p) => p._id !== user?._id);
      return other?.name || "Direct Message";
    }
    return room.name;
  };

  const getRoomOnlineStatus = (room) => {
    if (room.roomType !== "direct") return null;
    const other = room.participants?.find((p) => p._id !== user?._id);
    return other ? onlineUsers[other._id] : false;
  };

  const filteredRooms = rooms.filter((r) =>
    getRoomDisplayName(r).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Create room handler ──────────────────────────────────────────────────────
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return toast.error("Room name is required.");
    setCreatingRoom(true);
    const result = await createRoom(newRoomName.trim(), newRoomDesc.trim(), []);
    setCreatingRoom(false);
    if (result.success) {
      toast.success(`#${newRoomName} created!`);
      setShowCreateModal(false);
      setNewRoomName("");
      setNewRoomDesc("");
      onClose?.();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="sidebar-inner">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="brand-name">ChatApp</span>
          <div className={`connection-badge ${isConnected ? "connected" : "disconnected"}`}>
            {isConnected ? "Live" : "Offline"}
          </div>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Current User ────────────────────────────────────────────────────── */}
      <div className="sidebar-user">
        <div className="avatar avatar--md">
          {getInitials(user?.name)}
          <span className="avatar-online-dot" />
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.name}</span>
          <span className="sidebar-user-status">● Online</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="sidebar-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="search-icon">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={`Search ${activeTab}…`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === "rooms" ? "active" : ""}`}
          onClick={() => setActiveTab("rooms")}
        >
          Rooms
          {notifications.length > 0 && (
            <span className="badge">{notifications.reduce((a, n) => a + n.count, 0)}</span>
          )}
        </button>
        <button
          className={`sidebar-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          People
          <span className="badge badge--online">
            {users.filter((u) => onlineUsers[u._id]).length}
          </span>
        </button>
      </div>

      {/* ── Room / User List ─────────────────────────────────────────────────── */}
      <div className="sidebar-list">
        {activeTab === "rooms" ? (
          <>
            {loadingRooms ? (
              <div className="list-loading">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton-item" />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="list-empty">
                <p>No rooms yet.</p>
                <button className="btn-link" onClick={() => setShowCreateModal(true)}>
                  Create one
                </button>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const notif = notifications.find((n) => n.roomId === room._id);
                const isOnline = getRoomOnlineStatus(room);
                return (
                  <button
                    key={room._id}
                    className={`room-item ${activeRoom?._id === room._id ? "room-item--active" : ""}`}
                    onClick={() => { selectRoom(room); onClose?.(); }}
                  >
                    <div className="room-avatar">
                      {room.roomType === "direct" ? (
                        <>
                          {getInitials(getRoomDisplayName(room))}
                          {isOnline !== null && (
                            <span className={`room-online-dot ${isOnline ? "online" : "offline"}`} />
                          )}
                        </>
                      ) : (
                        <span className="room-hash">#</span>
                      )}
                    </div>
                    <div className="room-info">
                      <div className="room-name-row">
                        <span className="room-name">{getRoomDisplayName(room)}</span>
                        {room.lastMessage?.createdAt && (
                          <span className="room-time">
                            {formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <span className="room-preview">{getLastMessagePreview(room)}</span>
                    </div>
                    {notif && <span className="unread-badge">{notif.count}</span>}
                  </button>
                );
              })
            )}
          </>
        ) : (
          filteredUsers.map((u) => (
            <button
              key={u._id}
              className="room-item"
              onClick={() => { openDirectMessage(u._id); onClose?.(); }}
            >
              <div className="room-avatar">
                {getInitials(u.name)}
                <span className={`room-online-dot ${onlineUsers[u._id] ? "online" : "offline"}`} />
              </div>
              <div className="room-info">
                <div className="room-name-row">
                  <span className="room-name">{u.name}</span>
                  <span className={`user-status-text ${onlineUsers[u._id] ? "online" : "offline"}`}>
                    {onlineUsers[u._id] ? "Online" : "Offline"}
                  </span>
                </div>
                <span className="room-preview">{u.email}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* ── Create Room Button ───────────────────────────────────────────────── */}
      {activeTab === "rooms" && (
        <button className="create-room-btn" onClick={() => setShowCreateModal(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Room
        </button>
      )}

      {/* ── Create Room Modal ─────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create a Room</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateRoom} className="modal-form">
              <div className="form-group">
                <label>Room name</label>
                <input
                  type="text"
                  placeholder="e.g. general"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  type="text"
                  placeholder="What's this room about?"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creatingRoom}>
                  {creatingRoom ? <span className="spinner-inline" /> : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
