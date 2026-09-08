import { Prisma, RentalPeriodUnit } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import {
  createRentalPeriodSchema,
  rentalPeriodParamsSchema,
  updateRentalPeriodSchema,
} from "../validations/rental-period.validation";

export const listRentalPeriods = asyncHandler(
  async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === "true";

    const rentalPeriods = await prisma.rentalPeriod.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ isDefault: "desc" }, { duration: "asc" }, { name: "asc" }],
    });

    res.json({
      success: true,
      data: { rentalPeriods },
    });
  }
);

export const getRentalPeriod = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = rentalPeriodParamsSchema.parse(req.params);

    const rentalPeriod = await prisma.rentalPeriod.findUnique({
      where: { id },
    });

    if (!rentalPeriod) {
      throw new AppError(404, "Rental period not found");
    }

    res.json({
      success: true,
      data: { rentalPeriod },
    });
  }
);

export const createRentalPeriod = asyncHandler(
  async (req: Request, res: Response) => {
    const payload = createRentalPeriodSchema.parse(req.body);

    const existing = await prisma.rentalPeriod.findUnique({
      where: { name: payload.name },
    });

    if (existing) {
      throw new AppError(
        409,
        `Rental period with name "${payload.name}" already exists`
      );
    }

    if (payload.isDefault) {
      await prisma.rentalPeriod.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const rentalPeriod = await prisma.rentalPeriod.create({
      data: {
        name: payload.name,
        unit: payload.unit,
        duration: payload.duration,
        isDefault: payload.isDefault,
        isActive: payload.isActive,
      },
    });

    res.status(201).json({
      success: true,
      message: "Rental period created successfully",
      data: { rentalPeriod },
    });
  }
);

export const updateRentalPeriod = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = rentalPeriodParamsSchema.parse(req.params);
    const payload = updateRentalPeriodSchema.parse(req.body);

    const existing = await prisma.rentalPeriod.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Rental period not found");
    }

    if (payload.name && payload.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.rentalPeriod.findUnique({
        where: { name: payload.name },
      });
      if (duplicate) {
        throw new AppError(
          409,
          `Rental period with name "${payload.name}" already exists`
        );
      }
    }

    if (payload.isDefault) {
      await prisma.rentalPeriod.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updateData: Prisma.RentalPeriodUpdateInput = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.unit !== undefined) updateData.unit = payload.unit;
    if (payload.duration !== undefined) updateData.duration = payload.duration;
    if (payload.isDefault !== undefined) updateData.isDefault = payload.isDefault;
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

    const updated = await prisma.rentalPeriod.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Rental period updated successfully",
      data: { rentalPeriod: updated },
    });
  }
);

export const deleteRentalPeriod = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = rentalPeriodParamsSchema.parse(req.params);

    const existing = await prisma.rentalPeriod.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Rental period not found");
    }

    // Soft deactivate or delete if unreferenced
    const countConfigs = await prisma.productRentalConfig.count({
      where: { rentalPeriodId: id },
    });

    if (countConfigs > 0) {
      const deactivated = await prisma.rentalPeriod.update({
        where: { id },
        data: { isActive: false, isDefault: false },
      });
      res.json({
        success: true,
        message: "Rental period in use by products; set to inactive",
        data: { rentalPeriod: deactivated },
      });
      return;
    }

    const deleted = await prisma.rentalPeriod.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Rental period deleted successfully",
      data: { rentalPeriod: deleted },
    });
  }
);
