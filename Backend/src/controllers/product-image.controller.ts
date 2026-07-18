import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { productImageService } from "../services/product-image.service";
import {
  imageIdParamsSchema,
  productImageParamsSchema,
  reorderProductImagesSchema,
  uploadProductImagesBodySchema,
} from "../validations/product-image.validation";

const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "Authentication is required");
  }

  return req.user;
};

const getUploadedFiles = (req: Request): Express.Multer.File[] => {
  if (!Array.isArray(req.files)) {
    return [];
  }

  return req.files;
};

export const uploadProductImages = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId } = productImageParamsSchema.parse(req.params);
    const payload = uploadProductImagesBodySchema.parse(req.body);
    const images = await productImageService.uploadImages(
      productId,
      getUploadedFiles(req),
      payload.altText,
      user
    );

    res.status(201).json({
      success: true,
      message: "Product images uploaded successfully",
      data: { images },
    });
  }
);

export const listProductImages = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId } = productImageParamsSchema.parse(req.params);
    const images = await productImageService.listImages(productId, user);

    res.json({
      success: true,
      message: "Product images fetched successfully",
      data: { images },
    });
  }
);

export const setPrimaryProductImage = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { imageId } = imageIdParamsSchema.parse(req.params);
    const images = await productImageService.setPrimary(imageId, user);

    res.json({
      success: true,
      message: "Primary product image updated successfully",
      data: { images },
    });
  }
);

export const reorderProductImages = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId } = productImageParamsSchema.parse(req.params);
    const payload = reorderProductImagesSchema.parse(req.body);
    const images = await productImageService.reorderImages(
      productId,
      payload,
      user
    );

    res.json({
      success: true,
      message: "Product image order updated successfully",
      data: { images },
    });
  }
);

export const deleteProductImage = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { imageId } = imageIdParamsSchema.parse(req.params);
    const images = await productImageService.deleteImage(imageId, user);

    res.json({
      success: true,
      message: "Product image deleted successfully",
      data: { images },
    });
  }
);
