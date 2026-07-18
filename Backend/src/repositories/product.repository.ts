import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  firstName: true,
  lastName: true,
  profileImage: true,
  companyName: true,
} satisfies Prisma.UserSelect;

export const productDetailInclude = {
  category: true,
  images: {
    orderBy: [
      { isPrimary: "desc" },
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  },
  variants: {
    orderBy: [{ createdAt: "asc" }],
    include: {
      values: {
        include: {
          attributeValue: {
            include: {
              attribute: true,
            },
          },
        },
      },
    },
  },
  rentalConfig: {
    include: {
      rentalPeriod: true,
    },
  },
  vendor: {
    select: publicUserSelect,
  },
  createdBy: {
    select: publicUserSelect,
  },
  _count: {
    select: {
      assets: true,
      variants: true,
      images: true,
    },
  },
} satisfies Prisma.ProductInclude;

const productListInclude = {
  category: true,
  images: {
    orderBy: [
      { isPrimary: "desc" },
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
    take: 1,
  },
  vendor: {
    select: publicUserSelect,
  },
  _count: {
    select: {
      assets: true,
      variants: true,
      images: true,
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductDetailRecord = Prisma.ProductGetPayload<{
  include: typeof productDetailInclude;
}>;

export type ProductListRecord = Prisma.ProductGetPayload<{
  include: typeof productListInclude;
}>;

export class ProductRepository {
  list(
    where: Prisma.ProductWhereInput,
    orderBy: Prisma.ProductOrderByWithRelationInput[],
    skip: number,
    take: number
  ): Promise<[ProductListRecord[], number]> {
    return prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: productListInclude,
      }),
      prisma.product.count({ where }),
    ]);
  }

  findById(
    id: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductDetailRecord | null> {
    return db.product.findUnique({
      where: { id },
      include: productDetailInclude,
    });
  }

  findBySlug(
    slug: string,
    excludeProductId?: string,
    db: PrismaExecutor = prisma
  ) {
    return db.product.findFirst({
      where: {
        slug,
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      },
      select: { id: true },
    });
  }

  findBySku(
    sku: string,
    excludeProductId?: string,
    db: PrismaExecutor = prisma
  ) {
    return db.product.findFirst({
      where: {
        sku,
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      },
      select: { id: true },
    });
  }

  findVendorById(id: string, db: PrismaExecutor = prisma) {
    return db.user.findFirst({
      where: {
        id,
        role: "VENDOR",
        status: "ACTIVE",
      },
      select: { id: true },
    });
  }

  findCategoryById(id: string, db: PrismaExecutor = prisma) {
    return db.productCategory.findFirst({
      where: {
        id,
        isActive: true,
      },
      select: { id: true },
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

  countAttributesByIds(ids: string[], db: PrismaExecutor = prisma) {
    return db.productAttribute.count({
      where: {
        id: { in: ids },
        isActive: true,
      },
    });
  }

  countAttributeValuesByIds(ids: string[], db: PrismaExecutor = prisma) {
    return db.productAttributeValue.count({
      where: {
        id: { in: ids },
      },
    });
  }

  countVariantsByIds(
    productId: string,
    variantIds: string[],
    db: PrismaExecutor = prisma
  ) {
    return db.productVariant.count({
      where: {
        id: { in: variantIds },
        productId,
      },
    });
  }

  createBaseProduct(
    data: Prisma.ProductUncheckedCreateInput,
    db: PrismaExecutor = prisma
  ) {
    return db.product.create({ data });
  }

  updateBaseProduct(
    id: string,
    data: Prisma.ProductUncheckedUpdateInput,
    db: PrismaExecutor = prisma
  ) {
    return db.product.update({
      where: { id },
      data,
    });
  }

  archiveProduct(id: string, db: PrismaExecutor = prisma) {
    return db.product.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: productDetailInclude,
    });
  }

  async replaceImages(
    productId: string,
    images: Array<Omit<Prisma.ProductImageCreateManyInput, "productId">>,
    db: PrismaExecutor = prisma
  ): Promise<void> {
    await db.productImage.deleteMany({ where: { productId } });

    if (images.length > 0) {
      await db.productImage.createMany({
        data: images.map((image) => ({ ...image, productId })),
      });
    }
  }

  async replaceAssets(
    productId: string,
    assets: Array<Omit<Prisma.ProductAssetCreateManyInput, "productId">>,
    db: PrismaExecutor = prisma
  ): Promise<void> {
    await db.productAsset.deleteMany({ where: { productId } });

    if (assets.length > 0) {
      await db.productAsset.createMany({
        data: assets.map((asset) => ({ ...asset, productId })),
      });
    }
  }

  async replaceAttributeLinks(
    productId: string,
    attributeIds: string[],
    db: PrismaExecutor = prisma
  ): Promise<void> {
    await db.productAttributeOnProduct.deleteMany({ where: { productId } });

    if (attributeIds.length > 0) {
      await db.productAttributeOnProduct.createMany({
        data: attributeIds.map((attributeId, index) => ({
          productId,
          attributeId,
          sortOrder: index,
        })),
      });
    }
  }

  async replaceVariants(
    productId: string,
    variants: Array<
      Omit<Prisma.ProductVariantUncheckedCreateInput, "productId"> & {
        attributeValueIds?: string[];
      }
    >,
    db: PrismaExecutor = prisma
  ): Promise<void> {
    await db.productVariant.deleteMany({ where: { productId } });

    for (const variant of variants) {
      const { attributeValueIds, ...variantData } = variant;
      const createdVariant = await db.productVariant.create({
        data: {
          ...variantData,
          productId,
        },
        select: { id: true },
      });

      const uniqueAttributeValueIds = [...new Set(attributeValueIds ?? [])];

      if (uniqueAttributeValueIds.length > 0) {
        await db.productVariantValue.createMany({
          data: uniqueAttributeValueIds.map((attributeValueId) => ({
            variantId: createdVariant.id,
            attributeValueId,
          })),
        });
      }
    }
  }

  async createRentalConfig(
    data: Prisma.ProductRentalConfigUncheckedCreateInput,
    db: PrismaExecutor = prisma
  ): Promise<void> {
    await db.productRentalConfig.create({ data });
  }

  async upsertRentalConfig(
    productId: string,
    data: Omit<Prisma.ProductRentalConfigUncheckedCreateInput, "productId">,
    db: PrismaExecutor = prisma
  ): Promise<void> {
    await db.productRentalConfig.upsert({
      where: { productId },
      create: {
        ...data,
        productId,
      },
      update: data,
    });
  }

  async deleteRentalConfig(
    productId: string,
    db: PrismaExecutor = prisma
  ): Promise<void> {
    await db.productRentalConfig.deleteMany({ where: { productId } });
  }

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(callback);
  }
}

export const productRepository = new ProductRepository();
