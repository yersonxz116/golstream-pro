import cron from "node-cron";
import { prisma } from "../lib/prisma.js";

/**
 * Checks for expired subscriptions and updates status in DB.
 */
export async function checkExpiredSubscriptions(): Promise<{ expiredCount: number; expiringSoonCount: number }> {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // 1. Mark expired
  const expiredResult = await prisma.subscription.updateMany({
    where: {
      status: { not: "EXPIRED" },
      endDate: { lt: now },
    },
    data: {
      status: "EXPIRED",
    },
  });

  // 2. Mark expiring soon (within 3 days)
  const expiringSoonResult = await prisma.subscription.updateMany({
    where: {
      status: "ACTIVE",
      endDate: {
        gte: now,
        lte: threeDaysFromNow,
      },
    },
    data: {
      status: "EXPIRING_SOON",
    },
  });

  return {
    expiredCount: expiredResult.count,
    expiringSoonCount: expiringSoonResult.count,
  };
}

/**
 * Starts the recurring cron scheduler.
 */
export function startSubscriptionScheduler(): void {
  // Run on startup
  checkExpiredSubscriptions().catch((err) => {
    console.error("Error running initial subscription expiry check:", err);
  });

  // Run every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    try {
      const stats = await checkExpiredSubscriptions();
      if (stats.expiredCount > 0 || stats.expiringSoonCount > 0) {
        console.log(
          `[Scheduler] Expiradas: ${stats.expiredCount}, Por vencer: ${stats.expiringSoonCount}`
        );
      }
    } catch (err) {
      console.error("[Scheduler] Error checking subscriptions:", err);
    }
  });

  console.log("⏱️  Subscription expiry scheduler running (every 10m)");
}
