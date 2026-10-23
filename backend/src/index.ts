import { app } from "./app.js";
import { env } from "./config/index.js";
import { startSubscriptionScheduler } from "./scheduler/subscriptionScheduler.js";
import { runSeed } from "./seed.js";

async function bootstrap(): Promise<void> {
  // Ensure base seeds are present
  try {
    await runSeed();
  } catch (err) {
    console.error("Warning: Seeding on bootstrap failed:", err);
  }

  // Start background schedulers
  startSubscriptionScheduler();

  const port = parseInt(env.PORT, 10) || 4000;
  app.listen(port, () => {
    console.log(`🚀 GolStream Pro API running on port ${port} [${env.NODE_ENV}]`);
    console.log(`⚽ Stream Proxy active at /api/stream/:token/:channelId/index.m3u8`);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
