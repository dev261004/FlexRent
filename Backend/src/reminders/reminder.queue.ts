import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis";
import { ReminderJobData } from "./reminder.types";

const QUEUE_NAME = "reminder-queue";

let queue: Queue | null = null;

export const getReminderQueue = (): Queue => {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
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
 * Schedules a reminder job in BullMQ with a specific delay and deterministic jobId.
 */
export const scheduleReminderJob = async (
  data: ReminderJobData,
  delayMs: number
): Promise<void> => {
  const q = getReminderQueue();
  await q.add("execute-reminder", data, {
    delay: delayMs,
    jobId: data.jobId,
  });
};

/**
 * Removes a single reminder job from BullMQ.
 */
export const removeReminderJob = async (jobId: string): Promise<boolean> => {
  try {
    const q = getReminderQueue();
    const job = await q.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
  } catch (error: any) {
    console.error(`⚠️ Failed to remove BullMQ job ${jobId}:`, error.message);
  }
  return false;
};

/**
 * Removes multiple reminder jobs from BullMQ.
 */
export const cancelRentalReminderJobs = async (
  jobIds: string[]
): Promise<void> => {
  for (const jobId of jobIds) {
    await removeReminderJob(jobId);
  }
};

export const closeReminderQueue = async (): Promise<void> => {
  if (queue) {
    await queue.close();
    queue = null;
  }
};
