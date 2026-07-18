import bcrypt from "bcryptjs";
import { createHmac } from "crypto";
import { env } from "../config/env";

const SALT_ROUNDS = 12;

export const hashPassword = (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = (
  password: string,
  passwordHash: string
): Promise<boolean> => {
  return bcrypt.compare(password, passwordHash);
};

export const createPasswordFingerprint = (password: string): string => {
  return createHmac("sha256", env.PASSWORD_FINGERPRINT_SECRET)
    .update(password)
    .digest("hex");
};
