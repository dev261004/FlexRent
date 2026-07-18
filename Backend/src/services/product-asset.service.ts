import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  ProductAssetRecord,
  ProductForAssetAccess,
  productAssetRepository,
} from "../repositories/product-asset.repository";
import { ProductRequester } from "../types/product.types";
import {
  CreateProductAssetInput,
  ListProductAssetsQuery,
  UpdateProductAssetInput,
} from "../validations/product-asset.validation";

type ProductAssetUniqueFields = {
  assetTag?: string;
  barcode?: string | null;
  qrCode?: string | null;
};

export class ProductAssetService {
  async createAsset(
    productId: string,
    payload: CreateProductAssetInput,
    user: ProductRequester
  ) {
    const product = await productAssetRepository.productExists(productId);
    this.assertCanWrite(product, user);
    await this.assertUniqueFields(payload);
    await this.assertVariantBelongsToProduct(payload.variantId, productId);

    const asset = await productAssetRepository.createAsset({
      productId,
      assetTag: payload.assetTag,
      barcode: payload.barcode ?? null,
      qrCode: payload.qrCode ?? null,
      variantId: payload.variantId ?? null,
      status: payload.status,
      notes: payload.notes ?? null,
    });

    return this.mapAsset(asset);
  }

  async getAssets(
    productId: string,
    query: ListProductAssetsQuery,
    user: ProductRequester
  ) {
    const product = await productAssetRepository.productExists(productId);
    this.assertCanRead(product, user);

    if (query.variantId) {
      await this.assertVariantBelongsToProduct(query.variantId, productId);
    }

    const where = this.buildListWhere(productId, query);
    const orderBy = this.buildOrderBy(query);
    const skip = (query.page - 1) * query.limit;
    const [assets, total] = await productAssetRepository.getAssets(
      where,
      orderBy,
      skip,
      query.limit
    );

    return {
      assets: assets.map((asset) => this.mapAsset(asset)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getAssetById(
    productId: string,
    assetId: string,
    user: ProductRequester
  ) {
    const product = await productAssetRepository.productExists(productId);
    this.assertCanRead(product, user);
    const asset = await productAssetRepository.getAssetById(assetId);
    this.assertAssetBelongsToProduct(asset, productId);

    return this.mapAsset(asset);
  }

  async updateAsset(
    productId: string,
    assetId: string,
    payload: UpdateProductAssetInput,
    user: ProductRequester
  ) {
    const product = await productAssetRepository.productExists(productId);
    this.assertCanWrite(product, user);
    const existingAsset = await productAssetRepository.getAssetById(assetId);
    this.assertAssetBelongsToProduct(existingAsset, productId);

    await this.assertUniqueFields(payload, assetId);
    await this.assertVariantBelongsToProduct(payload.variantId, productId);

    const asset = await productAssetRepository.updateAsset(
      assetId,
      this.buildUpdateData(payload)
    );

    return this.mapAsset(asset);
  }

  async deleteAsset(productId: string, assetId: string, user: ProductRequester) {
    const product = await productAssetRepository.productExists(productId);
    this.assertCanWrite(product, user);
    const existingAsset = await productAssetRepository.getAssetById(assetId);
    this.assertAssetBelongsToProduct(existingAsset, productId);

    const deletedAsset = await productAssetRepository.deleteAsset(assetId);
    return this.mapAsset(deletedAsset);
  }

  private buildListWhere(
    productId: string,
    query: ListProductAssetsQuery
  ): Prisma.ProductAssetWhereInput {
    return {
      productId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.variantId ? { variantId: query.variantId } : {}),
      ...(query.search
        ? {
            OR: [
              { assetTag: { contains: query.search, mode: "insensitive" } },
              { barcode: { contains: query.search, mode: "insensitive" } },
              { qrCode: { contains: query.search, mode: "insensitive" } },
              { notes: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(
    query: ListProductAssetsQuery
  ): Prisma.ProductAssetOrderByWithRelationInput[] {
    return [
      {
        [query.sortBy]: query.sortOrder,
      } as Prisma.ProductAssetOrderByWithRelationInput,
      { id: "asc" },
    ];
  }

  private async assertUniqueFields(
    payload: ProductAssetUniqueFields,
    excludeAssetId?: string
  ): Promise<void> {
    if (payload.assetTag) {
      const asset = await productAssetRepository.assetTagExists(
        payload.assetTag,
        excludeAssetId
      );

      if (asset) {
        throw new AppError(409, "Asset tag already exists", {
          assetTag: "Asset tag already exists",
        });
      }
    }

    if (payload.barcode) {
      const asset = await productAssetRepository.barcodeExists(
        payload.barcode,
        excludeAssetId
      );

      if (asset) {
        throw new AppError(409, "Barcode already exists", {
          barcode: "Barcode already exists",
        });
      }
    }

    if (payload.qrCode) {
      const asset = await productAssetRepository.qrCodeExists(
        payload.qrCode,
        excludeAssetId
      );

      if (asset) {
        throw new AppError(409, "QR code already exists", {
          qrCode: "QR code already exists",
        });
      }
    }
  }

  private async assertVariantBelongsToProduct(
    variantId: string | null | undefined,
    productId: string
  ): Promise<void> {
    if (!variantId) {
      return;
    }

    const variant = await productAssetRepository.variantExists(variantId);

    if (!variant || variant.productId !== productId) {
      throw new AppError(400, "Variant does not belong to this product", {
        variantId: "Select a valid variant for this product",
      });
    }
  }

  private assertCanRead(
    product: ProductForAssetAccess | null,
    user: ProductRequester
  ): asserts product is ProductForAssetAccess {
    if (!product) {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "VENDOR" && !this.isVendorOwner(product, user.id)) {
      throw new AppError(403, "Vendors can only access their own product assets");
    }
  }

  private assertCanWrite(
    product: ProductForAssetAccess | null,
    user: ProductRequester
  ): asserts product is ProductForAssetAccess {
    if (!product) {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "CUSTOMER") {
      throw new AppError(403, "Customers can only view product assets");
    }

    if (user.role === "VENDOR" && !this.isVendorOwner(product, user.id)) {
      throw new AppError(403, "Vendors can only manage their own product assets");
    }
  }

  private isVendorOwner(product: ProductForAssetAccess, userId: string): boolean {
    return product.vendorId === userId || product.createdById === userId;
  }

  private assertAssetBelongsToProduct(
    asset: ProductAssetRecord | null,
    productId: string
  ): asserts asset is ProductAssetRecord {
    if (!asset || asset.productId !== productId) {
      throw new AppError(404, "Product asset not found");
    }
  }

  private buildUpdateData(
    payload: UpdateProductAssetInput
  ): Prisma.ProductAssetUncheckedUpdateInput {
    const data: Prisma.ProductAssetUncheckedUpdateInput = {};

    if (payload.assetTag !== undefined) {
      data.assetTag = payload.assetTag;
    }

    if (payload.barcode !== undefined) {
      data.barcode = payload.barcode;
    }

    if (payload.qrCode !== undefined) {
      data.qrCode = payload.qrCode;
    }

    if (payload.variantId !== undefined) {
      data.variantId = payload.variantId;
    }

    if (payload.status !== undefined) {
      data.status = payload.status;
    }

    if (payload.notes !== undefined) {
      data.notes = payload.notes;
    }

    return data;
  }

  private mapAsset(asset: ProductAssetRecord) {
    return {
      id: asset.id,
      productId: asset.productId,
      variantId: asset.variantId,
      assetTag: asset.assetTag,
      barcode: asset.barcode,
      qrCode: asset.qrCode,
      status: asset.status,
      notes: asset.notes,
      variant: asset.variant
        ? {
            id: asset.variant.id,
            sku: asset.variant.sku,
            name: asset.variant.name,
            productId: asset.variant.productId,
          }
        : null,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    };
  }
}

export const productAssetService = new ProductAssetService();
