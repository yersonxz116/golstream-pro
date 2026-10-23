import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { prisma } from "./lib/prisma.js";
import { decrypt, encrypt } from "./lib/crypto.js";

// Targeted football categories
const TARGET_CATEGORIES = [
  { id: "624", name: "UEFA Champions League (Oficial & ESPN)", sortOrder: 1 },
  { id: "553", name: "UEFA Champions League (M+ Campeones)", sortOrder: 2 },
  { id: "870", name: "LaLiga EA Sports (M+ LaLiga VIP)", sortOrder: 4 },
  { id: "552", name: "DAZN LaLiga VIP", sortOrder: 5 },
  { id: "1286", name: "DAZN España VIP", sortOrder: 6 },
  { id: "1601", name: "Copa del Rey VIP", sortOrder: 7 },
  { id: "1290", name: "Movistar+ Vamos VIP", sortOrder: 8 },
  { id: "1287", name: "Movistar Deportes VIP", sortOrder: 9 },
  { id: "2113", name: "Movistar Sport RAW", sortOrder: 10 },
  { id: "1824", name: "Premier League (EPL PPV VIP)", sortOrder: 11 },
  { id: "1728", name: "TNT Sports UK VIP", sortOrder: 12 },
  { id: "1441", name: "Sky Sports UK RAW", sortOrder: 13 },
  { id: "33", name: "Fútbol Colombiano (Win Sports)", sortOrder: 14 },
  { id: "938", name: "Fútbol Argentino (TNT Sports / TyC)", sortOrder: 15 },
  { id: "2388", name: "ESPN Deportes & Star+ (VIP Latam)", sortOrder: 16 },
  { id: "492", name: "ESPN Sports USA HD (60 FPS)", sortOrder: 17 },
  { id: "2032", name: "8K Sport On Air", sortOrder: 18 },
];

function isSeparator(name: string): boolean {
  const trimmed = name.trim();
  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("=") ||
    trimmed.startsWith("-") ||
    trimmed.includes("####") ||
    trimmed.includes("****") ||
    trimmed.includes("ENDED |") ||
    trimmed.includes("OFFLINE")
  );
}

