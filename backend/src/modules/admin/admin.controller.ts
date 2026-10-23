import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { encrypt, decrypt } from "../../lib/crypto.js";
import { XtreamService } from "../iptv/xtream.service.js";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "user"]).default("user"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  role: z.enum(["admin", "user"]).optional(),
});

const iptvCredentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  host: z.string().min(1),
});

export class AdminController {
  // ------------------ USERS ------------------
  static async listUsers(_req: Request, res: Response): Promise<void> {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        subscription: true,
        iptvAccount: {
          select: {
            id: true,
            isValid: true,
            lastTestedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const formatted = users.map((u) => {
      let subInfo = null;
      if (u.subscription) {
        const daysRemaining = Math.max(
          0,
          Math.ceil((u.subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
        const isExpired = u.subscription.endDate < now || u.subscription.status === "EXPIRED";

        subInfo = {
          id: u.subscription.id,
          startDate: u.subscription.startDate,
          endDate: u.subscription.endDate,
          status: isExpired ? "EXPIRED" : u.subscription.status,
          daysRemaining,
          isExpired,
        };
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        role: u.role.id,
        createdAt: u.createdAt,
        subscription: subInfo,
        iptvAccount: {
          configured: Boolean(u.iptvAccount),
          isValid: u.iptvAccount?.isValid ?? false,
          lastTestedAt: u.iptvAccount?.lastTestedAt ?? null,
        },
      };
    });

    res.json(formatted);
  }

  static async createUser(req: Request, res: Response): Promise<void> {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos de usuario inválidos", details: parsed.error.format() });
      return;
    }

    const { name, email, password, role, status } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      res.status(409).json({ error: "Ya existe un usuario con este correo electrónico" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        status,
        roleId: role,
      },
      include: { role: true },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.id,
      status: user.status,
    });
  }

  static async updateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Datos de actualización inválidos", details: parsed.error.format() });
      return;
    }

    const { name, email, password, status, role } = parsed.data;

    const dataToUpdate: Record<string, unknown> = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email.toLowerCase();
    if (status) dataToUpdate.status = status;
    if (role) dataToUpdate.roleId = role;
    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: { role: true },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role.id,
      status: updated.status,
    });
  }

  static async deleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: "Usuario eliminado satisfactoriamente" });
  }

  // ------------------ IPTV CREDENTIALS ------------------
  static async setIptvCredentials(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const parsed = iptvCredentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Campos username, password y host requeridos" });
      return;
    }

    const { username, password, host } = parsed.data;

    // Encrypt each credential with AES-256-GCM
    const encryptedUsername = encrypt(username);
    const encryptedPassword = encrypt(password);
    const encryptedHost = encrypt(host);

    await prisma.iptvAccount.upsert({
      where: { userId: id },
      create: {
        userId: id,
        encryptedUsername,
        encryptedPassword,
        encryptedHost,
        isValid: false,
      },
      update: {
        encryptedUsername,
        encryptedPassword,
        encryptedHost,
        isValid: false,
        lastTestedAt: null,
      },
    });

    res.json({ message: "Credenciales de Strong IPTV guardadas y cifradas exitosamente" });
  }

  static async testIptvCredentials(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const iptv = await prisma.iptvAccount.findUnique({
      where: { userId: id },
    });

    if (!iptv) {
      res.status(404).json({ error: "El usuario no tiene una cuenta IPTV asignada" });
      return;
    }

    const username = decrypt(iptv.encryptedUsername);
    const password = decrypt(iptv.encryptedPassword);
    const host = decrypt(iptv.encryptedHost);

    const result = await XtreamService.testCredentials(host, username, password);

    await prisma.iptvAccount.update({
      where: { id: iptv.id },
      data: {
        isValid: result.success,
        lastTestedAt: new Date(),
      },
    });

    res.json({
      success: result.success,
      message: result.message,
      testedAt: new Date(),
    });
  }

  // ------------------ SUBSCRIPTIONS (1-MONTH CYCLES) ------------------
  static async activateSubscription(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        startDate: now,
        endDate,
        status: "ACTIVE",
      },
      update: {
        startDate: now,
        endDate,
        status: "ACTIVE",
      },
    });

    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        action: "ACTIVATED",
        newEndDate: endDate,
        notes: "Activación mensual por administrador",
      },
    });

    res.json({
      message: "Suscripción activada por 1 mes",
      subscription,
    });
  }

  static async renewSubscription(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const existing = await prisma.subscription.findUnique({
      where: { userId },
    });

    const now = new Date();
    let baseDate = now;

    if (existing && existing.endDate > now) {
      // If current subscription is still active, extend +30 days from current expiration
      baseDate = existing.endDate;
    }

    const newEndDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        startDate: now,
        endDate: newEndDate,
        status: "ACTIVE",
      },
      update: {
        endDate: newEndDate,
        status: "ACTIVE",
      },
    });

    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        action: "RENEWED",
        newEndDate,
        notes: "Renovación (+1 mes) por administrador",
      },
    });

    res.json({
      message: "Suscripción renovada exitosamente (+1 mes)",
      subscription,
    });
  }

  static async suspendSubscription(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const subscription = await prisma.subscription.update({
      where: { userId },
      data: { status: "SUSPENDED" },
    });

    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        action: "SUSPENDED",
        newEndDate: subscription.endDate,
        notes: "Suscripción suspendida por administrador",
      },
    });

    res.json({ message: "Suscripción suspendida", subscription });
  }

  static async cancelSubscription(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const subscription = await prisma.subscription.update({
      where: { userId },
      data: { status: "EXPIRED" },
    });

    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        action: "CANCELLED",
        newEndDate: subscription.endDate,
        notes: "Suscripción cancelada por administrador",
      },
    });

    res.json({ message: "Suscripción cancelada", subscription });
  }

  static async getExpiringUsers(req: Request, res: Response): Promise<void> {
    const days = parseInt((req.query.days as string) || "5", 10);
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        endDate: {
          gte: now,
          lte: threshold,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(subscriptions);
  }

  // ------------------ CHANNELS & CATEGORIES ------------------
  static async listChannels(_req: Request, res: Response): Promise<void> {
    const channels = await prisma.channel.findMany({
      include: { category: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    res.json(channels);
  }

  static async updateChannel(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, isVisible, sortOrder, categoryId } = req.body;

    const updated = await prisma.channel.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(isVisible !== undefined && { isVisible }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        ...(categoryId !== undefined && { categoryId }),
      },
    });

    res.json(updated);
  }

  static async syncChannels(req: Request, res: Response): Promise<void> {
    const { host, username, password } = req.body;
    if (!host || !username || !password) {
      res.status(400).json({ error: "Host, username y password requeridos para sincronizar canales" });
      return;
    }

    const categories = await XtreamService.getCategories(host, username, password);
    const streams = await XtreamService.getLiveStreams(host, username, password);

    let syncedCount = 0;
    const categoryMap = new Map<string, string>();

    for (const cat of categories) {
      if (XtreamService.isFootballRelated(cat.category_name)) {
        const savedCat = await prisma.category.upsert({
          where: { id: cat.category_id },
          create: {
            id: cat.category_id,
            externalId: cat.category_id,
            name: cat.category_name,
            isVisible: true,
          },
          update: {
            name: cat.category_name,
          },
        });
        categoryMap.set(cat.category_id, savedCat.id);
      }
    }

    for (const stream of streams) {
      const isCategoryFootball = categoryMap.has(stream.category_id);
      const isStreamFootball = XtreamService.isFootballRelated(stream.name);

      if (isCategoryFootball || isStreamFootball) {
        await prisma.channel.upsert({
          where: { id: String(stream.stream_id) },
          create: {
            id: String(stream.stream_id),
            externalStreamId: String(stream.stream_id),
            name: stream.name,
            logoUrl: stream.stream_icon || null,
            categoryId: categoryMap.get(stream.category_id) || null,
            isVisible: true,
            isWorking: true,
          },
          update: {
            name: stream.name,
            logoUrl: stream.stream_icon || null,
            categoryId: categoryMap.get(stream.category_id) || null,
          },
        });
        syncedCount++;
      }
    }

    res.json({
      message: `Sincronización completada. Se importaron ${syncedCount} canales de fútbol.`,
      syncedCount,
    });
  }
}
