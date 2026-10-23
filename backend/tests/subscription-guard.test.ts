import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { encrypt } from "../src/lib/crypto.js";

describe("Player Streaming Access Guard (Subscription Blocking)", () => {
  let userToken: string;
  let testUserId: string;
  const channelId = "ch-101";

  beforeAll(async () => {
    // Create dedicated test user
    const email = `player_guard_${Date.now()}@golstream.pro`;
    const user = await prisma.user.create({
      data: {
        email,
        name: "Streaming Tester",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456", // dummy hash
        roleId: "user",
        status: "ACTIVE",
      },
    });
    testUserId = user.id;

    // Assign IPTV credentials
    await prisma.iptvAccount.create({
      data: {
        userId: testUserId,
        encryptedUsername: encrypt("iptv_test_user"),
        encryptedPassword: encrypt("iptv_test_pass"),
        encryptedHost: encrypt("http://stream.demo.com:8080"),
        isValid: true,
      },
    });

    // Create ACTIVE subscription
    const now = new Date();
    await prisma.subscription.create({
      data: {
        userId: testUserId,
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
    });

    // Generate user token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "usuario@golstream.pro",
        password: "UserSecure123!",
      });

    // Use test user with custom sign
    const { signAuthToken } = await import("../src/lib/jwt.js");
    userToken = signAuthToken({
      userId: testUserId,
      email,
      role: "user",
    });
  });

  it("should allow requesting stream token when subscription is ACTIVE", async () => {
    const res = await request(app)
      .get(`/api/user/channels/${channelId}/stream-token`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("streamToken");
    expect(res.body).toHaveProperty("streamUrl");
    expect(res.body.streamUrl).toContain(`/api/stream/`);
  });

  it("should block stream token generation (403) when subscription is EXPIRED", async () => {
    // Update to EXPIRED
    await prisma.subscription.update({
      where: { userId: testUserId },
      data: {
        status: "EXPIRED",
        endDate: new Date(Date.now() - 10000),
      },
    });

    const res = await request(app)
      .get(`/api/user/channels/${channelId}/stream-token`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("SUBSCRIPTION_EXPIRED");
  });

  it("should block stream token generation (403) when subscription is SUSPENDED", async () => {
    // Update to SUSPENDED
    await prisma.subscription.update({
      where: { userId: testUserId },
      data: {
        status: "SUSPENDED",
      },
    });

    const res = await request(app)
      .get(`/api/user/channels/${channelId}/stream-token`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("SUBSCRIPTION_SUSPENDED");
  });
});
