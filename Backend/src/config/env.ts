import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:password@localhost:5432/rental_db"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default("development-access-secret-change-me"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default("development-refresh-secret-change-me"),
  PASSWORD_FINGERPRINT_SECRET: z.string().min(16).optional(),
  ACCESS_TOKEN_EXPIRY: z.string().min(1).default("15m"),
  REFRESH_TOKEN_EXPIRY: z.string().min(1).default("7d"),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  PASSWORD_FINGERPRINT_SECRET:
    parsedEnv.PASSWORD_FINGERPRINT_SECRET ?? parsedEnv.JWT_REFRESH_SECRET,
};
