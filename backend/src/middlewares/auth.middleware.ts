import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      res.status(401).json({ error: "Unauthorized: No token provided" });
      return;
    }

    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!user || user.status === "SUSPENDED") {
      res.status(401).json({ error: "Unauthorized: Account not found or suspended" });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.id,
      status: user.status,
    };

    next();
  } catch {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}
