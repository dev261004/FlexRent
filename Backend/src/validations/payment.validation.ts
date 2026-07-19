import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const idSchema = z.string().trim().min(1, "Id is required");

const optionalText = (max = 500) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(max).optional()
  );

export const paymentOrderParamsSchema = z
  .object({
    orderId: idSchema,
  })
  .strict();

export const createPaymentSchema = z
  .object({
    amount: z.coerce
      .number({ required_error: "Amount is required" })
      .finite("Amount must be a valid number")
      .gt(0, "Amount must be greater than 0"),
    method: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "ONLINE"], {
      required_error: "Payment method is required",
    }),
    purpose: z
      .enum(["RENTAL", "SECURITY_DEPOSIT", "LATE_FEE"])
      .default("RENTAL"),
    transactionId: optionalText(160),
    paidAt: z.preprocess(
      emptyStringToUndefined,
      z.coerce.date({ invalid_type_error: "paidAt must be a valid date" }).optional()
    ),
    notes: optionalText(500),
  })
  .strict();

export const refundDepositSchema = z
  .object({
    amount: z.preprocess(
      emptyStringToUndefined,
      z.coerce
        .number({ invalid_type_error: "Amount must be a number" })
        .finite("Amount must be a valid number")
        .gt(0, "Amount must be greater than 0")
        .optional()
    ),
    method: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "ONLINE"]).optional(),
    transactionId: optionalText(160),
    refundedAt: z.preprocess(
      emptyStringToUndefined,
      z.coerce
        .date({ invalid_type_error: "refundedAt must be a valid date" })
        .optional()
    ),
    notes: optionalText(500),
  })
  .strict();

export const upiPaymentParamsSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const submitUpiPaymentSchema = z
  .object({
    transactionId: z
      .string({ required_error: "Transaction id is required" })
      .trim()
      .min(8, "Transaction id must be at least 8 characters")
      .max(50, "Transaction id must be at most 50 characters"),
    paymentProof: optionalText(500),
  })
  .strict();

export const rejectUpiPaymentSchema = z
  .object({
    remarks: optionalText(500),
  })
  .strict();

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type RefundDepositInput = z.infer<typeof refundDepositSchema>;
export type SubmitUpiPaymentInput = z.infer<typeof submitUpiPaymentSchema>;
export type RejectUpiPaymentInput = z.infer<typeof rejectUpiPaymentSchema>;
