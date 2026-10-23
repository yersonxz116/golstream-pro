import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { loginLimiter } from "../../middlewares/rateLimiter.js";

export const authRouter = Router();

authRouter.post("/login", loginLimiter, AuthController.login);
authRouter.get("/me", authMiddleware, AuthController.me);
authRouter.post("/logout", authMiddleware, AuthController.logout);
