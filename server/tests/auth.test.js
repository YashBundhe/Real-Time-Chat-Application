/**
 * Unit Tests for Auth API
 * Tests: POST /api/auth/register, POST /api/auth/login
 *
 * Uses supertest for HTTP assertions and an in-memory-like strategy
 * (connects to a test DB specified via MONGO_URI_TEST or falls back to the main URI).
 */

const request = require("supertest");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_key_for_unit_tests_only";
process.env.MONGO_URI = process.env.MONGO_URI_TEST || "mongodb://localhost:27017/chatapp_test";

const { app } = require("../server");

let createdUserId;
let authToken;

// ─── Test Suite Setup & Teardown ──────────────────────────────────────────────
beforeAll(async () => {
  // Wait for DB connection (server.js starts it async)
  await new Promise((resolve) => setTimeout(resolve, 1500));
});

afterAll(async () => {
  // Clean up test data and close connection
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.collection("users").deleteMany({ email: /test@chatapp/ });
    await mongoose.connection.close();
  }
});

// ─── Register Tests ───────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  const validUser = {
    name: "Test User",
    email: "test@chatapp.com",
    password: "password123",
  };

  test("✅ should register a new user and return JWT", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("_id");
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user).not.toHaveProperty("password"); // Password must NOT be returned

    createdUserId = res.body.user._id;
    authToken = res.body.token;
  });

  test("❌ should fail with duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send(validUser);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already registered/i);
  });

  test("❌ should fail when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test2@chatapp.com" }); // Missing name and password

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("❌ should fail with invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Bad User", email: "notanemail", password: "pass123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Login Tests ──────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  test("✅ should login with correct credentials and return JWT", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@chatapp.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.isOnline).toBe(true);
  });

  test("❌ should fail with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@chatapp.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("❌ should fail with non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@chatapp.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("❌ should fail when fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@chatapp.com" }); // Missing password

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Protected Route Tests ────────────────────────────────────────────────────
describe("GET /api/auth/me", () => {
  test("✅ should return current user profile with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user._id).toBe(createdUserId);
  });

  test("❌ should return 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("❌ should return 401 with malformed token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.statusCode).toBe(401);
  });
});
