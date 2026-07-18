import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const emptyStringToNull = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
};

const idSchema = z
  .string({ required_error: "Id is required" })
  .trim()
  .min(1, "Id is required");

const timeSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format")
    .optional()
);

const nonNegativeNumber = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .finite(`${fieldName} must be a valid number`)
      .min(0, `${fieldName} must be greater than or equal to 0`)
      .optional()
  );

const nullableNonNegativeNumber = (fieldName: string) =>
  z.preprocess(
    emptyStringToNull,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .finite(`${fieldName} must be a valid number`)
      .min(0, `${fieldName} must be greater than or equal to 0`)
      .nullable()
      .optional()
  );

const nonNegativeInteger = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ invalid_type_error: `${fieldName} must be a number` })
      .int(`${fieldName} must be an integer`)
      .min(0, `${fieldName} must be greater than or equal to 0`)
      .optional()
  );

const rentalConfigFields = {
  pickupTime: timeSchema,
  returnTime: timeSchema,
  paddingMinutes: nonNegativeInteger("Padding minutes"),
  depositType: z.enum(["FIXED", "PERCENTAGE"]).optional(),
  securityDeposit: nonNegativeNumber("Security deposit"),
  lateFeeUnit: z.enum(["HOUR", "DAY", "WEEK", "MONTH"]).optional(),
  lateFee: nonNegativeNumber("Late fee"),
  gracePeriodMinutes: nonNegativeInteger("Grace period minutes"),
  maxLateFee: nullableNonNegativeNumber("Max late fee"),
};

const validateMaxLateFee = (
  data: { lateFee?: number; maxLateFee?: number | null },
  ctx: z.RefinementCtx
) => {
  if (data.maxLateFee !== undefined && data.maxLateFee !== null) {
    const lateFee = data.lateFee ?? 0;

    if (data.maxLateFee < lateFee) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxLateFee"],
        message: "Max late fee must be greater than or equal to late fee",
      });
    }
  }
};

export const rentalConfigProductParamsSchema = z
  .object({
    productId: idSchema,
  })
  .strict();

export const createRentalConfigSchema = z
  .object({
    rentalPeriodId: idSchema,
    ...rentalConfigFields,
  })
  .strict()
  .superRefine(validateMaxLateFee);

export const updateRentalConfigSchema = z
  .object({
    rentalPeriodId: idSchema.optional(),
    ...rentalConfigFields,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one rental configuration field is required",
  });

export type CreateRentalConfigInput = z.infer<typeof createRentalConfigSchema>;
export type UpdateRentalConfigInput = z.infer<typeof updateRentalConfigSchema>;
