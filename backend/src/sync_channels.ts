import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { prisma } from "./lib/prisma.js";
import { decrypt, encrypt } from "./lib/crypto.js";

// Targeted football categories
const TARGET_CATEGORIES = [
  { id: "870", name: "LaLiga EA Sports (M+ LaLiga VIP)", sortOrder: 1 },
  { id: "553", name: "UEFA Champions League (M+ Campeones)", sortOrder: 2 },
  { id: "552", name: "DAZN LaLiga VIP", sortOrder: 3 },
  { id: "1286", name: "DAZN España VIP", sortOrder: 4 },
  { id: "1601", name: "Copa del Rey VIP", sortOrder: 5 },
  { id: "1290", name: "Movistar+ Vamos VIP", sortOrder: 6 },
  { id: "1287", name: "Movistar Deportes VIP", sortOrder: 7 },
  { id: "2113", name: "Movistar Sport RAW", sortOrder: 8 },
  { id: "1824", name: "Premier League (EPL PPV VIP)", sortOrder: 9 },
  { id: "1728", name: "TNT Sports UK VIP", sortOrder: 10 },
  { id: "1441", name: "Sky Sports UK RAW", sortOrder: 11 },
  { id: "33", name: "Fútbol Colombiano (Win Sports / ESPN)", sortOrder: 12 },
  { id: "938", name: "Fútbol Argentino (TNT Sports / TyC / ESPN)", sortOrder: 13 },
  { id: "1960", name: "ESPN+ Internacional PPV", sortOrder: 14 },
  { id: "2032", name: "8K Sport On Air", sortOrder: 15 },
];

function isSeparator(name: string): boolean {
  const trimmed = name.trim();
  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("=") ||
    trimmed.startsWith("-") ||
    trimmed.includes("####") ||
    trimmed.includes("****")
  );
}

function cleanChannelName(rawName: string): string {
  return rawName.replace(/^ES:\s*/i, "").replace(/^ARG:\s*/i, "").replace(/^CO:\s*/i, "").trim();
}

