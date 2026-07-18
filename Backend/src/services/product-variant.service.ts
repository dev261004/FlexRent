import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  ProductForVariantAccess,
  ProductVariantRecord,
  productVariantRepository,
} from "../repositories/product-variant.repository";
import { ProductRequester } from "../types/product.types";
import {
  CreateProductVariantInput,
  ListProductVariantsQuery,
  UpdateProductVariantInput,
} from "../validations/product-variant.validation";

const decimalToString = (
  value: Prisma.Decimal | number | string | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toString();
};

export class ProductVariantService {
  async createVariant(
    productId: string,
    payload: CreateProductVariantInput,
    user: ProductRequester
  ) {
    const product = await productVariantRepository.productExists(productId);
    this.assertCanWrite(product, user);
    await this.assertSkuIsUnique(payload.sku);
    await this.assertAttributeValuesAreValid(productId, payload.attributeValueIds);
    await this.assertVariantCombinationIsUnique(
      productId,
      payload.attributeValueIds
    );

    const variant = await productVariantRepository.transaction((tx) =>
      productVariantRepository.createVariant(
        {
          productId,
          name: payload.name ?? null,
          sku: payload.sku ?? null,
          salesPrice: payload.salesPrice ?? null,
          costPrice: payload.costPrice ?? null,
          quantityOnHand: payload.quantityOnHand ?? 0,
          isActive: payload.isActive ?? true,
        },
        payload.attributeValueIds,
        tx
      )
    );

    return this.mapVariant(variant);
  }

