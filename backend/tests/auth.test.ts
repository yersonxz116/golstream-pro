import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { env } from "../src/config/index.js";

describe("Authentication & Session API", () => {
  it("should successfully log in as the default seeded admin", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("role", "admin");
    expect(res.body.user.email).toBe(env.ADMIN_EMAIL.toLowerCase());
  });

  it("should successfully log in as a normal subscriber user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "usuario@golstream.pro",
        password: "UserSecure123!",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("role", "user");
    expect(res.body).toHaveProperty("subscription");
    expect(res.body.subscription.status).toBe("ACTIVE");
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: "WrongPassword!",
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("should reject login with nonexistent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "doesnotexist@nowhere.com",
        password: "SomePassword123!",
      });

    expect(res.status).toBe(401);
  });

  it("should return user profile and subscription status on /api/auth/me", async () => {
    // 1. Login
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "usuario@golstream.pro",
        password: "UserSecure123!",
      });

    const token = loginRes.body.token;

    // 2. Fetch /me
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe("usuario@golstream.pro");
    expect(meRes.body.subscription).toBeDefined();
    expect(meRes.body.subscription.status).toBe("ACTIVE");
    expect(meRes.body.iptvAccountConfigured).toBe(true);
  });
});
