import { z } from "zod";

const idSchema = z
  .string({ required_error: "Id is required" })
  .trim()
  .min(1, "Id is required");

export const productImageParamsSchema = z
  .object({
    productId: idSchema,
  })
  .strict();

export const imageIdParamsSchema = z
  .object({
    imageId: idSchema,
  })
  .strict();

export const uploadProductImagesBodySchema = z
  .object({
    altText: z.string().trim().max(200).optional(),
  })
  .strict();

export const reorderProductImagesSchema = z
  .object({
    images: z
      .array(
        z
          .object({
            imageId: idSchema,
            sortOrder: z.coerce
              .number({ invalid_type_error: "Sort order must be a number" })
              .int("Sort order must be an integer")
              .min(0, "Sort order cannot be negative"),
          })
          .strict()
      )
      .min(1, "At least one image is required")
      .max(100, "You can reorder up to 100 images at a time"),
  })
  .strict();
