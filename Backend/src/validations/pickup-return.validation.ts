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
export type ReturnOrderInput = z.infer<typeof returnOrderSchema>;
