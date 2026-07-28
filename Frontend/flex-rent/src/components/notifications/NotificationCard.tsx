"use client";

import {
  Bell,
  CreditCard,
  FileText,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Shield,
  Info,
  X,
  Trash2,
} from "lucide-react";
import type {
  Notification,
  NotificationType,
  NotificationPriority,
} from "@/features/notifications/types";

interface NotificationCardProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  compact?: boolean;
}

const typeIconMap: Record<NotificationType, typeof Bell> = {
  SYSTEM: Info,
  QUOTATION_CREATED: FileText,
  QUOTATION_ACCEPTED: CheckCircle,
  QUOTATION_REJECTED: X,
  PAYMENT_RECEIVED: CreditCard,
  PAYMENT_FAILED: AlertTriangle,
  PICKUP_REMINDER: Package,
  RETURN_REMINDER: Clock,
  OVERDUE_REMINDER: AlertTriangle,
  LATE_FEE_UPDATED: AlertTriangle,
  RETURN_CONFIRMED: CheckCircle,
  SECURITY_DEPOSIT_REFUNDED: Shield,
  EXTENSION_REQUESTED: RefreshCw,
  EXTENSION_APPROVED: CheckCircle,
  EXTENSION_REJECTED: X,
  GENERAL: Bell,
};

const priorityStyles: Record<NotificationPriority, string> = {
  LOW: "",
  NORMAL: "",
  HIGH: "border-l-2 border-l-amber-500",
  URGENT: "border-l-2 border-l-red-500",
};

const priorityDotStyles: Record<NotificationPriority, string> = {
  LOW: "",
  NORMAL: "",
  HIGH: "bg-amber-500",
  URGENT: "bg-red-500",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  return new Date(dateStr).toLocaleDateString();
}

export function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  onClick,
  compact = false,
}: NotificationCardProps) {
  const Icon = typeIconMap[notification.type] ?? Bell;
  const isUnread = !notification.isRead;

  const handleClick = () => {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex items-start gap-3 rounded-xl px-3 py-3 transition-colors ${
        onClick || notification.actionUrl
          ? "cursor-pointer hover:bg-surface-raised"
          : ""
      } ${isUnread ? "bg-accent/5" : ""} ${priorityStyles[notification.priority]}`}
    >
      {/* Icon */}
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUnread ? "bg-accent/15 text-accent" : "bg-surface-raised text-chalk"
        }`}
      >
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-tight ${
              isUnread ? "font-semibold text-text" : "font-medium text-text/80"
            }`}
          >
            {notification.title}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {(notification.priority === "HIGH" ||
              notification.priority === "URGENT") && (
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  priorityDotStyles[notification.priority]
                }`}
              />
            )}
            {isUnread && (
              <span className="h-2 w-2 rounded-full bg-accent" />
            )}
          </div>
        </div>
        {!compact && (
          <p className="mt-0.5 text-xs leading-relaxed text-chalk line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="mt-1 text-[10px] text-chalk/60">
          {relativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Actions */}
      {!compact && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {isUnread && onMarkRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              className="rounded-lg p-1.5 text-chalk transition-colors hover:bg-surface-raised hover:text-accent"
              title="Mark as read"
            >
              <CheckCircle size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="rounded-lg p-1.5 text-chalk transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
