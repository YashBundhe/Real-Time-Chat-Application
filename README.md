# 💬 MERN Real-Time Chat Application

A production-ready, full-stack real-time chat application built with **MongoDB**, **Express.js**, **React**, and **Node.js**, powered by **Socket.IO** for real-time communication.

---

## 📋 Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Project Structure](#-project-structure)
4. [Architecture Overview](#-architecture-overview)
5. [Getting Started](#-getting-started)
6. [Environment Variables](#-environment-variables)
7. [API Reference](#-api-reference)
8. [Socket.IO Events](#-socketio-events)
9. [Database Models](#-database-models)
10. [Frontend Overview](#-frontend-overview)
11. [Authentication Flow](#-authentication-flow)
12. [Error Handling](#-error-handling)
13. [Scripts](#-scripts)

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure register/login with token-based auth
- 💬 **Real-Time Messaging** — Instant messages via Socket.IO
- 👥 **Group & Direct Chats** — Support for 1-on-1 and multi-user rooms
- ⌨️ **Typing Indicators** — Live "User is typing…" broadcast
- 🟢 **Online Presence** — Real-time online/offline user status
- 📜 **Paginated History** — Efficient message loading with pagination
- 🗑️ **Soft Delete** — Messages are soft-deleted (not hard removed)
- 🔒 **Authorization Guards** — Room access limited to participants
- 🌐 **CORS Configured** — Ready for cross-origin frontend deployment
- ⚡ **Graceful Shutdown** — Server handles SIGTERM cleanly
- 🧪 **Test-Ready** — Jest + Supertest infrastructure included

---

## 🛠 Tech Stack

### Backend (`/server`)

| Technology   | Purpose                              |
|--------------|--------------------------------------|
| Node.js      | Runtime environment                  |
| Express.js   | HTTP server & REST API               |
| Socket.IO    | Real-time WebSocket communication    |
| MongoDB      | Document database                    |
| Mongoose     | MongoDB ODM with schema validation   |
| jsonwebtoken | JWT signing and verification         |
| bcryptjs     | Password hashing (salt rounds: 12)   |
| dotenv       | Environment variable management      |
| cors         | Cross-Origin Resource Sharing        |
| nodemon      | Dev auto-reload                      |
| Jest         | Unit/integration testing             |
| Supertest    | HTTP integration testing             |

### Frontend (`/client`)

| Technology       | Purpose                                    |
|------------------|--------------------------------------------|
| React 19         | UI framework                               |
| React Router v7  | Client-side routing                        |
| Context API      | Global state management (Auth, Chat, Socket)|
| Socket.IO Client | Real-time event handling                   |
| Axios            | HTTP requests to REST API                  |
| react-hot-toast  | Toast notifications                        |
| date-fns         | Date/time formatting                       |

---

## 📁 Project Structure

```
chat-app/
├── client/                        # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── ChatWindow.js      # Main message display area
│       │   ├── Message.js         # Individual message bubble
│       │   ├── MessageInput.js    # Message composer with typing events
│       │   └── Sidebar.js         # Room list & user list panel
│       ├── context/
│       │   ├── AuthContext.js     # Auth state (user, token, login/logout)
│       │   ├── ChatContext.js     # Chat state (rooms, messages, actions)
│       │   └── SocketContext.js   # Socket.IO connection & lifecycle
│       ├── pages/
│       │   ├── Login.js           # Login page
│       │   ├── Register.js        # Registration page
│       │   └── Dashboard.js       # Main chat interface
│       ├── services/
│       │   └── api.js             # Axios instance with auth interceptors
│       ├── App.js                 # Routes & protected route logic
│       └── index.css              # Global styles & design tokens
│
└── server/                        # Node.js/Express backend
    ├── config/
    │   ├── db.js                  # MongoDB connection with retry logic
    │   └── socket.js              # Socket.IO event handler (all events)
    ├── controllers/
    │   ├── authController.js      # Register, Login, Me, Logout, GetUsers
    │   ├── roomController.js      # CRUD for chat rooms
    │   └── messageController.js   # Get, Send, Delete messages
    ├── middleware/
    │   ├── auth.js                # protect (HTTP) + socketAuth (WS)
    │   └── errorHandler.js        # Global error handler
    ├── models/
    │   ├── User.js                # User schema + password hashing
    │   ├── ChatRoom.js            # ChatRoom schema (direct/group)
    │   └── Message.js             # Message schema + soft delete
    ├── routes/
    │   ├── authRoutes.js          # /api/auth/**
    │   ├── roomRoutes.js          # /api/rooms/**
    │   └── messageRoutes.js       # /api/messages/**
    ├── tests/                     # Jest test suites
    ├── .env                       # Environment variables (not committed)
    ├── package.json
    └── server.js                  # App entry point
```

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        React Client                         │
│                                                             │
│  AuthContext ──► API (Axios)  ──► REST  ──► Express Routes  │
│  ChatContext ──► SocketContext ──► WS ──► Socket.IO Handler │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼────────┐
                    │   Express Server  │
                    │                  │
                    │  Middleware Chain │
                    │  CORS → JSON →   │
                    │  Routes → Error  │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         MongoDB          JWT Auth      Socket.IO
         (Mongoose)    (protect +     (socketAuth +
                       socketAuth)    event handlers)
```

### Request Flow

1. **HTTP Request** → CORS → JSON Parser → Route → `protect` middleware (JWT verify) → Controller → MongoDB → Response
2. **WebSocket** → `socketAuth` (JWT from handshake) → `socket.user` attached → Event Handler → MongoDB → Broadcast

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **MongoDB** (local instance or MongoDB Atlas URI)
- **npm** ≥ 9.x

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Create `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Start Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev          # nodemon server.js → http://localhost:5000

# Terminal 2 — Frontend
cd client
npm start            # react-scripts start → http://localhost:3000
```

---

## 🔑 Environment Variables

| Variable        | Required | Default                    | Description                          |
|-----------------|----------|----------------------------|--------------------------------------|
| `MONGO_URI`     | ✅       | —                          | MongoDB connection string            |
| `JWT_SECRET`    | ✅       | —                          | Secret key for JWT signing           |
| `JWT_EXPIRES_IN`| ❌       | `7d`                       | JWT token expiry duration            |
| `PORT`          | ❌       | `5000`                     | HTTP server port                     |
| `NODE_ENV`      | ❌       | `development`              | Controls logging & stack traces      |
| `CLIENT_URL`    | ❌       | `http://localhost:3000`    | Allowed CORS origin                  |

---

## 📡 API Reference

### Base URL: `http://localhost:5000`

#### Health Check

| Method | Endpoint  | Auth | Description        |
|--------|-----------|------|--------------------|
| GET    | `/health` | No   | Server status check|

**Response:**
```json
{
  "success": true,
  "message": "Chat API is running",
  "timestamp": "2026-04-28T06:00:00.000Z",
  "environment": "development"
}
```

---

### Auth Routes — `/api/auth`

| Method | Endpoint            | Auth    | Description                       |
|--------|---------------------|---------|-----------------------------------|
| POST   | `/api/auth/register`| No      | Register a new user               |
| POST   | `/api/auth/login`   | No      | Login and receive JWT             |
| GET    | `/api/auth/me`      | Bearer  | Get current user's profile        |
| POST   | `/api/auth/logout`  | Bearer  | Set user offline, invalidate session |
| GET    | `/api/auth/users`   | Bearer  | Get all users (for sidebar)       |

**POST `/api/auth/register`**
```json
// Request body
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }

// Response 201
{ "success": true, "token": "<jwt>", "user": { "_id": "...", "name": "Alice", ... } }
```

**POST `/api/auth/login`**
```json
// Request body
{ "email": "alice@example.com", "password": "secret123" }

// Response 200
{ "success": true, "token": "<jwt>", "user": { ... } }
```

---

### Room Routes — `/api/rooms` *(All require Bearer token)*

| Method | Endpoint              | Description                             |
|--------|-----------------------|-----------------------------------------|
| GET    | `/api/rooms`          | Get all rooms the current user is in    |
| POST   | `/api/rooms`          | Create a new group room                 |
| POST   | `/api/rooms/direct`   | Create or fetch a direct (1-on-1) room  |
| GET    | `/api/rooms/:id`      | Get a single room by ID                 |
| DELETE | `/api/rooms/:id`      | Delete a room (admin only)              |

**POST `/api/rooms`**
```json
// Request body
{ "name": "Dev Team", "description": "Engineering chat", "participants": ["userId1", "userId2"] }

// Response 201
{ "success": true, "room": { "_id": "...", "name": "Dev Team", "participants": [...] } }
```

**POST `/api/rooms/direct`**
```json
// Request body
{ "userId": "<target-user-id>" }

// Response 200 (existing) or 201 (new)
{ "success": true, "room": { "_id": "...", "roomType": "direct", "participants": [...] } }
```

---

### Message Routes — `/api/messages` *(All require Bearer token)*

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | `/api/messages/:roomId`     | Get paginated messages for a room    |
| POST   | `/api/messages`             | Send a message (REST fallback)       |
| DELETE | `/api/messages/:id`         | Soft-delete a message (sender only)  |

**GET `/api/messages/:roomId?page=1&limit=50`**
```json
// Response 200
{
  "success": true,
  "messages": [ { "_id": "...", "content": "Hello!", "sender": { "name": "Alice" }, "createdAt": "..." } ],
  "pagination": { "total": 120, "page": 1, "limit": 50, "totalPages": 3, "hasMore": true }
}
```

**POST `/api/messages`**
```json
// Request body
{ "roomId": "<room-id>", "content": "Hello!" }

// Response 201
{ "success": true, "message": { "_id": "...", "content": "Hello!", "sender": { ... } } }
```

---

## 🔌 Socket.IO Events

### Connection

The socket handshake **must** include a JWT token:
```js
const socket = io("http://localhost:5000", {
  auth: { token: "<jwt-token>" }
});
```

---

### Client → Server (Emit)

| Event         | Payload                              | Description                          |
|---------------|--------------------------------------|--------------------------------------|
| `joinRoom`    | `roomId: string`                     | Join a chat room (verified against DB)|
| `leaveRoom`   | `roomId: string`                     | Leave a chat room                    |
| `sendMessage` | `{ roomId: string, content: string }`| Send a message (persisted to MongoDB)|
| `typing`      | `{ roomId: string }`                 | Notify room you are typing           |
| `stopTyping`  | `{ roomId: string }`                 | Notify room you stopped typing       |

---

### Server → Client (Listen)

| Event            | Payload                                             | Description                               |
|------------------|-----------------------------------------------------|-------------------------------------------|
| `receiveMessage` | `{ _id, content, sender, roomId, createdAt, ... }`  | A new message in a room you joined        |
| `userOnline`     | `{ userId, name, isOnline: true }`                  | A user connected to the server            |
| `userOffline`    | `{ userId, name, isOnline: false, lastSeen }`       | A user disconnected from the server       |
| `userJoined`     | `{ userId, name, roomId }`                          | Someone joined your room                  |
| `userLeft`       | `{ userId, name, roomId }`                          | Someone left your room                    |
| `userTyping`     | `{ userId, name, roomId }`                          | Someone in the room is typing             |
| `userStopTyping` | `{ userId, roomId }`                                | Someone stopped typing                    |
| `error`          | `{ message: string }`                               | Server-side event error                   |

---

### Example Socket Usage (Client)

```js
// Join a room after selecting it
socket.emit("joinRoom", roomId);

// Send a message
socket.emit("sendMessage", { roomId, content: "Hello!" });

// Typing
socket.emit("typing", { roomId });
socket.emit("stopTyping", { roomId });

// Receive messages
socket.on("receiveMessage", (message) => {
  setMessages(prev => [...prev, message]);
});

// Presence
socket.on("userOnline",  ({ userId }) => updateOnlineStatus(userId, true));
socket.on("userOffline", ({ userId }) => updateOnlineStatus(userId, false));
```

---

## 🗄 Database Models

### User

| Field      | Type    | Required | Notes                                     |
|------------|---------|----------|-------------------------------------------|
| `name`     | String  | ✅       | 2–50 characters                           |
| `email`    | String  | ✅       | Unique, lowercase, validated regex        |
| `password` | String  | ✅       | Min 6 chars, hashed via bcrypt (cost: 12), never returned in queries |
| `avatar`   | String  | ❌       | URL to profile picture                    |
| `isOnline` | Boolean | —        | Default `false`, toggled on connect/disconnect |
| `lastSeen` | Date    | —        | Updated on disconnect and logout          |
| `socketId` | String  | —        | Current Socket.IO ID, `null` when offline |

**Instance Methods:**
- `comparePassword(candidate)` — Returns `true` if password matches hash
- `toPublicProfile()` — Returns safe user object (no password)

---

### ChatRoom

| Field         | Type     | Required | Notes                                      |
|---------------|----------|----------|--------------------------------------------|
| `name`        | String   | ⚠️ group | Max 100 chars; required for group rooms    |
| `description` | String   | ❌       | Max 300 chars                              |
| `roomType`    | String   | —        | `"direct"` or `"group"` (default: group)  |
| `participants`| [User]   | ✅       | Array of User ObjectIds                    |
| `admin`       | User     | ❌       | Creator of group rooms                     |
| `lastMessage` | Message  | —        | Ref to latest Message (for sidebar preview)|
| `avatar`      | String   | ❌       | Room avatar URL                            |

**Validation:**
- Direct rooms: exactly 2 participants enforced via pre-save hook
- Group rooms: `name` is required, enforced via pre-save hook

**Indexes:** `{ participants: 1 }` for fast membership queries

---

### Message

| Field         | Type    | Required | Notes                                       |
|---------------|---------|----------|---------------------------------------------|
| `sender`      | User    | ✅       | Ref to User                                 |
| `content`     | String  | ✅       | Max 2000 chars                              |
| `roomId`      | ChatRoom| ✅       | Ref to ChatRoom                             |
| `messageType` | String  | —        | `"text"` / `"image"` / `"file"` / `"system"` |
| `readBy`      | [User]  | —        | Track who has read the message              |
| `isDeleted`   | Boolean | —        | Default `false`; soft-delete flag           |

**Indexes:** `{ roomId: 1, createdAt: -1 }` for efficient paginated message retrieval

---

## 🖥 Frontend Overview

### Context Providers

#### `AuthContext`
Manages authentication state globally.
- **State:** `user`, `token`, `loading`
- **Actions:** `login(credentials)`, `register(data)`, `logout()`
- Token persisted in `localStorage`; Axios interceptor auto-attaches it

#### `SocketContext`
Manages the Socket.IO connection lifecycle.
- Connects on mount with auth token
- Disconnects on unmount / logout
- Exposes `socket` instance to all consumers

#### `ChatContext`
Manages all chat state.
- **State:** `rooms`, `activeRoom`, `messages`, `onlineUsers`, `typingUsers`
- **Actions:** `selectRoom(room)`, `sendMessage(content)`, `createRoom(data)`, `createDirectRoom(userId)`
- Registers Socket.IO listeners for real-time updates

---

### Pages

| Page          | Route      | Auth     | Description                        |
|---------------|------------|----------|------------------------------------|
| `Login`       | `/login`   | Public   | Email/password login form          |
| `Register`    | `/register`| Public   | Name/email/password registration   |
| `Dashboard`   | `/`        | Private  | Full chat interface (Sidebar + ChatWindow) |

---

### Components

| Component      | Description                                                       |
|----------------|-------------------------------------------------------------------|
| `Sidebar`      | Room list, user list, create room/DM, online indicators          |
| `ChatWindow`   | Message feed for the active room, typing indicator display        |
| `MessageInput` | Textarea with send button; emits `typing`/`stopTyping` events    |
| `Message`      | Single message bubble with sender avatar, content, timestamp      |

---

### Services — `api.js`

A configured Axios instance:
- **Base URL:** `http://localhost:5000/api`
- **Request interceptor:** Auto-attaches `Authorization: Bearer <token>` from `localStorage`
- **Response interceptor:** Redirects to `/login` on 401

---

## 🔐 Authentication Flow

```
Register / Login
     │
     ▼
POST /api/auth/register | /api/auth/login
     │
     ▼
Server signs JWT (HS256, 7d expiry)
     │
     ▼
Client stores token in localStorage
     │
  ┌──┴─────────────────────────────────┐
  │ HTTP Requests                      │ Socket Connection
  │ Authorization: Bearer <jwt>        │ { auth: { token: <jwt> } }
  ▼                                    ▼
protect middleware                  socketAuth middleware
  │                                    │
  ▼                                    ▼
jwt.verify()                       jwt.verify()
  │                                    │
  ▼                                    ▼
User.findById()                   User.findById()
  │                                    │
  ▼                                    ▼
req.user = user                   socket.user = user
```

---

## ⚠️ Error Handling

The global `errorHandler` middleware (`middleware/errorHandler.js`) handles all errors passed via `next(error)` and normalizes them into consistent JSON:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "stack": "..." // Only in development mode
}
```

| Error Type                      | HTTP Status | Behavior                                  |
|---------------------------------|-------------|-------------------------------------------|
| Mongoose `CastError`            | 400         | Invalid ObjectId format                   |
| Mongoose duplicate key (11000)  | 409         | e.g., "Email already exists."             |
| Mongoose `ValidationError`      | 400         | All validation messages joined by ". "    |
| JWT `JsonWebTokenError`         | 401         | Invalid token                             |
| JWT `TokenExpiredError`         | 401         | Expired token                             |
| Default                         | 500         | Internal Server Error                     |

Socket.IO errors are emitted back to the client socket:
```js
socket.emit("error", { message: "Human-readable error" });
```

---

## 📜 Scripts

### Server

```bash
npm run dev      # Start with nodemon (auto-reload on changes)
npm start        # Start in production mode
npm test         # Run Jest tests in /tests directory
```

### Client

```bash
npm start        # Start React dev server on port 3000
npm run build    # Production build to /client/build
npm test         # Run React Testing Library tests
```

---

## 🧪 Testing

Tests live in `server/tests/`. The Jest configuration:
- **Environment:** `node`
- **Timeout:** 30 seconds per test
- **Tools:** Jest + Supertest

Run tests:
```bash
cd server
npm test
```

---

## 📝 Notes & Conventions

- **Socket.IO is the primary messaging path.** The REST `POST /api/messages` is a fallback only.
- **Passwords are never returned** in API responses (`select: false` in schema).
- **Messages are soft-deleted** — `isDeleted: true` + content replaced with `"This message was deleted."`.
- **Direct rooms are idempotent** — calling `POST /api/rooms/direct` with the same user returns the existing room.
- **Online status** is updated on every socket connect/disconnect and on REST login/logout.
- **Room access is always verified** before joining via Socket.IO `joinRoom` event.
