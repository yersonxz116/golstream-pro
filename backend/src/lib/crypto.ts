import crypto from "crypto";
import { env } from "../config/index.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard 96-bit IV for GCM

/**
 * Encrypts plain text using AES-256-GCM.
 * Format: iv:authTag:ciphertext (hex encoded)
 */
export function encrypt(plainText: string): string {
  if (!plainText) return "";
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted payload.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected iv:authTag:ciphertext");
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = Buffer.from(env.ENCRYPTION_KEY, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
