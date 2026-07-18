import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  CategoryRecord,
  categoryRepository,
} from "../repositories/category.repository";
import {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from "../validations/category.validation";

const titleCase = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const slugify = (value: string): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 170);

  return slug || "category";
};

export class CategoryService {
  async createCategory(payload: CreateCategoryInput) {
    const name = titleCase(payload.name);
    await this.assertCategoryNameIsUnique(name);
    const slug = await this.resolveSlug(name);

    const category = await categoryRepository.createCategory({
      name,
      slug,
      description: payload.description ?? null,
      isActive: true,
    });

    return this.mapCategory(category);
  }

  async getCategories(query: ListCategoriesQuery) {
    const where = this.buildListWhere(query);
    const orderBy = this.buildOrderBy(query);
    const skip = (query.page - 1) * query.limit;
    const [categories, total] = await categoryRepository.getCategories(
      where,
      orderBy,
      skip,
      query.limit
    );

    return {
      categories: categories.map((category) => this.mapCategory(category)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getCategoryById(id: string) {
    const category = await categoryRepository.getCategoryById(id);
    this.assertCategoryExists(category);

    return this.mapCategory(category);
  }

  async updateCategory(id: string, payload: UpdateCategoryInput) {
    const existingCategory = await categoryRepository.getCategoryById(id);
    this.assertCategoryExists(existingCategory);

    const data: Prisma.ProductCategoryUncheckedUpdateInput = {};

    if (payload.name !== undefined) {
      const name = titleCase(payload.name);
      await this.assertCategoryNameIsUnique(name, id);
      data.name = name;
      data.slug = await this.resolveSlug(name, id);
    }

    if (payload.description !== undefined) {
      data.description = payload.description;
    }

    const category = await categoryRepository.updateCategory(id, data);
    return this.mapCategory(category);
  }

  async deleteCategory(id: string) {
    const category = await categoryRepository.getCategoryById(id);
    this.assertCategoryExists(category);

    const hasProducts = await categoryRepository.hasProducts(id);

    if (hasProducts) {
      throw new AppError(
        409,
        "Category cannot be deleted because it is assigned to existing products."
      );
    }

    const deletedCategory = await categoryRepository.deleteCategory(id);
    return this.mapCategory(deletedCategory);
  }

  private buildListWhere(
    query: ListCategoriesQuery
  ): Prisma.ProductCategoryWhereInput {
    return {
      ...(query.search
        ? {
            name: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };
  }

  private buildOrderBy(
    query: ListCategoriesQuery
  ): Prisma.ProductCategoryOrderByWithRelationInput[] {
    return [
      {
        [query.sortBy]: query.sortOrder,
      } as Prisma.ProductCategoryOrderByWithRelationInput,
      { id: "asc" },
    ];
  }

  private async assertCategoryNameIsUnique(
    name: string,
    excludeCategoryId?: string
  ): Promise<void> {
    const existingCategory = await categoryRepository.existsByName(
      name,
      excludeCategoryId
    );

    if (existingCategory) {
      throw new AppError(409, "Category name already exists", {
        name: "Category name already exists",
      });
    }
  }

  private async resolveSlug(
    name: string,
    excludeCategoryId?: string
  ): Promise<string> {
    const baseSlug = slugify(name);
    let candidate = baseSlug;
    let suffix = 2;

    while (await categoryRepository.findBySlug(candidate, excludeCategoryId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private assertCategoryExists(
    category: CategoryRecord | null
  ): asserts category is CategoryRecord {
    if (!category) {
      throw new AppError(404, "Category not found");
    }
  }

  private mapCategory(category: CategoryRecord) {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}

export const categoryService = new CategoryService();
