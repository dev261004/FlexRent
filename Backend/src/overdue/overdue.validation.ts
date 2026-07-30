import { z } from "zod";

export const listOverdueQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  status: z.enum(["ACTIVE", "RESOLVED", "IGNORED"]).optional(),
  vendorId: z.string().optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
});

export const overdueIdParamSchema = z.object({
  id: z.string().min(1, "Overdue record ID is required"),
});

export const rentalOrderIdParamSchema = z.object({
  rentalOrderId: z.string().min(1, "Rental order ID is required"),
});

export type ListOverdueQueryInput = z.infer<typeof listOverdueQuerySchema>;
