import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { rentalOrderService } from "../services/rental-order.service";
import {
  createRentalOrderSchema,
  listRentalOrdersQuerySchema,
  rentalOrderParamsSchema,
  updateRentalOrderSchema,
} from "../validations/rental-order.validation";

const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "Authentication is required");
  }

  return req.user;
};

export const createRentalOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const payload = createRentalOrderSchema.parse(req.body);
    const rentalOrder = await rentalOrderService.createRentalOrder(payload, user);

    res.status(201).json({
      success: true,
      message: "Rental order created successfully",
      data: { rentalOrder },
    });
  }
);

export const getRentalOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const query = listRentalOrdersQuerySchema.parse(req.query);
    const result = await rentalOrderService.getRentalOrders(query, user);

    res.json({
      success: true,
      message: "Rental orders fetched successfully",
      data: result,
    });
  }
);

export const getRentalOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = rentalOrderParamsSchema.parse(req.params);
    const rentalOrder = await rentalOrderService.getRentalOrder(id, user);

    res.json({
      success: true,
      message: "Rental order fetched successfully",
      data: { rentalOrder },
    });
  }
);

export const updateRentalOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = rentalOrderParamsSchema.parse(req.params);
    const payload = updateRentalOrderSchema.parse(req.body);
    const rentalOrder = await rentalOrderService.updateRentalOrder(id, payload, user);

    res.json({
      success: true,
      message: "Rental order updated successfully",
      data: { rentalOrder },
    });
  }
);

export const deleteRentalOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = rentalOrderParamsSchema.parse(req.params);
    const rentalOrder = await rentalOrderService.deleteRentalOrder(id, user);

    res.json({
      success: true,
      message: "Rental order deleted successfully",
      data: { rentalOrder },
    });
  }
);
