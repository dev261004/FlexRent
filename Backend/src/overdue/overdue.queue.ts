import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis";

const QUEUE_NAME = "overdue-queue";
const REPEATABLE_JOB_ID = "recurring-overdue-detection";

let queue: Queue | null = null;

export const getOverdueQueue = (): Queue => {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    });
  }
  return queue;
};

/**
 * Trigger an immediate overdue detection job in BullMQ queue.
 */
export const runOverdueDetection = async (): Promise<void> => {
  const q = getOverdueQueue();
  await q.add("run-overdue-detection", { timestamp: new Date().toISOString() });
};

/**
 * Schedule a repeatable BullMQ job to run overdue detection (runs hourly).
 */
export const scheduleDetection = async (cronPattern: string = "0 * * * *"): Promise<void> => {
  const q = getOverdueQueue();

  // Add repeatable job (runs every hour at minute 0)
  await q.add(
    "run-overdue-detection-repeatable",
    { scheduled: true },
    {
      repeat: {
        pattern: cronPattern,
      },
      jobId: REPEATABLE_JOB_ID,
    }
  );
};

/**
 * Initialize queue and start recurring overdue detection.
 */
export const startOverdueDetection = async (): Promise<void> => {
  const q = getOverdueQueue();
  await scheduleDetection();
  console.log("⏰ Overdue detection scheduled (recurring hourly job)");
};

export const closeOverdueQueue = async (): Promise<void> => {
  if (queue) {
    await queue.close();
    queue = null;
  }
};
