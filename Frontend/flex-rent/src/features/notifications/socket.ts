import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketUrl = (): string => {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
  // Strip /api suffix to get the base server URL for Socket.IO
  return apiUrl.replace(/\/api\/?$/, "");
};

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(getSocketUrl(), {
    auth: { token },
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected");
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("🔌 Socket connection error:", error.message);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};
