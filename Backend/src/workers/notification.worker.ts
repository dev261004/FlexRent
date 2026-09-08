import { Worker, Job } from "bullmq";
import { createRedisConnection } from "../config/redis";
import { notificationService } from "../notifications/notification.service";
import { QueueNotificationPayload } from "../notifications/notification.types";

const QUEUE_NAME = "notification-queue";

let worker: Worker | null = null;

export const startNotificationWorker = (): Worker => {
  worker = new Worker(
    QUEUE_NAME,
    async (job: Job<QueueNotificationPayload>) => {
      const payload = job.data;

      console.log(
        `📬 Processing notification job ${job.id}: ${payload.type} → user:${payload.userId}`
      );

      await notificationService.notify(payload);

      console.log(`✅ Notification job ${job.id} completed`);
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
      limiter: {
        max: 50,
        duration: 1000,
      },
    }
  );

  worker.on("failed", (job, error) => {
    console.error(
      `❌ Notification job ${job?.id} failed:`,
      error.message
    );
  });

  worker.on("error", (error: any) => {
    if (error?.code === "ECONNREFUSED" || error?.message?.includes("ECONNREFUSED")) {
      return;
    }
    console.error("❌ Notification worker error:", error?.message || error);
  });

  console.log("✅ Notification worker started");
  return worker;
};

export const closeNotificationWorker = async (): Promise<void> => {
  if (worker) {
    await worker.close();
    worker = null;
  }
};
