import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../middleware/error.middleware";

export const listRentalPeriods = asyncHandler(async (req: Request, res: Response) => {
  const rentalPeriods = await prisma.rentalPeriod.findMany({
    where: { isActive: true },
    orderBy: [
      { isDefault: "desc" },
      { duration: "asc" }
    ],
  });

  res.json({
    success: true,
    data: { rentalPeriods },
  });
});
