import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireAdmin } from "../../middlewares/role.middleware.js";

export const adminRouter = Router();

// Apply auth and admin role check across all /api/admin routes
adminRouter.use(authMiddleware);
adminRouter.use(requireAdmin);

// User CRUD
adminRouter.get("/users", AdminController.listUsers);
adminRouter.post("/users", AdminController.createUser);
adminRouter.put("/users/:id", AdminController.updateUser);
adminRouter.delete("/users/:id", AdminController.deleteUser);

// Strong IPTV credentials assignment & testing
adminRouter.put("/users/:id/iptv", AdminController.setIptvCredentials);
adminRouter.post("/users/:id/iptv/test", AdminController.testIptvCredentials);

// 1-month Subscriptions
adminRouter.post("/subscriptions/:userId/activate", AdminController.activateSubscription);
adminRouter.post("/subscriptions/:userId/renew", AdminController.renewSubscription);
adminRouter.post("/subscriptions/:userId/suspend", AdminController.suspendSubscription);
adminRouter.post("/subscriptions/:userId/cancel", AdminController.cancelSubscription);
adminRouter.get("/subscriptions/expiring", AdminController.getExpiringUsers);

// Football channels & categories
adminRouter.get("/channels", AdminController.listChannels);
adminRouter.put("/channels/:id", AdminController.updateChannel);
adminRouter.post("/channels/sync", AdminController.syncChannels);
