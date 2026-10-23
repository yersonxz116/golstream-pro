import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { env } from "../src/config/index.js";
import { prisma } from "../src/lib/prisma.js";
import { checkExpiredSubscriptions } from "../src/scheduler/subscriptionScheduler.js";

describe("Subscription Management & Expiry Logic (1-Month Cycles)", () => {
  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Admin login
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
      });
    adminToken = adminLogin.body.token;

    // Create a unique user for subscription tests
    const userEmail = `subtest_${Date.now()}@golstream.pro`;
    const createRes = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Subscriber",
        email: userEmail,
        password: "TempPassword123!",
        role: "user",
      });

    testUserId = createRes.body.id;
  });

  it("should activate a 1-month subscription for the user", async () => {
    const res = await request(app)
      .post(`/api/admin/subscriptions/${testUserId}/activate`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription.status).toBe("ACTIVE");

    const startDate = new Date(res.body.subscription.startDate);
    const endDate = new Date(res.body.subscription.endDate);

    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);

    // Verify history entry was written
    const history = await prisma.subscriptionHistory.findMany({
      where: { subscriptionId: res.body.subscription.id },
    });
    expect(history.length).toBe(1);
    expect(history[0].action).toBe("ACTIVATED");
  });

  it("should renew the subscription extending it by +1 month (+30 days)", async () => {
    const currentSub = await prisma.subscription.findUnique({
      where: { userId: testUserId },
    });
    const previousEndDate = new Date(currentSub!.endDate);

    const res = await request(app)
      .post(`/api/admin/subscriptions/${testUserId}/renew`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const renewedEndDate = new Date(res.body.subscription.endDate);

    const addedDays = Math.round((renewedEndDate.getTime() - previousEndDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(addedDays).toBe(30);

    // Verify history recorded renewal
    const history = await prisma.subscriptionHistory.findMany({
      where: { subscriptionId: res.body.subscription.id },
    });
    expect(history.some((h) => h.action === "RENEWED")).toBe(true);
  });

  it("should suspend the subscription when requested", async () => {
    const res = await request(app)
      .post(`/api/admin/subscriptions/${testUserId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.subscription.status).toBe("SUSPENDED");
  });

  it("should automatically mark subscriptions as EXPIRED when endDate has passed", async () => {
    // Manually set endDate to yesterday
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.subscription.update({
      where: { userId: testUserId },
      data: {
        status: "ACTIVE",
        endDate: yesterday,
      },
    });

    // Run scheduler check
    const stats = await checkExpiredSubscriptions();
    expect(stats.expiredCount).toBeGreaterThanOrEqual(1);

    // Verify user's subscription in DB is now EXPIRED
    const updated = await prisma.subscription.findUnique({
      where: { userId: testUserId },
    });
    expect(updated?.status).toBe("EXPIRED");
  });
});
