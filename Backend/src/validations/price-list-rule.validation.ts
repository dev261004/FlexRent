import { PriceRuleType } from "@prisma/client";
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

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return value;
};

const idSchema = z.string().trim().min(1, "Id is required");

const optionalNullableId = z.preprocess(
  emptyStringToNull,
  z.string().trim().min(1).nullable().optional()
);

const optionalNullableDate = z.preprocess(
  emptyStringToNull,
  z.coerce.date({ invalid_type_error: "Date must be a valid date" }).nullable().optional()
);

const optionalNullableNumber = (fieldName: string, min?: number, max?: number) => {
  let schema = z.coerce
    .number({ invalid_type_error: `${fieldName} must be a number` })
    .finite(`${fieldName} must be a valid number`);

  if (min !== undefined) {
    schema = schema.min(min, `${fieldName} must be greater than or equal to ${min}`);
  }

  if (max !== undefined) {
    schema = schema.max(max, `${fieldName} must be less than or equal to ${max}`);
  }

  return z.preprocess(emptyStringToNull, schema.nullable().optional());
};

const optionalPositiveNumber = (fieldName: string) =>
  z.preprocess(
    emptyStringToNull,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .finite(`${fieldName} must be a valid number`)
      .gt(0, `${fieldName} must be greater than 0`)
      .nullable()
      .optional()
  );

const optionalMinQuantity = z.preprocess(
  emptyStringToUndefined,
  z.coerce
    .number({ invalid_type_error: "minQuantity must be a number" })
    .int("minQuantity must be an integer")
    .min(1, "minQuantity must be at least 1")
    .optional()
);

const optionalBoolean = z.preprocess(parseBoolean, z.boolean().optional());

const assertDateRange = (
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

export const priceListRuleListParamsSchema = z
  .object({
    priceListId: idSchema,
  })
  .strict();

export const priceListRuleParamsSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const createPriceListRuleSchema = z
  .object({
    productId: optionalNullableId,
    categoryId: optionalNullableId,
    ruleType: z.nativeEnum(PriceRuleType, {
      required_error: "ruleType is required",
    }),
    discountPercent: optionalNullableNumber("discountPercent", 0, 100),
    fixedPrice: optionalPositiveNumber("fixedPrice"),
    minQuantity: optionalMinQuantity.default(1),
    validFrom: optionalNullableDate,
    validTo: optionalNullableDate,
    selectable: optionalBoolean.default(true),
  })
  .strict()
  .superRefine(assertDateRange);

export const updatePriceListRuleSchema = z
  .object({
    productId: optionalNullableId,
    categoryId: optionalNullableId,
    ruleType: z.nativeEnum(PriceRuleType).optional(),
    discountPercent: optionalNullableNumber("discountPercent", 0, 100),
    fixedPrice: optionalPositiveNumber("fixedPrice"),
    minQuantity: optionalMinQuantity,
    validFrom: optionalNullableDate,
    validTo: optionalNullableDate,
    selectable: optionalBoolean,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one price list rule field is required",
  })
  .superRefine(assertDateRange);

export const listPriceListRulesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1).max(120).optional()
    ),
    productId: z.preprocess(emptyStringToUndefined, idSchema.optional()),
    categoryId: z.preprocess(emptyStringToUndefined, idSchema.optional()),
    selectable: optionalBoolean,
    ruleType: z.nativeEnum(PriceRuleType).optional(),
  })
  .strict();

export type CreatePriceListRuleInput = z.infer<typeof createPriceListRuleSchema>;
export type UpdatePriceListRuleInput = z.infer<typeof updatePriceListRuleSchema>;
export type ListPriceListRulesQuery = z.infer<typeof listPriceListRulesQuerySchema>;
