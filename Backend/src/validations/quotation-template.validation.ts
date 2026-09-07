import { z } from "zod";

export const createQuotationTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Template name must be at least 2 characters")
    .max(100, "Template name must not exceed 100 characters"),
  header: z
    .string()
    .trim()
    .min(5, "Header must be at least 5 characters"),
  footer: z
    .string()
    .trim()
    .min(5, "Footer must be at least 5 characters"),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  validityDays: z.coerce
    .number()
    .int("Validity days must be an integer")
    .min(1, "Validity days must be at least 1")
    .max(365, "Validity days must not exceed 365")
    .optional()
    .default(7),
});

export type CreateQuotationTemplateInput = z.infer<
  typeof createQuotationTemplateSchema
>;

export const updateQuotationTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Template name must be at least 2 characters")
    .max(100, "Template name must not exceed 100 characters")
    .optional(),
  header: z
    .string()
    .trim()
    .min(5, "Header must be at least 5 characters")
    .optional(),
  footer: z
    .string()
    .trim()
    .min(5, "Footer must be at least 5 characters")
    .optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  validityDays: z.coerce
    .number()
    .int("Validity days must be an integer")
    .min(1, "Validity days must be at least 1")
    .max(365, "Validity days must not exceed 365")
    .optional(),
});

export type UpdateQuotationTemplateInput = z.infer<
  typeof updateQuotationTemplateSchema
>;

export const quotationTemplateParamsSchema = z.object({
  id: z.string().trim().min(1, "Template ID is required"),
});

export type QuotationTemplateParams = z.infer<
  typeof quotationTemplateParamsSchema
>;

export const listQuotationTemplatesQuerySchema = z.object({
  search: z.string().trim().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type ListQuotationTemplatesQuery = z.infer<
  typeof listQuotationTemplatesQuerySchema
>;
