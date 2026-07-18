import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export type ProductForRentalConfigAccess = {
  id: string;
  vendorId: string | null;
  createdById: string;
};

const rentalConfigInclude = {
  rentalPeriod: true,
} satisfies Prisma.ProductRentalConfigInclude;

export type RentalConfigRecord = Prisma.ProductRentalConfigGetPayload<{
  include: typeof rentalConfigInclude;
}>;

export class RentalConfigRepository {
  findProductById(
    productId: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductForRentalConfigAccess | null> {
    return db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        vendorId: true,
        createdById: true,
      },
    });
  }

  findRentalPeriodById(id: string, db: PrismaExecutor = prisma) {
    return db.rentalPeriod.findFirst({
      where: {
        id,
        isActive: true,
      },
      select: { id: true },
    });
  }

  findByProductId(
    productId: string,
    db: PrismaExecutor = prisma
  ): Promise<RentalConfigRecord | null> {
    return db.productRentalConfig.findUnique({
      where: { productId },
      include: rentalConfigInclude,
    });
  }

  create(
    data: Prisma.ProductRentalConfigUncheckedCreateInput,
    db: PrismaExecutor = prisma
  ): Promise<RentalConfigRecord> {
    return db.productRentalConfig.create({
      data,
      include: rentalConfigInclude,
    });
  }

  update(
    productId: string,
    data: Prisma.ProductRentalConfigUncheckedUpdateInput,
    db: PrismaExecutor = prisma
  ): Promise<RentalConfigRecord> {
    return db.productRentalConfig.update({
      where: { productId },
      data,
      include: rentalConfigInclude,
    });
  }

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(callback);
  }
}

export const rentalConfigRepository = new RentalConfigRepository();
