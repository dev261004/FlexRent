"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NotificationCard } from "./NotificationCard";
import { useNotifications } from "@/features/notifications/hooks";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { getNotificationTargetUrl } from "@/features/notifications/utils";
import type {
  NotificationType,
  NotificationPriority,
  NotificationQueryParams,
} from "@/features/notifications/types";
import * as notificationApi from "@/features/notifications/api";

interface NotificationsPageContentProps {
  basePath: string;
}

const typeOptions: { value: NotificationType | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "SYSTEM", label: "System" },
  { value: "QUOTATION_CREATED", label: "Quotation Created" },
  { value: "QUOTATION_ACCEPTED", label: "Quotation Accepted" },
  { value: "QUOTATION_REJECTED", label: "Quotation Rejected" },
  { value: "PAYMENT_RECEIVED", label: "Payment Received" },
  { value: "PAYMENT_FAILED", label: "Payment Failed" },
  { value: "PICKUP_REMINDER", label: "Pickup Reminder" },
  { value: "RETURN_REMINDER", label: "Return Reminder" },
  { value: "OVERDUE_REMINDER", label: "Overdue Reminder" },
  { value: "LATE_FEE_UPDATED", label: "Late Fee Updated" },
  { value: "RETURN_CONFIRMED", label: "Return Confirmed" },
  { value: "SECURITY_DEPOSIT_REFUNDED", label: "Deposit Refunded" },
  { value: "EXTENSION_REQUESTED", label: "Extension Requested" },
  { value: "EXTENSION_APPROVED", label: "Extension Approved" },
  { value: "EXTENSION_REJECTED", label: "Extension Rejected" },
  { value: "GENERAL", label: "General" },
];

const priorityOptions: { value: NotificationPriority | ""; label: string }[] = [
  { value: "", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function NotificationsPageContent({
  basePath,
}: NotificationsPageContentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { refreshUnreadCount } = useNotificationContext();
  const {
    data,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();

  const [filters, setFilters] = useState<NotificationQueryParams>({
    page: 1,
    limit: 20,
    sortOrder: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNotifications(filters);
  }, [filters, fetchNotifications]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      await markRead(id);
      refreshUnreadCount();
    },
    [markRead, refreshUnreadCount]
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    refreshUnreadCount();
  }, [markAllRead, refreshUnreadCount]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteNotification(id);
      refreshUnreadCount();
    },
    [deleteNotification, refreshUnreadCount]
  );

  const handleNotificationClick = useCallback(
    (notification: { actionUrl: string | null; id: string; isRead: boolean }) => {
      const targetUrl = getNotificationTargetUrl(
        notification.actionUrl,
        user?.role,
        basePath
      );
      if (targetUrl) {
        router.push(targetUrl);
      }
    },
    [router, user?.role, basePath]
  );

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const pagination = data?.pagination;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-chalk">
            {pagination
              ? `${pagination.total} notification${pagination.total !== 1 ? "s" : ""}`
              : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              showFilters
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-surface-raised text-chalk hover:border-accent/40 hover:text-text"
            }`}
          >
            <Filter size={16} />
            Filters
          </button>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-chalk transition-colors hover:border-accent/40 hover:text-text"
          >
            <CheckCheck size={16} />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface-raised p-4">
          <select
            value={filters.type ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                type: (e.target.value || undefined) as NotificationType | undefined,
                page: 1,
              }))
            }
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent/70"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.priority ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                priority: (e.target.value || undefined) as NotificationPriority | undefined,
                page: 1,
              }))
            }
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent/70"
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-chalk">
            <input
              type="checkbox"
              checked={filters.unreadOnly ?? false}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  unreadOnly: e.target.checked || undefined,
                  page: 1,
                }))
              }
              className="accent-accent"
            />
            Unread only
          </label>

          <button
            type="button"
            onClick={() =>
              setFilters({ page: 1, limit: 20, sortOrder: "desc" })
            }
            className="ml-auto text-xs font-medium text-accent hover:text-accent/80"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Notification List */}
      <div className="rounded-2xl border border-border bg-surface">
        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : data?.notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised">
              <Bell size={28} className="text-chalk/50" />
            </div>
            <p className="mt-4 text-sm font-medium text-text">
              No notifications
            </p>
            <p className="mt-1 text-xs text-chalk">
              You&apos;re all caught up!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {data?.notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-chalk">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-chalk transition-colors hover:border-accent/40 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-chalk transition-colors hover:border-accent/40 hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
