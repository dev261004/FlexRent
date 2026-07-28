import api from "@/core/api";
import type {
  Notification,
  NotificationQueryParams,
  PaginatedNotifications,
} from "./types";

export async function getNotifications(
  params: NotificationQueryParams = {}
): Promise<PaginatedNotifications> {
  const response = await api.get("/notifications", { params });
  return response.data.data as PaginatedNotifications;
}

export async function getUnreadCount(): Promise<number> {
  const response = await api.get("/notifications/unread-count");
  return response.data.data.count as number;
}

export async function markRead(id: string): Promise<Notification> {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data.data.notification as Notification;
}

export async function markAllRead(): Promise<{ count: number }> {
  const response = await api.patch("/notifications/read-all");
  return response.data.data as { count: number };
}

export async function deleteNotification(id: string): Promise<Notification> {
  const response = await api.delete(`/notifications/${id}`);
  return response.data.data.notification as Notification;
}
