import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { env } from "../src/config/index.js";

describe("Role-Based Middleware & Access Control", () => {
  it("should return 401 Unauthorized when requesting admin route without token", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("should return 403 Forbidden when a normal authenticated user accesses admin routes", async () => {
    // 1. Login as user
    const userLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "usuario@golstream.pro",
        password: "UserSecure123!",
      });

    const userToken = userLogin.body.token;

    // 2. Attempt to access admin routes
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Admin privileges required");
  });

  it("should allow access (200 OK) when an admin accesses admin routes", async () => {
    // 1. Login as admin
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
      });

    const adminToken = adminLogin.body.token;

    // 2. Access admin users endpoint
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    // Verify credentials are NEVER returned in cleartext or encrypted form
    for (const u of res.body) {
      expect(u).not.toHaveProperty("encryptedUsername");
      expect(u).not.toHaveProperty("encryptedPassword");
      expect(u).not.toHaveProperty("encryptedHost");
      expect(u).not.toHaveProperty("passwordHash");
    }
  });
});
