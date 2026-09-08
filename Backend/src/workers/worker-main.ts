import dotenv from "dotenv";
dotenv.config();

import {
  startNotificationWorker,
  closeNotificationWorker,
} from "./notification.worker";
import {
  startReminderWorker,
  closeReminderWorker,
} from "./reminder.worker";
import {
  startOverdueWorker,
  closeOverdueWorker,
} from "./overdue.worker";
import { startOverdueDetection } from "../overdue/overdue.queue";

import Redis from "ioredis";
import { env } from "../config/env";

console.log("🚀 Starting FlexRent workers...");

const checkRedisAndStart = async () => {
  const tester = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy: () => null,
    lazyConnect: true,
  });

  try {
    await tester.connect();
    await tester.ping();
    console.log(`✅ Redis connected at ${env.REDIS_URL}`);
  } catch (err: any) {
    console.warn(
      `\n⚠️ [Redis Offline] Redis is not reachable at ${env.REDIS_URL} (${err.code || err.message}).\n` +
      `   BullMQ background workers (Notifications, Reminders, Overdue Detection) require Redis.\n` +
      `   Workers will idle and automatically resume as soon as Redis is online.\n` +
      `   👉 To start Redis:\n` +
      `      • Docker: docker run -d -p 6379:6379 --name flexrent-redis redis:alpine\n` +
      `      • Or add REDIS_URL to Backend/.env (e.g. Upstash cloud Redis)\n`
    );
  } finally {
    try {
      tester.disconnect();
    } catch {}
  }

  startNotificationWorker();
  startReminderWorker();
  startOverdueWorker();

  startOverdueDetection().catch(() => {});
};

checkRedisAndStart();

const shutdown = async (): Promise<void> => {
  console.log("\n🛑 Shutting down workers...");

  await closeNotificationWorker();
  await closeReminderWorker();
  await closeOverdueWorker();

  console.log("✅ All workers stopped");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Keep process alive
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled rejection in worker:", reason);
});

