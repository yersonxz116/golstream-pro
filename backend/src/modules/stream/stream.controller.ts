import { Request, Response } from "express";
import axios from "axios";
import { verifyStreamToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import { decrypt } from "../../lib/crypto.js";
import { XtreamService } from "../iptv/xtream.service.js";

export class StreamController {
  /**
   * Proxies and rewrites the HLS M3U8 manifest.
   * Solves CORS and Mixed Content issues while concealing upstream credentials.
   */
  static async getManifest(req: Request, res: Response): Promise<void> {
    try {
      const { token, channelId } = req.params;

      // 1. Verify token
      let payload;
      try {
        payload = verifyStreamToken(token);
      } catch {
        res.status(401).json({ error: "Stream token expired or invalid" });
        return;
      }

      // 2. Validate user and subscription
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          subscription: true,
          iptvAccount: true,
          role: true,
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (user.role.id !== "admin") {
        const sub = user.subscription;
        const now = new Date();
        if (!sub || sub.status === "EXPIRED" || sub.status === "SUSPENDED" || sub.endDate < now) {
          res.status(403).json({
            error: "Subscription expired or suspended",
            code: "SUBSCRIPTION_EXPIRED",
          });
          return;
        }
      }

      // 3. Decrypt IPTV credentials
      if (!user.iptvAccount) {
        res.status(400).json({ error: "No IPTV account configured for this user" });
        return;
      }

      const username = decrypt(user.iptvAccount.encryptedUsername);
      const password = decrypt(user.iptvAccount.encryptedPassword);
      const host = decrypt(user.iptvAccount.encryptedHost);

      // Find channel externalStreamId if available
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
      });
      const streamId = channel?.externalStreamId || channelId;

      const upstreamUrl = XtreamService.buildHlsUrl(host, username, password, streamId);

      // 4. Fetch upstream manifest
      let upstreamResponse;
      try {
        upstreamResponse = await axios.get<string>(upstreamUrl, {
          responseType: "text",
          timeout: 10000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
      } catch (err: unknown) {
        // Fallback or demo manifest if stream is unreachable or offline
        const errorMsg = err instanceof Error ? err.message : "Upstream stream unreachable";
        res.status(502).json({
          error: "No se pudo conectar con el canal de IPTV",
          details: errorMsg,
        });
        return;
      }

      const manifestContent = upstreamResponse.data;
      // Resolve against the redirected URL if the upstream load balancer redirected
      const finalUrl =
        (upstreamResponse.request as any)?.res?.responseUrl ||
        (upstreamResponse.config as any)?.url ||
        upstreamUrl;

      // 5. Rewrite manifest URLs to point through our chunk proxy
      const rewrittenLines = manifestContent.split("\n").map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          return line;
        }

        // It is a URI for a sub-playlist or a segment
        let absoluteUrl: string;
        try {
          absoluteUrl = new URL(trimmed, finalUrl).href;
        } catch {
          absoluteUrl = trimmed;
        }

        const encodedTarget = Buffer.from(absoluteUrl).toString("base64url");
        return `/api/stream/${token}/${channelId}/chunk?u=${encodedTarget}`;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.send(rewrittenLines.join("\n"));
    } catch (err: unknown) {
      console.error("Stream Proxy Error:", err);
      res.status(500).json({ error: "Error en el proxy de streaming" });
    }
  }

  /**
   * Proxies individual video segments (TS / AAC / fMP4 chunks).
   */
  static async getChunk(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const targetParam = req.query.u as string;

      if (!targetParam) {
        res.status(400).send("Target segment URL missing");
        return;
      }

      // Verify token
      try {
        verifyStreamToken(token);
      } catch {
        res.status(401).send("Stream token expired");
        return;
      }

      const targetUrl = Buffer.from(targetParam, "base64url").toString("utf-8");

      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      };
      if (req.headers.range) {
        headers["Range"] = req.headers.range as string;
      }

      const response = await axios.get(targetUrl, {
        responseType: "stream",
        timeout: 15000,
        headers,
      });

      if (response.headers["content-range"]) {
        res.setHeader("Content-Range", response.headers["content-range"] as string);
        res.status(206);
      }
      res.setHeader("Content-Type", (response.headers["content-type"] as string) || "video/mp2t");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=3600");

      response.data.pipe(res);
    } catch (err: unknown) {
      res.status(502).send("Segment streaming failed");
    }
  }
}
