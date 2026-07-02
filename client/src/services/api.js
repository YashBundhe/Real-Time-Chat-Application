import axios from "axios";

// ── Base Axios Instance ────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ── Request Interceptor: Attach JWT ───────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("chatToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("chatToken");
      localStorage.removeItem("chatUser");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  getUsers: () => api.get("/auth/users"),
};

// ── Rooms API ─────────────────────────────────────────────────────────────────
export const roomsAPI = {
  getRooms: () => api.get("/rooms"),
  createRoom: (data) => api.post("/rooms", data),
  createDirectRoom: (userId) => api.post("/rooms/direct", { userId }),
  getRoomById: (id) => api.get(`/rooms/${id}`),
  deleteRoom: (id) => api.delete(`/rooms/${id}`),
};

// ── Messages API ──────────────────────────────────────────────────────────────
export const messagesAPI = {
  getMessages: (roomId, page = 1, limit = 50) =>
    api.get(`/messages/${roomId}?page=${page}&limit=${limit}`),
  sendMessage: (data) => api.post("/messages", data),
  deleteMessage: (id) => api.delete(`/messages/${id}`),
};

export default api;
