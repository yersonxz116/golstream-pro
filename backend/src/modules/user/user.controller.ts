import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { signStreamToken } from "../../lib/jwt.js";

export class UserController {
  static async listChannels(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;

    const channels = await prisma.channel.findMany({
      where: { isVisible: true },
      include: {
        category: true,
        favorites: userId ? { where: { userId } } : false,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const formatted = channels.map((c) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      isWorking: c.isWorking,
      category: c.category?.name || "Fútbol General",
      categoryId: c.categoryId,
      isFavorite: Array.isArray(c.favorites) && c.favorites.length > 0,
    }));

    res.json(formatted);
  }

  static async toggleFavorite(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { channelId } = req.params;

    if (!userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_channelId: { userId, channelId },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      res.json({ isFavorite: false, message: "Eliminado de favoritos" });
    } else {
      await prisma.favorite.create({
        data: { userId, channelId },
      });
      res.json({ isFavorite: true, message: "Añadido a favoritos" });
    }
  }

  static async listFavorites(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        channel: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = favorites.map((f) => ({
      id: f.channel.id,
      name: f.channel.name,
      logoUrl: f.channel.logoUrl,
      isWorking: f.channel.isWorking,
      category: f.channel.category?.name || "Fútbol General",
      isFavorite: true,
    }));

    res.json(formatted);
  }

  static async getStreamToken(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { channelId } = req.params;

    if (!userId) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    // Verify user has an IPTV account configured
    const iptv = await prisma.iptvAccount.findUnique({
      where: { userId },
    });

    if (!iptv) {
      res.status(400).json({
        error: "No tienes una cuenta de Strong IPTV asignada. Contacta al administrador.",
        code: "IPTV_ACCOUNT_NOT_CONFIGURED",
      });
      return;
    }

    const token = signStreamToken({ userId, channelId }, "6h");

    res.json({
      streamToken: token,
      channelId,
      streamUrl: `/api/stream/${token}/${channelId}/index.m3u8`,
    });
  }
}
