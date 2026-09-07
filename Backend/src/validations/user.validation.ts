import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

export const userParamsSchema = z.object({
  id: z.string().trim().min(1, "User ID is required"),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(120).optional()
  ),
  role: z.preprocess(
    emptyStringToUndefined,
    z.enum(["CUSTOMER", "ADMIN", "VENDOR"]).optional()
  ),
  status: z.preprocess(
    emptyStringToUndefined,
    z.enum(["ACTIVE", "DISABLED"]).optional()
  ),
});

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(100).optional()
  ),
  role: z.enum(["CUSTOMER", "ADMIN", "VENDOR"]).default("CUSTOMER"),
  status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
  phone: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(20).optional()
  ),
  companyName: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(200).optional()
  ),
});

export const updateUserSchema = z.object({
  firstName: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1).max(100).optional()
  ),
  lastName: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(100).optional()
  ),
  role: z.preprocess(
    emptyStringToUndefined,
    z.enum(["CUSTOMER", "ADMIN", "VENDOR"]).optional()
  ),
  status: z.preprocess(
    emptyStringToUndefined,
    z.enum(["ACTIVE", "DISABLED"]).optional()
  ),
  phone: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(20).optional()
  ),
  companyName: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(200).optional()
  ),
  password: z.preprocess(
    emptyStringToUndefined,
    z.string().min(6, "Password must be at least 6 characters").optional()
  ),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
