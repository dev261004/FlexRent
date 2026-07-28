"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { NotificationCard } from "./NotificationCard";
import { useNotificationContext } from "@/contexts/NotificationContext";
import * as notificationApi from "@/features/notifications/api";
import type { Notification } from "@/features/notifications/types";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  basePath: string;
}

export function NotificationDropdown({
  isOpen,
  onClose,
  basePath,
}: NotificationDropdownProps) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const { refreshUnreadCount } = useNotificationContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationApi.getNotifications({
        page: 1,
        limit: 5,
        sortOrder: "desc",
      });
      setNotifications(result.notifications);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRecent();
    }
  }, [isOpen, fetchRecent]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMarkRead = async (id: string) => {
    await notificationApi.markRead(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n
      )
    );
    refreshUnreadCount();
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt ?? new Date().toISOString(),
      }))
    );
    refreshUnreadCount();
  };

  const handleClick = (notification: Notification) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-display text-sm font-semibold text-text">
          Notifications
        </h3>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
        >
          <CheckCheck size={14} />
          Mark all read
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-chalk">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onClick={handleClick}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5">
        <Link
          href={`${basePath}/notifications`}
          onClick={onClose}
          className="block text-center text-xs font-semibold text-accent transition-colors hover:text-accent/80"
        >
          View All Notifications
        </Link>
      </div>
    </div>
  );
}
