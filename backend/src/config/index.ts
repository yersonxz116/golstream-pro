import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  ENCRYPTION_KEY: z.string().length(64, "ENCRYPTION_KEY must be 64 hex characters (32 bytes)"),
  STREAM_TOKEN_SECRET: z.string().min(16, "STREAM_TOKEN_SECRET is required"),
  ADMIN_NAME: z.string().default("Administrador GolStream"),
  ADMIN_EMAIL: z.string().email().default("admin@golstream.pro"),
  ADMIN_PASSWORD: z.string().min(8).default("AdminSecurePassword2026!"),
  CORS_ORIGIN: z.string().default("http://localhost:5173,http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment validation error:", parsed.error.format());
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
