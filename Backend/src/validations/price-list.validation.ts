import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const emptyStringToNull = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
};

const parseBoolean = (value: unknown): unknown => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return value;
};

const idSchema = z
  .string({ required_error: "Price list id is required" })
  .trim()
  .min(1, "Price list id is required");

const requiredText = (fieldName: string, max = 100) =>
  z
    .string({ required_error: `${fieldName} is required` })
    .trim()
    .min(2, `${fieldName} must be at least 2 characters`)
    .max(max, `${fieldName} must be at most ${max} characters`);

const optionalText = (max = 500) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(max).optional()
  );

const optionalNullableText = (max = 500) =>
  z.preprocess(
    emptyStringToNull,
    z.string().trim().min(1).max(max).nullable().optional()
  );

const optionalDate = z.preprocess(
  emptyStringToUndefined,
  z.coerce.date({ invalid_type_error: "Date must be a valid date" }).optional()
);

const optionalNullableDate = z.preprocess(
  emptyStringToNull,
  z.coerce
    .date({ invalid_type_error: "Date must be a valid date" })
    .nullable()
    .optional()
);

const optionalBoolean = z.preprocess(parseBoolean, z.boolean().optional());

const assertValidDateRange = (
  data: { validFrom?: Date | null; validTo?: Date | null },
  context: z.RefinementCtx
) => {
  if (data.validFrom && data.validTo && data.validFrom >= data.validTo) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "validFrom must be before validTo",
      path: ["validFrom"],
    });
  }
};

export const priceListParamsSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const createPriceListSchema = z
  .object({
    name: requiredText("Price list name", 100),
    description: optionalText(500),
    isDefault: optionalBoolean,
    isActive: optionalBoolean,
    validFrom: optionalDate,
    validTo: optionalDate,
  })
  .strict()
  .superRefine(assertValidDateRange);

export const updatePriceListSchema = z
  .object({
    name: requiredText("Price list name", 100).optional(),
    description: optionalNullableText(500),
    isDefault: optionalBoolean,
    isActive: optionalBoolean,
    validFrom: optionalNullableDate,
    validTo: optionalNullableDate,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one price list field is required",
  })
  .superRefine(assertValidDateRange);

export const listPriceListsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalText(120),
    isActive: optionalBoolean,
    isDefault: optionalBoolean,
    sortBy: z
      .enum([
        "name",
        "validFrom",
        "validTo",
        "createdAt",
        "updatedAt",
        "isDefault",
        "isActive",
      ])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type CreatePriceListInput = z.infer<typeof createPriceListSchema>;
export type UpdatePriceListInput = z.infer<typeof updatePriceListSchema>;
export type ListPriceListsQuery = z.infer<typeof listPriceListsQuerySchema>;