  async getVariants(
    productId: string,
    query: ListProductVariantsQuery,
    user: ProductRequester
  ) {
    const product = await productVariantRepository.productExists(productId);
    this.assertCanRead(product, user);

    const where = this.buildListWhere(productId, query);
    const orderBy = this.buildOrderBy(query);
    const skip = (query.page - 1) * query.limit;
    const [variants, total] = await productVariantRepository.getVariants(
      where,
      orderBy,
      skip,
      query.limit
    );

    return {
      variants: variants.map((variant) => this.mapVariant(variant)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getVariantById(
    productId: string,
    variantId: string,
    user: ProductRequester
  ) {
    const product = await productVariantRepository.productExists(productId);
    this.assertCanRead(product, user);
    const variant = await productVariantRepository.getVariant(variantId);
    this.assertVariantBelongsToProduct(variant, productId);

    return this.mapVariant(variant);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    payload: UpdateProductVariantInput,
    user: ProductRequester
  ) {
    const product = await productVariantRepository.productExists(productId);
    this.assertCanWrite(product, user);
    const existingVariant = await productVariantRepository.getVariant(variantId);
    this.assertVariantBelongsToProduct(existingVariant, productId);

    await this.assertSkuIsUnique(payload.sku, variantId);

    if (payload.attributeValueIds !== undefined) {
      await this.assertAttributeValuesAreValid(productId, payload.attributeValueIds);
      await this.assertVariantCombinationIsUnique(
        productId,
        payload.attributeValueIds,
        variantId
      );
    }

    const variant = await productVariantRepository.transaction((tx) =>
      productVariantRepository.updateVariant(
        variantId,
        this.buildUpdateData(payload),
        payload.attributeValueIds,
        tx
      )
    );

    return this.mapVariant(variant);
  }

  async deleteVariant(
    productId: string,
    variantId: string,
    user: ProductRequester
  ) {
    const product = await productVariantRepository.productExists(productId);
    this.assertCanWrite(product, user);
    const existingVariant = await productVariantRepository.getVariant(variantId);
    this.assertVariantBelongsToProduct(existingVariant, productId);

    const variantInUse = await productVariantRepository.variantInUse(variantId);
    if (variantInUse) {
      throw new AppError(
        409,
        "Variant cannot be deleted because product assets reference it."
      );
    }

    const deletedVariant = await productVariantRepository.deleteVariant(variantId);
    return this.mapVariant(deletedVariant);
  }

  private buildListWhere(
    productId: string,
    query: ListProductVariantsQuery
  ): Prisma.ProductVariantWhereInput {
    return {
      productId,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { sku: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(
    query: ListProductVariantsQuery
  ): Prisma.ProductVariantOrderByWithRelationInput[] {
    return [
      {
        [query.sortBy]: query.sortOrder,
      } as Prisma.ProductVariantOrderByWithRelationInput,
      { id: "asc" },
    ];
  }

  private async assertSkuIsUnique(
    sku?: string | null,
    excludeVariantId?: string
  ): Promise<void> {
    if (!sku) {
      return;
    }

    const existingVariant = await productVariantRepository.skuExists(
      sku,
      excludeVariantId
    );

    if (existingVariant) {
      throw new AppError(409, "Variant SKU already exists", {
        sku: "Variant SKU already exists",
      });
    }
  }

  private async assertAttributeValuesAreValid(
    productId: string,
    attributeValueIds: string[]
  ): Promise<void> {
    const attributeValues = await productVariantRepository.findAttributeValues(
      attributeValueIds
    );

    if (attributeValues.length !== attributeValueIds.length) {
      throw new AppError(400, "One or more attribute values are invalid", {
        attributeValueIds: "Select valid attribute values",
      });
    }

    const attributeIds = attributeValues.map((value) => value.attributeId);
    if (new Set(attributeIds).size !== attributeIds.length) {
      throw new AppError(
        400,
        "Only one value is allowed for each attribute in a variant",
        {
          attributeValueIds:
            "Choose only one value per attribute for this variant",
        }
      );
    }

    const invalidValue = attributeValues.find(
      (value) =>
        !value.attribute.products.some((link) => link.productId === productId)
    );

    if (invalidValue) {
      throw new AppError(
        400,
        "Attribute values must belong to attributes enabled for this product",
        {
          attributeValueIds:
            "Select values from attributes linked with this product",
        }
      );
    }
  }

  private async assertVariantCombinationIsUnique(
    productId: string,
    attributeValueIds: string[],
    excludeVariantId?: string
  ): Promise<void> {
    const exists = await productVariantRepository.variantCombinationExists(
      productId,
      attributeValueIds,
      excludeVariantId
    );

    if (exists) {
      throw new AppError(409, "Variant combination already exists", {
        attributeValueIds: "Variant combination already exists",
      });
    }
  }

  private assertCanRead(
    product: ProductForVariantAccess | null,
    user: ProductRequester
  ): asserts product is ProductForVariantAccess {
    if (!product) {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "VENDOR" && !this.isVendorOwner(product, user.id)) {
      throw new AppError(403, "Vendors can only access their own variants");
    }
  }

  private assertCanWrite(
    product: ProductForVariantAccess | null,
    user: ProductRequester
  ): asserts product is ProductForVariantAccess {
    if (!product) {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "CUSTOMER") {
      throw new AppError(403, "Customers can only view product variants");
    }

    if (user.role === "VENDOR" && !this.isVendorOwner(product, user.id)) {
      throw new AppError(403, "Vendors can only manage their own variants");
    }
  }

  private isVendorOwner(
    product: ProductForVariantAccess,
    userId: string
  ): boolean {
    return product.vendorId === userId || product.createdById === userId;
  }

  private assertVariantBelongsToProduct(
    variant: ProductVariantRecord | null,
    productId: string
  ): asserts variant is ProductVariantRecord {
    if (!variant || variant.productId !== productId) {
      throw new AppError(404, "Product variant not found");
    }
  }

  private buildUpdateData(
    payload: UpdateProductVariantInput
  ): Prisma.ProductVariantUncheckedUpdateInput {
    const data: Prisma.ProductVariantUncheckedUpdateInput = {};

    if (payload.name !== undefined) {
      data.name = payload.name;
    }

    if (payload.sku !== undefined) {
      data.sku = payload.sku;
    }

    if (payload.salesPrice !== undefined) {
      data.salesPrice = payload.salesPrice;
    }

    if (payload.costPrice !== undefined) {
      data.costPrice = payload.costPrice;
    }

    if (payload.quantityOnHand !== undefined) {
      data.quantityOnHand = payload.quantityOnHand;
    }

    if (payload.isActive !== undefined) {
      data.isActive = payload.isActive;
    }

    return data;
  }

  private mapVariant(variant: ProductVariantRecord) {
    return {
      id: variant.id,
      productId: variant.productId,
      name: variant.name,
      sku: variant.sku,
      salesPrice: decimalToString(variant.salesPrice),
      costPrice: decimalToString(variant.costPrice),
      quantityOnHand: variant.quantityOnHand,
      isActive: variant.isActive,
      assetCount: variant._count.assets,
      values: variant.values.map((value) => ({
        id: value.id,
        attributeValueId: value.attributeValueId,
        value: value.attributeValue.value,
        slug: value.attributeValue.slug,
        colorHex: value.attributeValue.colorHex,
        imageUrl: value.attributeValue.imageUrl,
        attribute: {
          id: value.attributeValue.attribute.id,
          name: value.attributeValue.attribute.name,
          slug: value.attributeValue.attribute.slug,
          displayType: value.attributeValue.attribute.displayType,
        },
      })),
      createdAt: variant.createdAt.toISOString(),
      updatedAt: variant.updatedAt.toISOString(),
    };
  }
}

export const productVariantService = new ProductVariantService();
