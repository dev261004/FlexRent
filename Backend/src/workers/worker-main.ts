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

console.log("🚀 Starting FlexRent workers...");

const notificationWorker = startNotificationWorker();
const reminderWorker = startReminderWorker();

const shutdown = async (): Promise<void> => {
  console.log("\n🛑 Shutting down workers...");

  await closeNotificationWorker();
  await closeReminderWorker();

  console.log("✅ All workers stopped");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Keep process alive
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled rejection in worker:", reason);
});
