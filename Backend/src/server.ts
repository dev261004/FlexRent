import { createServer } from "http";
import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { disconnectRedis } from "./config/redis";
import {
  initializeNotificationSocket,
  closeSocket,
} from "./notifications/notification.socket";

const httpServer = createServer(app);

initializeNotificationSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`Rental Management API running on http://localhost:${env.PORT}`);
});

const shutdown = async (): Promise<void> => {
  console.log("\n🛑 Shutting down server...");

  await closeSocket();
  await disconnectRedis();
  await prisma.$disconnect();

  httpServer.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
