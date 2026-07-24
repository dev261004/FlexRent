import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const requiredText = (fieldName: string, max = 120) =>
  z
    .string({ required_error: `${fieldName} is required` })
    .trim()
    .min(1, `${fieldName} is required`)
    .max(max, `${fieldName} must be at most ${max} characters`);

const optionalText = (max = 120) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(max).optional()
  );

export const addressSchema = z
  .object({
    addressLine1: requiredText("Address line 1", 160),
    addressLine2: optionalText(160),
    city: requiredText("City", 80),
    state: requiredText("State", 80),
    postalCode: requiredText("Postal code", 24),
    country: requiredText("Country", 80),
  })
  .strict();

export const updateVendorPickupSettingsSchema = z
  .object({
    supportsStorePickup: z.boolean({
      required_error: "supportsStorePickup is required",
      invalid_type_error: "supportsStorePickup must be a boolean",
    }),
    pickupAddresses: z.array(addressSchema).optional(),
    storeTimings: z.record(z.any()).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.supportsStorePickup && (!data.pickupAddresses || data.pickupAddresses.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupAddresses"],
        message: "At least one pickup address is required when store pickup is enabled",
      });
    }
  });

export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateVendorPickupSettingsInput = z.infer<typeof updateVendorPickupSettingsSchema>;
