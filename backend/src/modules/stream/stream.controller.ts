import http from "http";
import https from "https";
import { Request, Response } from "express";
import axios from "axios";
import { verifyStreamToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import { decrypt } from "../../lib/crypto.js";
import { XtreamService } from "../iptv/xtream.service.js";

// Reusable Keep-Alive agents to eliminate TCP handshake latency on proxy chunks
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100, maxFreeSockets: 20, timeout: 60000 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100, maxFreeSockets: 20, timeout: 60000 });

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

      // 4. Fetch upstream manifest with automatic retry
      let upstreamResponse;
      try {
        upstreamResponse = await axios.get<string>(upstreamUrl, {
          responseType: "text",
          timeout: 10000,
          httpAgent,
          httpsAgent,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Connection: "keep-alive",
          },
        });
      } catch (err: unknown) {
        // Fast retry with a direct connection if keep-alive pool timed out
        try {
          upstreamResponse = await axios.get<string>(upstreamUrl, {
            responseType: "text",
            timeout: 12000,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Connection: "close",
            },
          });
        } catch (retryErr: unknown) {
          const errorMsg = retryErr instanceof Error ? retryErr.message : "Upstream stream unreachable";
          res.status(502).json({
            error: "No se pudo conectar con el canal de IPTV",
            details: errorMsg,
          });
          return;
        }
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

      let response;
      try {
        response = await axios.get(targetUrl, {
          responseType: "stream",
          timeout: 15000,
          httpAgent,
          httpsAgent,
          headers: {
            ...headers,
            Connection: "keep-alive",
          },
        });
      } catch (firstErr) {
        // Fast retry on transient connection drops or load-balancer flips
        console.warn(`[Stream Proxy] Retrying chunk download for ${targetUrl.slice(0, 60)}...`);
        response = await axios.get(targetUrl, {
          responseType: "stream",
          timeout: 18000,
          headers: {
            ...headers,
            Connection: "close", // Bypass stale keep-alive pool on retry
          },
        });
      }

      if (response.headers["content-range"]) {
        res.setHeader("Content-Range", response.headers["content-range"] as string);
        res.status(206);
      }
      res.setHeader("Content-Type", (response.headers["content-type"] as string) || "video/mp2t");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("Connection", "keep-alive");

      response.data.pipe(res);
    } catch (err: unknown) {
      res.status(502).send("Segment streaming failed");
    }
  }
}
