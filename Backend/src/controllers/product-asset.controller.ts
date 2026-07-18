import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { productAssetService } from "../services/product-asset.service";
import {
  createProductAssetSchema,
  listProductAssetsQuerySchema,
  productAssetDetailParamsSchema,
  productAssetParamsSchema,
  updateProductAssetSchema,
} from "../validations/product-asset.validation";

const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "Authentication is required");
  }

  return req.user;
};

export const createProductAsset = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId } = productAssetParamsSchema.parse(req.params);
    const payload = createProductAssetSchema.parse(req.body);
    const asset = await productAssetService.createAsset(productId, payload, user);

    res.status(201).json({
      success: true,
      message: "Product asset created successfully",
      data: { asset },
    });
  }
);

export const listProductAssets = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId } = productAssetParamsSchema.parse(req.params);
    const query = listProductAssetsQuerySchema.parse(req.query);
    const result = await productAssetService.getAssets(productId, query, user);

    res.json({
      success: true,
      message: "Product assets fetched successfully",
      data: result,
    });
  }
);

export const getProductAssetById = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId, assetId } = productAssetDetailParamsSchema.parse(
      req.params
    );
    const asset = await productAssetService.getAssetById(
      productId,
      assetId,
      user
    );

    res.json({
      success: true,
      message: "Product asset fetched successfully",
      data: { asset },
    });
  }
);

export const updateProductAsset = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId, assetId } = productAssetDetailParamsSchema.parse(
      req.params
    );
    const payload = updateProductAssetSchema.parse(req.body);
    const asset = await productAssetService.updateAsset(
      productId,
      assetId,
      payload,
      user
    );

    res.json({
      success: true,
      message: "Product asset updated successfully",
      data: { asset },
    });
  }
);

export const deleteProductAsset = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId, assetId } = productAssetDetailParamsSchema.parse(
      req.params
    );
    const asset = await productAssetService.deleteAsset(productId, assetId, user);

    res.json({
      success: true,
      message: "Product asset deleted successfully",
      data: { asset },
    });
  }
);
