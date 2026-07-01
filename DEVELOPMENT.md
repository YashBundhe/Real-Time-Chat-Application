# 🛠 Development Process

A concise log of the build process, key decisions, challenges, and solutions for this MERN real-time chat app.

---

## Stack Decisions

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Node.js | Non-blocking I/O suits real-time |
| Real-time | Socket.IO | Built-in rooms, fallback transports |
| Database | MongoDB + Mongoose | Flexible schema, hooks, easy population |
| Auth | JWT (stateless) | No session store needed |
| Frontend state | React Context API | Sufficient for this scale |

---

## Build Phases & Challenges

### 1. Backend Foundation
- **Challenge:** Socket.IO needs a raw `http.Server`, not Express directly.
- **Fix:** Wrapped Express with `http.createServer(app)`, passed it to both `new Server()` and `.listen()`.
- **Challenge:** CORS must be configured separately for Express routes *and* Socket.IO handshake — they are independent HTTP layers.
- **Fix:** Applied `cors()` options in both `app.use(cors(...))` and `new Server(httpServer, { cors: {...} })`.

### 2. Authentication
- **Challenge:** `password` field has `select: false` — login queries return `undefined` for it.
- **Fix:** Used `.select("+password")` only in the login query.
- **Challenge:** Socket.IO handshake has no standard `Authorization` header.
- **Fix:** Client sends token via `auth: { token }` in socket options; `socketAuth` reads from `socket.handshake.auth`.

### 3. Database Modelling
- **Challenge:** Two users clicking "Start DM" simultaneously could create duplicate direct rooms.
- **Fix:** `createDirectRoom` queries first with `{ $all: [id1, id2], $size: 2 }` before creating — makes the endpoint idempotent.
- **Challenge:** Without indexes, message queries did a full collection scan.
- **Fix:** Added compound index `{ roomId: 1, createdAt: -1 }` for fast paginated retrieval.

### 4. REST API
- **Challenge:** Messages are fetched newest-first (index-efficient) but UI needs oldest-first.
- **Fix:** Query `.sort({ createdAt: -1 })` then `.reverse()` the array before sending.

### 5. Socket.IO Events
- **Challenge:** A user removed from a room could still send messages via their open socket session.
- **Fix:** Re-query DB membership (`ChatRoom.findOne({ _id: roomId, participants: user._id })`) on every `sendMessage` event.
- **Challenge:** `socket.to(room)` excludes the sender — their UI doesn't update after sending.
- **Fix:** Used `io.to(room).emit(...)` so the server is the single source of truth for all participants including the sender.

### 6. React State Management
- **Challenge:** Context providers have a dependency chain — `ChatContext` needs the socket, `SocketContext` needs the token.
- **Fix:** Nested providers in strict order: `AuthProvider → SocketProvider → ChatProvider`.
- **Challenge:** Socket event listeners captured stale state values via closures.
- **Fix:** Used functional setState (`prev => [...prev, msg]`) inside all socket listeners.
- **Challenge:** Socket stayed connected after logout, still receiving events.
- **Fix:** `SocketContext` calls `socket.disconnect()` when the token becomes `null`.

### 7. Real-Time Features
- **Challenge:** Emitting `typing` on every keystroke floods the network.
- **Fix:** Track typing state with a 2-second timeout — emit once at burst start, emit `stopTyping` after 2s idle.
- **Challenge:** Typing indicator persisted in a room after switching to another room.
- **Fix:** `selectRoom()` emits `stopTyping` for the previous room and clears typing state before switching.

### 8. Error Handling
- **Challenge:** Mongoose `ValidationError` is a nested object — raw response exposes schema internals.
- **Fix:** Flattened to `Object.values(err.errors).map(e => e.message).join(". ")`.
- **Challenge:** Stack traces must not appear in production responses.
- **Fix:** Used spread conditional: `...(NODE_ENV === "development" && { stack: err.stack })`.

---

## Key Lessons

1. Socket.IO auth is a **separate concern** from Express middleware — both layers need explicit JWT verification.
2. Always use **functional `setState`** inside socket listeners to avoid stale closure bugs.
3. Use `io.to(room)` (not `socket.to(room)`) so the server is the single source of truth.
4. Add **indexes before populating data** — retrofitting indexes on large collections is painful.
5. Make sensitive socket events **re-verify DB state** — don't trust session-time checks alone.
6. **Debounce typing events** — emitting on every keystroke is the most common real-time performance mistake.
7. Idempotent endpoints (like `POST /rooms/direct`) reduce client-side complexity significantly.
