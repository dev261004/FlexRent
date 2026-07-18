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
} from "../validations/rental-order.validation";
import {
  PickupOrderInput,
  ReturnOrderInput,
} from "../validations/pickup-return.validation";

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

      return this.mapRentalOrder(order);
    });
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

    const updatedOrder = await rentalOrderRepository.transaction(async (tx) => {
      await rentalOrderRepository.deleteOrderItems(id, tx);

      return rentalOrderRepository.updateRentalOrder(
        id,
        {
          rentalStart,
          rentalEnd,
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

    return this.mapRentalOrder(updatedOrder);
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

      return rentalOrderRepository.returnOrder(
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
    });

    return this.mapRentalOrder(updatedOrder);
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

  private async assertCustomerAndVendorExist(customerId: string, vendorId: string) {
    const [customer, vendor] = await Promise.all([
      rentalOrderRepository.findUserById(customerId, "CUSTOMER"),
      rentalOrderRepository.findUserById(vendorId, "VENDOR"),
    ]);

    if (!customer) throw new AppError(404, "Customer not found");
    if (!vendor) throw new AppError(404, "Vendor not found");
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

      const periodCount = this.calculateRentalPeriods(product.rentalConfig, rentalStart, rentalEnd);
      const basePrice = toNumber(variant?.salesPrice ?? product.salesPrice);
      const rentalPrice = this.applyPriceRule(basePrice, item, product, priceList);
      const subtotal = rentalPrice * item.quantity * periodCount;
      const deposit = this.calculateDeposit(product.rentalConfig, subtotal, item.quantity);

      calculatedItems.push({
        productId: item.productId,
        variantId: item.variantId ?? null,
        assetId: item.assetId ?? null,
        quantity: item.quantity,
        rentalPrice,
        deposit,
        subtotal,
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

  private calculateRentalPeriods(config: any, rentalStart: Date, rentalEnd: Date): number {
    if (!config?.rentalPeriod) return 1;

    const milliseconds = rentalEnd.getTime() - rentalStart.getTime();
    const hours = milliseconds / (1000 * 60 * 60);
    const unit = config.rentalPeriod.unit;
    const duration = Math.max(config.rentalPeriod.duration ?? 1, 1);
    const unitHours =
      unit === "HOUR"
        ? 1
        : unit === "WEEK"
          ? 24 * 7
          : unit === "MONTH"
            ? 24 * 30
            : 24;

    return Math.max(1, Math.ceil(hours / (unitHours * duration)));
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

  private applyPriceRule(
    basePrice: number,
    item: RentalOrderItemInput,
    product: any,
    priceList: any
  ): number {
    const now = new Date();
    const rules = priceList?.rules ?? [];
    const matchingRule = rules.find((rule: any) => {
      const scopeMatches =
        rule.productId === item.productId ||
        (!rule.productId && rule.categoryId === product.categoryId) ||
        (!rule.productId && !rule.categoryId);
      const quantityMatches = item.quantity >= rule.minQuantity;
      const dateMatches =
        (!rule.validFrom || rule.validFrom <= now) && (!rule.validTo || rule.validTo >= now);

      return rule.selectable && scopeMatches && quantityMatches && dateMatches;
    });

    if (!matchingRule) return basePrice;
    if (matchingRule.ruleType === "FIXED_PRICE") return toNumber(matchingRule.fixedPrice);

    const discountPercent = toNumber(matchingRule.discountPercent);
    return Math.max(0, basePrice - basePrice * (discountPercent / 100));
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
      rentalStart: order.rentalStart.toISOString(),
      rentalEnd: order.rentalEnd.toISOString(),
      actualPickupAt: order.actualPickupAt?.toISOString() ?? null,
      actualReturnAt: order.actualReturnAt?.toISOString() ?? null,
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
            ...order.securityDeposit,
            amount: decimalToString(order.securityDeposit.amount),
            refundedAmount: decimalToString(order.securityDeposit.refundedAmount),
            deductedAmount: decimalToString(order.securityDeposit.deductedAmount),
            createdAt: order.securityDeposit.createdAt.toISOString(),
            updatedAt: order.securityDeposit.updatedAt.toISOString(),
            collectedAt: order.securityDeposit.collectedAt?.toISOString() ?? null,
            refundedAt: order.securityDeposit.refundedAt?.toISOString() ?? null,
          }
        : null,
      payments: order.payments.map((payment: any) => ({
        ...payment,
        amount: decimalToString(payment.amount),
        paidAt: payment.paidAt?.toISOString() ?? null,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}

export const rentalOrderService = new RentalOrderService();
