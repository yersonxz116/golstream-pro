import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized: Authentication required" });
    return;
  }

  // Admins always have access
  if (req.user.role === "admin") {
    next();
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: req.user.id },
  });

  if (!subscription) {
    res.status(403).json({
      error: "No subscription found. Please contact administration.",
      code: "SUBSCRIPTION_NOT_FOUND",
    });
    return;
  }

  const now = new Date();
  const isExpired = subscription.endDate < now || subscription.status === "EXPIRED";
  const isSuspended = subscription.status === "SUSPENDED";

  if (isSuspended) {
    res.status(403).json({
      error: "Subscription is suspended. Contact administration.",
      code: "SUBSCRIPTION_SUSPENDED",
    });
    return;
  }

  if (isExpired) {
    // Dynamically mark as expired if date passed
    if (subscription.status !== "EXPIRED") {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "EXPIRED" },
      });
    }

    res.status(403).json({
      error: "Subscription has expired. Please renew to continue watching.",
      code: "SUBSCRIPTION_EXPIRED",
      expiredAt: subscription.endDate,
    });
    return;
  }

  next();
}
