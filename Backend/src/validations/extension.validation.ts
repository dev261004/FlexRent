import { z } from "zod";

export const previewExtensionSchema = z.object({
  newRentalEnd: z.string().datetime({ message: "newRentalEnd must be a valid ISO-8601 date string" }),
});

export type PreviewExtensionInput = z.infer<typeof previewExtensionSchema>;

export const requestExtensionSchema = z.object({
  newRentalEnd: z.string().datetime({ message: "newRentalEnd must be a valid ISO-8601 date string" }),
  reason: z.string().trim().max(500, "Reason cannot exceed 500 characters").optional(),
});

export type RequestExtensionInput = z.infer<typeof requestExtensionSchema>;

export const approveExtensionSchema = z.object({
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type ApproveExtensionInput = z.infer<typeof approveExtensionSchema>;

export const rejectExtensionSchema = z.object({
  reason: z.string().trim().min(1, "Rejection reason is required").max(500, "Reason cannot exceed 500 characters"),
});

export type RejectExtensionInput = z.infer<typeof rejectExtensionSchema>;
