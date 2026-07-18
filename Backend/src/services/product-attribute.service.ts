import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  ProductAttributeRecord,
  productAttributeRepository,
} from "../repositories/product-attribute.repository";
import {
  CreateProductAttributeInput,
  ListProductAttributesQuery,
  UpdateProductAttributeInput,
} from "../validations/product-attribute.validation";

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

  return slug || "attribute";
};

export class ProductAttributeService {
  async createAttribute(payload: CreateProductAttributeInput) {
    const name = titleCase(payload.name);
    await this.assertAttributeNameIsUnique(name);
    const slug = await this.resolveSlug(name);

    const attribute = await productAttributeRepository.createAttribute({
      name,
      slug,
      displayType: payload.displayType,
      isActive: payload.isActive ?? true,
    });

    return this.mapAttribute(attribute);
  }

  async getAttributes(query: ListProductAttributesQuery) {
    const where = this.buildListWhere(query);
    const orderBy = this.buildOrderBy(query);
    const skip = (query.page - 1) * query.limit;
    const [attributes, total] =
      await productAttributeRepository.getAttributes(
        where,
        orderBy,
        skip,
        query.limit
      );

    return {
      attributes: attributes.map((attribute) => this.mapAttribute(attribute)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getAttributeById(id: string) {
    const attribute = await productAttributeRepository.getAttributeById(id);
    this.assertAttributeExists(attribute);

    return this.mapAttribute(attribute);
  }

  async updateAttribute(id: string, payload: UpdateProductAttributeInput) {
    const existingAttribute = await productAttributeRepository.getAttributeById(
      id
    );
    this.assertAttributeExists(existingAttribute);

    const data: Prisma.ProductAttributeUncheckedUpdateInput = {};

    if (payload.name !== undefined) {
      const name = titleCase(payload.name);
      await this.assertAttributeNameIsUnique(name, id);
      data.name = name;
      data.slug = await this.resolveSlug(name, id);
    }

    if (payload.displayType !== undefined) {
      data.displayType = payload.displayType;
    }

    if (payload.isActive !== undefined) {
      data.isActive = payload.isActive;
    }

    const attribute = await productAttributeRepository.updateAttribute(id, data);
    return this.mapAttribute(attribute);
  }

  async deleteAttribute(id: string) {
    const attribute = await productAttributeRepository.getAttributeById(id);
    this.assertAttributeExists(attribute);

    const isUsed = await productAttributeRepository.isUsed(id);

    if (isUsed) {
      throw new AppError(
        409,
        "Attribute cannot be deleted because it is linked with products or variants."
      );
    }

    const deletedAttribute = await productAttributeRepository.deleteAttribute(id);
    return this.mapAttribute(deletedAttribute);
  }

  private buildListWhere(
    query: ListProductAttributesQuery
  ): Prisma.ProductAttributeWhereInput {
    return {
      ...(query.search
        ? {
            name: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };
  }

  private buildOrderBy(
    query: ListProductAttributesQuery
  ): Prisma.ProductAttributeOrderByWithRelationInput[] {
    return [
      {
        [query.sortBy]: query.sortOrder,
      } as Prisma.ProductAttributeOrderByWithRelationInput,
      { id: "asc" },
    ];
  }

  private async assertAttributeNameIsUnique(
    name: string,
    excludeAttributeId?: string
  ): Promise<void> {
    const existingAttribute = await productAttributeRepository.existsByName(
      name,
      excludeAttributeId
    );

    if (existingAttribute) {
      throw new AppError(409, "Attribute name already exists", {
        name: "Attribute name already exists",
      });
    }
  }

  private async resolveSlug(
    name: string,
    excludeAttributeId?: string
  ): Promise<string> {
    const baseSlug = slugify(name);
    let candidate = baseSlug;
    let suffix = 2;

    while (
      await productAttributeRepository.findBySlug(candidate, excludeAttributeId)
    ) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private assertAttributeExists(
    attribute: ProductAttributeRecord | null
  ): asserts attribute is ProductAttributeRecord {
    if (!attribute) {
      throw new AppError(404, "Product attribute not found");
    }
  }

  private mapAttribute(attribute: ProductAttributeRecord) {
    return {
      id: attribute.id,
      name: attribute.name,
      slug: attribute.slug,
      displayType: attribute.displayType,
      isActive: attribute.isActive,
      valueCount: attribute._count.values,
      productCount: attribute._count.products,
      createdAt: attribute.createdAt.toISOString(),
      updatedAt: attribute.updatedAt.toISOString(),
    };
  }
}

export const productAttributeService = new ProductAttributeService();
