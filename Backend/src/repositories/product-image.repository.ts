import { Prisma, PrismaClient, ProductImage } from "@prisma/client";
import { prisma } from "../config/prisma";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export type ProductForImageAccess = {
  id: string;
  vendorId: string | null;
  createdById: string;
};

export class ProductImageRepository {
  findProductById(
    productId: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductForImageAccess | null> {
    return db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        vendorId: true,
        createdById: true,
      },
    });
  }

  findById(
    imageId: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductImage | null> {
    return db.productImage.findUnique({
      where: { id: imageId },
    });
  }

  findManyByProductId(
    productId: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductImage[]> {
    return db.productImage.findMany({
      where: { productId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  countByProductId(
    productId: string,
    db: PrismaExecutor = prisma
  ): Promise<number> {
    return db.productImage.count({
      where: { productId },
    });
  }

  createMany(
    images: Prisma.ProductImageCreateManyInput[],
    db: PrismaExecutor = prisma
  ) {
    return db.productImage.createMany({
      data: images,
    });
  }

  clearPrimary(productId: string, db: PrismaExecutor = prisma) {
    return db.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });
  }

  setPrimary(imageId: string, db: PrismaExecutor = prisma) {
    return db.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }

  updateSortOrder(
    imageId: string,
    sortOrder: number,
    db: PrismaExecutor = prisma
  ) {
    return db.productImage.update({
      where: { id: imageId },
      data: { sortOrder },
    });
  }

  delete(imageId: string, db: PrismaExecutor = prisma) {
    return db.productImage.delete({
      where: { id: imageId },
    });
  }

  findFirstRemaining(
    productId: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductImage | null> {
    return db.productImage.findFirst({
      where: { productId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(callback);
  }
}

export const productImageRepository = new ProductImageRepository();
