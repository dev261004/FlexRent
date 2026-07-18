import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const ruleInclude = {
  priceList: {
    select: {
      id: true,
      name: true,
      isDefault: true,
      isActive: true,
    },
  },
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
      vendorId: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.PriceListRuleInclude;

export type PriceListRuleRecord = Prisma.PriceListRuleGetPayload<{
  include: typeof ruleInclude;
}>;

export class PriceListRuleRepository {
  createRule(
    data: Prisma.PriceListRuleUncheckedCreateInput,
    db: PrismaExecutor = prisma
  ): Promise<PriceListRuleRecord> {
    return db.priceListRule.create({
      data,
      include: ruleInclude,
    });
  }

  getRules(
    where: Prisma.PriceListRuleWhereInput,
    skip: number,
    take: number
  ): Promise<[PriceListRuleRecord[], number]> {
    return prisma.$transaction([
      prisma.priceListRule.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take,
        include: ruleInclude,
      }),
      prisma.priceListRule.count({ where }),
    ]);
  }

  getRule(id: string, db: PrismaExecutor = prisma): Promise<PriceListRuleRecord | null> {
    return db.priceListRule.findUnique({
      where: { id },
      include: ruleInclude,
    });
  }

  updateRule(
    id: string,
    data: Prisma.PriceListRuleUncheckedUpdateInput,
    db: PrismaExecutor = prisma
  ): Promise<PriceListRuleRecord> {
    return db.priceListRule.update({
      where: { id },
      data,
      include: ruleInclude,
    });
  }

  deleteRule(id: string, db: PrismaExecutor = prisma) {
    return db.priceListRule.delete({
      where: { id },
      include: ruleInclude,
    });
  }

  priceListExists(id: string, db: PrismaExecutor = prisma) {
    return db.priceList.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  productExists(id: string, db: PrismaExecutor = prisma) {
    return db.product.findUnique({
      where: { id },
      select: { id: true, vendorId: true },
    });
  }

  categoryExists(id: string, db: PrismaExecutor = prisma) {
    return db.productCategory.findUnique({
      where: { id },
      select: { id: true },
    });
  }
}

export const priceListRuleRepository = new PriceListRuleRepository();
