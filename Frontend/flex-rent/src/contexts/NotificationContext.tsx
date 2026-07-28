"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import {
  connectSocket,
  disconnectSocket,
} from "@/features/notifications/socket";
import { getUnreadCount } from "@/features/notifications/api";
import type { Notification } from "@/features/notifications/types";

type NotificationContextValue = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const socketInitialized = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silent fail
    }
  }, [isAuthenticated]);

  // Socket connection lifecycle
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && token && !socketInitialized.current) {
      socketInitialized.current = true;
      const socket = connectSocket(token);

      // Listen for realtime notification events
      socket.on("notification:new", (notification: Notification) => {
        setUnreadCount((prev) => prev + 1);

        toast(notification.title, {
          duration: 4000,
          icon: "🔔",
          style: {
            background: "var(--color-surface-raised, #1f1d1b)",
            color: "var(--color-text, #f4f0ec)",
            border: "1px solid var(--color-border, #2e2b28)",
          },
        });
      });

      socket.on("notification:count", (data: { count: number }) => {
        setUnreadCount(data.count);
      });

      socket.on("notification:read", () => {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });

      socket.on("notification:all-read", () => {
        setUnreadCount(0);
      });

      // Fetch initial count
      refreshUnreadCount();
    }

    if (!isAuthenticated && socketInitialized.current) {
      socketInitialized.current = false;
      disconnectSocket();
      setUnreadCount(0);
    }
  }, [isAuthenticated, token, isLoading, refreshUnreadCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketInitialized.current) {
        disconnectSocket();
        socketInitialized.current = false;
      }
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, setUnreadCount, refreshUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider"
    );
  }
  return ctx;
}
