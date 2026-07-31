import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const idSchema = z.string().trim().min(1, "Id is required");

const optionalText = (max = 1000) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(max).optional()
  );

export const pickupReturnParamsSchema = z
  .object({
    orderId: idSchema,
  })
  .strict();

export const confirmOrderSchema = z
  .object({
    method: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "ONLINE"]),
    transactionId: optionalText(160),
    notes: optionalText(1000),
  })
  .strict();

export const pickupOrderSchema = z
  .object({
    pickupDate: z.preprocess(
      emptyStringToUndefined,
      z.coerce.date({ invalid_type_error: "pickupDate must be a valid date" }).optional()
    ),
    pickedUpBy: optionalText(160),
    notes: optionalText(1000),
  })
  .strict();

export const schedulePickupSchema = z
  .object({
    pickupScheduledAt: z.preprocess(
      emptyStringToUndefined,
      z.coerce.date({ invalid_type_error: "pickupScheduledAt must be a valid date" })
    ),
    pickupETAInMinutes: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().min(0).optional()
    ),
    notes: optionalText(1000),
  })
  .strict();

export const updateEtaSchema = z
  .object({
    pickupETAInMinutes: z.coerce.number().int().min(0, "ETA in minutes must be 0 or greater"),
    notes: optionalText(1000),
  })
  .strict();

export const completePickupSchema = z
  .object({
    notes: optionalText(1000),
  })
  .strict();

export const confirmPickupCustomerSchema = z
  .object({
    notes: optionalText(1000),
  })
  .strict();

export const returnOrderSchema = z
  .object({
    returnedAt: z.preprocess(
      emptyStringToUndefined,
      z.coerce.date({ invalid_type_error: "returnedAt must be a valid date" }).optional()
    ),
    returnedBy: optionalText(160),
    returnNotes: optionalText(1000),
    maintenanceAssetIds: z.array(idSchema).max(100).optional(),
  })
  .strict();

export type PickupOrderInput = z.infer<typeof pickupOrderSchema>;
export type SchedulePickupInput = z.infer<typeof schedulePickupSchema>;
export type UpdateEtaInput = z.infer<typeof updateEtaSchema>;
export type CompletePickupInput = z.infer<typeof completePickupSchema>;
export type ConfirmPickupCustomerInput = z.infer<typeof confirmPickupCustomerSchema>;
export type ReturnOrderInput = z.infer<typeof returnOrderSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
