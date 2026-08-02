import { Router, Request, Response } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { notificationService } from "./notification.service";
import { NotificationType, NotificationPriority } from "@prisma/client";

const router = Router();

router.use(verifyJWT);

/**
 * POST /notifications/test
 * Sends a test notification to the currently authenticated user.
 * Body (all optional):
 * {
 *   "type": "QUOTATION_ACCEPTED",
 *   "priority": "HIGH",
 *   "title": "Custom Title",
 *   "message": "Custom message",
 *   "actionUrl": "/dashboard/orders/123"
 * }
 */
router.post(
  "/test",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const {
      type = "GENERAL",
      priority = "NORMAL",
      title,
      message,
      actionUrl,
    } = req.body;

    const notification = await notificationService.notify({
      userId,
      title: title ?? `Test Notification (${type})`,
      message:
        message ??
        `This is a test notification with priority ${priority}. Sent at ${new Date().toLocaleTimeString()}.`,
      type: type as NotificationType,
      priority: priority as NotificationPriority,
      actionUrl: actionUrl ?? null,
      data: { test: true, timestamp: Date.now() },
      idempotencyKey: `test_${userId}_${Date.now()}`,
    });

    res.json({
      success: true,
      message: "Test notification sent successfully",
      data: { notification },
    });
  })
);

/**
 * POST /notifications/test/all-types
 * Sends one notification per type to test all notification types at once.
 */
router.post(
  "/test/all-types",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const now = Date.now();

    const testCases: {
      type: NotificationType;
      priority: NotificationPriority;
      title: string;
    }[] = [
      { type: "QUOTATION_CREATED", priority: "NORMAL", title: "New Quotation Received" },
      { type: "QUOTATION_ACCEPTED", priority: "NORMAL", title: "Quotation Accepted!" },
      { type: "QUOTATION_REJECTED", priority: "NORMAL", title: "Quotation Rejected" },
      { type: "PAYMENT_RECEIVED", priority: "NORMAL", title: "Payment Confirmed" },
      { type: "PAYMENT_FAILED", priority: "URGENT", title: "Payment Failed!" },
      { type: "RETURN_REMINDER", priority: "HIGH", title: "Return Due Tomorrow" },
      { type: "OVERDUE_REMINDER", priority: "HIGH", title: "Rental Overdue!" },
      { type: "LATE_FEE_UPDATED", priority: "HIGH", title: "Late Fee Applied" },
      { type: "EXTENSION_APPROVED", priority: "NORMAL", title: "Extension Approved" },
      { type: "SECURITY_DEPOSIT_REFUNDED", priority: "NORMAL", title: "Deposit Refunded" },
    ];

    const notifications = [];
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const notification = await notificationService.notify({
        userId,
        title: tc.title,
        message: `This is a test ${tc.type} notification.`,
        type: tc.type,
        priority: tc.priority,
        actionUrl: req.user?.role === "VENDOR" ? `/vendor/operations/test-${i}` : `/dashboard/orders/test-${i}`,
        data: { test: true },
        idempotencyKey: `test_all_${userId}_${now}_${i}`,
      });
      notifications.push(notification);
    }

    res.json({
      success: true,
      message: `${notifications.length} test notifications sent`,
      data: { count: notifications.length },
    });
  })
);

export default router;
