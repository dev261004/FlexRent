import { Role } from "@prisma/client";
import { z, ZodError } from "zod";

export const PASSWORD_RULE_MESSAGE =
  "Password must be 6 to 12 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const optionalText = (max = 120) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(max).optional()
  );

const requiredText = (fieldName: string, max = 120) =>
  z
    .string({ required_error: `${fieldName} is required` })
    .trim()
    .min(1, `${fieldName} is required`)
    .max(max, `${fieldName} must be at most ${max} characters`);

const roleSchema = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.enum(["CUSTOMER", "USER", "ADMIN", "VENDOR"]).default("CUSTOMER")
  )
  .transform((role): Role => (role === "USER" ? "CUSTOMER" : role));

export const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(6, PASSWORD_RULE_MESSAGE)
  .max(12, PASSWORD_RULE_MESSAGE)
  .regex(/[A-Z]/, PASSWORD_RULE_MESSAGE)
  .regex(/[a-z]/, PASSWORD_RULE_MESSAGE)
  .regex(/[0-9]/, PASSWORD_RULE_MESSAGE)
  .regex(/[^A-Za-z0-9]/, PASSWORD_RULE_MESSAGE);

export const registerSchema = z
  .object({
    firstName: requiredText("First name", 80),
    lastName: optionalText(80),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string({
      required_error: "Confirm password is required",
    }),
    role: roleSchema,
    phone: optionalText(30),
    profileImage: optionalText(500),
    companyName: optionalText(120),
    productCategory: optionalText(80),
    gstNumber: optionalText(32),
    adminRegistrationKey: optionalText(120),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Password and confirm password must match",
      });
    }

    if (data.role === "VENDOR") {
      const vendorFields = [
        ["companyName", data.companyName, "Company name is required"],
        [
          "productCategory",
          data.productCategory,
          "Product category is required",
        ],
        ["gstNumber", data.gstNumber, "GST number is required"],
      ] as const;

      for (const [path, value, message] of vendorFields) {
        if (!value) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [path],
            message,
          });
        }
      }
    }

    if (data.role === "ADMIN" && !data.adminRegistrationKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adminRegistrationKey"],
        message: "Admin registration key is required",
      });
    }
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  password: z.string({ required_error: "Password is required" }).min(1),
});

export const refreshSchema = z.object({
  refreshToken: optionalText(2000),
});

export const updateProfileSchema = z.object({
  firstName: optionalText(80),
  lastName: optionalText(80),
  phone: optionalText(30),
  profileImage: optionalText(500),
  companyName: optionalText(120),
  productCategory: optionalText(80),
  gstNumber: optionalText(32),
});

export const formatZodErrors = (error: ZodError): Record<string, string> => {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const path = issue.path.join(".") || "form";
    acc[path] = issue.message;
    return acc;
  }, {});
};
