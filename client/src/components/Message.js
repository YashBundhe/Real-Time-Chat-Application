import React from "react";
import { format } from "date-fns";

/**
 * Message Component
 * Renders a single chat message bubble.
 *
 * Props:
 *   message   - The message object (sender, content, createdAt, isDeleted)
 *   isOwn     - Boolean: true if current user sent this message
 *   compact   - Boolean: true to hide avatar/name (consecutive messages from same user)
 */
const Message = ({ message, isOwn, compact }) => {
  const { sender, content, createdAt, isDeleted } = message;

  const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const formattedTime = createdAt
    ? format(new Date(createdAt), "h:mm a")
    : "";

  return (
    <div className={`message-row ${isOwn ? "message-row--own" : "message-row--other"} ${compact ? "message-row--compact" : ""}`}>
      {/* Avatar — hidden in compact mode or for own messages */}
      {!isOwn && (
        <div className={`message-avatar-col ${compact ? "invisible" : ""}`}>
          <div className="avatar avatar--sm">
            {getInitials(sender?.name)}
          </div>
        </div>
      )}

      <div className="message-content-col">
        {/* Author + time — hidden in compact mode */}
        {!compact && !isOwn && (
          <div className="message-meta">
            <span className="message-author">{sender?.name || "Unknown"}</span>
            <span className="message-time">{formattedTime}</span>
          </div>
        )}

        {/* Bubble */}
        <div className={`message-bubble ${isOwn ? "bubble--own" : "bubble--other"} ${isDeleted ? "bubble--deleted" : ""}`}>
          {isDeleted ? (
            <span className="deleted-text">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              This message was deleted
            </span>
          ) : (
            <p className="message-text">{content}</p>
          )}
        </div>

        {/* Timestamp for own messages */}
        {isOwn && (
          <span className="message-time message-time--own">{formattedTime}</span>
        )}
      </div>
    </div>
  );
};

export default Message;
