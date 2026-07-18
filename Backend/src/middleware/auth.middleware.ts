import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequestUser } from "../types/auth.types";
import { AppRole } from "../types/roles";
import { verifyAccessToken } from "../utils/jwt";
import { AppError, asyncHandler } from "./error.middleware";

declare global {
  namespace Express {
    interface Request {
      user?: AuthRequestUser;
    }
  }
}

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
};

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);

  if (!token) {
    throw new AppError(401, "Authentication token is required");
  }

  let payload: ReturnType<typeof verifyAccessToken>;

  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(401, "Invalid or expired authentication token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new AppError(401, "User is not active");
  }

  req.user = user;
  next();
});

export const requireRole = (roles: AppRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, "Authentication is required"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "You do not have permission for this action"));
      return;
    }

    next();
  };
};
