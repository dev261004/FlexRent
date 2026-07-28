import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
};

export const rentalOrderIdParamsSchema = z
  .object({
    rentalOrderId: z
      .string({ required_error: "Rental order id is required" })
      .trim()
      .min(1, "Rental order id is required"),
  })
  .strict();

export const listRemindersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    rentalOrderId: z.preprocess(emptyStringToUndefined, z.string().optional()),
    status: z.preprocess(
      emptyStringToUndefined,
      z.enum(["SCHEDULED", "SENT", "FAILED", "CANCELLED"]).optional()
    ),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type ListRemindersQuery = z.infer<typeof listRemindersQuerySchema>;