function cleanChannelName(rawName: string): string {
  let name = rawName.replace(/^(VIP|ES|ARG|CO|US|MX|CL|BR|UK|SPO):\s*/i, "").trim();
  if (rawName.includes("CL: ESPN 1")) name = "ESPN 1 HD (Champions League Oficial)";
  if (rawName.includes("CL: ESPN 2")) name = "ESPN 2 HD (Champions League Oficial)";
  if (rawName.includes("CL: ESPN 3")) name = "ESPN 3 HD (Champions League Oficial)";
  if (rawName.includes("CL: ESPN 4")) name = "ESPN 4 HD (Champions League Oficial)";
  return name;
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

        // In category 624, keep UEFA Champions League channels
        if (targetCat.id === "624") {
          const isUcl = /uefa|champions/i.test(s.name);
          if (!isUcl) continue;
        }

        // In Colombia, keep Win Sports, Claro, Fox Sports (exclude offline Claro-ESPN feeds 609301/609302)
        if (targetCat.id === "33") {
          if (s.stream_id === 609301 || s.stream_id === 609302) continue;
          const isSport = /win|espn|fox|deport|futbol/i.test(s.name);
          if (!isSport) continue;
        }

        // In Argentina, keep TNT Sports, TyC Sports, Fox (exclude black-screen ESPN feeds 1997304-1997308)
        if (targetCat.id === "938") {
          if (/espn/i.test(s.name)) continue;
          const isSport = /tyc|tnt|fox|deport|futbol/i.test(s.name);
          if (!isSport) continue;
        }

        // In US Sports, keep ESPN and major sports
        if (targetCat.id === "492") {
          const isEspnOrMajor = /espn|fox sports|nbc|cbs/i.test(s.name);
          if (!isEspnOrMajor) continue;
        }

        // In VIP Latam (2388), keep ESPN, Fox Sports, TUDN
        if (targetCat.id === "2388") {
          const isEspnOrMajor = /espn|star\+|fox sports|tudn/i.test(s.name);
          if (!isEspnOrMajor) continue;
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

  // Ensure the 4 primary ESPN Champions League feeds are prioritized in UEFA Champions League category
  const uclCategory = await prisma.category.findUnique({ where: { id: "cat-624" } });
  if (uclCategory) {
    const primaryEspnUcl = [
      { id: "stream-1562491", streamId: "1562491", name: "ESPN 1 HD (Champions League Oficial)", sortOrder: 1 },
      { id: "stream-1562490", streamId: "1562490", name: "ESPN 2 HD (Champions League Oficial)", sortOrder: 2 },
      { id: "stream-1562489", streamId: "1562489", name: "ESPN 3 HD (Champions League Oficial)", sortOrder: 3 },
      { id: "stream-1562488", streamId: "1562488", name: "ESPN 4 HD (Champions League Oficial)", sortOrder: 4 },
    ];
    for (const ec of primaryEspnUcl) {
      await prisma.channel.upsert({
        where: { id: ec.id },
        create: {
          id: ec.id,
          externalStreamId: ec.streamId,
          name: ec.name,
          categoryId: uclCategory.id,
          sortOrder: ec.sortOrder,
          isVisible: true,
          isWorking: true,
          lastCheckedAt: new Date(),
        },
        update: {
          name: ec.name,
          externalStreamId: ec.streamId,
          categoryId: uclCategory.id,
          sortOrder: ec.sortOrder,
          isVisible: true,
          isWorking: true,
          lastCheckedAt: new Date(),
        },
      });
    }
    console.log("✅ 4 canales principales de ESPN Champions League asignados a la categoría oficial.");
  }

  // Ensure DIRECTV Sports (DSPORTS) Category and Channels are prioritized
  const dsportsCat = await prisma.category.upsert({
    where: { id: "cat-dsports" },
    create: {
      id: "cat-dsports",
      externalId: "dsports",
      name: "DIRECTV Sports (DSPORTS)",
      sortOrder: 3,
      isVisible: true,
    },
    update: {
      name: "DIRECTV Sports (DSPORTS)",
      sortOrder: 3,
      isVisible: true,
    },
  });

  const dsportsChannels = [
    { id: "stream-441113", streamId: "441113", name: "DSPORTS HD (DIRECTV Sports 1080p)", sortOrder: 1 },
    { id: "stream-609304", streamId: "609304", name: "DSPORTS 1 (DIRECTV Sports Colombia & Sudamérica)", sortOrder: 2 },
    { id: "stream-1997323", streamId: "1997323", name: "DSPORTS Argentina (DTV RAW 60FPS)", sortOrder: 3 },
  ];

  for (const dc of dsportsChannels) {
    await prisma.channel.upsert({
      where: { id: dc.id },
      create: {
        id: dc.id,
        externalStreamId: dc.streamId,
        name: dc.name,
        categoryId: dsportsCat.id,
        sortOrder: dc.sortOrder,
        isVisible: true,
        isWorking: true,
        lastCheckedAt: new Date(),
      },
      update: {
        name: dc.name,
        externalStreamId: dc.streamId,
        categoryId: dsportsCat.id,
        sortOrder: dc.sortOrder,
        isVisible: true,
        isWorking: true,
        lastCheckedAt: new Date(),
      },
    });
  }
  console.log("✅ Canales de DIRECTV Sports (DSPORTS) asignados y configurados.");

  // 3. Delete old mock channels, ended PPVs, and dead black-screen feeds
  await prisma.channel.deleteMany({
    where: {
      OR: [
        { id: { in: ["ch-101", "ch-102", "ch-103", "ch-104", "ch-105", "ch-106", "ch-107", "ch-108", "ch-109", "ch-110"] } },
        { name: { contains: "ENDED" } },
        { externalStreamId: { in: ["609301", "609302", "1997304", "1997305", "1997306", "1997307", "1997308"] } },
        { categoryId: "cat-1960" },
      ],
    },
  });
  await prisma.channel.deleteMany({
    where: {
      categoryId: "cat-2388",
      NOT: {
        OR: [
          { name: { contains: "ESPN" } },
          { name: { contains: "FOX" } },
          { name: { contains: "TUDN" } },
        ],
      },
    },
  });
  await prisma.category.deleteMany({
    where: { id: "cat-1960" },
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
