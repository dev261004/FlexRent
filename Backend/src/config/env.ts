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
  ACCESS_TOKEN_EXPIRY: z.string().min(1).default("15m"),
  REFRESH_TOKEN_EXPIRY: z.string().min(1).default("7d"),
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: z.coerce.number().int().positive().default(15),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .preprocess((value) => value === "true" || value === true, z.boolean())
    .default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("FlexRent <no-reply@flexrent.local>"),
  CLOUDINARY_CLOUD_NAME: z.string({ required_error: "Cloudinary cloud name is missing in .env" }).min(1),
  CLOUDINARY_API_KEY: z.string({ required_error: "Cloudinary API key is missing in .env" }).min(1),
  CLOUDINARY_API_SECRET: z.string({ required_error: "Cloudinary API secret is missing in .env" }).min(1),
  REDIS_URL: z.string().min(1).default("redis://127.0.0.1:6379"),
});

let parsedEnv: z.infer<typeof envSchema>;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid environment variables:");
    error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export const env = {
  ...parsedEnv,
};
