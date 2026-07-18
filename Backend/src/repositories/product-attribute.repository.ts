import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const productAttributeSelect = {
  id: true,
  name: true,
  slug: true,
  displayType: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      values: true,
      products: true,
    },
  },
} satisfies Prisma.ProductAttributeSelect;

export type ProductAttributeRecord = Prisma.ProductAttributeGetPayload<{
  select: typeof productAttributeSelect;
}>;

export class ProductAttributeRepository {
  createAttribute(
    data: Prisma.ProductAttributeUncheckedCreateInput,
    db: PrismaExecutor = prisma
  ): Promise<ProductAttributeRecord> {
    return db.productAttribute.create({
      data,
      select: productAttributeSelect,
    });
  }

  getAttributes(
    where: Prisma.ProductAttributeWhereInput,
    orderBy: Prisma.ProductAttributeOrderByWithRelationInput[],
    skip: number,
    take: number
  ): Promise<[ProductAttributeRecord[], number]> {
    return prisma.$transaction([
      prisma.productAttribute.findMany({
        where,
        orderBy,
        skip,
        take,
        select: productAttributeSelect,
      }),
      prisma.productAttribute.count({ where }),
    ]);
  }

  getAttributeById(
    id: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductAttributeRecord | null> {
    return db.productAttribute.findUnique({
      where: { id },
      select: productAttributeSelect,
    });
  }

  updateAttribute(
    id: string,
    data: Prisma.ProductAttributeUncheckedUpdateInput,
    db: PrismaExecutor = prisma
  ): Promise<ProductAttributeRecord> {
    return db.productAttribute.update({
      where: { id },
      data,
      select: productAttributeSelect,
    });
  }

  deleteAttribute(
    id: string,
    db: PrismaExecutor = prisma
  ): Promise<ProductAttributeRecord> {
    return db.productAttribute.delete({
      where: { id },
      select: productAttributeSelect,
    });
  }

  existsByName(
    name: string,
    excludeAttributeId?: string,
    db: PrismaExecutor = prisma
  ) {
    return db.productAttribute.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        ...(excludeAttributeId ? { id: { not: excludeAttributeId } } : {}),
      },
      select: { id: true },
    });
  }

  findBySlug(
    slug: string,
    excludeAttributeId?: string,
    db: PrismaExecutor = prisma
  ) {
    return db.productAttribute.findFirst({
      where: {
        slug,
        ...(excludeAttributeId ? { id: { not: excludeAttributeId } } : {}),
      },
      select: { id: true },
    });
  }

  async isUsed(id: string, db: PrismaExecutor = prisma): Promise<boolean> {
    const [productLinks, variantLinks] = await Promise.all([
      db.productAttributeOnProduct.count({
        where: { attributeId: id },
      }),
      db.productVariantValue.count({
        where: {
          attributeValue: {
            attributeId: id,
          },
        },
      }),
    ]);

    return productLinks > 0 || variantLinks > 0;
  }
}

export const productAttributeRepository = new ProductAttributeRepository();
