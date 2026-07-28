import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { notificationService } from "./notification.service";
import {
  listNotificationsQuerySchema,
  notificationParamsSchema,
} from "./notification.validation";

export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listNotificationsQuerySchema.parse(req.query);
    const result = await notificationService.getNotifications(
      req.user!.id,
      query
    );

    res.json({
      success: true,
      message: "Notifications fetched successfully",
      data: result,
    });
  }
);

export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.id);

    res.json({
      success: true,
      message: "Unread count fetched successfully",
      data: { count },
    });
  }
);

export const getNotificationById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = notificationParamsSchema.parse(req.params);
    const notification = await notificationService.getNotificationById(
      id,
      req.user!.id
    );

    res.json({
      success: true,
      message: "Notification fetched successfully",
      data: { notification },
    });
  }
);

export const markAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = notificationParamsSchema.parse(req.params);
    const notification = await notificationService.markAsRead(
      id,
      req.user!.id
    );

    res.json({
      success: true,
      message: "Notification marked as read",
      data: { notification },
    });
  }
);

export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await notificationService.markAllAsRead(req.user!.id);

    res.json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  }
);

export const deleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = notificationParamsSchema.parse(req.params);
    const notification = await notificationService.softDelete(
      id,
      req.user!.id
    );

    res.json({
      success: true,
      message: "Notification deleted successfully",
      data: { notification },
    });
  }
);
