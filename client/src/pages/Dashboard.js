import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useSocket } from "../context/SocketContext";

const Dashboard = () => {
  const { user } = useAuth();
  const { activeRoom } = useChat();
  const { isConnected } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard">
      {/* Mobile hamburger overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="chat-main">
        {/* Mobile topbar */}
        <div className="mobile-topbar">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <span /><span /><span />
          </button>
          <span className="mobile-room-name">
            {activeRoom
              ? activeRoom.roomType === "direct"
                ? activeRoom.participants?.find((p) => p._id !== user?._id)?.name || "Direct Message"
                : activeRoom.name
              : "ChatApp"}
          </span>
          <div className={`connection-dot ${isConnected ? "online" : "offline"}`} title={isConnected ? "Connected" : "Disconnected"} />
        </div>

        {activeRoom ? (
          <ChatWindow />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2>Select a conversation</h2>
            <p>Choose a room or start a direct message from the sidebar</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
