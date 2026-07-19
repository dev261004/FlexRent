import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  ProductDetailRecord,
  ProductListRecord,
  productRepository,
} from "../repositories/product.repository";
import {
  CreateProductInput,
  ListProductsQuery,
  PaginatedProducts,
  ProductRequester,
  UpdateProductInput,
} from "../types/product.types";

type ProductUserRecord = NonNullable<ProductDetailRecord["vendor"]>;
type ProductCategoryRecord = NonNullable<ProductDetailRecord["category"]>;
type ProductImageRecord = ProductDetailRecord["images"][number];
type ProductVariantRecord = ProductDetailRecord["variants"][number];
type ProductRentalConfigRecord = NonNullable<ProductDetailRecord["rentalConfig"]>;
type ProductNestedPayload = {
  images?: CreateProductInput["images"];
  assets?: CreateProductInput["assets"];
  attributeIds?: string[];
  variants?: CreateProductInput["variants"];
  rentalConfig?: CreateProductInput["rentalConfig"] | null;
};

const uniqueStrings = (values: string[]): string[] => [...new Set(values)];

const decimalToString = (
  value: Prisma.Decimal | number | string | null | undefined
): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  return value.toString();
};

const slugify = (value: string): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 170);

  return slug || "product";
};

export class ProductService {
  async listProducts(
    query: ListProductsQuery,
    user: ProductRequester
  ): Promise<PaginatedProducts<ReturnType<typeof this.mapProductSummary>>> {
    const where = this.buildListWhere(query, user);
    const orderBy = this.buildOrderBy(query);
    const skip = (query.page - 1) * query.limit;

    const [products, total] = await productRepository.list(
      where,
      orderBy,
      skip,
      query.limit
    );

    return {
      products: products.map((product) => this.mapProductSummary(product)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getProductById(id: string, user: ProductRequester) {
    const product = await productRepository.findById(id);
    this.assertReadable(product, user);

    return this.mapProductDetail(product);
  }

  async createProduct(payload: CreateProductInput, user: ProductRequester) {
    this.assertCanCreate(user);
    this.assertCreateAssetsDoNotReferenceVariants(payload.assets ?? []);
    this.assertNoDuplicateProductChildren(payload);

    const vendorId = await this.resolveVendorIdForCreate(payload, user);
    const slug = await this.resolveSlug(payload.slug, payload.name);

    await this.assertSkuIsUnique(payload.sku);
    await this.assertCategoryExists(payload.categoryId);
    await this.assertRentalConfigIsValid(payload.rentalConfig);
    await this.assertAttributeIdsExist(payload.attributeIds);
    await this.assertVariantAttributeValueIdsExist(payload.variants);

    return productRepository.transaction(async (tx) => {
      const product = await productRepository.createBaseProduct(
        {
          name: payload.name,
          slug,
          sku: payload.sku ?? null,
          description: payload.description ?? null,
          type: payload.type ?? "GOODS",
          status: payload.status ?? "DRAFT",
          quantityOnHand: payload.quantityOnHand ?? 0,
          salesPrice: payload.salesPrice,
          costPrice: payload.costPrice ?? null,
          categoryId: payload.categoryId ?? null,
          createdById: user.id,
          vendorId,
        },
        tx
      );

      await this.replaceNestedProductData(product.id, payload, tx);

      const createdProduct = await productRepository.findById(product.id, tx);
      if (!createdProduct) {
        throw new AppError(500, "Product was created but could not be loaded");
      }

      return this.mapProductDetail(createdProduct);
    });
  }

  async updateProduct(
    id: string,
    payload: UpdateProductInput,
    user: ProductRequester
  ) {
    this.assertCanWrite(user);
    const existingProduct = await productRepository.findById(id);
    this.assertWritable(existingProduct, user);
    this.assertNoDuplicateProductChildren(payload);

    if (payload.assets !== undefined) {
      await this.assertAssetsAreValidForUpdate(
        id,
        payload.assets,
        payload.variants !== undefined
      );
    }

    await this.assertSkuIsUnique(payload.sku, id);
    await this.assertCategoryExists(payload.categoryId);
    await this.assertVendorChangeIsValid(payload, user);
    await this.assertRentalConfigIsValid(payload.rentalConfig);
    await this.assertAttributeIdsExist(payload.attributeIds);
    await this.assertVariantAttributeValueIdsExist(payload.variants);

    const updateData = await this.buildUpdateData(payload, existingProduct, user);

    return productRepository.transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await productRepository.updateBaseProduct(id, updateData, tx);
      }

      await this.replaceNestedProductData(id, payload, tx);

      const updatedProduct = await productRepository.findById(id, tx);
      if (!updatedProduct) {
        throw new AppError(404, "Product not found");
      }

      return this.mapProductDetail(updatedProduct);
    });
  }

