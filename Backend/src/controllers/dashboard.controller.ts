import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { dashboardService } from "../services/dashboard.service";
import { rentalOperationsDashboardQuerySchema } from "../validations/dashboard.validation";

const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "Authentication is required");
  }

  return req.user;
};

export const getRentalOperationsDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const query = rentalOperationsDashboardQuerySchema.parse(req.query);
    const dashboard = await dashboardService.getRentalOperationsDashboard(
      query,
      user
    );

    res.json({
      success: true,
      message: "Rental operations dashboard fetched successfully",
      data: { dashboard },
    });
  }
);
