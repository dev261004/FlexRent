import { createHash } from "crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AppRole } from "../types/roles";

type TokenKind = "access" | "refresh";

type BaseTokenPayload = {
  sub: string;
  email: string;
  role: AppRole;
  type: TokenKind;
};

export type AccessTokenPayload = BaseTokenPayload & {
  type: "access";
};

export type RefreshTokenPayload = BaseTokenPayload & {
  type: "refresh";
};

type TokenUser = {
  id: string;
  email: string;
  role: AppRole;
};

const signToken = (
  payload: BaseTokenPayload,
  secret: string,
  expiresIn: string
): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
};

const verifyToken = <T extends BaseTokenPayload>(
  token: string,
  secret: string,
  expectedType: TokenKind
): T => {
  const payload = jwt.verify(token, secret) as JwtPayload & Partial<T>;

  if (
    payload.type !== expectedType ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return payload as T;
};

export const generateAccessToken = (user: TokenUser): string => {
  return signToken(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: "access",
    },
    env.JWT_ACCESS_SECRET,
    env.ACCESS_TOKEN_EXPIRY
  );
};

export const generateRefreshToken = (user: TokenUser): string => {
  return signToken(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: "refresh",
    },
    env.JWT_REFRESH_SECRET,
    env.REFRESH_TOKEN_EXPIRY
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return verifyToken<AccessTokenPayload>(
    token,
    env.JWT_ACCESS_SECRET,
    "access"
  );
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return verifyToken<RefreshTokenPayload>(
    token,
    env.JWT_REFRESH_SECRET,
    "refresh"
  );
};

export const hashToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

export const parseDurationToMs = (
  value: string,
  fallbackMs: number
): number => {
  const match = /^(\d+)(ms|s|m|h|d)$/i.exec(value.trim());

  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

export const refreshTokenMaxAgeMs = (): number => {
  return parseDurationToMs(env.REFRESH_TOKEN_EXPIRY, 7 * 24 * 60 * 60 * 1000);
};

export const refreshTokenExpiresAt = (): Date => {
  return new Date(Date.now() + refreshTokenMaxAgeMs());
};
