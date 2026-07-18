import { User } from "@prisma/client";
import { Request, Response } from "express";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { AppRole } from "../types/roles";
import { sendPasswordResetEmail } from "../utils/mailer";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  refreshTokenExpiresAt,
  refreshTokenMaxAgeMs,
  verifyRefreshToken,
} from "../utils/jwt";
import { mapUserToPublicUser } from "../utils/mappers";
import {
  createPasswordResetToken,
  hashPassword,
  hashPasswordResetToken,
  verifyPassword,
} from "../utils/password";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  vendorRegisterSchema,
} from "../utils/validation";

const REFRESH_COOKIE_NAME = "refreshToken";

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieOptions,
    maxAge: refreshTokenMaxAgeMs(),
  });
};

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
};

const createPasswordResetUrl = (token: string): string => {
  const resetUrl = new URL("/reset-password", env.CLIENT_URL);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
};

const createUserSession = async (user: Pick<User, "id" | "email" | "role">) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: refreshTokenExpiresAt(),
    },
  });

  return { accessToken, refreshToken };
};

const assertEmailIsUnique = async (email: string): Promise<void> => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(409, "Email already exists", {
      email: "Email already exists",
    });
  }
};

type AccountRole = Extract<AppRole, "CUSTOMER" | "VENDOR">;

type RegisterAccountPayload = {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  profileImage?: string;
  companyName?: string;
  productCategory?: string;
  gstNumber?: string;
};

const createRegisteredAccount = async (
  payload: RegisterAccountPayload,
  role: AccountRole
) => {
  await assertEmailIsUnique(payload.email);
  const passwordHash = await hashPassword(payload.password);

  return prisma.user.create({
    data: {
      email: payload.email,
      passwordHash,
      role,
      firstName: payload.firstName,
      lastName: payload.lastName ?? null,
      phone: payload.phone ?? null,
      profileImage: payload.profileImage ?? null,
      companyName: role === "VENDOR" ? payload.companyName : null,
      productCategory:
        role === "VENDOR" ? payload.productCategory : null,
      gstNumber: role === "VENDOR" ? payload.gstNumber : null,
    },
  });
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const payload = registerSchema.parse(req.body);
  const user = await createRegisteredAccount(payload, "CUSTOMER");

  const tokens = await createUserSession(user);
  setRefreshTokenCookie(res, tokens.refreshToken);

  res.status(201).json({
    success: true,
    message: "Customer registration successful",
    data: {
      user: mapUserToPublicUser(user),
      accessToken: tokens.accessToken,
    },
  });
});

export const registerVendor = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = vendorRegisterSchema.parse(req.body);
    const user = await createRegisteredAccount(payload, "VENDOR");

    const tokens = await createUserSession(user);
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(201).json({
      success: true,
      message: "Vendor registration successful",
      data: {
        user: mapUserToPublicUser(user),
        accessToken: tokens.accessToken,
      },
    });
  }
);

export const login = asyncHandler(async (req: Request, res: Response) => {
  const payload = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const passwordMatches = await verifyPassword(
    payload.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(403, "This account is disabled");
  }

  const tokens = await createUserSession(user);
  setRefreshTokenCookie(res, tokens.refreshToken);

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: mapUserToPublicUser(user),
      accessToken: tokens.accessToken,
    },
  });
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      throw new AppError(404, "Account not found. Please create an account first.", {
        email: "No account exists with this email",
      });
    }

    if (user.status !== "ACTIVE") {
      throw new AppError(403, "This account is disabled");
    }

    const token = createPasswordResetToken();
    const tokenHash = hashPasswordResetToken(token);
    const expiresAt = new Date(
      Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
    );

    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      }),
      prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      }),
    ]);

    await sendPasswordResetEmail({
      to: user.email,
      name: user.firstName,
      resetUrl: createPasswordResetUrl(token),
      expiresInMinutes: env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES,
    });

    res.json({
      success: true,
      message: "Password reset link has been sent to your email",
      data: null,
    });
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = resetPasswordSchema.parse(req.body);
    const tokenHash = hashPasswordResetToken(payload.token);

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      throw new AppError(400, "Reset link is invalid or expired");
    }

    if (resetToken.user.status !== "ACTIVE") {
      throw new AppError(403, "This account is disabled");
    }

    const passwordHash = await hashPassword(payload.password);
    const usedAt = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt },
      }),
      prisma.refreshToken.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: usedAt,
        },
      }),
    ]);

    clearRefreshTokenCookie(res);

    res.json({
      success: true,
      message: "Password reset successful. Please log in again.",
      data: null,
    });
  }
);

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const payload = refreshSchema.parse(req.body);
  const refreshToken =
    req.cookies?.[REFRESH_COOKIE_NAME] ?? payload.refreshToken;

  if (!refreshToken) {
    throw new AppError(401, "Refresh token is required");
  }

  let refreshPayload: ReturnType<typeof verifyRefreshToken>;

  try {
    refreshPayload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const oldTokenHash = hashToken(refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: oldTokenHash },
    include: { user: true },
  });

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt.getTime() <= Date.now() ||
    storedToken.userId !== refreshPayload.sub
  ) {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  if (storedToken.user.status !== "ACTIVE") {
    throw new AppError(403, "This account is disabled");
  }

  const accessToken = generateAccessToken(storedToken.user);
  const newRefreshToken = generateRefreshToken(storedToken.user);
  const newTokenHash = hashToken(newRefreshToken);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenHash: newTokenHash,
      },
    }),
    prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: storedToken.userId,
        expiresAt: refreshTokenExpiresAt(),
      },
    }),
  ]);

  setRefreshTokenCookie(res, newRefreshToken);

  res.json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      user: mapUserToPublicUser(storedToken.user),
      accessToken,
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  clearRefreshTokenCookie(res);

  res.json({
    success: true,
    message: "Logout successful",
    data: null,
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(401, "Authentication is required");
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  res.json({
    success: true,
    message: "Current user fetched successfully",
    data: {
      user: mapUserToPublicUser(user),
    },
  });
});

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(401, "Authentication is required");
    }

    const payload = updateProfileSchema.parse(req.body);
    const vendorFields =
      req.user.role === "VENDOR"
        ? {
            companyName: payload.companyName,
            productCategory: payload.productCategory,
            gstNumber: payload.gstNumber,
          }
        : {};

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        profileImage: payload.profileImage,
        ...vendorFields,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: mapUserToPublicUser(user),
      },
    });
  }
);
