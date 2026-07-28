"use client";

import { useState, useCallback } from "react";
import type {
  Notification,
  NotificationQueryParams,
  PaginatedNotifications,
} from "./types";
import * as notificationApi from "./api";

export function useNotifications() {
  const [data, setData] = useState<PaginatedNotifications | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (params: NotificationQueryParams = {}) => {
      setLoading(true);
      setError(null);
      try {
        const result = await notificationApi.getNotifications(params);
        setData(result);
        return result;
      } catch (err: any) {
        const message =
          err?.response?.data?.message ?? "Failed to fetch notifications";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const markRead = useCallback(
    async (id: string) => {
      try {
        const updated = await notificationApi.markRead(id);
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            notifications: prev.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true, readAt: updated.readAt } : n
            ),
          };
        });
        return updated;
      } catch {
        return null;
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    try {
      const result = await notificationApi.markAllRead();
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: prev.notifications.map((n) => ({
            ...n,
            isRead: true,
            readAt: n.readAt ?? new Date().toISOString(),
          })),
        };
      });
      return result;
    } catch {
      return null;
    }
  }, []);

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        await notificationApi.deleteNotification(id);
        setData((prev) => {
          if (!prev) return prev;
          const notifications = prev.notifications.filter((n) => n.id !== id);
          return {
            ...prev,
            notifications,
            pagination: {
              ...prev.pagination,
              total: prev.pagination.total - 1,
            },
          };
        });
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  return {
    data,
    loading,
    error,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  };
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    setLoading(true);
    try {
      const c = await notificationApi.getUnreadCount();
      setCount(c);
      return c;
    } catch {
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  return { count, setCount, loading, fetchCount };
}