export async function runSyncChannels(credentials?: {
  host?: string;
  username?: string;
  password?: string;
}): Promise<{ totalChannels: number }> {
  console.log("================================================================================");
  console.log("⚽  SINCRONIZACIÓN INTELIGENTE DE CANALES DE FÚTBOL EN VIVO (STRONG IPTV)");
  console.log("================================================================================");

  // 1. Resolve credentials dynamically
  let host = credentials?.host || process.env.IPTV_HOST;
  let username = credentials?.username || process.env.IPTV_USERNAME;
  let password = credentials?.password || process.env.IPTV_PASSWORD;

  if (!host || !username || !password) {
    const adminWithIptv = await prisma.user.findFirst({
      where: { roleId: "admin", iptvAccount: { isNot: null } },
      include: { iptvAccount: true },
    });

    if (adminWithIptv?.iptvAccount) {
      host = decrypt(adminWithIptv.iptvAccount.encryptedHost);
      username = decrypt(adminWithIptv.iptvAccount.encryptedUsername);
      password = decrypt(adminWithIptv.iptvAccount.encryptedPassword);
    }
  }

  if (!host || !username || !password) {
    throw new Error("No hay credenciales IPTV configuradas para realizar la sincronización.");
  }

  // Normalize host
  if (!host.startsWith("http://") && !host.startsWith("https://")) {
    host = `http://${host}`;
  }
  host = host.replace(/\/+$/, "");

  // Update IPTV credentials across all users in DB so subscribers can stream
  console.log("1. Actualizando credenciales IPTV para los usuarios en la base de datos...");
  const encryptedUser = encrypt(username);
  const encryptedPass = encrypt(password);
  const encryptedHost = encrypt(host);

  const users = await prisma.user.findMany();
  for (const u of users) {
    await prisma.iptvAccount.upsert({
      where: { userId: u.id },
      create: {
        userId: u.id,
        encryptedUsername: encryptedUser,
        encryptedPassword: encryptedPass,
        encryptedHost: encryptedHost,
        isValid: true,
        lastTestedAt: new Date(),
      },
      update: {
        encryptedUsername: encryptedUser,
        encryptedPassword: encryptedPass,
        encryptedHost: encryptedHost,
        isValid: true,
        lastTestedAt: new Date(),
      },
    });
  }
  console.log(`✅ Credenciales Strong IPTV sincronizadas para ${users.length} usuarios.`);

  // 2. Fetch streams from Strong IPTV for each targeted category
  console.log("\n2. Sincronizando canales y categorías reales de fútbol desde Strong IPTV...");
  let totalImported = 0;

  for (const targetCat of TARGET_CATEGORIES) {
    // Upsert Category
    const savedCat = await prisma.category.upsert({
      where: { id: `cat-${targetCat.id}` },
      create: {
        id: `cat-${targetCat.id}`,
        externalId: targetCat.id,
        name: targetCat.name,
        sortOrder: targetCat.sortOrder,
        isVisible: true,
      },
      update: {
        name: targetCat.name,
        sortOrder: targetCat.sortOrder,
        isVisible: true,
      },
    });

    try {
      const response = await axios.get(
        `${host}/player_api.php?username=${username}&password=${password}&action=get_live_streams&category_id=${targetCat.id}`,
        { timeout: 15000 }
      );

      const streams = Array.isArray(response.data) ? response.data : [];
      let catCount = 0;

      for (let i = 0; i < streams.length; i++) {
        const s = streams[i];
        if (isSeparator(s.name)) continue;

        // If it is Colombia or Argentina category, keep sports-related channels
        if (targetCat.id === "33" || targetCat.id === "938") {
          const isSport = /win|espn|fox|tyc|tnt|deport|futbol/i.test(s.name);
          if (!isSport) continue;
        }

        const cleanName = cleanChannelName(s.name);
        const channelId = `stream-${s.stream_id}`;

        await prisma.channel.upsert({
          where: { id: channelId },
          create: {
            id: channelId,
            externalStreamId: String(s.stream_id),
            name: cleanName,
            logoUrl: s.stream_icon || null,
            categoryId: savedCat.id,
            sortOrder: targetCat.sortOrder * 100 + catCount,
            isVisible: true,
            isWorking: true,
            lastCheckedAt: new Date(),
          },
          update: {
            name: cleanName,
            externalStreamId: String(s.stream_id),
            logoUrl: s.stream_icon || null,
            categoryId: savedCat.id,
            sortOrder: targetCat.sortOrder * 100 + catCount,
            isVisible: true,
            isWorking: true,
            lastCheckedAt: new Date(),
          },
        });

        catCount++;
        totalImported++;
      }

      console.log(`  - [${targetCat.name}]: ${catCount} canales importados.`);
    } catch (catErr: unknown) {
      const msg = catErr instanceof Error ? catErr.message : String(catErr);
      console.warn(`  - Error obteniendo streams para categoría ${targetCat.id}: ${msg}`);
    }
  }

  // 3. Delete old mock channels if present
  await prisma.channel.deleteMany({
    where: {
      id: {
        in: ["ch-101", "ch-102", "ch-103", "ch-104", "ch-105", "ch-106", "ch-107", "ch-108", "ch-109", "ch-110"],
      },
    },
  });

  const totalChannelsInDb = await prisma.channel.count();
  console.log(`\n================================================================================`);
  console.log(`🎉 Sincronización exitosa! Canales activos en base de datos: ${totalChannelsInDb}`);
  console.log(`================================================================================`);

  return { totalChannels: totalChannelsInDb };
}

if (process.argv[1]?.includes("sync_channels")) {
  runSyncChannels()
    .catch((e) => {
      console.error("Error fatal en sincronización:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
