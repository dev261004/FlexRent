import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { rentalOrderService } from "../services/rental-order.service";
import {
  pickupOrderSchema,
  confirmOrderSchema,
  pickupReturnParamsSchema,
  returnOrderSchema,
} from "../validations/pickup-return.validation";
import {
  createPaymentSchema,
  paymentOrderParamsSchema,
  refundDepositSchema,
  rejectUpiPaymentSchema,
  submitUpiPaymentSchema,
  upiPaymentParamsSchema,
} from "../validations/payment.validation";
import {
  createRentalOrderSchema,
  listRentalOrdersQuerySchema,
  rentalOrderParamsSchema,
  updateRentalOrderSchema,
} from "../validations/rental-order.validation";
import {
  acceptRentalOrderSchema,
  rejectRentalOrderSchema,
  rentalOrderWorkflowParamsSchema,
} from "../validations/rental-order-workflow.validation";

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

export const pickupRentalOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { orderId } = pickupReturnParamsSchema.parse(req.params);
    const payload = pickupOrderSchema.parse(req.body);
    const rentalOrder = await rentalOrderService.pickupOrder(
      orderId,
      payload,
      user
    );

    res.json({
      success: true,
      message: "Rental order picked up successfully",
      data: { rentalOrder },
    });
  }
);

export const confirmRentalOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { orderId } = pickupReturnParamsSchema.parse(req.params);
    const payload = confirmOrderSchema.parse(req.body);
    const rentalOrder = await rentalOrderService.confirmOrder(orderId, payload, user);
    res.json({ success: true, message: "Rental order confirmed and security deposit collected", data: { rentalOrder } });
  }
);

export const returnRentalOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { orderId } = pickupReturnParamsSchema.parse(req.params);
    const payload = returnOrderSchema.parse(req.body);
    const rentalOrder = await rentalOrderService.returnOrder(
      orderId,
      payload,
      user
    );

    res.json({
      success: true,
      message: "Rental order returned successfully",
      data: { rentalOrder },
    });
  }
);

export const getRentalOrderTimeline = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { orderId } = pickupReturnParamsSchema.parse(req.params);
    const timeline = await rentalOrderService.getTimeline(orderId, user);

    res.json({
      success: true,
      message: "Rental order timeline fetched successfully",
      data: { timeline },
    });
  }
);

export const createRentalOrderPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { orderId } = paymentOrderParamsSchema.parse(req.params);
    const payload = createPaymentSchema.parse(req.body);
    const result = await rentalOrderService.recordPayment(orderId, payload, user);

    res.status(201).json({
      success: true,
      message: "Rental order payment recorded successfully",
      data: result,
    });
  }
);

export const getRentalOrderPayments = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { orderId } = paymentOrderParamsSchema.parse(req.params);
    const result = await rentalOrderService.getPayments(orderId, user);

    res.json({
      success: true,
      message: "Rental order payments fetched successfully",
      data: result,
    });
  }
);

export const refundRentalOrderDeposit = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { orderId } = paymentOrderParamsSchema.parse(req.params);
    const payload = refundDepositSchema.parse(req.body);
    const result = await rentalOrderService.refundDeposit(orderId, payload, user);

    res.json({
      success: true,
      message: "Security deposit refunded successfully",
      data: result,
    });
  }
);

export const acceptRentalOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = rentalOrderWorkflowParamsSchema.parse(req.params);
    acceptRentalOrderSchema.parse(req.body);
    const rentalOrder = await rentalOrderService.acceptRentalOrder(id, user);

    res.json({
      success: true,
      message: "Rental request accepted successfully",
      data: { rentalOrder },
    });
  }
);

export const rejectRentalOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = rentalOrderWorkflowParamsSchema.parse(req.params);
    const payload = rejectRentalOrderSchema.parse(req.body);
    const rentalOrder = await rentalOrderService.rejectRentalOrder(
      id,
      payload,
      user
    );

    res.json({
      success: true,
      message: "Rental request rejected successfully",
      data: { rentalOrder },
    });
  }
);

export const getPaymentQR = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = upiPaymentParamsSchema.parse(req.params);
    const paymentQR = await rentalOrderService.generatePaymentQR(id, user);

    res.json({
      success: true,
      message: "UPI payment link generated successfully",
      data: { paymentQR },
    });
  }
);

export const submitPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = upiPaymentParamsSchema.parse(req.params);
    const payload = submitUpiPaymentSchema.parse(req.body);
    const payment = await rentalOrderService.submitUpiPayment(id, payload, user);

    res.status(201).json({
      success: true,
      message: "Payment submitted successfully",
      data: { payment },
    });
  }
);

export const getPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = upiPaymentParamsSchema.parse(req.params);
    const payment = await rentalOrderService.getUpiPayment(id, user);

    res.json({
      success: true,
      message: "Payment details fetched successfully",
      data: { payment },
    });
  }
);

export const verifyPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = upiPaymentParamsSchema.parse(req.params);
    const payment = await rentalOrderService.verifyUpiPayment(id, user);

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: { payment },
    });
  }
);

export const rejectPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { id } = upiPaymentParamsSchema.parse(req.params);
    const payload = rejectUpiPaymentSchema.parse(req.body);
    const payment = await rentalOrderService.rejectUpiPayment(id, payload, user);

    res.json({
      success: true,
      message: "Payment rejected successfully",
      data: { payment },
    });
  }
);
