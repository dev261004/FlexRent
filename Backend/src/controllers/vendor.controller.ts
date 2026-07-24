import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { vendorService } from "../services/vendor.service";
import { updateVendorPickupSettingsSchema } from "../validations/vendor.validation";

const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "Authentication is required");
  }

  return req.user;
};

export const updateMyPickupSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const payload = updateVendorPickupSettingsSchema.parse(req.body);
    const pickupSettings = await vendorService.updatePickupSettings(payload, user);

    res.json({
      success: true,
      message: "Pickup settings updated successfully",
      data: { pickupSettings },
    });
  }
);
