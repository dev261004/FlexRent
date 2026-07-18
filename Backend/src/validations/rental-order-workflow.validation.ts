import { z } from "zod";

export const rentalOrderWorkflowParamsSchema = z
  .object({
    id: z.string().trim().min(1, "Rental order id is required"),
  })
  .strict();

export const acceptRentalOrderSchema = z.object({}).strict();

export const rejectRentalOrderSchema = z
  .object({
    reason: z
      .string({ required_error: "Rejection reason is required" })
      .trim()
      .min(5, "Rejection reason must be at least 5 characters")
      .max(500, "Rejection reason must be at most 500 characters"),
  })
  .strict();

export type AcceptRentalOrderInput = z.infer<typeof acceptRentalOrderSchema>;
export type RejectRentalOrderInput = z.infer<typeof rejectRentalOrderSchema>;
