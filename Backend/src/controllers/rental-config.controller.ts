import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { rentalConfigService } from "../services/rental-config.service";
import {
  createRentalConfigSchema,
  rentalConfigProductParamsSchema,
  updateRentalConfigSchema,
} from "../validations/rental-config.validation";

const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "Authentication is required");
  }

  return req.user;
};

export const createRentalConfig = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId } = rentalConfigProductParamsSchema.parse(req.params);
    const payload = createRentalConfigSchema.parse(req.body);
    const rentalConfig = await rentalConfigService.createRentalConfig(
      productId,
      payload,
      user
    );

    res.status(201).json({
      success: true,
      message: "Rental configuration created successfully",
      data: { rentalConfig },
    });
  }
);

export const getRentalConfig = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId } = rentalConfigProductParamsSchema.parse(req.params);
    const rentalConfig = await rentalConfigService.getRentalConfig(
      productId,
      user
    );

    res.json({
      success: true,
      message: "Rental configuration fetched successfully",
      data: { rentalConfig },
    });
  }
);

export const updateRentalConfig = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId } = rentalConfigProductParamsSchema.parse(req.params);
    const payload = updateRentalConfigSchema.parse(req.body);
    const rentalConfig = await rentalConfigService.updateRentalConfig(
      productId,
      payload,
      user
    );

    res.json({
      success: true,
      message: "Rental configuration updated successfully",
      data: { rentalConfig },
    });
  }
);
