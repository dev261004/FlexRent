import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis";
import { QueueNotificationPayload } from "./notification.types";

const QUEUE_NAME = "notification-queue";

let queue: Queue | null = null;

export const getNotificationQueue = (): Queue => {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });
  }
  return queue;
};

/**
 * Queue a notification for immediate processing by the worker.
 * Use this when you want to offload notification creation to a background process.
 */
export const queueNotification = async (
  payload: QueueNotificationPayload
): Promise<void> => {
  const q = getNotificationQueue();
  await q.add("send-notification", payload, {
    ...(payload.delay ? { delay: payload.delay } : {}),
    ...(payload.jobId ? { jobId: payload.jobId } : {}),
  });
};

/**
 * Schedule a notification to be delivered after a delay.
 * Used for reminders, overdue checks, digests, etc.
 */
export const scheduleNotification = async (
  payload: QueueNotificationPayload,
  delayMs: number
): Promise<void> => {
  const q = getNotificationQueue();
  await q.add("send-notification", payload, {
    delay: delayMs,
    ...(payload.jobId ? { jobId: payload.jobId } : {}),
  });
};

export const closeNotificationQueue = async (): Promise<void> => {
  if (queue) {
    await queue.close();
    queue = null;
  }
};
