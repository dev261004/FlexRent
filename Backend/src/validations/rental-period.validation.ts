import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

export const rentalPeriodParamsSchema = z.object({
  id: z.string().trim().min(1, "Rental period ID is required"),
});

export const createRentalPeriodSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  unit: z
    .enum(["HOUR", "DAY", "NIGHT", "WEEK", "MONTH"])
    .default("DAY"),
  duration: z.coerce
    .number()
    .int("Duration must be an integer")
    .min(1, "Duration must be at least 1")
    .default(1),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateRentalPeriodSchema = z.object({
  name: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(2).max(100).optional()
  ),
  unit: z.preprocess(
    emptyStringToUndefined,
    z.enum(["HOUR", "DAY", "NIGHT", "WEEK", "MONTH"]).optional()
  ),
  duration: z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().min(1).optional()
  ),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateRentalPeriodInput = z.infer<typeof createRentalPeriodSchema>;
export type UpdateRentalPeriodInput = z.infer<typeof updateRentalPeriodSchema>;
