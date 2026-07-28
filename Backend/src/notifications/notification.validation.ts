import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
};

export const notificationParamsSchema = z
  .object({
    id: z
      .string({ required_error: "Notification id is required" })
      .trim()
      .min(1, "Notification id is required"),
  })
  .strict();

export const listNotificationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.preprocess(
      emptyStringToUndefined,
      z
        .enum([
          "SYSTEM",
          "QUOTATION_CREATED",
          "QUOTATION_ACCEPTED",
          "QUOTATION_REJECTED",
          "PAYMENT_RECEIVED",
          "PAYMENT_FAILED",
          "PICKUP_REMINDER",
          "RETURN_REMINDER",
          "OVERDUE_REMINDER",
          "LATE_FEE_UPDATED",
          "RETURN_CONFIRMED",
          "SECURITY_DEPOSIT_REFUNDED",
          "EXTENSION_REQUESTED",
          "EXTENSION_APPROVED",
          "EXTENSION_REJECTED",
          "GENERAL",
        ])
        .optional()
    ),
    priority: z.preprocess(
      emptyStringToUndefined,
      z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional()
    ),
    unreadOnly: z.preprocess(
      (value) => value === "true" || value === true,
      z.boolean().default(false)
    ),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;
