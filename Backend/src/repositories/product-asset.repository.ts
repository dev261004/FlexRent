import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export type ProductForAssetAccess = {
  id: string;
  vendorId: string | null;
  createdById: string;
};

const productAssetInclude = {
  variant: {
    select: {
      id: true,
      sku: true,
      name: true,
      productId: true,
    },
  },
} satisfies Prisma.ProductAssetInclude;

export type ProductAssetRecord = Prisma.ProductAssetGetPayload<{
  include: typeof productAssetInclude;
}>;

export class ProductAssetRepository {
  productExists(
    productId: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductForAssetAccess | null> {
    return db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        vendorId: true,
        createdById: true,
      },
    });
  }

  variantExists(
    variantId: string,
    db: PrismaExecutor = prisma
  ): Promise<{ id: string; productId: string } | null> {
    return db.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        productId: true,
      },
    });
  }

  createAsset(
    data: Prisma.ProductAssetUncheckedCreateInput,
    db: PrismaExecutor = prisma
  ): Promise<ProductAssetRecord> {
    return db.productAsset.create({
      data,
      include: productAssetInclude,
    });
  }

  getAssets(
    where: Prisma.ProductAssetWhereInput,
    orderBy: Prisma.ProductAssetOrderByWithRelationInput[],
    skip: number,
    take: number
  ): Promise<[ProductAssetRecord[], number]> {
    return prisma.$transaction([
      prisma.productAsset.findMany({
        where,
        orderBy,
        skip,
        take,
        include: productAssetInclude,
      }),
      prisma.productAsset.count({ where }),
    ]);
  }

  getAssetById(
    assetId: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductAssetRecord | null> {
    return db.productAsset.findUnique({
      where: { id: assetId },
      include: productAssetInclude,
    });
  }

  updateAsset(
    assetId: string,
    data: Prisma.ProductAssetUncheckedUpdateInput,
    db: PrismaExecutor = prisma
  ): Promise<ProductAssetRecord> {
    return db.productAsset.update({
      where: { id: assetId },
      data,
      include: productAssetInclude,
    });
  }

  deleteAsset(
    assetId: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductAssetRecord> {
    return db.productAsset.delete({
      where: { id: assetId },
      include: productAssetInclude,
    });
  }

  assetTagExists(
    assetTag: string,
    excludeAssetId?: string,
    db: PrismaExecutor = prisma
  ) {
    return db.productAsset.findFirst({
      where: {
        assetTag,
        ...(excludeAssetId ? { id: { not: excludeAssetId } } : {}),
      },
      select: { id: true },
    });
  }

  barcodeExists(
    barcode: string,
    excludeAssetId?: string,
    db: PrismaExecutor = prisma
  ) {
    return db.productAsset.findFirst({
      where: {
        barcode,
        ...(excludeAssetId ? { id: { not: excludeAssetId } } : {}),
      },
      select: { id: true },
    });
  }

  qrCodeExists(
    qrCode: string,
    excludeAssetId?: string,
    db: PrismaExecutor = prisma
  ) {
    return db.productAsset.findFirst({
      where: {
        qrCode,
        ...(excludeAssetId ? { id: { not: excludeAssetId } } : {}),
      },
      select: { id: true },
    });
  }
}

export const productAssetRepository = new ProductAssetRepository();
