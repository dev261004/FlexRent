import Redis from "ioredis";
import { env } from "./env";

let redis: Redis | null = null;
let lastLoggedErrorTime = 0;

const logRedisConnectionIssue = (err: any) => {
  const now = Date.now();
  if (now - lastLoggedErrorTime > 30000) {
    lastLoggedErrorTime = now;
    console.warn(
      `\n⚠️ [Redis Connection Issue] Cannot reach Redis at ${env.REDIS_URL} (${err.code || err.message}).\n` +
      `   BullMQ background workers (notifications, reminders, overdue) need Redis.\n` +
      `   👉 Start Redis with Docker: docker run -d -p 6379:6379 redis\n` +
      `   👉 Or configure REDIS_URL in Backend/.env\n`
    );
  }
};

export const getRedisConnection = (): Redis => {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        return Math.min(times * 1000, 10000);
      },
    });

    redis.on("error", (error) => {
      logRedisConnectionIssue(error);
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected");
      redis?.config("SET", "stop-writes-on-bgsave-error", "no").catch(() => {});
    });
  }

  return redis;
};

export const createRedisConnection = (): Redis => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      return Math.min(times * 1000, 10000);
    },
  });

  client.on("connect", () => {
    client.config("SET", "stop-writes-on-bgsave-error", "no").catch(() => {});
  });

  client.on("error", (err) => {
    logRedisConnectionIssue(err);
  });

  return client;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};
