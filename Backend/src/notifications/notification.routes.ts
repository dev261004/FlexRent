import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import {
  deleteNotification,
  getNotificationById,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "./notification.controller";

const router = Router();

router.use(verifyJWT);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.get("/:id", getNotificationById);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
