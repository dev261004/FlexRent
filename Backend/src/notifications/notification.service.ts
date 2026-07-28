import { AppError } from "../middleware/error.middleware";
import {
  notificationRepository,
  NotificationRow,
} from "./notification.repository";
import { emitToUser } from "./notification.socket";
import {
  NotifyPayload,
  NotificationResponse,
  resolveChannels,
} from "./notification.types";
import { ListNotificationsQuery } from "./notification.validation";

export class NotificationService {
  /**
   * The SINGLE entry point for sending notifications.
   * Business modules call this directly for immediate delivery.
   * BullMQ workers also call this for scheduled/async jobs.
   */
  async notify(payload: NotifyPayload): Promise<NotificationResponse> {
    const channels = resolveChannels(payload.channels);

    // Idempotency check — return existing notification if key matches
    if (payload.idempotencyKey) {
      const existing = await notificationRepository.findByIdempotencyKey(
        payload.idempotencyKey
      );
      if (existing) {
        return this.mapNotification(existing);
      }
    }

    let notification: NotificationRow | null = null;

    // Channel: In-App — persist to database
    if (channels.inApp) {
      notification = await notificationRepository.create({
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        priority: payload.priority ?? "NORMAL",
        data: (payload.data as any) ?? undefined,
        actionUrl: payload.actionUrl ?? null,
        idempotencyKey: payload.idempotencyKey ?? null,
      });
    }

    // Channel: Socket.IO — emit realtime event
    if (channels.socket && notification) {
      const mapped = this.mapNotification(notification);

      try {
        emitToUser(payload.userId, "notification:new", mapped);

        const unreadCount = await notificationRepository.countUnread(
          payload.userId
        );
        emitToUser(payload.userId, "notification:count", { count: unreadCount });
      } catch {
        // Socket may not be initialized (e.g., in worker process)
        // Fail silently — the notification is already persisted
      }
    }

    // Channel: Email — future integration
    // if (channels.email) { ... }

    // Channel: Push — future integration
    // if (channels.push) { ... }

    if (!notification) {
      throw new AppError(500, "Notification was not created — no channels active");
    }

    return this.mapNotification(notification);
  }

  async getNotifications(userId: string, query: ListNotificationsQuery) {
    const [notifications, total] = await notificationRepository.findMany(
      userId,
      query
    );

    return {
      notifications: notifications.map((n) => this.mapNotification(n)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getNotificationById(
    id: string,
    userId: string
  ): Promise<NotificationResponse> {
    const notification = await notificationRepository.findById(id);
    this.assertExists(notification);
    this.assertOwnership(notification, userId);

    return this.mapNotification(notification);
  }

  async markAsRead(
    id: string,
    userId: string
  ): Promise<NotificationResponse> {
    const notification = await notificationRepository.findById(id);
    this.assertExists(notification);
    this.assertOwnership(notification, userId);

    const updated = await notificationRepository.markAsRead(id);

    try {
      emitToUser(userId, "notification:read", { id });
      const unreadCount = await notificationRepository.countUnread(userId);
      emitToUser(userId, "notification:count", { count: unreadCount });
    } catch {
      // Socket not available — silent fail
    }

    return this.mapNotification(updated);
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await notificationRepository.markAllAsRead(userId);

    try {
      emitToUser(userId, "notification:all-read", {});
      emitToUser(userId, "notification:count", { count: 0 });
    } catch {
      // Socket not available — silent fail
    }

    return { count: result.count };
  }

  async softDelete(
    id: string,
    userId: string
  ): Promise<NotificationResponse> {
    const notification = await notificationRepository.findById(id);
    this.assertExists(notification);
    this.assertOwnership(notification, userId);

    const deleted = await notificationRepository.softDelete(id);

    try {
      if (!notification.isRead) {
        const unreadCount = await notificationRepository.countUnread(userId);
        emitToUser(userId, "notification:count", { count: unreadCount });
      }
    } catch {
      // Socket not available — silent fail
    }

    return this.mapNotification(deleted);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.countUnread(userId);
  }

  private assertExists(
    notification: NotificationRow | null
  ): asserts notification is NotificationRow {
    if (!notification) {
      throw new AppError(404, "Notification not found");
    }
  }

  private assertOwnership(
    notification: NotificationRow,
    userId: string
  ): void {
    if (notification.userId !== userId) {
      throw new AppError(403, "You do not have permission to access this notification");
    }
  }

  private mapNotification(notification: NotificationRow): NotificationResponse {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      data: notification.data,
      actionUrl: notification.actionUrl,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}

export const notificationService = new NotificationService();
