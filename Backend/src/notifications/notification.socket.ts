import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";

let io: Server | null = null;

export const initializeNotificationSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
    transports: ["polling", "websocket"],
  });

  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token is required"));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as any).userId = payload.sub;
      (socket as any).userRole = payload.role;
      next();
    } catch {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId as string;
    const userRole = (socket as any).userRole as string;

    socket.join(`user:${userId}`);
    socket.join(`role:${userRole}`);

    console.log(`🔌 Socket connected: user:${userId} role:${userRole}`);

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: user:${userId}`);
    });
  });

  console.log("✅ Socket.IO initialized");
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized. Call initializeNotificationSocket first."
    );
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  const server = getIO();
  server.to(`user:${userId}`).emit(event, data);
};

export const closeSocket = async (): Promise<void> => {
  if (io) {
    return new Promise((resolve) => {
      io!.close(() => {
        io = null;
        resolve();
      });
    });
  }
};
