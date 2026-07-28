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
    });
  }

  return redis;
};

export const createRedisConnection = (): Redis => {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
  }
};
