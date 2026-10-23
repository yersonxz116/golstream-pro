import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";
import { env } from "./config/index.js";
import { encrypt } from "./lib/crypto.js";

export async function runSeed(): Promise<void> {
  console.log("🌱 Starting GolStream Pro Database Seeder...");

  // 1. Roles
  await prisma.role.upsert({
    where: { id: "admin" },
    create: { id: "admin", name: "Administrador" },
    update: { name: "Administrador" },
  });

  await prisma.role.upsert({
    where: { id: "user" },
    create: { id: "user", name: "Usuario Suscriptor" },
    update: { name: "Usuario Suscriptor" },
  });

  // 2. Initial Admin User from environment variables
  const adminPasswordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL.toLowerCase() },
    create: {
      email: env.ADMIN_EMAIL.toLowerCase(),
      name: env.ADMIN_NAME,
      passwordHash: adminPasswordHash,
      roleId: "admin",
      status: "ACTIVE",
    },
    update: {
      name: env.ADMIN_NAME,
      passwordHash: adminPasswordHash,
      roleId: "admin",
      status: "ACTIVE",
    },
  });

  console.log(`✅ Admin user seeded: ${adminUser.email}`);

  // 3. Demo Standard User with active 1-month subscription
  const demoUserPassword = await bcrypt.hash("UserSecure123!", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "usuario@golstream.pro" },
    create: {
      email: "usuario@golstream.pro",
      name: "Juan Pérez (Fútbol Fan)",
      passwordHash: demoUserPassword,
      roleId: "user",
      status: "ACTIVE",
    },
    update: {
      status: "ACTIVE",
    },
  });

  // Seed demo IPTV credentials (encrypted)
  await prisma.iptvAccount.upsert({
    where: { userId: demoUser.id },
    create: {
      userId: demoUser.id,
      encryptedUsername: encrypt("demo_iptv_user"),
      encryptedPassword: encrypt("demo_iptv_pass_2026"),
      encryptedHost: encrypt("http://iptv.strongstream.net:8080"),
      isValid: true,
      lastTestedAt: new Date(),
    },
    update: {
      isValid: true,
      lastTestedAt: new Date(),
    },
  });

  // Seed 1-month subscription
  const now = new Date();
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await prisma.subscription.upsert({
    where: { userId: demoUser.id },
    create: {
      userId: demoUser.id,
      startDate: now,
      endDate: oneMonthFromNow,
      status: "ACTIVE",
    },
    update: {
      startDate: now,
      endDate: oneMonthFromNow,
      status: "ACTIVE",
    },
  });

  console.log(`✅ Demo subscriber seeded: ${demoUser.email} (Suscripción activa 30 días)`);

  // 4. Football Categories
  const categoriesData = [
    { id: "cat-laliga", name: "LaLiga EA Sports & Copa del Rey", sortOrder: 1 },
    { id: "cat-champions", name: "UEFA Champions League", sortOrder: 2 },
    { id: "cat-premier", name: "Premier League & FA Cup", sortOrder: 3 },
    { id: "cat-libertadores", name: "CONMEBOL Libertadores & Sudamericana", sortOrder: 4 },
    { id: "cat-espn", name: "ESPN Deportes & Star+ Feed", sortOrder: 5 },
    { id: "cat-dazn", name: "DAZN Fútbol & Señales Premium", sortOrder: 6 },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { id: cat.id },
      create: { id: cat.id, externalId: cat.id, name: cat.name, sortOrder: cat.sortOrder, isVisible: true },
      update: { name: cat.name, sortOrder: cat.sortOrder },
    });
  }

  // 5. Curated Football Channels
  const channelsData = [
    {
      id: "ch-101",
      externalStreamId: "101",
      name: "ESPN Premium HD",
      categoryId: "cat-espn",
      logoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&q=80",
      sortOrder: 1,
    },
    {
      id: "ch-102",
      externalStreamId: "102",
      name: "ESPN 2 HD Fútbol",
      categoryId: "cat-espn",
      logoUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=128&q=80",
      sortOrder: 2,
    },
    {
      id: "ch-103",
      externalStreamId: "103",
      name: "DAZN LaLiga 1 1080p",
      categoryId: "cat-dazn",
      logoUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&q=80",
      sortOrder: 3,
    },
    {
      id: "ch-104",
      externalStreamId: "104",
      name: "Movistar Liga de Campeones UHD",
      categoryId: "cat-champions",
      logoUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=128&q=80",
      sortOrder: 4,
    },
    {
      id: "ch-105",
      externalStreamId: "105",
      name: "Sky Sports Premier League HD",
      categoryId: "cat-premier",
      logoUrl: "https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=128&q=80",
      sortOrder: 5,
    },
    {
      id: "ch-106",
      externalStreamId: "106",
      name: "beIN Sports 1 HD Fútbol",
      categoryId: "cat-champions",
      logoUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=128&q=80",
      sortOrder: 6,
    },
    {
      id: "ch-107",
      externalStreamId: "107",
      name: "TNT Sports HD Fútbol",
      categoryId: "cat-libertadores",
      logoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&q=80",
      sortOrder: 7,
    },
    {
      id: "ch-108",
      externalStreamId: "108",
      name: "TyC Sports HD",
      categoryId: "cat-libertadores",
      logoUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=128&q=80",
      sortOrder: 8,
    },
    {
      id: "ch-109",
      externalStreamId: "109",
      name: "Win Sports+ HD Fútbol Colombiano",
      categoryId: "cat-libertadores",
      logoUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=128&q=80",
      sortOrder: 9,
    },
    {
      id: "ch-110",
      externalStreamId: "110",
      name: "Fox Sports 1 HD",
      categoryId: "cat-espn",
      logoUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=128&q=80",
      sortOrder: 10,
    },
  ];

  for (const ch of channelsData) {
    await prisma.channel.upsert({
      where: { id: ch.id },
      create: {
        id: ch.id,
        externalStreamId: ch.externalStreamId,
        name: ch.name,
        categoryId: ch.categoryId,
        logoUrl: ch.logoUrl,
        sortOrder: ch.sortOrder,
        isVisible: true,
        isWorking: true,
      },
      update: {
        name: ch.name,
        logoUrl: ch.logoUrl,
        sortOrder: ch.sortOrder,
      },
    });
  }

  console.log(`✅ ${channelsData.length} canales de fútbol sembrados exitosamente.`);
  console.log("🌱 Database seeding completed successfully!");
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  runSeed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
