import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  RentalOrderRecord,
  rentalOrderRepository,
} from "../repositories/rental-order.repository";
import { ProductRequester } from "../types/product.types";
import {
  CreateRentalOrderInput,
  ListRentalOrdersQuery,
  UpdateRentalOrderInput,
  PreviewRentalOrderInput,
} from "../validations/rental-order.validation";
import { AddressInput } from "../validations/vendor.validation";
import {
  PickupOrderInput,
  ReturnOrderInput,
  ConfirmOrderInput,
} from "../validations/pickup-return.validation";
import {
  CreatePaymentInput,
  RejectUpiPaymentInput,
  RefundDepositInput,
  SubmitUpiPaymentInput,
} from "../validations/payment.validation";
import { RejectRentalOrderInput } from "../validations/rental-order-workflow.validation";
import { notificationService } from "../notifications/notification.service";

type RentalOrderItemInput = CreateRentalOrderInput["items"][number];
type RentalStatusValue =
  | "QUOTATION"
  | "CONFIRMED"
  | "PICKED_UP"
  | "RETURNED"
  | "CANCELLED";

const EDITABLE_STATUS: RentalStatusValue = "QUOTATION";

const decimalToString = (
  value: Prisma.Decimal | number | string | null | undefined
): string | null => {
  if (value === null || value === undefined) return null;
  return value.toString();
};

const toNumber = (value: Prisma.Decimal | number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return Number(value.toString());
};

export class RentalOrderService {
  async confirmOrder(orderId: string, payload: ConfirmOrderInput, user: ProductRequester) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertWritable(order, user);
    if (order.status !== "QUOTATION") throw new AppError(400, "Only quotation rental orders can be confirmed");

