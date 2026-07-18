import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

type PrismaExecutor = typeof prisma | Prisma.TransactionClient;

const rentalOrderInclude = {
  customer: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  },
  vendor: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      companyName: true,
    },
  },
  priceList: true,
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          vendorId: true,
        },
      },
      variant: {
        select: {
          id: true,
          name: true,
          sku: true,
        },
      },
      asset: {
        select: {
          id: true,
          assetTag: true,
          status: true,
        },
      },
    },
  },
  securityDeposit: true,
  payments: true,
} as const;

export type RentalOrderRecord = any;
export type ProductForRentalOrder = any;

export class RentalOrderRepository {
  createRentalOrder(data: any, db: PrismaExecutor = prisma): Promise<RentalOrderRecord> {
    return (db as any).rentalOrder.create({
      data,
      include: rentalOrderInclude,
    });
  }

  getRentalOrders(
    where: any,
    skip: number,
    take: number
  ): Promise<[RentalOrderRecord[], number]> {
    return (prisma as any).$transaction([
      (prisma as any).rentalOrder.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take,
        include: rentalOrderInclude,
      }),
      (prisma as any).rentalOrder.count({ where }),
    ]);
  }

  getRentalOrder(id: string, db: PrismaExecutor = prisma): Promise<RentalOrderRecord | null> {
    return (db as any).rentalOrder.findUnique({
      where: { id },
      include: rentalOrderInclude,
    });
  }

  updateRentalOrder(id: string, data: any, db: PrismaExecutor = prisma) {
    return (db as any).rentalOrder.update({
      where: { id },
      data,
      include: rentalOrderInclude,
    });
  }

  deleteRentalOrder(id: string, db: PrismaExecutor = prisma) {
    return (db as any).rentalOrder.delete({
      where: { id },
      include: rentalOrderInclude,
    });
  }

  async generateRentalNumber(db: PrismaExecutor = prisma): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RO-${year}-`;
    const latestOrder = await (db as any).rentalOrder.findFirst({
      where: {
        rentalNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        rentalNumber: "desc",
      },
      select: {
        rentalNumber: true,
      },
    });

    const nextNumber = latestOrder
      ? Number(latestOrder.rentalNumber.replace(prefix, "")) + 1
      : 1;

    return `${prefix}${String(nextNumber).padStart(6, "0")}`;
  }

  findUserById(id: string, role?: "CUSTOMER" | "VENDOR", db: PrismaExecutor = prisma) {
    return (db as any).user.findFirst({
      where: {
        id,
        status: "ACTIVE",
        ...(role ? { role } : {}),
      },
      select: {
        id: true,
        role: true,
      },
    });
  }

  findProductById(id: string, db: PrismaExecutor = prisma): Promise<ProductForRentalOrder | null> {
    return (db as any).product.findUnique({
      where: { id },
      include: {
        rentalConfig: {
          include: {
            rentalPeriod: true,
          },
        },
        variants: true,
        assets: true,
        category: true,
      },
    });
  }

  findActivePriceList(db: PrismaExecutor = prisma) {
    const now = new Date();

    return (db as any).priceList.findFirst({
      where: {
        isActive: true,
        OR: [
          { isDefault: true },
          {
            AND: [
              { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
              { OR: [{ validTo: null }, { validTo: { gte: now } }] },
            ],
          },
        ],
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      include: {
        rules: true,
      },
    });
  }

  countOverlappingItems(
    where: any,
    db: PrismaExecutor = prisma
  ): Promise<number> {
    return (db as any).rentalOrderItem.count({ where });
  }

  deleteOrderItems(rentalOrderId: string, db: PrismaExecutor = prisma) {
    return (db as any).rentalOrderItem.deleteMany({
      where: { rentalOrderId },
    });
  }

  pickupOrder(id: string, data: any, db: PrismaExecutor = prisma) {
    return (db as any).rentalOrder.update({
      where: { id },
      data,
      include: rentalOrderInclude,
    });
  }

  returnOrder(id: string, data: any, db: PrismaExecutor = prisma) {
    return (db as any).rentalOrder.update({
      where: { id },
      data,
      include: rentalOrderInclude,
    });
  }

  updateAssets(
    assetIds: string[],
    status: "AVAILABLE" | "PICKED_UP" | "MAINTENANCE",
    db: PrismaExecutor = prisma
  ) {
    return (db as any).productAsset.updateMany({
      where: { id: { in: assetIds } },
      data: { status },
    });
  }

  getAssetsByIds(assetIds: string[], db: PrismaExecutor = prisma) {
    return (db as any).productAsset.findMany({
      where: { id: { in: assetIds } },
      select: {
        id: true,
        productId: true,
        variantId: true,
        status: true,
        assetTag: true,
      },
    });
  }

  getTimeline(orderId: string, db: PrismaExecutor = prisma) {
    return (db as any).rentalOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        rentalNumber: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
        rentalStart: true,
        rentalEnd: true,
        actualPickupAt: true,
        actualReturnAt: true,
      },
    });
  }

  createPayment(data: any, db: PrismaExecutor = prisma) {
    return (db as any).rentalPayment.create({ data });
  }

  getPayments(orderId: string, db: PrismaExecutor = prisma) {
    return (db as any).rentalPayment.findMany({
      where: { rentalOrderId: orderId },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
  }

  updatePaymentStatus(orderId: string, paymentStatus: string, db: PrismaExecutor = prisma) {
    return (db as any).rentalOrder.update({
      where: { id: orderId },
      data: { paymentStatus },
      include: rentalOrderInclude,
    });
  }

  updateSecurityDeposit(
    rentalOrderId: string,
    data: any,
    db: PrismaExecutor = prisma
  ) {
    return (db as any).securityDeposit.update({
      where: { rentalOrderId },
      data,
    });
  }

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(callback);
  }
}

export const rentalOrderRepository = new RentalOrderRepository();
