import { z } from "zod";

export const ATTRIBUTE_DISPLAY_TYPES = [
  "RADIO",
  "PILLS",
  "CHECKBOX",
  "IMAGE",
] as const;

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const idSchema = z
  .string({ required_error: "Id is required" })
  .trim()
  .min(1, "Id is required");

const nameSchema = z
  .string({ required_error: "Attribute name is required" })
  .trim()
  .min(2, "Attribute name must be at least 2 characters")
  .max(100, "Attribute name must be at most 100 characters");

const optionalNameSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .trim()
    .min(2, "Attribute name must be at least 2 characters")
    .max(100, "Attribute name must be at most 100 characters")
    .optional()
);

const optionalSearchSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().min(1).max(100).optional()
);

export const productAttributeParamsSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const createProductAttributeSchema = z
  .object({
    name: nameSchema,
    displayType: z.enum(ATTRIBUTE_DISPLAY_TYPES, {
      required_error: "Display type is required",
    }),
    isActive: z.coerce.boolean().optional(),
  })
  .strict();

export const updateProductAttributeSchema = z
  .object({
    name: optionalNameSchema,
    displayType: z.enum(ATTRIBUTE_DISPLAY_TYPES).optional(),
    isActive: z.coerce.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one attribute field is required",
  });

export const listProductAttributesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: optionalSearchSchema,
    isActive: z.coerce.boolean().optional(),
    sortBy: z
      .enum(["name", "displayType", "createdAt", "updatedAt"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type CreateProductAttributeInput = z.infer<
  typeof createProductAttributeSchema
>;
export type UpdateProductAttributeInput = z.infer<
  typeof updateProductAttributeSchema
>;
export type ListProductAttributesQuery = z.infer<
  typeof listProductAttributesQuerySchema
>;
