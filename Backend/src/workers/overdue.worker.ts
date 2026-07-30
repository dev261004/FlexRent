import { Job, Worker } from "bullmq";
import { createRedisConnection } from "../config/redis";
import { overdueService } from "../overdue/overdue.service";

const QUEUE_NAME = "overdue-queue";

let worker: Worker | null = null;

export const startOverdueWorker = (): Worker => {
  worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      console.log(`🔍 [Overdue Worker] Processing job ${job.id} (${job.name})...`);

      const result = await overdueService.detectOverdueRentals();

      console.log(
        `✅ [Overdue Worker] Job ${job.id} complete. Detected: ${result.detectedCount}, Processed: ${result.processedCount}, Skipped: ${result.skippedCount}`
      );
      return result;
    },
    {
      connection: createRedisConnection(),
      concurrency: 1,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

  worker.on("failed", (job, error) => {
    console.error(`❌ [Overdue Worker] Job ${job?.id} failed:`, error.message);
  });

  worker.on("error", (error) => {
    console.error("❌ [Overdue Worker] Worker error:", error.message);
  });

  console.log("✅ Overdue detection worker started");
  return worker;
};

export const closeOverdueWorker = async (): Promise<void> => {
  if (worker) {
    await worker.close();
    worker = null;
  }
};
