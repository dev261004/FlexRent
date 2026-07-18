import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const requiredText = (fieldName: string, max = 120) =>
  z
    .string({ required_error: `${fieldName} is required` })
    .trim()
    .min(1, `${fieldName} is required`)
    .max(max, `${fieldName} must be at most ${max} characters`);

const optionalText = (max = 500) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(max).optional()
  );

export const categoryParamsSchema = z
  .object({
    id: requiredText("Category id", 120),
  })
  .strict();

export const createCategorySchema = z
  .object({
    name: requiredText("Category name", 120),
    description: optionalText(500),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    name: requiredText("Category name", 120).optional(),
    description: optionalText(500),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one category field is required",
  });

export const listCategoriesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: optionalText(120),
    sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
