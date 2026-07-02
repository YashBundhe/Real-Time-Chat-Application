import React, { useState, useRef, useCallback } from "react";
import { useChat } from "../context/ChatContext";
import toast from "react-hot-toast";

// Typing debounce delay in ms
const TYPING_DEBOUNCE = 1500;

const MessageInput = () => {
  const { sendMessage, emitTyping, emitStopTyping } = useChat();
  const [message, setMessage] = useState("");
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // ── Handle typing indicators (debounced) ────────────────────────────────────
  const handleTyping = useCallback(() => {
    emitTyping();
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitStopTyping(), TYPING_DEBOUNCE);
  }, [emitTyping, emitStopTyping]);

  // ── Handle input change ──────────────────────────────────────────────────────
  const handleChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
    // Auto-resize textarea
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      return toast.error("Message is too long (max 2000 characters).");
    }

    sendMessage(trimmed);
    setMessage("");
    emitStopTyping();
    clearTimeout(typingTimeoutRef.current);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  // ── Submit on Enter (Shift+Enter = new line) ─────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = message.length;
  const isOverLimit = charCount > 2000;

  return (
    <div className="message-input-bar">
      <div className={`message-input-wrapper ${isOverLimit ? "error" : ""}`}>
        <textarea
          ref={textareaRef}
          id="message-input"
          className="message-textarea"
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={2100} // Slightly above 2000 to allow the UI error to show
          aria-label="Message input"
        />

        {/* Char counter (only shows near limit) */}
        {charCount > 1800 && (
          <span className={`char-counter ${isOverLimit ? "over" : ""}`}>
            {charCount}/2000
          </span>
        )}

        <button
          id="send-message-btn"
          className="send-btn"
          onClick={handleSend}
          disabled={!message.trim() || isOverLimit}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
