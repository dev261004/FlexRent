import { Prisma } from "@prisma/client";
import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { formatZodErrors } from "../utils/validation";

export class AppError extends Error {
  statusCode: number;
  errors?: Record<string, string>;

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler = (handler: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatZodErrors(error),
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const targets = Array.isArray(error.meta?.target)
        ? error.meta.target
        : ["field"];
      const uniqueMessages: Record<string, string> = {
        email: "Email already exists",
        passwordFingerprint: "Password already exists",
        gstNumber: "GST number already exists",
      };
      const message =
        uniqueMessages[String(targets[0])] ??
        `${targets.join(", ")} must be unique`;

      res.status(409).json({
        success: false,
        message,
      });
      return;
    }
  }

  console.error(error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
