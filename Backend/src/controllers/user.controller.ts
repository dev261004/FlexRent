import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { hashPassword } from "../utils/password";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userParamsSchema,
} from "../validations/user.validation";

const mapUserResponse = (user: any) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
  role: user.role,
  status: user.status,
  phone: user.phone,
  companyName: user.companyName,
  profileImage: user.profileImage,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = listUsersQuerySchema.parse(req.query);
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.role) {
    where.role = query.role;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: "insensitive" } },
      { lastName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { companyName: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      users: users.map(mapUserResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = userParamsSchema.parse(req.params);

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  res.json({
    success: true,
    data: { user: mapUserResponse(user) },
  });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const payload = createUserSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existing) {
    throw new AppError(409, `User with email "${payload.email}" already exists`);
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      status: payload.status,
      phone: payload.phone,
      companyName: payload.companyName,
    },
  });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: { user: mapUserResponse(user) },
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = userParamsSchema.parse(req.params);
  const payload = updateUserSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(404, "User not found");
  }

  const updateData: any = {};
  if (payload.firstName !== undefined) updateData.firstName = payload.firstName;
  if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
  if (payload.role !== undefined) updateData.role = payload.role;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.phone !== undefined) updateData.phone = payload.phone;
  if (payload.companyName !== undefined) updateData.companyName = payload.companyName;

  if (payload.password) {
    updateData.passwordHash = await hashPassword(payload.password);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  res.json({
    success: true,
    message: "User updated successfully",
    data: { user: mapUserResponse(updated) },
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = userParamsSchema.parse(req.params);

  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(404, "User not found");
  }

  // Soft deactivate user to DISABLED to preserve integrity of past orders/products
  const disabledUser = await prisma.user.update({
    where: { id },
    data: { status: "DISABLED" },
  });

  res.json({
    success: true,
    message: "User status updated to DISABLED",
    data: { user: mapUserResponse(disabledUser) },
  });
});
