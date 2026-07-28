import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ListNotificationsQuery } from "./notification.validation";

const notificationSelect = {
  id: true,
  userId: true,
  title: true,
  message: true,
  type: true,
  priority: true,
  data: true,
  actionUrl: true,
  idempotencyKey: true,
  isRead: true,
  readAt: true,
  isDeleted: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSelect;

export type NotificationRow = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

export class NotificationRepository {
  create(
    data: Prisma.NotificationUncheckedCreateInput
  ): Promise<NotificationRow> {
    return prisma.notification.create({
      data,
      select: notificationSelect,
    });
  }

  findByIdempotencyKey(key: string): Promise<NotificationRow | null> {
    return prisma.notification.findUnique({
      where: { idempotencyKey: key },
      select: notificationSelect,
    });
  }

  async findMany(
    userId: string,
    query: ListNotificationsQuery
  ): Promise<[NotificationRow[], number]> {
    const where: Prisma.NotificationWhereInput = {
      userId,
      isDeleted: false,
      ...(query.type ? { type: query.type } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.unreadOnly ? { isRead: false } : {}),
    };

    const skip = (query.page - 1) * query.limit;

    return prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: query.sortOrder }, { id: "desc" }],
        skip,
        take: query.limit,
        select: notificationSelect,
      }),
      prisma.notification.count({ where }),
    ]);
  }

  findById(id: string): Promise<NotificationRow | null> {
    return prisma.notification.findFirst({
      where: { id, isDeleted: false },
      select: notificationSelect,
    });
  }

  markAsRead(id: string): Promise<NotificationRow> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
      select: notificationSelect,
    });
  }

  markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false, isDeleted: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  softDelete(id: string): Promise<NotificationRow> {
    return prisma.notification.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
      select: notificationSelect,
    });
  }

  countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false, isDeleted: false },
    });
  }
}

export const notificationRepository = new NotificationRepository();
