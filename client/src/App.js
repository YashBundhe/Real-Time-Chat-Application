import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ChatProvider } from "./context/ChatContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import "./index.css";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={
      <PrivateRoute>
        <SocketProvider>
          <ChatProvider>
            <Dashboard />
          </ChatProvider>
        </SocketProvider>
      </PrivateRoute>
    } />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: {
          background: "#1e2130", color: "#e2e8f0",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px", fontSize: "14px",
          fontFamily: "'Inter', sans-serif",
        },
        success: { iconTheme: { primary: "#22c55e", secondary: "#1e2130" } },
        error: { iconTheme: { primary: "#ef4444", secondary: "#1e2130" } },
      }} />
    </AuthProvider>
  </BrowserRouter>
);

export default App;

