import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const priceListSelect = {
  id: true,
  name: true,
  description: true,
  isDefault: true,
  isActive: true,
  validFrom: true,
  validTo: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      rules: true,
    },
  },
} satisfies Prisma.PriceListSelect;

export type PriceListRecord = Prisma.PriceListGetPayload<{
  select: typeof priceListSelect;
}>;

export class PriceListRepository {
  createPriceList(
    data: Prisma.PriceListUncheckedCreateInput,
    db: PrismaExecutor = prisma
  ): Promise<PriceListRecord> {
    return db.priceList.create({
      data,
      select: priceListSelect,
    });
  }

  getPriceLists(
    where: Prisma.PriceListWhereInput,
    orderBy: Prisma.PriceListOrderByWithRelationInput[],
    skip: number,
    take: number
  ): Promise<[PriceListRecord[], number]> {
    return prisma.$transaction([
      prisma.priceList.findMany({
        where,
        orderBy,
        skip,
        take,
        select: priceListSelect,
      }),
      prisma.priceList.count({ where }),
    ]);
  }

  getPriceList(
    id: string,
    db: PrismaExecutor = prisma
  ): Promise<PriceListRecord | null> {
    return db.priceList.findUnique({
      where: { id },
      select: priceListSelect,
    });
  }

  updatePriceList(
    id: string,
    data: Prisma.PriceListUncheckedUpdateInput,
    db: PrismaExecutor = prisma
  ): Promise<PriceListRecord> {
    return db.priceList.update({
      where: { id },
      data,
      select: priceListSelect,
    });
  }

  deletePriceList(id: string, db: PrismaExecutor = prisma) {
    return db.priceList.delete({
      where: { id },
      select: priceListSelect,
    });
  }

  existsByName(name: string, excludePriceListId?: string, db: PrismaExecutor = prisma) {
    return db.priceList.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        ...(excludePriceListId ? { id: { not: excludePriceListId } } : {}),
      },
      select: { id: true },
    });
  }

  defaultPriceList(excludePriceListId?: string, db: PrismaExecutor = prisma) {
    return db.priceList.findFirst({
      where: {
        isDefault: true,
        ...(excludePriceListId ? { id: { not: excludePriceListId } } : {}),
      },
      select: { id: true },
    });
  }

  clearDefault(excludePriceListId?: string, db: PrismaExecutor = prisma) {
    return db.priceList.updateMany({
      where: {
        isDefault: true,
        ...(excludePriceListId ? { id: { not: excludePriceListId } } : {}),
      },
      data: {
        isDefault: false,
      },
    });
  }

  async hasRules(id: string, db: PrismaExecutor = prisma): Promise<boolean> {
    const ruleCount = await db.priceListRule.count({
      where: { priceListId: id },
    });

    return ruleCount > 0;
  }

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(callback);
  }
}

export const priceListRepository = new PriceListRepository();
