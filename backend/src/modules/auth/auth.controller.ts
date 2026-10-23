import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { signAuthToken } from "../../lib/jwt.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: "Email y contraseña requeridos con formato válido" });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: true,
        subscription: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    if (user.status === "SUSPENDED") {
      res.status(403).json({ error: "Tu cuenta se encuentra suspendida. Contacta a soporte." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role.id,
    });

    // Calculate subscription status
    const now = new Date();
    let subscriptionData = null;
    if (user.subscription) {
      const daysRemaining = Math.max(
        0,
        Math.ceil((user.subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
      const isExpired = user.subscription.endDate < now || user.subscription.status === "EXPIRED";

      subscriptionData = {
        id: user.subscription.id,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        status: isExpired ? "EXPIRED" : user.subscription.status,
        daysRemaining,
        isExpired,
      };
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.id,
        status: user.status,
      },
      subscription: subscriptionData,
    });
  }

  static async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: true,
        subscription: true,
        iptvAccount: {
          select: {
            isValid: true,
            lastTestedAt: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const now = new Date();
    let subscriptionData = null;
    if (user.subscription) {
      const daysRemaining = Math.max(
        0,
        Math.ceil((user.subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
      const isExpired = user.subscription.endDate < now || user.subscription.status === "EXPIRED";

      subscriptionData = {
        id: user.subscription.id,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        status: isExpired ? "EXPIRED" : user.subscription.status,
        daysRemaining,
        isExpired,
      };
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.id,
        status: user.status,
      },
      subscription: subscriptionData,
      iptvAccountConfigured: Boolean(user.iptvAccount),
      iptvAccountValid: user.iptvAccount?.isValid ?? false,
    });
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.json({ message: "Sesión cerrada correctamente" });
  }
}
