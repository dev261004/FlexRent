import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

export type ProductForVariantAccess = {
  id: string;
  vendorId: string | null;
  createdById: string;
};

const productVariantInclude = {
  values: {
    include: {
      attributeValue: {
        include: {
          attribute: true,
        },
      },
    },
  },
  _count: {
    select: {
      assets: true,
    },
  },
} satisfies Prisma.ProductVariantInclude;

export type ProductVariantRecord = Prisma.ProductVariantGetPayload<{
  include: typeof productVariantInclude;
}>;

export type AttributeValueForVariant = Prisma.ProductAttributeValueGetPayload<{
  include: {
    attribute: {
      include: {
        products: true;
      };
    };
  };
}>;

export class ProductVariantRepository {
  productExists(
    productId: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductForVariantAccess | null> {
    return db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        vendorId: true,
        createdById: true,
      },
    });
  }

  createVariant(
    data: Prisma.ProductVariantUncheckedCreateInput,
    attributeValueIds: string[],
    db: PrismaExecutor = prisma
  ): Promise<ProductVariantRecord> {
    return db.productVariant.create({
      data: {
        ...data,
        values: {
          create: attributeValueIds.map((attributeValueId) => ({
            attributeValueId,
          })),
        },
      },
      include: productVariantInclude,
    });
  }

  getVariants(
    where: Prisma.ProductVariantWhereInput,
    orderBy: Prisma.ProductVariantOrderByWithRelationInput[],
    skip: number,
    take: number
  ): Promise<[ProductVariantRecord[], number]> {
    return prisma.$transaction([
      prisma.productVariant.findMany({
        where,
        orderBy,
        skip,
        take,
        include: productVariantInclude,
      }),
      prisma.productVariant.count({ where }),
    ]);
  }

  getVariant(
    variantId: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductVariantRecord | null> {
    return db.productVariant.findUnique({
      where: { id: variantId },
      include: productVariantInclude,
    });
  }

  async updateVariant(
    variantId: string,
    data: Prisma.ProductVariantUncheckedUpdateInput,
    attributeValueIds: string[] | undefined,
    db: PrismaExecutor = prisma
  ): Promise<ProductVariantRecord> {
    if (attributeValueIds !== undefined) {
      await db.productVariantValue.deleteMany({
        where: { variantId },
      });
    }

    return db.productVariant.update({
      where: { id: variantId },
      data: {
        ...data,
        ...(attributeValueIds !== undefined
          ? {
              values: {
                create: attributeValueIds.map((attributeValueId) => ({
                  attributeValueId,
                })),
              },
            }
          : {}),
      },
      include: productVariantInclude,
    });
  }

  deleteVariant(
    variantId: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductVariantRecord> {
    return db.productVariant.delete({
      where: { id: variantId },
      include: productVariantInclude,
    });
  }

  skuExists(sku: string, excludeVariantId?: string, db: PrismaExecutor = prisma) {
    return db.productVariant.findFirst({
      where: {
        sku,
        ...(excludeVariantId ? { id: { not: excludeVariantId } } : {}),
      },
      select: { id: true },
    });
  }

  findAttributeValues(attributeValueIds: string[]) {
    return prisma.productAttributeValue.findMany({
      where: { id: { in: attributeValueIds } },
      include: {
        attribute: {
          include: {
            products: true,
          },
        },
      },
    });
  }

  async variantCombinationExists(
    productId: string,
    attributeValueIds: string[],
    excludeVariantId?: string
  ): Promise<boolean> {
    const variants = await prisma.productVariant.findMany({
      where: {
        productId,
        ...(excludeVariantId ? { id: { not: excludeVariantId } } : {}),
      },
      select: {
        values: {
          select: {
            attributeValueId: true,
          },
        },
      },
    });

    const expectedKey = this.combinationKey(attributeValueIds);

    return variants.some(
      (variant) =>
        variant.values.length === attributeValueIds.length &&
        this.combinationKey(
          variant.values.map((value) => value.attributeValueId)
        ) === expectedKey
    );
  }

  async variantInUse(variantId: string): Promise<boolean> {
    const assetCount = await prisma.productAsset.count({
      where: { variantId },
    });

    return assetCount > 0;
  }

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(callback);
  }

  private combinationKey(attributeValueIds: string[]): string {
    return [...attributeValueIds].sort().join("|");
  }
}

export const productVariantRepository = new ProductVariantRepository();
