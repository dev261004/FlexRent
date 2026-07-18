import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const parseBoolean = (value: unknown): unknown => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return value;
};

const idSchema = z.string().trim().min(1, "Id is required");

const optionalText = (max = 500) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(max).optional()
  );

const optionalDate = z.preprocess(
  emptyStringToUndefined,
  z.coerce.date({ invalid_type_error: "Date must be a valid date" }).optional()
);

const requiredDate = (fieldName: string) =>
  z.coerce.date({
    required_error: `${fieldName} is required`,
    invalid_type_error: `${fieldName} must be a valid date`,
  });

const rentalOrderItemSchema = z
  .object({
    productId: idSchema,
    variantId: z.preprocess(emptyStringToUndefined, idSchema.optional()),
    assetId: z.preprocess(emptyStringToUndefined, idSchema.optional()),
    quantity: z.coerce
      .number({ invalid_type_error: "Quantity must be a number" })
      .int("Quantity must be an integer")
      .min(1, "Quantity must be greater than zero"),
  })
  .strict();

const validateRentalDates = (
  data: { rentalStart?: Date; rentalEnd?: Date },
  context: z.RefinementCtx
) => {
  if (data.rentalStart && data.rentalEnd && data.rentalStart >= data.rentalEnd) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Rental start must be before rental end",
      path: ["rentalStart"],
    });
  }
};

export const rentalOrderParamsSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const createRentalOrderSchema = z
  .object({
    customerId: idSchema,
    vendorId: idSchema,
    rentalStart: requiredDate("Rental start"),
    rentalEnd: requiredDate("Rental end"),
    notes: optionalText(1000),
    items: z
      .array(rentalOrderItemSchema)
      .min(1, "At least one item is required")
      .max(50, "You can add up to 50 rental items"),
  })
  .strict()
  .superRefine(validateRentalDates);

export const updateRentalOrderSchema = z
  .object({
    rentalStart: optionalDate,
    rentalEnd: optionalDate,
    notes: optionalText(1000),
    items: z
      .array(rentalOrderItemSchema)
      .min(1, "At least one item is required")
      .max(50, "You can add up to 50 rental items")
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one rental order field is required",
  })
  .superRefine(validateRentalDates);

export const listRentalOrdersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalText(120),
    customerId: z.preprocess(emptyStringToUndefined, idSchema.optional()),
    vendorId: z.preprocess(emptyStringToUndefined, idSchema.optional()),
    status: z
      .enum(["QUOTATION", "CONFIRMED", "PICKED_UP", "RETURNED", "CANCELLED"])
      .optional(),
    fromDate: optionalDate,
    toDate: optionalDate,
    includeCancelled: z.preprocess(parseBoolean, z.boolean().optional()),
  })
  .strict();

export type CreateRentalOrderInput = z.infer<typeof createRentalOrderSchema>;
export type UpdateRentalOrderInput = z.infer<typeof updateRentalOrderSchema>;
export type ListRentalOrdersQuery = z.infer<typeof listRentalOrdersQuerySchema>;
