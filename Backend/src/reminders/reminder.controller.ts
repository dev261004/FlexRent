import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { rentalOrderRepository } from "../repositories/rental-order.repository";
import { reminderService } from "./reminder.service";
import {
  listRemindersQuerySchema,
  rentalOrderIdParamsSchema,
} from "./reminder.validation";

export const getReminders = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listRemindersQuerySchema.parse(req.query);
    const result = await reminderService.getReminders(query);

    res.json({
      success: true,
      message: "Reminders fetched successfully",
      data: result,
    });
  }
);

export const getRemindersByRentalOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { rentalOrderId } = rentalOrderIdParamsSchema.parse(req.params);
    const reminders = await reminderService.getRemindersByRentalOrder(rentalOrderId);

    res.json({
      success: true,
      message: "Rental reminders fetched successfully",
      data: { reminders },
    });
  }
);

export const rescheduleReminders = asyncHandler(
  async (req: Request, res: Response) => {
    const { rentalOrderId } = rentalOrderIdParamsSchema.parse(req.params);
    const order = await rentalOrderRepository.getRentalOrder(rentalOrderId);

    await reminderService.rescheduleRentalReminders({
      rentalOrderId: order.id,
      userId: order.customerId,
      rentalNumber: order.rentalNumber,
      rentalStart: order.rentalStart,
      rentalEnd: order.rentalEnd,
    });

    res.json({
      success: true,
      message: "Reminders rescheduled successfully",
      data: { rentalOrderId },
    });
  }
);

export const cancelReminders = asyncHandler(
  async (req: Request, res: Response) => {
    const { rentalOrderId } = rentalOrderIdParamsSchema.parse(req.params);
    await reminderService.cancelRentalReminders(rentalOrderId);

    res.json({
      success: true,
      message: "Reminders cancelled successfully",
      data: { rentalOrderId },
    });
  }
);
