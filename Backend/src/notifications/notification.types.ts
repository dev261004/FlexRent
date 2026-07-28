import { NotificationPriority, NotificationType } from "@prisma/client";

export interface NotificationChannels {
  inApp?: boolean;
  socket?: boolean;
  email?: boolean;
  push?: boolean;
}

const DEFAULT_CHANNELS: Required<NotificationChannels> = {
  inApp: true,
  socket: true,
  email: false,
  push: false,
};

export const resolveChannels = (
  channels?: NotificationChannels
): Required<NotificationChannels> => {
  return {
    ...DEFAULT_CHANNELS,
    ...channels,
  };
};

export interface NotifyPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  data?: Record<string, unknown>;
  actionUrl?: string;
  idempotencyKey?: string;
  channels?: NotificationChannels;
}

export interface QueueNotificationPayload extends NotifyPayload {
  delay?: number;
  jobId?: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  data: unknown;
  actionUrl: string | null;
  idempotencyKey: string | null;
  isRead: boolean;
  readAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  data: unknown;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
