import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma";

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

const categorySelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductCategorySelect;

export type CategoryRecord = Prisma.ProductCategoryGetPayload<{
  select: typeof categorySelect;
}>;

export class CategoryRepository {
  createCategory(
    data: Prisma.ProductCategoryUncheckedCreateInput,
    db: PrismaExecutor = prisma
  ): Promise<CategoryRecord> {
    return db.productCategory.create({
      data,
      select: categorySelect,
    });
  }

  getCategories(
    where: Prisma.ProductCategoryWhereInput,
    orderBy: Prisma.ProductCategoryOrderByWithRelationInput[],
    skip: number,
    take: number
  ): Promise<[CategoryRecord[], number]> {
    return prisma.$transaction([
      prisma.productCategory.findMany({
        where,
        orderBy,
        skip,
        take,
        select: categorySelect,
      }),
      prisma.productCategory.count({ where }),
    ]);
  }

  getCategoryById(
    id: string,
    db: PrismaExecutor = prisma
  ): Promise<CategoryRecord | null> {
    return db.productCategory.findUnique({
      where: { id },
      select: categorySelect,
    });
  }

  updateCategory(
    id: string,
    data: Prisma.ProductCategoryUncheckedUpdateInput,
    db: PrismaExecutor = prisma
  ): Promise<CategoryRecord> {
    return db.productCategory.update({
      where: { id },
      data,
      select: categorySelect,
    });
  }

  deleteCategory(id: string, db: PrismaExecutor = prisma) {
    return db.productCategory.delete({
      where: { id },
      select: categorySelect,
    });
  }

  existsByName(
    name: string,
    excludeCategoryId?: string,
    db: PrismaExecutor = prisma
  ) {
    return db.productCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        ...(excludeCategoryId ? { id: { not: excludeCategoryId } } : {}),
      },
      select: { id: true },
    });
  }

  findBySlug(
    slug: string,
    excludeCategoryId?: string,
    db: PrismaExecutor = prisma
  ) {
    return db.productCategory.findFirst({
      where: {
        slug,
        ...(excludeCategoryId ? { id: { not: excludeCategoryId } } : {}),
      },
      select: { id: true },
    });
  }

  async hasProducts(id: string, db: PrismaExecutor = prisma): Promise<boolean> {
    const productCount = await db.product.count({
      where: { categoryId: id },
    });

    return productCount > 0;
  }

  transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(callback);
  }
}

export const categoryRepository = new CategoryRepository();