  async deleteProduct(id: string, user: ProductRequester) {
    this.assertCanWrite(user);
    const product = await productRepository.findById(id);
    this.assertWritable(product, user);

    const archivedProduct = await productRepository.archiveProduct(id);
    return this.mapProductDetail(archivedProduct);
  }

  private buildListWhere(
    query: ListProductsQuery,
    user: ProductRequester
  ): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        {
          category: {
            name: { contains: query.search, mode: "insensitive" },
          },
        },
        {
          vendor: {
            companyName: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.salesPrice = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    if (user.role === "VENDOR") {
      if (query.vendorId && query.vendorId !== user.id) {
        throw new AppError(403, "Vendors can only access their own products");
      }

      where.vendorId = user.id;
    }

    if (user.role === "CUSTOMER") {
      where.status = "ACTIVE";
      where.quantityOnHand = { gt: 0 };
    }

    return where;
  }

  private buildOrderBy(
    query: ListProductsQuery
  ): Prisma.ProductOrderByWithRelationInput[] {
    return [
      { [query.sortBy]: query.order } as Prisma.ProductOrderByWithRelationInput,
      { id: "asc" },
    ];
  }

  private assertReadable(
    product: ProductDetailRecord | null,
    user: ProductRequester
  ): asserts product is ProductDetailRecord {
    if (!product) {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "CUSTOMER" && product.status !== "ACTIVE") {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "CUSTOMER" && product.quantityOnHand <= 0) {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "VENDOR" && !this.isVendorOwner(product, user.id)) {
      throw new AppError(403, "Vendors can only access their own products");
    }
  }

  private assertWritable(
    product: ProductDetailRecord | null,
    user: ProductRequester
  ): asserts product is ProductDetailRecord {
    if (!product) {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "VENDOR" && !this.isVendorOwner(product, user.id)) {
      throw new AppError(403, "Vendors can only update their own products");
    }
  }

  private assertCanCreate(user: ProductRequester): void {
    if (!["ADMIN", "VENDOR"].includes(user.role)) {
      throw new AppError(403, "Only admins and vendors can create products");
    }
  }

  private assertCanWrite(user: ProductRequester): void {
    if (!["ADMIN", "VENDOR"].includes(user.role)) {
      throw new AppError(403, "Only admins and vendors can modify products");
    }
  }

  private isVendorOwner(product: ProductDetailRecord, userId: string): boolean {
    return product.vendorId === userId || product.createdById === userId;
  }

  private async resolveVendorIdForCreate(
    payload: CreateProductInput,
    user: ProductRequester
  ): Promise<string | null> {
    if (user.role === "VENDOR") {
      if (payload.vendorId && payload.vendorId !== user.id) {
        throw new AppError(403, "Vendors cannot assign products to other vendors");
      }

      return user.id;
    }

    if (!payload.vendorId) {
      return null;
    }

    await this.assertVendorExists(payload.vendorId);
    return payload.vendorId;
  }

  private async assertVendorChangeIsValid(
    payload: UpdateProductInput,
    user: ProductRequester
  ): Promise<void> {
    if (payload.vendorId === undefined) {
      return;
    }

    if (user.role !== "ADMIN") {
      throw new AppError(403, "Only admins can change product vendor");
    }

    if (payload.vendorId) {
      await this.assertVendorExists(payload.vendorId);
    }
  }

  private async assertVendorExists(vendorId: string): Promise<void> {
    const vendor = await productRepository.findVendorById(vendorId);

    if (!vendor) {
      throw new AppError(400, "Vendor does not exist or is not active", {
        vendorId: "Select a valid active vendor",
      });
    }
  }

  private async assertCategoryExists(
    categoryId?: string | null
  ): Promise<void> {
    if (!categoryId) {
      return;
    }

    const category = await productRepository.findCategoryById(categoryId);

    if (!category) {
      throw new AppError(400, "Category does not exist or is not active", {
        categoryId: "Select a valid active category",
      });
    }
  }

  private async assertRentalConfigIsValid(
    rentalConfig?: CreateProductInput["rentalConfig"] | null
  ): Promise<void> {
    if (!rentalConfig) {
      return;
    }

    const rentalPeriod = await productRepository.findRentalPeriodById(
      rentalConfig.rentalPeriodId
    );

    if (!rentalPeriod) {
      throw new AppError(400, "Rental period does not exist or is not active", {
        rentalPeriodId: "Select a valid active rental period",
      });
    }
  }

  private async assertAttributeIdsExist(attributeIds?: string[]): Promise<void> {
    const ids = uniqueStrings(attributeIds ?? []);

    if (ids.length === 0) {
      return;
    }

    const count = await productRepository.countAttributesByIds(ids);

    if (count !== ids.length) {
      throw new AppError(400, "One or more product attributes are invalid", {
        attributeIds: "Select valid active attributes",
      });
    }
  }

  private async assertVariantAttributeValueIdsExist(
    variants?: CreateProductInput["variants"]
  ): Promise<void> {
    const attributeValueIds = uniqueStrings(
      (variants ?? []).flatMap((variant) => variant.attributeValueIds ?? [])
    );

    if (attributeValueIds.length === 0) {
      return;
    }

    const count = await productRepository.countAttributeValuesByIds(
      attributeValueIds
    );

    if (count !== attributeValueIds.length) {
      throw new AppError(400, "One or more variant attribute values are invalid", {
        attributeValueIds: "Select valid attribute values",
      });
    }
  }

  private assertCreateAssetsDoNotReferenceVariants(
    assets: NonNullable<CreateProductInput["assets"]>
  ): void {
    if (assets.some((asset) => asset.variantId)) {
      throw new AppError(
        400,
        "Asset variantId cannot be used while creating a product. Create the product variants first, then update assets with variant ids."
      );
    }
  }

  private async assertAssetsAreValidForUpdate(
    productId: string,
    assets: NonNullable<UpdateProductInput["assets"]>,
    variantsAreBeingReplaced: boolean
  ): Promise<void> {
    const variantIds = uniqueStrings(
      assets
        .map((asset) => asset.variantId)
        .filter((variantId): variantId is string => Boolean(variantId))
    );

    if (variantsAreBeingReplaced && variantIds.length > 0) {
      throw new AppError(
        400,
        "Do not send asset variantId while replacing variants in the same request"
      );
    }

    if (variantIds.length === 0) {
      return;
    }

    const count = await productRepository.countVariantsByIds(productId, variantIds);

    if (count !== variantIds.length) {
      throw new AppError(400, "One or more asset variants are invalid", {
        variantId: "Asset variant ids must belong to this product",
      });
    }
  }

  private assertNoDuplicateProductChildren(
    payload: ProductNestedPayload
  ): void {
    this.assertNoDuplicateValues(
      payload.attributeIds ?? [],
      "attributeIds",
      "Duplicate attributes are not allowed"
    );
    this.assertNoDuplicateValues(
      (payload.assets ?? []).map((asset) => asset.assetTag),
      "assets.assetTag",
      "Duplicate asset tags are not allowed"
    );
    this.assertNoDuplicateValues(
      (payload.assets ?? [])
        .map((asset) => asset.barcode)
        .filter((barcode): barcode is string => Boolean(barcode)),
      "assets.barcode",
      "Duplicate barcodes are not allowed"
    );
    this.assertNoDuplicateValues(
      (payload.assets ?? [])
        .map((asset) => asset.qrCode)
        .filter((qrCode): qrCode is string => Boolean(qrCode)),
      "assets.qrCode",
      "Duplicate QR codes are not allowed"
    );
    this.assertNoDuplicateValues(
      (payload.variants ?? [])
        .map((variant) => variant.sku)
        .filter((sku): sku is string => Boolean(sku)),
      "variants.sku",
      "Duplicate variant SKUs are not allowed"
    );

    for (const [index, variant] of (payload.variants ?? []).entries()) {
      this.assertNoDuplicateValues(
        variant.attributeValueIds ?? [],
        `variants.${index}.attributeValueIds`,
        "Duplicate variant attribute values are not allowed"
      );
    }
  }

  private assertNoDuplicateValues(
    values: string[],
    field: string,
    message: string
  ): void {
    const normalizedValues = values.map((value) => value.trim().toLowerCase());
    const uniqueValues = new Set(normalizedValues);

    if (uniqueValues.size !== normalizedValues.length) {
      throw new AppError(400, message, {
        [field]: message,
      });
    }
  }

  private async assertSkuIsUnique(
    sku?: string | null,
    excludeProductId?: string
  ): Promise<void> {
    if (!sku) {
      return;
    }

    const existingProduct = await productRepository.findBySku(
      sku,
      excludeProductId
    );

    if (existingProduct) {
      throw new AppError(409, "Product SKU already exists", {
        sku: "Product SKU already exists",
      });
    }
  }

  private async resolveSlug(
    requestedSlug: string | null | undefined,
    fallbackName: string,
    excludeProductId?: string
  ): Promise<string> {
    const baseSlug = slugify(requestedSlug ?? fallbackName);

    if (requestedSlug) {
      const existingSlug = await productRepository.findBySlug(
        baseSlug,
        excludeProductId
      );

      if (existingSlug) {
        throw new AppError(409, "Product slug already exists", {
          slug: "Product slug already exists",
        });
      }

      return baseSlug;
    }

    let candidate = baseSlug;
    let suffix = 2;

    while (await productRepository.findBySlug(candidate, excludeProductId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async buildUpdateData(
    payload: UpdateProductInput,
    existingProduct: ProductDetailRecord,
    user: ProductRequester
  ): Promise<Prisma.ProductUncheckedUpdateInput> {
    const data: Prisma.ProductUncheckedUpdateInput = {};

    if (payload.name !== undefined) {
      data.name = payload.name;
    }

    if (payload.slug !== undefined) {
      data.slug = await this.resolveSlug(
        payload.slug,
        payload.name ?? existingProduct.name,
        existingProduct.id
      );
    }

    if (payload.sku !== undefined) {
      data.sku = payload.sku;
    }

    if (payload.description !== undefined) {
      data.description = payload.description;
    }

    if (payload.type !== undefined) {
      data.type = payload.type;
    }

    if (payload.status !== undefined) {
      data.status = payload.status;
    }

    if (payload.quantityOnHand !== undefined) {
      data.quantityOnHand = payload.quantityOnHand;
    }

    if (payload.salesPrice !== undefined) {
      data.salesPrice = payload.salesPrice;
    }

    if (payload.costPrice !== undefined) {
      data.costPrice = payload.costPrice;
    }

    if (payload.categoryId !== undefined) {
      data.categoryId = payload.categoryId;
    }

    if (payload.vendorId !== undefined && user.role === "ADMIN") {
      data.vendorId = payload.vendorId;
    }

    return data;
  }

  private async replaceNestedProductData(
    productId: string,
    payload: ProductNestedPayload,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    if (payload.images !== undefined) {
      await productRepository.replaceImages(
        productId,
        this.mapImagesForStorage(payload.images),
        tx
      );
    }

    if (payload.attributeIds !== undefined) {
      await productRepository.replaceAttributeLinks(
        productId,
        uniqueStrings(payload.attributeIds),
        tx
      );
    }

    if (payload.variants !== undefined) {
      await productRepository.replaceVariants(
        productId,
        this.mapVariantsForStorage(payload.variants),
        tx
      );
    }

    if (payload.assets !== undefined) {
      await productRepository.replaceAssets(
        productId,
        this.mapAssetsForStorage(payload.assets),
        tx
      );
    }

    if (payload.rentalConfig !== undefined) {
      if (payload.rentalConfig === null) {
        await productRepository.deleteRentalConfig(productId, tx);
      } else {
        await productRepository.upsertRentalConfig(
          productId,
          this.mapRentalConfigForStorage(payload.rentalConfig),
          tx
        );
      }
    }
  }

  private mapImagesForStorage(
    images: NonNullable<CreateProductInput["images"]>
  ): Array<Omit<Prisma.ProductImageCreateManyInput, "productId">> {
    const hasPrimaryImage = images.some((image) => image.isPrimary);
    let primaryImageAssigned = false;

    return images.map((image, index) => {
      const shouldBePrimary = hasPrimaryImage
        ? Boolean(image.isPrimary) && !primaryImageAssigned
        : index === 0;

      if (shouldBePrimary) {
        primaryImageAssigned = true;
      }

      return {
        url: image.url,
        altText: image.altText ?? null,
        isPrimary: shouldBePrimary,
        sortOrder: image.sortOrder ?? index,
      };
    });
  }

  private mapAssetsForStorage(
    assets: NonNullable<CreateProductInput["assets"]>
  ): Array<Omit<Prisma.ProductAssetCreateManyInput, "productId">> {
    return assets.map((asset) => ({
      assetTag: asset.assetTag,
      barcode: asset.barcode ?? null,
      qrCode: asset.qrCode ?? null,
      variantId: asset.variantId ?? null,
      status: asset.status ?? "AVAILABLE",
      notes: asset.notes ?? null,
    }));
  }

  private mapVariantsForStorage(
    variants: NonNullable<CreateProductInput["variants"]>
  ): Array<
    Omit<Prisma.ProductVariantUncheckedCreateInput, "productId"> & {
      attributeValueIds?: string[];
    }
  > {
    return variants.map((variant) => ({
      sku: variant.sku ?? null,
      name: variant.name ?? null,
      quantityOnHand: variant.quantityOnHand ?? 0,
      salesPrice: variant.salesPrice ?? null,
      costPrice: variant.costPrice ?? null,
      isActive: variant.isActive ?? true,
      attributeValueIds: uniqueStrings(variant.attributeValueIds ?? []),
    }));
  }

  private mapRentalConfigForStorage(
    rentalConfig: NonNullable<CreateProductInput["rentalConfig"]>
  ): Omit<Prisma.ProductRentalConfigUncheckedCreateInput, "productId"> {
    return {
      rentalPeriodId: rentalConfig.rentalPeriodId,
      pickupTime: rentalConfig.pickupTime ?? null,
      returnTime: rentalConfig.returnTime ?? null,
      paddingMinutes: rentalConfig.paddingMinutes ?? 0,
      depositType: rentalConfig.depositType ?? "FIXED",
      securityDeposit: rentalConfig.securityDeposit ?? 0,
      lateFeeUnit: rentalConfig.lateFeeUnit ?? "HOUR",
      lateFee: rentalConfig.lateFee ?? 0,
      gracePeriodMinutes: rentalConfig.gracePeriodMinutes ?? 0,
      maxLateFee: rentalConfig.maxLateFee ?? null,
    };
  }

  private mapProductSummary(product: ProductListRecord) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      type: product.type,
      status: product.status,
      quantityOnHand: product.quantityOnHand,
      salesPrice: decimalToString(product.salesPrice),
      costPrice: decimalToString(product.costPrice),
      category: this.mapCategory(product.category),
      primaryImage: product.images[0]
        ? this.mapImage(product.images[0])
        : null,
      vendor: this.mapProductUser(product.vendor),
      assetCount: product._count.assets,
      imageCount: product._count.images,
      variantCount: product._count.variants,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private mapProductDetail(product: ProductDetailRecord) {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      type: product.type,
      status: product.status,
      quantityOnHand: product.quantityOnHand,
      salesPrice: decimalToString(product.salesPrice),
      costPrice: decimalToString(product.costPrice),
      category: this.mapCategory(product.category),
      images: product.images.map((image) => this.mapImage(image)),
      variants: product.variants.map((variant) => this.mapVariant(variant)),
      rentalConfig: product.rentalConfig
        ? this.mapRentalConfig(product.rentalConfig)
        : null,
      vendor: this.mapProductUser(product.vendor),
      createdBy: this.mapProductUser(product.createdBy),
      assetCount: product._count.assets,
      imageCount: product._count.images,
      variantCount: product._count.variants,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private mapProductUser(user: ProductUserRecord | null) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" "),
      profileImage: user.profileImage,
      companyName: user.companyName,
    };
  }

  private mapCategory(category: ProductCategoryRecord | null) {
    if (!category) {
      return null;
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  private mapImage(image: ProductImageRecord) {
    return {
      id: image.id,
      url: image.url,
      altText: image.altText,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
      createdAt: image.createdAt.toISOString(),
    };
  }

  private mapVariant(variant: ProductVariantRecord) {
    return {
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      quantityOnHand: variant.quantityOnHand,
      salesPrice: decimalToString(variant.salesPrice),
      costPrice: decimalToString(variant.costPrice),
      isActive: variant.isActive,
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

  private mapRentalConfig(config: ProductRentalConfigRecord) {
    return {
      id: config.id,
      rentalPeriod: {
        id: config.rentalPeriod.id,
        name: config.rentalPeriod.name,
        unit: config.rentalPeriod.unit,
        duration: config.rentalPeriod.duration,
        isDefault: config.rentalPeriod.isDefault,
        isActive: config.rentalPeriod.isActive,
      },
      pickupTime: config.pickupTime,
      returnTime: config.returnTime,
      paddingMinutes: config.paddingMinutes,
      depositType: config.depositType,
      securityDeposit: decimalToString(config.securityDeposit),
      lateFeeUnit: config.lateFeeUnit,
      lateFee: decimalToString(config.lateFee),
      gracePeriodMinutes: config.gracePeriodMinutes,
      maxLateFee: decimalToString(config.maxLateFee),
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}

export const productService = new ProductService();
