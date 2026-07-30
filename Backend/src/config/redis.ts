import Redis from "ioredis";
import { env } from "./env";

let redis: Redis | null = null;

export const getRedisConnection = (): Redis => {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
    });

    redis.on("error", (error) => {
      console.error("❌ Redis connection error:", error.message);
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
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  client.on("connect", () => {
    client.config("SET", "stop-writes-on-bgsave-error", "no").catch(() => {});
  });

  return client;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};
