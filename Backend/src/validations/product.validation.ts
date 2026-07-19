import { z } from "zod";

export const PRODUCT_TYPES = ["GOODS", "SERVICE"] as const;
export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const PRODUCT_ASSET_STATUSES = [
  "AVAILABLE",
  "BOOKED",
  "PICKED_UP",
  "LATE_PICKUP",
  "LATE_RETURN",
  "MAINTENANCE",
  "RETIRED",
] as const;
export const DEPOSIT_TYPES = ["FIXED", "PERCENTAGE"] as const;
export const LATE_FEE_UNITS = ["HOUR", "DAY", "WEEK", "MONTH"] as const;

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

const requiredText = (fieldName: string, max = 160) =>
  z
    .string({ required_error: `${fieldName} is required` })
    .trim()
    .min(1, `${fieldName} is required`)
    .max(max, `${fieldName} must be at most ${max} characters`);

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

const idSchema = requiredText("Id", 120);

const optionalId = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z
      .string({ invalid_type_error: `${fieldName} must be a string` })
      .trim()
      .min(1, `${fieldName} is required`)
      .max(120)
      .optional()
  );

const optionalNullableId = (fieldName: string) =>
  z.preprocess(
    emptyStringToNull,
    z
      .string({ invalid_type_error: `${fieldName} must be a string` })
      .trim()
      .min(1, `${fieldName} is required`)
      .max(120)
      .nullable()
      .optional()
  );

const moneyGreaterThanTen = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({
        required_error: `${fieldName} is required`,
        invalid_type_error: `${fieldName} must be a number`,
      })
      .finite(`${fieldName} must be a valid number`)
      .gt(10, `${fieldName} must be greater than 10`)
  );

const optionalMoneyGreaterThanTen = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .finite(`${fieldName} must be a valid number`)
      .gt(10, `${fieldName} must be greater than 10`)
      .optional()
  );

const optionalNullableMoneyGreaterThanTen = (fieldName: string) =>
  z.preprocess(
    emptyStringToNull,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .finite(`${fieldName} must be a valid number`)
      .gt(10, `${fieldName} must be greater than 10`)
      .nullable()
      .optional()
  );

const optionalNonNegativeMoney = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .finite(`${fieldName} must be a valid number`)
      .min(0, `${fieldName} cannot be negative`)
      .optional()
  );

const optionalNullableNonNegativeMoney = (fieldName: string) =>
  z.preprocess(
    emptyStringToNull,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .finite(`${fieldName} must be a valid number`)
      .min(0, `${fieldName} cannot be negative`)
      .nullable()
      .optional()
  );

const optionalNonNegativeInt = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .int(`${fieldName} must be an integer`)
      .min(0, `${fieldName} cannot be negative`)
      .optional()
  );

const requiredNonNegativeInt = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({
        required_error: `${fieldName} is required`,
        invalid_type_error: `${fieldName} must be a number`,
      })
      .int(`${fieldName} must be an integer`)
      .min(0, `${fieldName} cannot be negative`)
  );

const productImageSchema = z
  .object({
    url: requiredText("Image URL", 1000),
    altText: optionalText(200),
    isPrimary: z.coerce.boolean().optional(),
    sortOrder: optionalNonNegativeInt("Image sort order"),
  })
  .strict();

const productAssetSchema = z
  .object({
    assetTag: requiredText("Asset tag", 120),
    barcode: optionalText(120),
    qrCode: optionalText(120),
    variantId: optionalId("Variant id"),
    status: z.enum(PRODUCT_ASSET_STATUSES).optional(),
    notes: optionalText(500),
  })
  .strict();

const productVariantSchema = z
  .object({
    sku: optionalText(120),
    name: optionalText(160),
    quantityOnHand: optionalNonNegativeInt("Variant quantity"),
    salesPrice: optionalNonNegativeMoney("Variant sales price"),
    costPrice: optionalNonNegativeMoney("Variant cost price"),
    isActive: z.coerce.boolean().optional(),
    attributeValueIds: z.array(idSchema).max(50).optional(),
  })
  .strict();

const productRentalConfigSchema = z
  .object({
    rentalPeriodId: idSchema,
    pickupTime: optionalText(20),
    returnTime: optionalText(20),
    paddingMinutes: optionalNonNegativeInt("Padding minutes"),
    depositType: z.enum(DEPOSIT_TYPES).optional(),
    securityDeposit: optionalNonNegativeMoney("Security deposit"),
    lateFeeUnit: z.enum(LATE_FEE_UNITS).optional(),
    lateFee: optionalNonNegativeMoney("Late fee"),
    gracePeriodMinutes: optionalNonNegativeInt("Grace period minutes"),
    maxLateFee: optionalNullableNonNegativeMoney("Max late fee"),
  })
  .strict();

export const productParamsSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const createProductSchema = z
  .object({
    name: requiredText("Product name", 160),
    slug: optionalText(180),
    sku: optionalText(120),
    description: optionalText(5000),
    type: z.enum(PRODUCT_TYPES).optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
    quantityOnHand: requiredNonNegativeInt("Quantity on hand").optional(),
    salesPrice: moneyGreaterThanTen("Sales price"),
    costPrice: optionalMoneyGreaterThanTen("Cost price"),
    categoryId: optionalId("Category id"),
    vendorId: optionalId("Vendor id"),
    images: z.array(productImageSchema).max(20).optional(),
    assets: z.array(productAssetSchema).max(500).optional(),
    attributeIds: z.array(idSchema).max(50).optional(),
    variants: z.array(productVariantSchema).max(200).optional(),
    rentalConfig: productRentalConfigSchema.optional(),
  })
  .strict();

export const updateProductSchema = z
  .object({
    name: optionalText(160),
    slug: optionalNullableText(180),
    sku: optionalNullableText(120),
    description: optionalNullableText(5000),
    type: z.enum(PRODUCT_TYPES).optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
    quantityOnHand: optionalNonNegativeInt("Quantity on hand"),
    salesPrice: optionalMoneyGreaterThanTen("Sales price"),
    costPrice: optionalNullableMoneyGreaterThanTen("Cost price"),
    categoryId: optionalNullableId("Category id"),
    vendorId: optionalNullableId("Vendor id"),
    images: z.array(productImageSchema).max(20).optional(),
    assets: z.array(productAssetSchema).max(500).optional(),
    attributeIds: z.array(idSchema).max(50).optional(),
    variants: z.array(productVariantSchema).max(200).optional(),
    rentalConfig: productRentalConfigSchema.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one product field is required",
  });

export const listProductsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: optionalText(120),
    categoryId: optionalId("Category id"),
    vendorId: optionalId("Vendor id"),
    status: z.enum(PRODUCT_STATUSES).optional(),
    type: z.enum(PRODUCT_TYPES).optional(),
    minPrice: optionalNonNegativeMoney("Minimum price"),
    maxPrice: optionalNonNegativeMoney("Maximum price"),
    sortBy: z
      .enum([
        "name",
        "salesPrice",
        "quantityOnHand",
        "createdAt",
        "updatedAt",
        "status",
        "type",
      ])
      .default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.minPrice !== undefined &&
      data.maxPrice !== undefined &&
      data.minPrice > data.maxPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxPrice"],
        message: "Maximum price must be greater than or equal to minimum price",
      });
    }
  });
