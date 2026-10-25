import jwt from "jsonwebtoken";
import { env } from "../config/index.js";

export interface UserTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface StreamTokenPayload {
  userId: string;
  channelId: string;
}

export function signAuthToken(payload: UserTokenPayload, expiresIn: jwt.SignOptions["expiresIn"] = "7d"): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

export function verifyAuthToken(token: string): UserTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as UserTokenPayload;
}

export function signStreamToken(payload: StreamTokenPayload, expiresIn: jwt.SignOptions["expiresIn"] = "24h"): string {
  return jwt.sign(payload, env.STREAM_TOKEN_SECRET, { expiresIn });
}

export function verifyStreamToken(token: string): StreamTokenPayload {
  return jwt.verify(token, env.STREAM_TOKEN_SECRET) as StreamTokenPayload;
}
