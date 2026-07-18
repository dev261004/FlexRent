import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { productVariantService } from "../services/product-variant.service";
import {
  createProductVariantSchema,
  listProductVariantsQuerySchema,
  productVariantDetailParamsSchema,
  productVariantParamsSchema,
  updateProductVariantSchema,
} from "../validations/product-variant.validation";

const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, "Authentication is required");
  }

  return req.user;
};

export const createProductVariant = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId } = productVariantParamsSchema.parse(req.params);
    const payload = createProductVariantSchema.parse(req.body);
    const variant = await productVariantService.createVariant(
      productId,
      payload,
      user
    );

    res.status(201).json({
      success: true,
      message: "Product variant created successfully",
      data: { variant },
    });
  }
);

export const listProductVariants = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId } = productVariantParamsSchema.parse(req.params);
    const query = listProductVariantsQuerySchema.parse(req.query);
    const result = await productVariantService.getVariants(
      productId,
      query,
      user
    );

    res.json({
      success: true,
      message: "Product variants fetched successfully",
      data: result,
    });
  }
);

export const getProductVariantById = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId, variantId } = productVariantDetailParamsSchema.parse(
      req.params
    );
    const variant = await productVariantService.getVariantById(
      productId,
      variantId,
      user
    );

    res.json({
      success: true,
      message: "Product variant fetched successfully",
      data: { variant },
    });
  }
);

export const updateProductVariant = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId, variantId } = productVariantDetailParamsSchema.parse(
      req.params
    );
    const payload = updateProductVariantSchema.parse(req.body);
    const variant = await productVariantService.updateVariant(
      productId,
      variantId,
      payload,
      user
    );

    res.json({
      success: true,
      message: "Product variant updated successfully",
      data: { variant },
    });
  }
);

export const deleteProductVariant = asyncHandler(
  async (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const { productId, variantId } = productVariantDetailParamsSchema.parse(
      req.params
    );
    const variant = await productVariantService.deleteVariant(
      productId,
      variantId,
      user
    );

    res.json({
      success: true,
      message: "Product variant deleted successfully",
      data: { variant },
    });
  }
);
