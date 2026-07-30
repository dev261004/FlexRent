import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { overdueService } from "./overdue.service";
import {
  listOverdueQuerySchema,
  overdueIdParamSchema,
  rentalOrderIdParamSchema,
} from "./overdue.validation";

/**
 * GET /overdue
 * List overdue records with pagination and optional filters.
 */
export const listOverdueRecords = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listOverdueQuerySchema.parse(req.query);

    // If logged in as VENDOR, automatically filter by vendorId unless admin
    if (req.user?.role === "VENDOR") {
      query.vendorId = req.user.id;
    } else if (req.user?.role === "CUSTOMER") {
      query.userId = req.user.id;
    }

    const result = await overdueService.getOverdueRecords(query);

    res.json({
      success: true,
      message: "Overdue records retrieved successfully",
      data: result,
    });
  }
);

/**
 * GET /overdue/statistics
 * Get summary dashboard metrics for overdue rentals.
 */
export const getOverdueStatistics = asyncHandler(
  async (req: Request, res: Response) => {
    let vendorId: string | undefined;
    let userId: string | undefined;

    if (req.user?.role === "VENDOR") {
      vendorId = req.user.id;
    } else if (req.user?.role === "CUSTOMER") {
      userId = req.user.id;
    }

    const stats = await overdueService.getStatistics(vendorId, userId);

    res.json({
      success: true,
      message: "Overdue statistics retrieved successfully",
      data: stats,
    });
  }
);

/**
 * GET /overdue/:rentalOrderId
 * Get single overdue record details by rental order ID.
 */
export const getOverdueByRentalId = asyncHandler(
  async (req: Request, res: Response) => {
    const { rentalOrderId } = rentalOrderIdParamSchema.parse(req.params);
    const record = await overdueService.getOverdueByRentalId(rentalOrderId);

    res.json({
      success: true,
      message: "Overdue record retrieved successfully",
      data: { record },
    });
  }
);

/**
 * POST /overdue/run
 * Manually trigger overdue detection engine.
 */
export const runOverdueDetection = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await overdueService.detectOverdueRentals();

    res.json({
      success: true,
      message: "Overdue detection completed successfully",
      data: result,
    });
  }
);

/**
 * PATCH /overdue/:id/ignore
 * Manually ignore an overdue record (Admin/Vendor action).
 */
export const ignoreOverdue = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = overdueIdParamSchema.parse(req.params);
    const record = await overdueService.ignoreOverdue(id);

    res.json({
      success: true,
      message: "Overdue record marked as IGNORED",
      data: { record },
    });
  }
);

/**
 * PATCH /overdue/:id/resolve
 * Manually resolve an overdue record.
 */
export const resolveOverdue = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = overdueIdParamSchema.parse(req.params);
    const record = await overdueService.resolveOverdueManually(id);

    res.json({
      success: true,
      message: "Overdue record marked as RESOLVED",
      data: { record },
    });
  }
);
