import React, { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import Message from "./Message";
import MessageInput from "./MessageInput";

const ChatWindow = () => {
  const { user } = useAuth();
  const { activeRoom, messages, typingUsers, loadingMessages } = useChat();
  const bottomRef = useRef(null);

  // ── Auto-scroll to bottom on new messages ──────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // ── Derive room display name ────────────────────────────────────────────────
  const getRoomDisplayName = () => {
    if (!activeRoom) return "";
    if (activeRoom.roomType === "direct") {
      return activeRoom.participants?.find((p) => p._id !== user?._id)?.name || "Direct Message";
    }
    return `# ${activeRoom.name}`;
  };

  const getRoomSubtitle = () => {
    if (!activeRoom) return "";
    if (activeRoom.roomType === "direct") {
      const other = activeRoom.participants?.find((p) => p._id !== user?._id);
      return other?.isOnline ? "● Online" : "● Offline";
    }
    return `${activeRoom.participants?.length || 0} members`;
  };

  const isOtherOnline = () => {
    if (activeRoom?.roomType !== "direct") return false;
    const other = activeRoom.participants?.find((p) => p._id !== user?._id);
    return other?.isOnline;
  };

  // ── Group messages by date ──────────────────────────────────────────────────
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="chat-window">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h2 className="chat-room-name">{getRoomDisplayName()}</h2>
          <span className={`chat-room-subtitle ${isOtherOnline() ? "online" : ""}`}>
            {getRoomSubtitle()}
          </span>
        </div>
        {activeRoom?.description && (
          <p className="chat-room-desc">{activeRoom.description}</p>
        )}
      </div>

      {/* ── Messages Area ──────────────────────────────────────────────────── */}
      <div className="messages-area">
        {loadingMessages ? (
          <div className="messages-loading">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`skeleton-message ${i % 2 === 0 ? "left" : "right"}`} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="messages-empty">
            <div className="messages-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="date-separator">
                <span className="date-separator-line" />
                <span className="date-separator-text">{date}</span>
                <span className="date-separator-line" />
              </div>

              {/* Messages for this date */}
              {msgs.map((msg, idx) => {
                const prevMsg = msgs[idx - 1];
                const isSameAuthor =
                  prevMsg && prevMsg.sender?._id === msg.sender?._id &&
                  new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 5 * 60 * 1000;

                return (
                  <Message
                    key={msg._id}
                    message={msg}
                    isOwn={msg.sender?._id === user?._id}
                    compact={isSameAuthor}
                  />
                );
              })}
            </div>
          ))
        )}

        {/* ── Typing Indicator ──────────────────────────────────────────────── */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
            <span className="typing-text">
              {typingUsers.length === 1
                ? `${typingUsers[0].name} is typing…`
                : `${typingUsers.map((u) => u.name).join(", ")} are typing…`}
            </span>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* ── Message Input ──────────────────────────────────────────────────── */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
