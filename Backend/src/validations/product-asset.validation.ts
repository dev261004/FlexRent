import { z } from "zod";

export const PRODUCT_ASSET_STATUSES = [
  "AVAILABLE",
  "BOOKED",
  "PICKED_UP",
  "LATE_PICKUP",
  "LATE_RETURN",
  "MAINTENANCE",
  "RETIRED",
] as const;

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

const optionalText = (max = 100) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(max).optional()
  );

const optionalNullableText = (max = 100) =>
  z.preprocess(
    emptyStringToNull,
    z.string().trim().min(1).max(max).nullable().optional()
  );

const optionalId = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1, `${fieldName} is required`).max(120).optional()
  );

const optionalNullableId = (fieldName: string) =>
  z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .min(1, `${fieldName} is required`)
      .max(120)
      .nullable()
      .optional()
  );

export const productAssetParamsSchema = z
  .object({
    productId: idSchema,
  })
  .strict();

export const productAssetDetailParamsSchema = z
  .object({
    productId: idSchema,
    assetId: idSchema,
  })
  .strict();

export const createProductAssetSchema = z
  .object({
    assetTag: z
      .string({ required_error: "Asset tag is required" })
      .trim()
      .min(2, "Asset tag must be at least 2 characters")
      .max(100, "Asset tag must be at most 100 characters"),
    barcode: optionalText(100),
    qrCode: optionalText(100),
    variantId: optionalId("Variant id"),
    status: z.enum(PRODUCT_ASSET_STATUSES).default("AVAILABLE"),
    notes: optionalText(1000),
  })
  .strict();

export const updateProductAssetSchema = z
  .object({
    assetTag: z
      .preprocess(
        emptyStringToUndefined,
        z
          .string()
          .trim()
          .min(2, "Asset tag must be at least 2 characters")
          .max(100, "Asset tag must be at most 100 characters")
          .optional()
      ),
    barcode: optionalNullableText(100),
    qrCode: optionalNullableText(100),
    variantId: optionalNullableId("Variant id"),
    status: z.enum(PRODUCT_ASSET_STATUSES).optional(),
    notes: optionalNullableText(1000),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one asset field is required",
  });

export const listProductAssetsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalText(100),
    status: z.enum(PRODUCT_ASSET_STATUSES).optional(),
    variantId: optionalId("Variant id"),
    sortBy: z
      .enum(["assetTag", "status", "createdAt", "updatedAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type CreateProductAssetInput = z.infer<typeof createProductAssetSchema>;
export type UpdateProductAssetInput = z.infer<typeof updateProductAssetSchema>;
export type ListProductAssetsQuery = z.infer<typeof listProductAssetsQuerySchema>;
