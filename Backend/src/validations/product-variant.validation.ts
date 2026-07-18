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

const idSchema = z
  .string({ required_error: "Id is required" })
  .trim()
  .min(1, "Id is required");

const optionalText = (max = 160) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(max).optional()
  );

const optionalNullableText = (max = 160) =>
  z.preprocess(
    emptyStringToNull,
    z.string().trim().min(1).max(max).nullable().optional()
  );

const optionalNonNegativeNumber = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .finite(`${fieldName} must be a valid number`)
      .min(0, `${fieldName} must be greater than or equal to 0`)
      .optional()
  );

const optionalNullableNonNegativeNumber = (fieldName: string) =>
  z.preprocess(
    emptyStringToNull,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .finite(`${fieldName} must be a valid number`)
      .min(0, `${fieldName} must be greater than or equal to 0`)
      .nullable()
      .optional()
  );

const nonNegativeInt = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .int(`${fieldName} must be an integer`)
      .min(0, `${fieldName} must be greater than or equal to 0`)
      .optional()
  );

const attributeValueIdsSchema = z
  .array(idSchema)
  .min(1, "At least one attribute value is required")
  .max(50, "You can use up to 50 attribute values")
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Duplicate attribute values are not allowed",
  });

export const productVariantParamsSchema = z
  .object({
    productId: idSchema,
  })
  .strict();

export const productVariantDetailParamsSchema = z
  .object({
    productId: idSchema,
    variantId: idSchema,
  })
  .strict();

export const createProductVariantSchema = z
  .object({
    name: optionalText(160),
    sku: optionalText(120),
    salesPrice: optionalNonNegativeNumber("Sales price"),
    costPrice: optionalNonNegativeNumber("Cost price"),
    quantityOnHand: nonNegativeInt("Quantity on hand"),
    isActive: z.coerce.boolean().optional(),
    attributeValueIds: attributeValueIdsSchema,
  })
  .strict();

export const updateProductVariantSchema = z
  .object({
    name: optionalNullableText(160),
    sku: optionalNullableText(120),
    salesPrice: optionalNullableNonNegativeNumber("Sales price"),
    costPrice: optionalNullableNonNegativeNumber("Cost price"),
    quantityOnHand: nonNegativeInt("Quantity on hand"),
    isActive: z.coerce.boolean().optional(),
    attributeValueIds: attributeValueIdsSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one variant field is required",
  });

export const listProductVariantsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalText(120),
    isActive: z.coerce.boolean().optional(),
    sortBy: z
      .enum(["name", "sku", "quantityOnHand", "salesPrice", "createdAt", "updatedAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type CreateProductVariantInput = z.infer<
  typeof createProductVariantSchema
>;
export type UpdateProductVariantInput = z.infer<
  typeof updateProductVariantSchema
>;
export type ListProductVariantsQuery = z.infer<
  typeof listProductVariantsQuerySchema
>;
