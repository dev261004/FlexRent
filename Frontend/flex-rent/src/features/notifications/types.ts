export type NotificationType =
  | "SYSTEM"
  | "QUOTATION_CREATED"
  | "QUOTATION_ACCEPTED"
  | "QUOTATION_REJECTED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_FAILED"
  | "PICKUP_REMINDER"
  | "RETURN_REMINDER"
  | "OVERDUE_REMINDER"
  | "LATE_FEE_UPDATED"
  | "RETURN_CONFIRMED"
  | "SECURITY_DEPOSIT_REFUNDED"
  | "EXTENSION_REQUESTED"
  | "EXTENSION_APPROVED"
  | "EXTENSION_REJECTED"
  | "GENERAL";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  data: Record<string, unknown> | null;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  priority?: NotificationPriority;
  unreadOnly?: boolean;
  sortOrder?: "asc" | "desc";
}
