import { Router } from "express";
import { UserController } from "./user.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireActiveSubscription } from "../../middlewares/subscription.middleware.js";

export const userRouter = Router();

userRouter.use(authMiddleware);

userRouter.get("/channels", UserController.listChannels);
userRouter.get("/favorites", UserController.listFavorites);
userRouter.post("/channels/:channelId/favorite", UserController.toggleFavorite);

// Getting a stream token is strictly guarded by active subscription check
userRouter.get(
  "/channels/:channelId/stream-token",
  requireActiveSubscription,
  UserController.getStreamToken
);