    const updated = await rentalOrderRepository.transaction(async (tx) => {
      await this.decreaseApprovedOrderStock(order, tx);
      const depositAmount = toNumber(order.securityDepositAmount);
      if (depositAmount > 0) {
        await rentalOrderRepository.createPayment({ rentalOrderId: orderId, amount: depositAmount, method: payload.method, status: "PAID", transactionId: payload.transactionId ?? null, paidAt: new Date(), notes: this.formatPaymentNotes("SECURITY_DEPOSIT", payload.notes) }, tx);
        await rentalOrderRepository.updateSecurityDeposit(orderId, { status: "COLLECTED", collectedAt: new Date(), notes: payload.notes ?? order.securityDeposit?.notes }, tx);
      }
      return rentalOrderRepository.updateRentalOrder(orderId, { status: "CONFIRMED", paymentStatus: depositAmount > 0 ? "PARTIALLY_PAID" : order.paymentStatus, notes: this.mergeNotes(order.notes, ["Order confirmed", payload.notes ? `Confirmation notes: ${payload.notes}` : null]) }, tx);
    });
    return this.mapRentalOrder(updated);
  }

  async createRentalOrder(payload: CreateRentalOrderInput, user: ProductRequester) {
    this.assertCanCreateForCustomer(payload.customerId, user);
    this.assertDateRange(payload.rentalStart, payload.rentalEnd);
    await this.assertCustomerAndVendorExist(payload.customerId, payload.vendorId);

    const calculatedItems = await this.buildCalculatedItems(
      payload.items,
      payload.vendorId,
      payload.rentalStart,
      payload.rentalEnd,
      user
    );

    const totals = this.calculateTotals(calculatedItems);
    const fulfillmentData = await this.resolveCreateFulfillmentData(payload);

    return rentalOrderRepository.transaction(async (tx) => {
      const rentalNumber = await rentalOrderRepository.generateRentalNumber(tx);

      const order = await rentalOrderRepository.createRentalOrder(
        {
          rentalNumber,
          customerId: payload.customerId,
          vendorId: payload.vendorId,
          priceListId: calculatedItems.priceListId,
          status: EDITABLE_STATUS,
          paymentStatus: "PENDING",
          ...fulfillmentData,
          rentalStart: payload.rentalStart,
          rentalEnd: payload.rentalEnd,
          subtotal: totals.subtotal,
          securityDepositAmount: totals.securityDeposit,
          lateFee: 0,
          grandTotal: totals.grandTotal,
          notes: payload.notes ?? null,
          items: {
            create: calculatedItems.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              assetId: item.assetId,
              quantity: item.quantity,
              rentalPrice: item.rentalPrice,
              deposit: item.deposit,
              subtotal: item.subtotal,
            })),
          },
          securityDeposit: {
            create: {
              amount: totals.securityDeposit,
              status: totals.securityDeposit > 0 ? "PENDING" : "REFUNDED",
            },
          },
        },
        tx
      );

      const mapped = this.mapRentalOrder(order);

      // Trigger real-time notification to Vendor
      notificationService
        .notify({
          userId: payload.vendorId,
          title: "New Quotation Request",
          message: `A new quotation request (Order #${order.rentalNumber}) has been submitted by customer (${user.email}).`,
          type: "QUOTATION_CREATED",
          priority: "NORMAL",
          actionUrl: `/vendor/operations/${order.id}`,
          data: { orderId: order.id, rentalNumber: order.rentalNumber },
          idempotencyKey: `quotation_created_${order.id}`,
        })
        .catch((err) => console.error("Notification error:", err.message));

      return mapped;
    });
  }

  async previewRentalOrder(payload: PreviewRentalOrderInput, user: ProductRequester) {
    this.assertDateRange(payload.rentalStart, payload.rentalEnd);

    const calculatedItems = await this.buildCalculatedItems(
      payload.items,
      payload.vendorId,
      payload.rentalStart,
      payload.rentalEnd,
      user
    );

    const totals = this.calculateTotals(calculatedItems);

    return {
      subtotal: decimalToString(totals.subtotal),
      securityDepositAmount: decimalToString(totals.securityDeposit),
      lateFee: decimalToString(0), // No late fee on preview
      grandTotal: decimalToString(totals.grandTotal),
      items: calculatedItems.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        duration: item.duration,
        baseRate: decimalToString(item.baseRate),
        baseRentalAmount: decimalToString(item.baseRentalAmount),
        pricingRule: item.pricingRule,
        discountPercentage: item.discountPercentage ? decimalToString(item.discountPercentage) : null,
        discountAmount: decimalToString(item.discountAmount),
        rentalAmount: decimalToString(item.rentalAmount),
        rentalPrice: decimalToString(item.rentalPrice),
        deposit: decimalToString(item.deposit),
        subtotal: decimalToString(item.subtotal),
      })),
    };
  }

  async getRentalOrders(query: ListRentalOrdersQuery, user: ProductRequester) {
    const where = this.buildListWhere(query, user);
    const skip = (query.page - 1) * query.limit;
    const [orders, total] = await rentalOrderRepository.getRentalOrders(
      where,
      skip,
      query.limit
    );

    return {
      rentalOrders: orders.map((order) => this.mapRentalOrder(order)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getRentalOrder(id: string, user: ProductRequester) {
    const order = await rentalOrderRepository.getRentalOrder(id);
    this.assertReadable(order, user);
    return this.mapRentalOrder(order);
  }

  async updateRentalOrder(
    id: string,
    payload: UpdateRentalOrderInput,
    user: ProductRequester
  ) {
    const order = await rentalOrderRepository.getRentalOrder(id);
    this.assertWritable(order, user);
    this.assertEditable(order);

    const rentalStart = payload.rentalStart ?? order.rentalStart;
    const rentalEnd = payload.rentalEnd ?? order.rentalEnd;
    this.assertDateRange(rentalStart, rentalEnd);

    const itemsPayload =
      payload.items ??
      order.items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        assetId: item.assetId ?? undefined,
        quantity: item.quantity,
      }));

    const calculatedItems = await this.buildCalculatedItems(
      itemsPayload,
      order.vendorId,
      rentalStart,
      rentalEnd,
      user,
      order.id
    );
    const totals = this.calculateTotals(calculatedItems);
    const fulfillmentData = await this.resolveUpdateFulfillmentData(order, payload);

    const updatedOrder = await rentalOrderRepository.transaction(async (tx) => {
      await rentalOrderRepository.deleteOrderItems(id, tx);

      return rentalOrderRepository.updateRentalOrder(
        id,
        {
          rentalStart,
          rentalEnd,
          ...fulfillmentData,
          priceListId: calculatedItems.priceListId,
          subtotal: totals.subtotal,
          securityDepositAmount: totals.securityDeposit,
          grandTotal: totals.grandTotal,
          ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
          items: {
            create: calculatedItems.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              assetId: item.assetId,
              quantity: item.quantity,
              rentalPrice: item.rentalPrice,
              deposit: item.deposit,
              subtotal: item.subtotal,
            })),
          },
          securityDeposit: {
            upsert: {
              create: {
                amount: totals.securityDeposit,
                status: totals.securityDeposit > 0 ? "PENDING" : "REFUNDED",
              },
              update: {
                amount: totals.securityDeposit,
              },
            },
          },
        },
        tx
      );
    });

    return this.mapRentalOrder(updatedOrder);
  }

  async deleteRentalOrder(id: string, user: ProductRequester) {
    const order = await rentalOrderRepository.getRentalOrder(id);
    this.assertWritable(order, user);
    this.assertEditable(order);

    const deletedOrder = await rentalOrderRepository.deleteRentalOrder(id);
    return this.mapRentalOrder(deletedOrder);
  }

  async pickupOrder(
    orderId: string,
    payload: PickupOrderInput,
    user: ProductRequester
  ) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertWritable(order, user);

    if (order.status !== "CONFIRMED") {
      throw new AppError(400, "Only confirmed rental orders can be picked up");
    }

    if (order.actualPickupAt) {
      throw new AppError(400, "Pickup already completed for this rental order");
    }

    const assetIds = this.getAssignedAssetIds(order);
    await this.assertPickupAssetsAreAvailable(order, assetIds);

    const pickupDate = payload.pickupDate ?? new Date();
    const notes = this.mergeNotes(order.notes, [
      `Pickup Date: ${pickupDate.toISOString()}`,
      `Picked Up By: ${payload.pickedUpBy ?? user.id}`,
      payload.notes ? `Pickup Notes: ${payload.notes}` : null,
    ]);

    const updatedOrder = await rentalOrderRepository.transaction(async (tx) => {
      if (assetIds.length > 0) {
        await rentalOrderRepository.updateAssets(assetIds, "PICKED_UP", tx);
      }

      return rentalOrderRepository.pickupOrder(
        orderId,
        {
          status: "PICKED_UP",
          actualPickupAt: pickupDate,
          notes,
        },
        tx
      );
    });

    const mapped = this.mapRentalOrder(updatedOrder);

    notificationService
      .notify({
        userId: order.customerId,
        title: "Rental Item Picked Up",
        message: `Your rental order #${order.rentalNumber} has been marked as picked up.`,
        type: "PICKUP_REMINDER",
        priority: "HIGH",
        actionUrl: `/dashboard/orders/${order.id}`,
        data: { orderId: order.id, rentalNumber: order.rentalNumber },
        idempotencyKey: `pickup_${order.id}`,
      })
      .catch((err) => console.error("Notification error:", err.message));

    return mapped;
  }

  async returnOrder(
    orderId: string,
    payload: ReturnOrderInput,
    user: ProductRequester
  ) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertWritable(order, user);

    if (order.status !== "PICKED_UP") {
      throw new AppError(400, "Only active picked-up rental orders can be returned");
    }

    if (order.actualReturnAt) {
      throw new AppError(400, "Return already completed for this rental order");
    }

    const assetIds = this.getAssignedAssetIds(order);
    const maintenanceAssetIds = payload.maintenanceAssetIds ?? [];
    this.assertMaintenanceAssetsBelongToOrder(maintenanceAssetIds, assetIds);

    const returnedAt = payload.returnedAt ?? new Date();
    const lateFee = await this.calculateLateFee(order, returnedAt);
    const grandTotal = toNumber(order.subtotal) + toNumber(order.securityDepositAmount) + lateFee;
    const notes = this.mergeNotes(order.notes, [
      `Returned At: ${returnedAt.toISOString()}`,
      `Returned By: ${payload.returnedBy ?? user.id}`,
      payload.returnNotes ? `Return Notes: ${payload.returnNotes}` : null,
    ]);

    const availableAssetIds = assetIds.filter(
      (assetId) => !maintenanceAssetIds.includes(assetId)
    );

    const updatedOrder = await rentalOrderRepository.transaction(async (tx) => {
      if (availableAssetIds.length > 0) {
        await rentalOrderRepository.updateAssets(availableAssetIds, "AVAILABLE", tx);
      }

      if (maintenanceAssetIds.length > 0) {
        await rentalOrderRepository.updateAssets(
          maintenanceAssetIds,
          "MAINTENANCE",
          tx
        );
      }

      const returnedOrder = await rentalOrderRepository.returnOrder(
        orderId,
        {
          status: "RETURNED",
          actualReturnAt: returnedAt,
          lateFee,
          grandTotal,
          notes,
        },
        tx
      );
      const depositAmount = toNumber(order.securityDepositAmount);
      const deduction = Math.min(lateFee, depositAmount);
      const refundAmount = Math.max(depositAmount - deduction, 0);
      if (refundAmount > 0) {
        await rentalOrderRepository.createPayment({ rentalOrderId: orderId, amount: refundAmount, method: "CASH", status: "REFUNDED", paidAt: returnedAt, notes: this.formatPaymentNotes("SECURITY_DEPOSIT_REFUND", deduction > 0 ? `Late fee deduction: ${deduction.toFixed(2)}` : "Returned on time") }, tx);
      }
      if (order.securityDeposit) {
        await rentalOrderRepository.updateSecurityDeposit(orderId, { refundedAmount: refundAmount, deductedAmount: deduction, status: deduction > 0 ? "PARTIALLY_REFUNDED" : "REFUNDED", refundedAt: returnedAt }, tx);
      }
      return returnedOrder;
    });

    const mapped = this.mapRentalOrder(updatedOrder);

    notificationService
      .notify({
        userId: order.customerId,
        title: "Return Confirmed",
        message: `The return for rental order #${order.rentalNumber} has been confirmed.`,
        type: "RETURN_CONFIRMED",
        priority: "NORMAL",
        actionUrl: `/dashboard/orders/${order.id}`,
        data: { orderId: order.id, rentalNumber: order.rentalNumber },
        idempotencyKey: `return_${order.id}`,
      })
      .catch((err) => console.error("Notification error:", err.message));

    return mapped;
  }

  async getTimeline(orderId: string, user: ProductRequester) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertReadable(order, user);

    const timeline = await rentalOrderRepository.getTimeline(orderId);
    if (!timeline) throw new AppError(404, "Rental order not found");

    return {
      orderId: timeline.id,
      rentalNumber: timeline.rentalNumber,
      currentStatus: timeline.status,
      paymentStatus: timeline.paymentStatus,
      events: [
        {
          label: "Created",
          status: "CREATED",
          date: timeline.createdAt.toISOString(),
          completed: true,
        },
        {
          label: "Confirmed",
          status: "CONFIRMED",
          date: timeline.status === "CONFIRMED" ? timeline.updatedAt.toISOString() : null,
          completed: ["CONFIRMED", "PICKED_UP", "RETURNED"].includes(timeline.status),
        },
        {
          label: "Picked Up",
          status: "PICKED_UP",
          date: timeline.actualPickupAt?.toISOString() ?? null,
          completed: Boolean(timeline.actualPickupAt),
        },
        {
          label: "Returned",
          status: "RETURNED",
          date: timeline.actualReturnAt?.toISOString() ?? null,
          completed: Boolean(timeline.actualReturnAt),
        },
      ],
      rentalStart: timeline.rentalStart.toISOString(),
      rentalEnd: timeline.rentalEnd.toISOString(),
    };
  }

  async recordPayment(
    orderId: string,
    payload: CreatePaymentInput,
    user: ProductRequester
  ) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertWritable(order, user);

    const payment = await rentalOrderRepository.transaction(async (tx) => {
      const createdPayment = await rentalOrderRepository.createPayment(
        {
          rentalOrderId: orderId,
          amount: payload.amount,
          method: payload.method,
          status: "PAID",
          transactionId: payload.transactionId ?? null,
          paidAt: payload.paidAt ?? new Date(),
          notes: this.formatPaymentNotes(payload.purpose, payload.notes),
        },
        tx
      );

      if (payload.purpose === "SECURITY_DEPOSIT") {
        await this.markSecurityDepositCollected(order, tx);
      }

      const updatedOrder = await rentalOrderRepository.getRentalOrder(orderId, tx);
      this.assertRuleOrderLoaded(updatedOrder);
      const paymentStatus = this.calculatePaymentStatus(updatedOrder);
      await rentalOrderRepository.updatePaymentStatus(orderId, paymentStatus, tx);

      return createdPayment;
    });

    const updatedOrder = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertRuleOrderLoaded(updatedOrder);

    return {
      payment: this.mapPayment(payment),
      summary: this.buildPaymentSummary(updatedOrder),
    };
  }

  async getPayments(orderId: string, user: ProductRequester) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertReadable(order, user);

    const payments = await rentalOrderRepository.getPayments(orderId);

    return {
      payments: payments.map((payment: any) => this.mapPayment(payment)),
      summary: this.buildPaymentSummary(order),
    };
  }

  async refundDeposit(
    orderId: string,
    payload: RefundDepositInput,
    user: ProductRequester
  ) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertWritable(order, user);

    if (!order.securityDeposit) {
      throw new AppError(404, "Security deposit record not found");
    }

    const depositAmount = toNumber(order.securityDeposit.amount);
    const alreadyRefunded = toNumber(order.securityDeposit.refundedAmount);
    const alreadyDeducted = toNumber(order.securityDeposit.deductedAmount);
    const remainingLateFeeDeduction = Math.max(toNumber(order.lateFee) - alreadyDeducted, 0);
    const availableDeposit = Math.max(depositAmount - alreadyRefunded - alreadyDeducted, 0);
    const deduction = Math.min(remainingLateFeeDeduction, availableDeposit);
    const refundableAmount = Math.max(availableDeposit - deduction, 0);
    const refundAmount = payload.amount ?? refundableAmount;

    if (refundAmount <= 0) {
      throw new AppError(400, "No security deposit amount is available for refund");
    }

    if (refundAmount > refundableAmount) {
      throw new AppError(400, "Refund amount cannot exceed remaining refundable deposit");
    }

    const result = await rentalOrderRepository.transaction(async (tx) => {
      const payment = await rentalOrderRepository.createPayment(
        {
          rentalOrderId: orderId,
          amount: refundAmount,
          method: payload.method ?? "CASH",
          status: "REFUNDED",
          transactionId: payload.transactionId ?? null,
          paidAt: payload.refundedAt ?? new Date(),
          notes: this.formatPaymentNotes("SECURITY_DEPOSIT_REFUND", payload.notes),
        },
        tx
      );

      const refundedAmount = alreadyRefunded + refundAmount;
      const deductedAmount = alreadyDeducted + deduction;
      const status =
        refundedAmount >= depositAmount - deductedAmount
          ? deductedAmount > 0
            ? "PARTIALLY_REFUNDED"
            : "REFUNDED"
          : "PARTIALLY_REFUNDED";

      const securityDeposit = await rentalOrderRepository.updateSecurityDeposit(
        orderId,
        {
          refundedAmount,
          deductedAmount,
          status,
          refundedAt: payload.refundedAt ?? new Date(),
          notes: payload.notes ?? order.securityDeposit.notes,
        },
        tx
      );

      return { payment, securityDeposit };
    });

    const updatedOrder = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertRuleOrderLoaded(updatedOrder);

    notificationService
      .notify({
        userId: order.customerId,
        title: "Security Deposit Refunded 🛡️",
        message: `Your security deposit for rental order #${order.rentalNumber} has been refunded.`,
        type: "SECURITY_DEPOSIT_REFUNDED",
        priority: "NORMAL",
        actionUrl: `/dashboard/orders/${order.id}`,
        data: { orderId: order.id, rentalNumber: order.rentalNumber },
        idempotencyKey: `deposit_refunded_${order.id}_${result.payment.id}`,
      })
      .catch((err) => console.error("Notification error:", err.message));

    return {
      payment: this.mapPayment(result.payment),
      securityDeposit: this.mapSecurityDeposit(result.securityDeposit),
      summary: this.buildPaymentSummary(updatedOrder),
    };
  }

  async generatePaymentQR(orderId: string, user: ProductRequester) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertPaymentCustomerAccess(order, user);

    if (order.status !== "CONFIRMED") {
      throw new AppError(400, "Payment QR can be generated only for confirmed rental orders");
    }

    if (this.isPaymentCompleted(order)) {
      throw new AppError(400, "Payment is already completed for this rental order");
    }

    const amount = this.calculateOutstandingBalance(order);
    if (amount <= 0) {
      throw new AppError(400, "No outstanding amount is available for payment");
    }

    const upiId = order.vendor?.upiId;
    if (!upiId) {
      throw new AppError(400, "Vendor UPI ID is not configured");
    }

    const vendorName = this.getVendorDisplayName(order.vendor);
    const upiLink = rentalOrderRepository.generatePaymentLink({
      upiId,
      vendorName,
      amount,
      rentalNumber: order.rentalNumber,
    });

    return {
      amount: Number(amount.toFixed(2)),
      vendorName,
      upiId,
      upiLink,
    };
  }

  async submitUpiPayment(
    orderId: string,
    payload: SubmitUpiPaymentInput,
    user: ProductRequester
  ) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertPaymentCustomerAccess(order, user);

    if (order.status !== "CONFIRMED") {
      throw new AppError(400, "Payment can be submitted only for confirmed rental orders");
    }

    if (this.isPaymentCompleted(order)) {
      throw new AppError(400, "Payment is already completed for this rental order");
    }

    if (this.hasSubmittedPayment(order)) {
      throw new AppError(409, "Payment is already submitted and awaiting verification");
    }

    const amount = this.calculateOutstandingBalance(order);
    if (amount <= 0) {
      throw new AppError(400, "No outstanding amount is available for payment");
    }

    const payment = await rentalOrderRepository.transaction(async (tx) => {
      const submittedPayment = await rentalOrderRepository.submitPayment(
        {
          rentalOrderId: orderId,
          amount,
          method: "UPI",
          status: "PAYMENT_SUBMITTED",
          transactionId: payload.transactionId,
          paymentProof: payload.paymentProof ?? null,
          paidAt: new Date(),
          notes: this.formatPaymentNotes("UPI_PAYMENT_SUBMITTED"),
        },
        tx
      );

      await rentalOrderRepository.updatePaymentStatus(
        orderId,
        "PAYMENT_SUBMITTED",
        tx
      );

      return submittedPayment;
    });

    return this.mapUpiPayment(payment, order);
  }

  async getUpiPayment(orderId: string, user: ProductRequester) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertReadable(order, user);

    const payment = await rentalOrderRepository.getPayment(orderId);
    if (!payment) {
      throw new AppError(404, "Payment not found for this rental order");
    }

    return this.mapUpiPayment(payment, order);
  }

  async verifyUpiPayment(orderId: string, user: ProductRequester) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertWritable(order, user);
    this.assertOrderCanHavePaymentVerified(order);

    const payment = await rentalOrderRepository.getSubmittedPayment(orderId);
    if (!payment) {
      throw new AppError(404, "Submitted payment not found");
    }

    const verifiedPayment = await rentalOrderRepository.transaction(async (tx) => {
      const updatedPayment = await rentalOrderRepository.verifyPayment(
        payment.id,
        {
          status: "PAID",
          verifiedAt: new Date(),
          verifiedBy: user.id,
          remarks: null,
        },
        tx
      );

      const updatedOrder = await rentalOrderRepository.getRentalOrder(orderId, tx);
      this.assertRuleOrderLoaded(updatedOrder);
      await rentalOrderRepository.updatePaymentStatus(
        orderId,
        this.calculatePaymentStatus(updatedOrder),
        tx
      );

      return updatedPayment;
    });

    notificationService
      .notify({
        userId: order.customerId,
        title: "Payment Received! 💳",
        message: `Your payment for rental order #${order.rentalNumber} has been verified.`,
        type: "PAYMENT_RECEIVED",
        priority: "NORMAL",
        actionUrl: `/dashboard/orders/${order.id}`,
        data: { orderId: order.id, rentalNumber: order.rentalNumber },
        idempotencyKey: `payment_verified_${order.id}_${payment.id}`,
      })
      .catch((err) => console.error("Notification error:", err.message));

    return this.mapUpiPayment(verifiedPayment, order);
  }

  async rejectUpiPayment(
    orderId: string,
    payload: RejectUpiPaymentInput,
    user: ProductRequester
  ) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertWritable(order, user);
    this.assertOrderCanHavePaymentVerified(order);

    const payment = await rentalOrderRepository.getSubmittedPayment(orderId);
    if (!payment) {
      throw new AppError(404, "Submitted payment not found");
    }

    const rejectedPayment = await rentalOrderRepository.transaction(async (tx) => {
      const updatedPayment = await rentalOrderRepository.rejectPayment(
        payment.id,
        {
          status: "FAILED",
          remarks: payload.remarks ?? null,
        },
        tx
      );

      await rentalOrderRepository.updatePaymentStatus(orderId, "PENDING", tx);
      return updatedPayment;
    });

    notificationService
      .notify({
        userId: order.customerId,
        title: "Payment Verification Failed ⚠️",
        message: `Your UPI payment for rental order #${order.rentalNumber} was rejected by the vendor.${
          payload.remarks ? ` Remarks: ${payload.remarks}` : ""
        }`,
        type: "PAYMENT_FAILED",
        priority: "URGENT",
        actionUrl: `/dashboard/orders/${order.id}`,
        data: { orderId: order.id, rentalNumber: order.rentalNumber },
        idempotencyKey: `payment_rejected_${order.id}_${payment.id}`,
      })
      .catch((err) => console.error("Notification error:", err.message));

    return this.mapUpiPayment(rejectedPayment, order);
  }

  async acceptRentalOrder(orderId: string, user: ProductRequester) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertWritable(order, user);
    this.assertAcceptRejectAllowed(order);

    const acceptedOrder = await rentalOrderRepository.transaction(async (tx) => {
      await this.decreaseApprovedOrderStock(order, tx);

      return rentalOrderRepository.acceptRentalOrder(orderId, {
        status: "CONFIRMED",
        approvedAt: new Date(),
        approvedBy: user.id,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
      }, tx);
    });

    this.notifyCustomerOrderAccepted(acceptedOrder);
    return this.mapRentalOrder(acceptedOrder);
  }

  async rejectRentalOrder(
    orderId: string,
    payload: RejectRentalOrderInput,
    user: ProductRequester
  ) {
    const order = await rentalOrderRepository.getRentalOrder(orderId);
    this.assertWritable(order, user);
    this.assertAcceptRejectAllowed(order);

    const rejectedOrder = await rentalOrderRepository.rejectRentalOrder(orderId, {
      status: "CANCELLED",
      rejectedAt: new Date(),
      rejectedBy: user.id,
      rejectionReason: payload.reason,
      approvedAt: null,
      approvedBy: null,
    });

    this.notifyCustomerOrderRejected(rejectedOrder);
    return this.mapRentalOrder(rejectedOrder);
  }

  private async assertCustomerAndVendorExist(customerId: string, vendorId: string) {
    const [customer, vendor] = await Promise.all([
      rentalOrderRepository.findUserById(customerId, "CUSTOMER"),
      rentalOrderRepository.findUserById(vendorId, "VENDOR"),
    ]);

    if (!customer) throw new AppError(404, "Customer not found");
    if (!vendor) throw new AppError(404, "Vendor not found");
  }

  private async resolveCreateFulfillmentData(payload: CreateRentalOrderInput) {
    if (payload.fulfillmentMethod === "STORE_PICKUP") {
      return this.resolveStorePickupData(payload.vendorId, payload.pickupAddress);
    }

    if (!payload.deliveryAddress) {
      throw new AppError(400, "Delivery address is required for home delivery", {
        deliveryAddress: "Delivery address is required for home delivery",
      });
    }

    return {
      fulfillmentMethod: "HOME_DELIVERY",
      ...this.mapDeliveryAddressForStorage(payload.deliveryAddress),
      ...this.emptyPickupAddressForStorage(),
    };
  }

  private async resolveUpdateFulfillmentData(
    order: RentalOrderRecord,
    payload: UpdateRentalOrderInput
  ) {
    if (payload.fulfillmentMethod === undefined && payload.deliveryAddress === undefined && payload.pickupAddress === undefined) {
      return {};
    }

    const fulfillmentMethod = payload.fulfillmentMethod ?? order.fulfillmentMethod;
    if (fulfillmentMethod === "STORE_PICKUP") {
      const storedPickup = this.mapStoredPickupAddress(order);
      const mappedStoredPickup = storedPickup ? {
        ...storedPickup,
        addressLine2: storedPickup.addressLine2 ?? undefined
      } : undefined;
      return this.resolveStorePickupData(order.vendorId, payload.pickupAddress ?? mappedStoredPickup);
    }

    const deliveryAddress =
      payload.deliveryAddress ??
      this.mapStoredDeliveryAddress(order);

    if (!deliveryAddress) {
      throw new AppError(400, "Delivery address is required for home delivery", {
        deliveryAddress: "Delivery address is required for home delivery",
      });
    }

    return {
      fulfillmentMethod: "HOME_DELIVERY",
      ...this.mapDeliveryAddressForStorage(deliveryAddress),
      ...this.emptyPickupAddressForStorage(),
    };
  }

  private async resolveStorePickupData(vendorId: string, payloadPickupAddress?: AddressInput) {
    const vendor = await rentalOrderRepository.findVendorPickupSettings(vendorId);

    if (!vendor || !vendor.supportsStorePickup || !vendor.pickupAddresses || !Array.isArray(vendor.pickupAddresses) || vendor.pickupAddresses.length === 0) {
      throw new AppError(400, "Store pickup is not available for this vendor.", {
        fulfillmentMethod: "Store pickup is not available for this vendor.",
      });
    }

    if (!payloadPickupAddress) {
      throw new AppError(400, "Pickup address is required when choosing store pickup.", {
        pickupAddress: "Pickup address is required when choosing store pickup.",
      });
    }

    return {
      fulfillmentMethod: "STORE_PICKUP",
      ...this.emptyDeliveryAddressForStorage(),
      pickupAddressLine1: payloadPickupAddress.addressLine1,
      pickupAddressLine2: payloadPickupAddress.addressLine2 ?? null,
      pickupCity: payloadPickupAddress.city,
      pickupState: payloadPickupAddress.state,
      pickupPostalCode: payloadPickupAddress.postalCode,
      pickupCountry: payloadPickupAddress.country,
    };
  }

  private mapDeliveryAddressForStorage(address: AddressInput) {
    return {
      deliveryAddressLine1: address.addressLine1,
      deliveryAddressLine2: address.addressLine2 ?? null,
      deliveryCity: address.city,
      deliveryState: address.state,
      deliveryPostalCode: address.postalCode,
      deliveryCountry: address.country,
    };
  }

  private emptyDeliveryAddressForStorage() {
    return {
      deliveryAddressLine1: null,
      deliveryAddressLine2: null,
      deliveryCity: null,
      deliveryState: null,
      deliveryPostalCode: null,
      deliveryCountry: null,
    };
  }

  private emptyPickupAddressForStorage() {
    return {
      pickupAddressLine1: null,
      pickupAddressLine2: null,
      pickupCity: null,
      pickupState: null,
      pickupPostalCode: null,
      pickupCountry: null,
    };
  }

  private assertCanCreateForCustomer(customerId: string, user: ProductRequester) {
    if (user.role === "CUSTOMER" && user.id !== customerId) {
      throw new AppError(403, "Customers can only create their own rental orders");
    }
  }

  private async buildCalculatedItems(
    items: RentalOrderItemInput[],
    vendorId: string,
    rentalStart: Date,
    rentalEnd: Date,
    user: ProductRequester,
    excludeOrderId?: string
  ) {
    const priceList = await rentalOrderRepository.findActivePriceList();
    const calculatedItems = [];

    for (const item of items) {
      const product = await rentalOrderRepository.findProductById(item.productId);

      if (!product) throw new AppError(404, "Product not found");
      if (product.status !== "ACTIVE") {
        throw new AppError(400, "Product must be active to create a rental order");
      }
      if (product.vendorId !== vendorId) {
        throw new AppError(400, "Product does not belong to selected vendor");
      }
      if (user.role === "VENDOR" && product.vendorId !== user.id) {
        throw new AppError(403, "Vendors can only manage their own rental orders");
      }

      const variant = item.variantId
        ? product.variants.find((variantItem: any) => variantItem.id === item.variantId)
        : null;

      if (item.variantId && !variant) {
        throw new AppError(400, "Variant must belong to the selected product");
      }

      const asset = item.assetId
        ? product.assets.find((assetItem: any) => assetItem.id === item.assetId)
        : null;

      if (item.assetId && !asset) {
        throw new AppError(400, "Asset must belong to the selected product");
      }

      if (asset && item.variantId && asset.variantId && asset.variantId !== item.variantId) {
        throw new AppError(400, "Asset must belong to the selected variant");
      }

      await this.assertAvailability(
        item,
        product,
        rentalStart,
        rentalEnd,
        excludeOrderId
      );

      const durationInfo = this.calculateRentalDurationAndValidate(product.rentalConfig, rentalStart, rentalEnd);
      const baseRate = toNumber(variant?.salesPrice ?? product.salesPrice);
      const baseRentalAmount = baseRate * durationInfo.value * item.quantity;

      const ruleCalculation = this.applyDurationPriceRule(baseRentalAmount, baseRate, item, product, priceList, durationInfo);
      const deposit = this.calculateDeposit(product.rentalConfig, ruleCalculation.rentalAmount, item.quantity);

      calculatedItems.push({
        productId: item.productId,
        variantId: item.variantId ?? null,
        assetId: item.assetId ?? null,
        quantity: item.quantity,
        rentalPrice: baseRate,
        deposit,
        subtotal: ruleCalculation.rentalAmount,
        duration: durationInfo,
        baseRate,
        baseRentalAmount,
        pricingRule: ruleCalculation.rule,
        discountPercentage: ruleCalculation.discountPercentage,
        discountAmount: ruleCalculation.discountAmount,
        rentalAmount: ruleCalculation.rentalAmount,
      });
    }

    return {
      priceListId: priceList?.id ?? null,
      items: calculatedItems,
    };
  }

  private async assertAvailability(
    item: RentalOrderItemInput,
    product: any,
    rentalStart: Date,
    rentalEnd: Date,
    excludeOrderId?: string
  ) {
    const where = {
      productId: item.productId,
      ...(item.variantId ? { variantId: item.variantId } : {}),
      ...(item.assetId ? { assetId: item.assetId } : {}),
      rentalOrder: {
        status: { in: ["QUOTATION", "CONFIRMED", "PICKED_UP"] },
        ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
        rentalStart: { lt: rentalEnd },
        rentalEnd: { gt: rentalStart },
      },
    };

    const bookedQuantity = await rentalOrderRepository.countOverlappingItems(where);

    if (item.assetId && bookedQuantity > 0) {
      throw new AppError(409, "Selected asset is not available for the rental dates");
    }

    const availableQuantity = item.variantId
      ? product.variants.find((variant: any) => variant.id === item.variantId)?.quantityOnHand ?? 0
      : product.quantityOnHand;

    if (bookedQuantity + item.quantity > availableQuantity) {
      throw new AppError(409, "Product quantity is not available for the rental dates");
    }
  }

  private getUnitHours(unit: string): number {
    if (unit === "HOUR") return 1;
    if (unit === "WEEK") return 24 * 7;
    if (unit === "MONTH") return 24 * 30;
    return 24; // DAY or NIGHT
  }

  private calculateRentalDurationAndValidate(config: any, rentalStart: Date, rentalEnd: Date) {
    const milliseconds = rentalEnd.getTime() - rentalStart.getTime();
    const hours = milliseconds / (1000 * 60 * 60);

    let unit = config?.rentalRateUnit ?? config?.rentalPeriod?.unit ?? "DAY";
    let durationMultiplier = config?.rentalPeriod?.duration ?? 1;

    let unitHours = this.getUnitHours(unit);
    const durationValue = Math.max(1, Math.ceil(hours / (unitHours * durationMultiplier)));

    const minDuration = config?.minimumRentalDuration ?? 1;
    const minUnit = config?.minDurationUnit ?? unit;
    const minDurationHours = minDuration * this.getUnitHours(minUnit);
    
    if (hours < minDurationHours - 0.01) {
      throw new AppError(400, `Minimum rental period for this product is ${minDuration} ${minUnit.toLowerCase()}(s).`);
    }

    const maxDuration = config?.maximumRentalDuration;
    if (maxDuration) {
      const maxUnit = config?.maxDurationUnit ?? unit;
      const maxDurationHours = maxDuration * this.getUnitHours(maxUnit);
      if (hours > maxDurationHours + 0.01) {
        throw new AppError(400, `Maximum rental period for this product is ${maxDuration} ${maxUnit.toLowerCase()}(s).`);
      }
    }

    return {
      value: durationValue,
      unit: unit,
    };
  }

  private async calculateLateFee(order: RentalOrderRecord, returnedAt: Date): Promise<number> {
    if (returnedAt <= order.rentalEnd) return 0;

    let totalLateFee = 0;

    for (const item of order.items) {
      const product = await rentalOrderRepository.findProductById(item.productId);
      const config = product?.rentalConfig;

      if (!config) continue;

      const graceMs = (config.gracePeriodMinutes ?? 0) * 60 * 1000;
      const lateMs = returnedAt.getTime() - order.rentalEnd.getTime() - graceMs;
      if (lateMs <= 0) continue;

      const unitMs = this.getLateFeeUnitMilliseconds(config.lateFeeUnit);
      const lateUnits = Math.max(1, Math.ceil(lateMs / unitMs));
      const itemLateFee = lateUnits * toNumber(config.lateFee) * item.quantity;
      const maxLateFee = config.maxLateFee ? toNumber(config.maxLateFee) : null;

      totalLateFee += maxLateFee === null ? itemLateFee : Math.min(itemLateFee, maxLateFee);
    }

    return totalLateFee;
  }

  private getLateFeeUnitMilliseconds(unit: string): number {
    if (unit === "WEEK") return 7 * 24 * 60 * 60 * 1000;
    if (unit === "MONTH") return 30 * 24 * 60 * 60 * 1000;
    if (unit === "DAY") return 24 * 60 * 60 * 1000;
    return 60 * 60 * 1000;
  }

  private applyDurationPriceRule(
    baseRentalAmount: number,
    baseRate: number,
    item: RentalOrderItemInput,
    product: any,
    priceList: any,
    durationInfo: { value: number; unit: string }
  ) {
    const now = new Date();
    const rules = priceList?.rules ?? [];
    const matchingRules = rules.filter((rule: any) => {
      const scopeMatches =
        rule.productId === item.productId ||
        (!rule.productId && rule.categoryId === product.categoryId) ||
        (!rule.productId && !rule.categoryId);
      const quantityMatches = item.quantity >= rule.minQuantity;
      const dateMatches =
        (!rule.validFrom || rule.validFrom <= now) && (!rule.validTo || rule.validTo >= now);

      const ruleMinDuration = rule.minDuration ?? 1;
      const ruleDurationUnit = rule.durationUnit ?? "DAY";
      const isDurationRule = rule.minDuration != null;
      const durationMatches = durationInfo.value >= ruleMinDuration && durationInfo.unit === ruleDurationUnit;

      return rule.selectable && scopeMatches && quantityMatches && dateMatches && (!isDurationRule || durationMatches);
    });

    matchingRules.sort((a: any, b: any) => {
      const aMin = a.minDuration ?? 0;
      const bMin = b.minDuration ?? 0;
      return bMin - aMin;
    });

    const rule = matchingRules[0];

    if (!rule) {
      return {
        rule: null,
        discountPercentage: null,
        discountAmount: 0,
        rentalAmount: baseRentalAmount,
      };
    }

    if (rule.ruleType === "FIXED_PRICE") {
      const fixedDiscountAmount = toNumber(rule.fixedPrice);
      const totalDiscount = fixedDiscountAmount * item.quantity;
      const rentalAmount = Math.max(0, baseRentalAmount - totalDiscount);

      return {
        rule: {
          type: "FIXED_PRICE",
          minimumDuration: rule.minDuration,
          durationUnit: rule.durationUnit,
          value: fixedDiscountAmount.toString(),
        },
        discountPercentage: null,
        discountAmount: totalDiscount,
        rentalAmount,
      };
    }

    const discountPercent = toNumber(rule.discountPercent);
    const discountAmount = baseRentalAmount * (discountPercent / 100);
    return {
      rule: {
        type: "DISCOUNT",
        minimumDuration: rule.minDuration,
        durationUnit: rule.durationUnit,
        value: discountPercent.toString(),
      },
      discountPercentage: discountPercent,
      discountAmount,
      rentalAmount: Math.max(0, baseRentalAmount - discountAmount),
    };
  }

  private calculateDeposit(config: any, subtotal: number, quantity: number): number {
    if (!config) return 0;

    const securityDeposit = toNumber(config.securityDeposit);
    if (config.depositType === "PERCENTAGE") {
      return subtotal * (securityDeposit / 100);
    }

    return securityDeposit * quantity;
  }

  private calculateTotals(calculated: { items: Array<{ subtotal: number; deposit: number }> }) {
    const subtotal = calculated.items.reduce((total, item) => total + item.subtotal, 0);
    const securityDeposit = calculated.items.reduce((total, item) => total + item.deposit, 0);

    return {
      subtotal,
      securityDeposit,
      grandTotal: subtotal + securityDeposit,
    };
  }

  private buildListWhere(query: ListRentalOrdersQuery, user: ProductRequester) {
    const where: any = {
      ...(query.search ? { rentalNumber: { contains: query.search, mode: "insensitive" } } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.vendorId ? { vendorId: query.vendorId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.includeCancelled ? {} : { status: { not: "CANCELLED" } }),
    };

    if (query.fromDate || query.toDate) {
      where.rentalStart = {
        ...(query.fromDate ? { gte: query.fromDate } : {}),
        ...(query.toDate ? { lte: query.toDate } : {}),
      };
    }

    if (user.role === "VENDOR") where.vendorId = user.id;
    if (user.role === "CUSTOMER") where.customerId = user.id;

    return where;
  }

  private assertDateRange(rentalStart: Date, rentalEnd: Date) {
    if (rentalStart >= rentalEnd) {
      throw new AppError(400, "Rental start must be before rental end", {
        rentalStart: "Rental start must be before rental end",
      });
    }
  }

  private assertReadable(
    order: RentalOrderRecord | null,
    user: ProductRequester
  ): asserts order is RentalOrderRecord {
    if (!order) throw new AppError(404, "Rental order not found");
    if (user.role === "VENDOR" && order.vendorId !== user.id) {
      throw new AppError(403, "Vendors can only access their own rental orders");
    }
    if (user.role === "CUSTOMER" && order.customerId !== user.id) {
      throw new AppError(403, "Customers can only access their own rental orders");
    }
  }

  private assertWritable(
    order: RentalOrderRecord | null,
    user: ProductRequester
  ): asserts order is RentalOrderRecord {
    this.assertReadable(order, user);
    if (user.role === "CUSTOMER") {
      throw new AppError(403, "Customers cannot modify rental orders");
    }
  }

  private assertEditable(order: RentalOrderRecord) {
    if (order.status !== EDITABLE_STATUS) {
      throw new AppError(400, "Rental order can be changed only while it is in draft");
    }
  }

  private assertAcceptRejectAllowed(order: RentalOrderRecord) {
    if (order.status !== "QUOTATION") {
      throw new AppError(400, "Only quotation rental requests can be accepted or rejected");
    }
  }

  private async decreaseApprovedOrderStock(
    order: RentalOrderRecord,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    for (const item of order.items) {
      const productResult = await rentalOrderRepository.decrementProductQuantity(
        item.productId,
        item.quantity,
        tx
      );

      if (productResult.count !== 1) {
        throw new AppError(409, "Product quantity is not available for approval");
      }

      if (item.variantId) {
        const variantResult = await rentalOrderRepository.decrementVariantQuantity(
          item.variantId,
          item.quantity,
          tx
        );

        if (variantResult.count !== 1) {
          throw new AppError(409, "Product variant quantity is not available for approval");
        }
      }
    }
  }

  private notifyCustomerOrderAccepted(order: RentalOrderRecord) {
    notificationService
      .notify({
        userId: order.customerId,
        title: "Quotation Approved! 🎉",
        message: `Your rental order #${order.rentalNumber} has been accepted by the vendor.`,
        type: "QUOTATION_ACCEPTED",
        priority: "NORMAL",
        actionUrl: `/dashboard/orders/${order.id}`,
        data: { orderId: order.id, rentalNumber: order.rentalNumber },
        idempotencyKey: `quotation_accepted_${order.id}`,
      })
      .catch((err) => console.error("Notification error:", err.message));
  }

  private notifyCustomerOrderRejected(order: RentalOrderRecord) {
    notificationService
      .notify({
        userId: order.customerId,
        title: "Quotation Rejected",
        message: `Your rental order #${order.rentalNumber} was rejected by the vendor.${
          order.rejectionReason ? ` Reason: ${order.rejectionReason}` : ""
        }`,
        type: "QUOTATION_REJECTED",
        priority: "NORMAL",
        actionUrl: `/dashboard/orders/${order.id}`,
        data: { orderId: order.id, rentalNumber: order.rentalNumber },
        idempotencyKey: `quotation_rejected_${order.id}`,
      })
      .catch((err) => console.error("Notification error:", err.message));
  }

  private calculatePaymentStatus(order: RentalOrderRecord): "PENDING" | "PARTIALLY_PAID" | "PAID" {
    const totalPaid = this.calculateTotalPaid(order);
    const grandTotal = toNumber(order.grandTotal);

    if (totalPaid <= 0) return "PENDING";
    if (totalPaid >= grandTotal) return "PAID";
    return "PARTIALLY_PAID";
  }

  private calculateTotalPaid(order: RentalOrderRecord): number {
    return order.payments
      .filter((payment: any) => payment.status === "PAID")
      .reduce((total: number, payment: any) => total + toNumber(payment.amount), 0);
  }

  private calculateOutstandingBalance(order: RentalOrderRecord): number {
    return Math.max(toNumber(order.grandTotal) - this.calculateTotalPaid(order), 0);
  }

  private isPaymentCompleted(order: RentalOrderRecord): boolean {
    return order.paymentStatus === "PAID" || this.calculateOutstandingBalance(order) <= 0;
  }

  private hasSubmittedPayment(order: RentalOrderRecord): boolean {
    return order.payments.some((payment: any) => payment.status === "PAYMENT_SUBMITTED");
  }

  private assertPaymentCustomerAccess(
    order: RentalOrderRecord | null,
    user: ProductRequester
  ): asserts order is RentalOrderRecord {
    if (!order) throw new AppError(404, "Rental order not found");

    if (user.role !== "CUSTOMER") {
      throw new AppError(403, "Only customers can access this payment action");
    }

    if (order.customerId !== user.id) {
      throw new AppError(403, "Customers can only access their own rental order payments");
    }
  }

  private assertOrderCanHavePaymentVerified(order: RentalOrderRecord) {
    if (order.status === "CANCELLED") {
      throw new AppError(400, "Cancelled rental orders cannot be verified for payment");
    }

    if (order.paymentStatus === "PAID") {
      throw new AppError(400, "Payment is already verified");
    }
  }

  private getVendorDisplayName(vendor: any): string {
    if (vendor.companyName) return vendor.companyName;

    const fullName = [vendor.firstName, vendor.lastName].filter(Boolean).join(" ");
    return fullName || vendor.email;
  }

  private async markSecurityDepositCollected(
    order: RentalOrderRecord,
    tx: Prisma.TransactionClient
  ) {
    if (!order.securityDeposit || order.securityDeposit.status !== "PENDING") {
      return;
    }

    await rentalOrderRepository.updateSecurityDeposit(
      order.id,
      {
        status: "COLLECTED",
        collectedAt: new Date(),
      },
      tx
    );
  }

  private formatPaymentNotes(purpose: string, notes?: string): string {
    return [`Purpose: ${purpose}`, notes ? `Notes: ${notes}` : null]
      .filter(Boolean)
      .join("\n");
  }

  private buildPaymentSummary(order: RentalOrderRecord) {
    return {
      grandTotal: decimalToString(order.grandTotal),
      subtotal: decimalToString(order.subtotal),
      securityDepositAmount: decimalToString(order.securityDepositAmount),
      lateFee: decimalToString(order.lateFee),
      paidAmount: this.calculateTotalPaid(order).toFixed(2),
      outstandingBalance: this.calculateOutstandingBalance(order).toFixed(2),
      paymentStatus: this.calculatePaymentStatus(order),
    };
  }

  private assertRuleOrderLoaded(
    order: RentalOrderRecord | null
  ): asserts order is RentalOrderRecord {
    if (!order) throw new AppError(404, "Rental order not found");
  }

  private getAssignedAssetIds(order: RentalOrderRecord): string[] {
    return order.items
      .map((item: any) => item.assetId)
      .filter((assetId: string | null): assetId is string => Boolean(assetId));
  }

  private async assertPickupAssetsAreAvailable(
    order: RentalOrderRecord,
    assetIds: string[]
  ): Promise<void> {
    if (assetIds.length === 0) return;

    const assets = await rentalOrderRepository.getAssetsByIds(assetIds);
    const orderAssetIds = new Set(assetIds);

    if (assets.length !== assetIds.length) {
      throw new AppError(404, "One or more assigned product assets do not exist");
    }

    for (const asset of assets) {
      const orderItem = order.items.find((item: any) => item.assetId === asset.id);

      if (!orderAssetIds.has(asset.id) || asset.productId !== orderItem?.productId) {
        throw new AppError(400, "Assigned asset does not belong to the rental item product");
      }

      if (asset.status !== "AVAILABLE") {
        throw new AppError(409, "Every assigned product asset must be available for pickup");
      }
    }
  }

  private assertMaintenanceAssetsBelongToOrder(
    maintenanceAssetIds: string[],
    orderAssetIds: string[]
  ) {
    const orderAssetSet = new Set(orderAssetIds);
    const invalidAsset = maintenanceAssetIds.find(
      (assetId) => !orderAssetSet.has(assetId)
    );

    if (invalidAsset) {
      throw new AppError(400, "Maintenance asset must belong to the rental order");
    }
  }

  private mergeNotes(existingNotes: string | null, entries: Array<string | null>): string {
    const newNotes = entries.filter(Boolean).join("\n");
    return [existingNotes, newNotes].filter(Boolean).join("\n\n");
  }

  private mapRentalOrder(order: RentalOrderRecord) {
    return {
      id: order.id,
      rentalNumber: order.rentalNumber,
      customerId: order.customerId,
      vendorId: order.vendorId,
      priceListId: order.priceListId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentMethod: order.fulfillmentMethod,
      deliveryAddress: this.mapStoredDeliveryAddress(order),
      pickupLocation: this.mapStoredPickupAddress(order),
      rentalStart: order.rentalStart.toISOString(),
      rentalEnd: order.rentalEnd.toISOString(),
      actualPickupAt: order.actualPickupAt?.toISOString() ?? null,
      actualReturnAt: order.actualReturnAt?.toISOString() ?? null,
      approvedAt: order.approvedAt?.toISOString() ?? null,
      approvedBy: order.approvedBy ?? null,
      rejectedAt: order.rejectedAt?.toISOString() ?? null,
      rejectedBy: order.rejectedBy ?? null,
      rejectionReason: order.rejectionReason ?? null,
      subtotal: decimalToString(order.subtotal),
      securityDepositAmount: decimalToString(order.securityDepositAmount),
      lateFee: decimalToString(order.lateFee),
      grandTotal: decimalToString(order.grandTotal),
      notes: order.notes,
      customer: order.customer,
      vendor: order.vendor,
      priceList: order.priceList,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        assetId: item.assetId,
        quantity: item.quantity,
        rentalPrice: decimalToString(item.rentalPrice),
        deposit: decimalToString(item.deposit),
        subtotal: decimalToString(item.subtotal),
        product: item.product,
        variant: item.variant,
        asset: item.asset,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      securityDeposit: order.securityDeposit
        ? {
            ...this.mapSecurityDeposit(order.securityDeposit),
          }
        : null,
      payments: order.payments.map((payment: any) => this.mapPayment(payment)),
      paymentSummary: this.buildPaymentSummary(order),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private mapStoredDeliveryAddress(order: RentalOrderRecord): AddressInput | null {
    if (!order.deliveryAddressLine1) return null;

    return {
      addressLine1: order.deliveryAddressLine1,
      addressLine2: order.deliveryAddressLine2 ?? undefined,
      city: order.deliveryCity,
      state: order.deliveryState,
      postalCode: order.deliveryPostalCode,
      country: order.deliveryCountry,
    };
  }

  private mapStoredPickupAddress(order: RentalOrderRecord) {
    if (!order.pickupAddressLine1) return null;

    return {
      addressLine1: order.pickupAddressLine1,
      addressLine2: order.pickupAddressLine2,
      city: order.pickupCity,
      state: order.pickupState,
      postalCode: order.pickupPostalCode,
      country: order.pickupCountry,
    };
  }

  private mapVendorPickupAddress(vendor: any): AddressInput | null {
    if (!vendor?.supportsStorePickup || !vendor.pickupAddressLine1) {
      return null;
    }

    return {
      addressLine1: vendor.pickupAddressLine1,
      addressLine2: vendor.pickupAddressLine2 ?? undefined,
      city: vendor.pickupCity,
      state: vendor.pickupState,
      postalCode: vendor.pickupPostalCode,
      country: vendor.pickupCountry,
    };
  }

  private mapPayment(payment: any) {
    return {
      ...payment,
      amount: decimalToString(payment.amount),
      paidAt: payment.paidAt?.toISOString() ?? null,
      verifiedAt: payment.verifiedAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }

  private mapUpiPayment(payment: any, order: RentalOrderRecord) {
    return {
      id: payment.id,
      rentalOrderId: payment.rentalOrderId,
      rentalNumber: order.rentalNumber,
      amount: decimalToString(payment.amount),
      status: payment.status,
      transactionId: payment.transactionId,
      paymentProof: payment.paymentProof ?? null,
      remarks: payment.remarks ?? null,
      vendor: {
        id: order.vendor.id,
        name: this.getVendorDisplayName(order.vendor),
        upiId: order.vendor.upiId ?? null,
      },
      submittedAt: payment.createdAt.toISOString(),
      paidAt: payment.paidAt?.toISOString() ?? null,
      verifiedAt: payment.verifiedAt?.toISOString() ?? null,
      verifiedBy: payment.verifiedBy ?? null,
    };
  }

  private mapSecurityDeposit(securityDeposit: any) {
    return {
      ...securityDeposit,
      amount: decimalToString(securityDeposit.amount),
      refundedAmount: decimalToString(securityDeposit.refundedAmount),
      deductedAmount: decimalToString(securityDeposit.deductedAmount),
      createdAt: securityDeposit.createdAt.toISOString(),
      updatedAt: securityDeposit.updatedAt.toISOString(),
      collectedAt: securityDeposit.collectedAt?.toISOString() ?? null,
      refundedAt: securityDeposit.refundedAt?.toISOString() ?? null,
    };
  }
}

export const rentalOrderService = new RentalOrderService();
