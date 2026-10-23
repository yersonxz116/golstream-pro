import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/index.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { userRouter } from "./modules/user/user.routes.js";
import { streamRouter } from "./modules/stream/stream.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or in allowed list
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local dev/mobile test
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "GolStream Pro Backend API",
    timestamp: new Date().toISOString(),
  });
});

// Feature routers
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/stream", streamRouter);

// Centralized error handling
app.use(errorHandler);
