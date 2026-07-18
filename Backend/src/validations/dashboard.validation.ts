import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const optionalDate = z.preprocess(
  emptyStringToUndefined,
  z.coerce.date({ invalid_type_error: "Date must be a valid date" }).optional()
);

export const rentalOperationsDashboardQuerySchema = z
  .object({
    range: z.enum(["today", "this_week", "this_month", "custom"]).default("today"),
    fromDate: optionalDate,
    toDate: optionalDate,
    vendorId: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).optional()
    ),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.range === "custom" && (!data.fromDate || !data.toDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fromDate and toDate are required for custom range",
        path: ["fromDate"],
      });
    }

    if (data.fromDate && data.toDate && data.fromDate > data.toDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fromDate must be before toDate",
        path: ["fromDate"],
      });
    }
  });

export type RentalOperationsDashboardQuery = z.infer<
  typeof rentalOperationsDashboardQuerySchema
>;
