import { Worker, Job } from "bullmq";
import { createRedisConnection } from "../config/redis";
import { reminderService } from "../reminders/reminder.service";
import { ReminderJobData } from "../reminders/reminder.types";

const QUEUE_NAME = "reminder-queue";

let worker: Worker | null = null;

export const startReminderWorker = (): Worker => {
  worker = new Worker(
    QUEUE_NAME,
    async (job: Job<ReminderJobData>) => {
      const data = job.data;

      console.log(
        `⏰ Processing reminder job ${job.id}: ${data.notificationType} → order:${data.rentalOrderId}`
      );

      await reminderService.executeReminderJob(data);

      console.log(`✅ Reminder job ${job.id} completed`);
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
      `❌ Reminder job ${job?.id} failed:`,
      error.message
    );
  });

  worker.on("error", (error) => {
    console.error("❌ Reminder worker error:", error.message);
  });

  console.log("✅ Reminder worker started");
  return worker;
};

export const closeReminderWorker = async (): Promise<void> => {
  if (worker) {
    await worker.close();
    worker = null;
  }
};
