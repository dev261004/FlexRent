import fs from "fs/promises";
import path from "path";
import { ProductImage } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";
import {
  ProductForImageAccess,
  productImageRepository,
} from "../repositories/product-image.repository";
import { ProductRequester } from "../types/product.types";

type ReorderProductImagesInput = {
  images: Array<{
    imageId: string;
    sortOrder: number;
  }>;
};

export class ProductImageService {
  async uploadImages(
    productId: string,
    files: Express.Multer.File[],
    altText: string | undefined,
    user: ProductRequester
  ) {
    if (files.length === 0) {
      throw new AppError(400, "At least one image is required");
    }

    const product = await productImageRepository.findProductById(productId);
    this.assertCanWriteProductImages(product, user);

    const existingImageCount = await productImageRepository.countByProductId(
      productId
    );
    const firstProductImage = existingImageCount === 0;

    try {
      await productImageRepository.transaction(async (tx) => {
        const startSortOrder = existingImageCount;

        await productImageRepository.createMany(
          files.map((file, index) => ({
            productId,
            url: this.toPublicImagePath(file.path),
            altText: altText ?? null,
            isPrimary: firstProductImage && index === 0,
            sortOrder: startSortOrder + index,
          })),
          tx
        );
      });
    } catch (error) {
      await this.deleteUploadedFiles(files);
      throw error;
    }

    return this.listImages(productId, user);
  }

  async listImages(productId: string, user: ProductRequester) {
    const product = await productImageRepository.findProductById(productId);
    this.assertCanReadProductImages(product, user);

    const images = await productImageRepository.findManyByProductId(productId);
    return images.map((image) => this.mapImage(image));
  }

  async setPrimary(imageId: string, user: ProductRequester) {
    const image = await productImageRepository.findById(imageId);
    this.assertImageExists(image);

    const product = await productImageRepository.findProductById(image.productId);
    this.assertCanWriteProductImages(product, user);

    await productImageRepository.transaction(async (tx) => {
      await productImageRepository.clearPrimary(image.productId, tx);
      await productImageRepository.setPrimary(image.id, tx);
    });

    return this.listImages(image.productId, user);
  }

  async reorderImages(
    productId: string,
    payload: ReorderProductImagesInput,
    user: ProductRequester
  ) {
    const product = await productImageRepository.findProductById(productId);
    this.assertCanWriteProductImages(product, user);
    this.assertNoDuplicateImageIds(payload);

    const currentImages = await productImageRepository.findManyByProductId(
      productId
    );
    const currentImageIds = new Set(currentImages.map((image) => image.id));

    for (const image of payload.images) {
      if (!currentImageIds.has(image.imageId)) {
        throw new AppError(400, "One or more image ids are invalid", {
          imageId: "Image ids must belong to this product",
        });
      }
    }

    await productImageRepository.transaction(async (tx) => {
      for (const image of payload.images) {
        await productImageRepository.updateSortOrder(
          image.imageId,
          image.sortOrder,
          tx
        );
      }
    });

    return this.listImages(productId, user);
  }

  async deleteImage(imageId: string, user: ProductRequester) {
    const image = await productImageRepository.findById(imageId);
    this.assertImageExists(image);

    const product = await productImageRepository.findProductById(image.productId);
    this.assertCanWriteProductImages(product, user);

    await productImageRepository.transaction(async (tx) => {
      await productImageRepository.delete(image.id, tx);

      if (image.isPrimary) {
        const remainingImage = await productImageRepository.findFirstRemaining(
          image.productId,
          tx
        );

        if (remainingImage) {
          await productImageRepository.clearPrimary(image.productId, tx);
          await productImageRepository.setPrimary(remainingImage.id, tx);
        }
      }
    });

    await this.deletePhysicalFile(image.url);

    return this.listImages(image.productId, user);
  }

  private assertCanReadProductImages(
    product: ProductForImageAccess | null,
    _user: ProductRequester
  ): asserts product is ProductForImageAccess {
    if (!product) {
      throw new AppError(404, "Product not found");
    }
  }

  private assertCanWriteProductImages(
    product: ProductForImageAccess | null,
    user: ProductRequester
  ): asserts product is ProductForImageAccess {
    if (!product) {
      throw new AppError(404, "Product not found");
    }

    if (user.role === "CUSTOMER") {
      throw new AppError(403, "Customers can only view product images");
    }

    if (
      user.role === "VENDOR" &&
      product.vendorId !== user.id &&
      product.createdById !== user.id
    ) {
      throw new AppError(403, "Vendors can only manage their own product images");
    }
  }

  private assertImageExists(
    image: ProductImage | null
  ): asserts image is ProductImage {
    if (!image) {
      throw new AppError(404, "Product image not found");
    }
  }

  private assertNoDuplicateImageIds(payload: ReorderProductImagesInput): void {
    const imageIds = payload.images.map((image) => image.imageId);
    const uniqueImageIds = new Set(imageIds);

    if (uniqueImageIds.size !== imageIds.length) {
      throw new AppError(400, "Duplicate image ids are not allowed", {
        images: "Duplicate image ids are not allowed",
      });
    }
  }

  private toPublicImagePath(filename: string): string {
    return filename; // For Cloudinary, the file path is the URL stored in the DB
  }

  private async deleteUploadedFiles(
    files: Express.Multer.File[]
  ): Promise<void> {
    // With Cloudinary, if we need to clean up uploaded files on error, we delete them from Cloudinary using their public_id.
    // multer-storage-cloudinary adds `filename` (which is the public_id).
    for (const file of files) {
      if (file.filename) {
        await this.deletePhysicalFile(file.filename);
      }
    }
  }

  private async deletePhysicalFile(imageUrlOrPublicId: string): Promise<void> {
    try {
      let publicId = imageUrlOrPublicId;
      // If it's a full URL, extract the public ID (this is a simple extraction, depending on the format)
      // Usually, multer-storage-cloudinary returns the full URL in `file.path` and the public ID in `file.filename`.
      // The DB stores `file.path` which is the URL. We can extract public ID from the URL or store the public ID.
      // Assuming imageUrlOrPublicId is the URL:
      if (imageUrlOrPublicId.includes("cloudinary.com")) {
        const parts = imageUrlOrPublicId.split("/");
        const lastPart = parts.pop() || "";
        const idWithoutExtension = lastPart.split(".")[0];
        // If it includes the folder:
        const folderIndex = parts.indexOf("flexrent");
        if (folderIndex !== -1) {
          publicId = parts.slice(folderIndex).join("/") + "/" + idWithoutExtension;
        } else {
          publicId = idWithoutExtension;
        }
      }
      
      const cloudinary = require("cloudinary").v2;
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Failed to delete image from Cloudinary:", error);
    }
  }

  private mapImage(image: ProductImage) {
    return {
      id: image.id,
      productId: image.productId,
      url: image.url,
      altText: image.altText,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
      createdAt: image.createdAt.toISOString(),
    };
  }
}

export const productImageService = new ProductImageService();
